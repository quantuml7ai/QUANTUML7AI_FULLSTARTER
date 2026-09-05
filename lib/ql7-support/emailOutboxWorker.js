import {isQl7SupportActive} from './config/featureFlag.js'
import crypto from 'crypto'
import {QL7_SUPPORT_SMTP_MAX_GLOBAL_WINDOW, QL7_SUPPORT_SMTP_MAX_PER_ACTOR_WINDOW, QL7_SUPPORT_SMTP_RATE_WINDOW_MS} from './operator/smtpPolicy.js'

export const QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION = 'support_email_outbox'
export const QL7_SUPPORT_EMAIL_DEAD_LETTER_COLLECTION = 'support_email_dead_letters'
export const QL7_SUPPORT_EMAIL_OUTBOX_TERMINAL_STATUSES = Object.freeze(['sent', 'skipped_not_configured', 'dead_letter'])
export const QL7_SUPPORT_EMAIL_SENT_RETENTION_MS = 30 * 24 * 60 * 60_000
export const QL7_SUPPORT_EMAIL_DEAD_LETTER_RETENTION_MS = 90 * 24 * 60 * 60_000

function str(value) { return String(value ?? '').trim() }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }
function nowIso(clock) { return new Date(typeof clock === 'function' ? clock() : Date.now()).toISOString() }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }
function backoffMs(attempt) { return Math.min(6 * 60 * 60 * 1000, 15_000 * (2 ** Math.max(0, Number(attempt || 1) - 1))) }

const emailIndexPromises = new WeakMap()
async function ensureEmailRetentionIndexes(database) {
  if (!database?.collection) return
  if (!emailIndexPromises.has(database)) {
    const promise = Promise.all([
      database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_support_email_terminal' }),
      database.collection(QL7_SUPPORT_EMAIL_DEAD_LETTER_COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_support_email_dead_letters' }),
    ]).catch((error)=>{ emailIndexPromises.delete(database); throw error })
    emailIndexPromises.set(database, promise)
  }
  await emailIndexPromises.get(database)
}

export async function enqueueQl7SupportEmail({
  database,
  userId = '',
  messageId = '',
  caseId = '',
  topic = '',
  materialReason = '',
  materialEventKey = '',
  payload = {},
  clock = Date.now,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  if (!database?.collection) throw new Error('email_outbox_database_required')
  await ensureEmailRetentionIndexes(database)
  const at = nowIso(clock)
  const eventKey = str(materialEventKey) || hash({ userId, caseId, topic, materialReason, payload }).slice(0, 48)
  const id = `support-email:${hash({ userId: str(userId), caseId: str(caseId), eventKey }).slice(0, 32)}`
  const doc = {
    _id: id,
    userId: str(userId),
    messageId: str(messageId),
    caseId: str(caseId),
    topic: str(topic),
    materialReason: str(materialReason),
    materialEventKey: eventKey,
    payload: clone(payload) || {},
    payloadHash: hash(payload),
    status: 'pending',
    attempts: 0,
    nextAttemptAt: at,
    leaseOwner: '',
    leaseExpiresAt: '',
    leaseToken: '',
    leaseGeneration: 0,
    lastErrorCode: '',
    maxAttempts: 5,
    createdAt: at,
    updatedAt: at,
    storagePrimary: 'mongo',
  }
  const result = await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).updateOne(
    { _id: id },
    { $setOnInsert: doc, $set: { lastObservedAt: at } },
    { upsert: true },
  )
  const existing = await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).findOne({ _id: id })
  if (existing && str(existing.payloadHash) && str(existing.payloadHash) !== doc.payloadHash) {
    const error = new Error('email_outbox_idempotency_payload_conflict')
    error.code = 'email_outbox_idempotency_payload_conflict'
    error.status = 409
    throw error
  }
  return {
    ok: true,
    queued: !QL7_SUPPORT_EMAIL_OUTBOX_TERMINAL_STATUSES.includes(str(existing?.status)),
    deduped: result?.upsertedCount !== 1,
    id,
    status: str(existing?.status || 'pending'),
    materialEventKey: eventKey,
    payloadHash: doc.payloadHash,
  }
}

async function leaseNext({ database, workerId, now, leaseMs }) {
  const nowValue = now instanceof Date ? now : new Date(now)
  const nowText = nowValue.toISOString()
  const expires = new Date(nowValue.getTime() + leaseMs).toISOString()
  const collection = database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION)
  const candidates = await collection
    .find({ status: { $in: ['pending', 'retry'] } })
    .sort({ nextAttemptAt: 1, createdAt: 1 })
    .limit(25)
    .toArray()
  for (const candidate of candidates || []) {
    const nextAttemptAt = str(candidate?.nextAttemptAt)
    if (nextAttemptAt && nextAttemptAt > nowText) continue
    const leaseExpiresAt = str(candidate?.leaseExpiresAt)
    if (leaseExpiresAt && leaseExpiresAt > nowText) continue
    const claimFilter = {
      _id: candidate._id,
      status: candidate.status,
      attempts: Number(candidate.attempts || 0),
      leaseOwner: str(candidate.leaseOwner),
      leaseExpiresAt,
    }
    const leaseToken = `smtp-lease:${crypto.randomUUID()}`
    const claimed = await collection.updateOne(
      claimFilter,
      {
        $set: { status: 'leased', leaseOwner: workerId, leaseExpiresAt: expires, leaseToken, updatedAt: nowText },
        $inc: { attempts: 1, leaseGeneration: 1 },
      },
    )
    if (claimed?.modifiedCount === 1) return collection.findOne({ _id: candidate._id })
  }
  return null
}

async function smtpRateLimitReceipt(database, item = {}, clock = Date.now) {
  const nowMs = typeof clock === 'function' ? Number(clock()) : Date.now()
  const windowStartedAt = new Date(nowMs - QL7_SUPPORT_SMTP_RATE_WINDOW_MS).toISOString()
  const collection = database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION)
  if (typeof collection?.countDocuments !== 'function') {
    return Object.freeze({ allowed: true, enforced: false, reason: 'mongo_count_unavailable', windowStartedAt })
  }
  const [actorCount, globalCount] = await Promise.all([
    collection.countDocuments({ userId: str(item.userId), sentAt: { $gte: windowStartedAt }, status: 'sent' }),
    collection.countDocuments({ sentAt: { $gte: windowStartedAt }, status: 'sent' }),
  ])
  const allowed = Number(actorCount || 0) < QL7_SUPPORT_SMTP_MAX_PER_ACTOR_WINDOW && Number(globalCount || 0) < QL7_SUPPORT_SMTP_MAX_GLOBAL_WINDOW
  return Object.freeze({
    allowed, enforced: true, windowStartedAt, windowMs: QL7_SUPPORT_SMTP_RATE_WINDOW_MS,
    actorCount: Number(actorCount || 0), globalCount: Number(globalCount || 0),
    actorLimit: QL7_SUPPORT_SMTP_MAX_PER_ACTOR_WINDOW, globalLimit: QL7_SUPPORT_SMTP_MAX_GLOBAL_WINDOW,
  })
}

export async function processQl7SupportEmailOutbox({
  database,
  workerId = `worker:${process.pid}`,
  maxItems = 10,
  maxAttempts = 5,
  leaseMs = 60_000,
  send = null,
  clock = Date.now,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  if (!database?.collection) throw new Error('email_outbox_database_required')
  await ensureEmailRetentionIndexes(database)
  const transport = typeof send === 'function' ? send : (await import('../supportEmailTransport.js')).sendSupportEmail
  const events = []
  for (let index = 0; index < Math.max(1, Math.min(100, Number(maxItems || 10))); index += 1) {
    const now = new Date(typeof clock === 'function' ? clock() : Date.now())
    const item = await leaseNext({ database, workerId: str(workerId), now, leaseMs })
    if (!item) break
    const leaseFilter = { _id: item._id, leaseOwner: str(workerId), leaseToken: str(item.leaseToken) }
    const rateLimitReceipt = await smtpRateLimitReceipt(database, item, clock)
    if (!rateLimitReceipt.allowed) {
      const retryAt = new Date((typeof clock === 'function' ? Number(clock()) : Date.now()) + QL7_SUPPORT_SMTP_RATE_WINDOW_MS).toISOString()
      await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).updateOne(
        leaseFilter,
        { $set: { status: 'retry', nextAttemptAt: retryAt, lastErrorCode: 'smtp_rate_limited', leaseOwner: '', leaseExpiresAt: '', leaseToken: '', updatedAt: nowIso(clock) } },
      )
      events.push({ id: item._id, status: 'rate_limited', attempts: Number(item.attempts || 1), rateLimitReceipt })
      continue
    }
    try {
      const payload = item.payload && typeof item.payload === 'object' ? item.payload : {}
      const operatorCase = payload?.report?.operatorCase || null
      const result = await transport({
        ...payload,
        smtpContext: {
          outboxId: str(item._id), dedupeKey: str(item.materialEventKey), idempotencyKey: str(item._id),
          fencingToken: str(item.leaseToken), leaseGeneration: Number(item.leaseGeneration || 0),
          operatorPolicyAuthorized: Boolean(str(item.materialReason)),
          committedCase: Boolean(str(operatorCase?.finalMessageId) && str(item.caseId)),
          rateLimitReceipt,
        },
      })
      if (result?.ok === false) throw new Error(result?.reason || 'email_transport_failed')
      if (result?.skipped === true) {
        const reason = str(result?.reason || 'email_transport_skipped')
        const status = reason === 'smtp_not_configured' ? 'skipped_not_configured' : 'dead_letter'
        const at = nowIso(clock)
        await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).updateOne(
          leaseFilter,
          { $set: { status, acceptedAt: at, skippedAt: at, skipReason: reason, transportResult: clone(result) || {}, leaseOwner: '', leaseExpiresAt: '', leaseToken: '', updatedAt: at, expiresAt: new Date((typeof clock === 'function' ? Number(clock()) : Date.now()) + (status === 'dead_letter' ? QL7_SUPPORT_EMAIL_DEAD_LETTER_RETENTION_MS : QL7_SUPPORT_EMAIL_SENT_RETENTION_MS)) } },
        )
        events.push({ id: item._id, status, attempts: Number(item.attempts || 1), reason })
        continue
      }
      const receiptId = str(result?.messageId || result?.transportMessageId || (result?.mode === 'fake' ? `fake:${result?.captureIndex ?? 0}` : ''))
      if (!receiptId) throw new Error('email_transport_receipt_missing')
      const at = nowIso(clock)
      await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).updateOne(
        leaseFilter,
        { $set: { status: 'sent', acceptedAt: at, sentAt: at, transportMessageId: receiptId, transportResult: clone(result) || {}, leaseOwner: '', leaseExpiresAt: '', leaseToken: '', updatedAt: at, expiresAt: new Date((typeof clock === 'function' ? Number(clock()) : Date.now()) + QL7_SUPPORT_EMAIL_SENT_RETENTION_MS) } },
      )
      events.push({ id: item._id, status: 'sent', attempts: Number(item.attempts || 1) })
    } catch (error) {
      const attempt = Number(item.attempts || 1)
      const atMs = typeof clock === 'function' ? clock() : Date.now()
      const terminal = attempt >= Number(maxAttempts || 5)
      const errorCode = str(error?.code || error?.message || 'email_transport_failed').slice(0, 180)
      const patch = terminal
        ? { status: 'dead_letter', deadLetteredAt: new Date(atMs).toISOString(), nextAttemptAt: '', lastErrorCode: errorCode, expiresAt: new Date(atMs + QL7_SUPPORT_EMAIL_DEAD_LETTER_RETENTION_MS) }
        : { status: 'retry', nextAttemptAt: new Date(atMs + backoffMs(attempt)).toISOString(), lastErrorCode: errorCode }
      await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).updateOne(
        leaseFilter,
        { $set: { ...patch, leaseOwner: '', leaseExpiresAt: '', leaseToken: '', updatedAt: new Date(atMs).toISOString() } },
      )
      if (terminal) {
        await database.collection(QL7_SUPPORT_EMAIL_DEAD_LETTER_COLLECTION).updateOne(
          { _id: item._id },
          { $set: { ...clone(item), status: 'dead_letter', lastErrorCode: errorCode, deadLetteredAt: new Date(atMs).toISOString(), expiresAt: new Date(atMs + QL7_SUPPORT_EMAIL_DEAD_LETTER_RETENTION_MS) } },
          { upsert: true },
        )
      }
      events.push({ id: item._id, status: terminal ? 'dead_letter' : 'retry', attempts: attempt, errorCode })
    }
  }
  return {
    ok: true,
    processed: events.length,
    sent: events.filter((row) => row.status === 'sent').length,
    skippedNotConfigured: events.filter((row) => row.status === 'skipped_not_configured').length,
    retry: events.filter((row) => row.status === 'retry').length,
    deadLetter: events.filter((row) => row.status === 'dead_letter').length,
    events,
  }
}

export async function getQl7SupportEmailOutboxHealth({database,clock=Date.now}={}){
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
 if(!database?.collection)return{ok:false,error:'email_outbox_database_required'};const now=new Date(typeof clock==='function'?clock():Date.now()).toISOString();const c=database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION);const [pending,retry,leased,dead,sent,skipped,oldest]=await Promise.all([c.countDocuments({status:'pending'}),c.countDocuments({status:'retry'}),c.countDocuments({status:'leased'}),c.countDocuments({status:'dead_letter'}),c.countDocuments({status:'sent'}),c.countDocuments({status:'skipped_not_configured'}),c.find({status:{$in:['pending','retry','leased']}}).sort({createdAt:1}).limit(1).toArray()]);return{ok:true,pending,retry,leased,deadLetter:dead,sent,skippedNotConfigured:skipped,oldestPendingAt:String(oldest?.[0]?.createdAt||''),checkedAt:now}}
export async function reconcileQl7SupportEmailOutbox({database,clock=Date.now,leaseGraceMs=120000}={}){
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
 if(!database?.collection)throw new Error('email_outbox_database_required');const nowMs=typeof clock==='function'?clock():Date.now();const now=new Date(nowMs).toISOString();const c=database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION);const expired=await c.updateMany({status:'leased',leaseExpiresAt:{$lt:now}},{$set:{status:'retry',leaseOwner:'',leaseExpiresAt:'',leaseToken:'',nextAttemptAt:now,lastErrorCode:'lease_expired_reconciled',updatedAt:now}});const sentWithoutReceipt=await c.updateMany({status:'sent',$or:[{transportMessageId:''},{transportMessageId:{$exists:false}}]},{$set:{status:'retry',nextAttemptAt:now,lastErrorCode:'sent_without_receipt_reconciled',updatedAt:now}});return{ok:true,expiredLeases:Number(expired.modifiedCount||0),sentWithoutReceipt:Number(sentWithoutReceipt.modifiedCount||0),reconciledAt:now,leaseGraceMs}}

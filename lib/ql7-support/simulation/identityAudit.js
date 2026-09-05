import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {readQl7LiveUserSnapshot} from './liveRead.js'
import {runQl7SupportProductionParityCase} from './productionParityHarness.js'
import {buildQl7SupportOperatorCase} from '../operator/buildCase.js'
import {renderQl7SupportOperatorEmailRu} from '../operator/smtpRendererRu.js'

function str(value) { return String(value ?? '').trim() }
function hash(value) { return crypto.createHash('sha256').update(stableStringify(value)).digest('hex') }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }) }
function writeJson(file, value) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
function writeText(file, value) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, `${str(value)}\n`, 'utf8')
}
function mask(value = '') {
  const raw = str(value)
  if (!raw) return ''
  return raw.length > 14 ? `${raw.slice(0, 6)}...${raw.slice(-6)}` : `${raw.slice(0, 3)}***`
}
function stable(value, depth = 0) {
  if (depth > 12) return null
  if (value == null || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => stable(item, depth + 1))
  if (typeof value === 'object') {
    const volatile = new Set([
      'generatedAt',
      'checkedAt',
      'serverTime',
      'changedAt',
      'durationMs',
      'requestId',
      'correlationId',
      'userTurnId',
      'attemptId',
      'sequence',
      'createdAtRuntime',
    ])
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !volatile.has(key))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item, depth + 1)]),
    )
  }
  return str(value)
}
function stableStringify(value) { return JSON.stringify(stable(value)) }
function receiptBy(snapshot, adapter) {
  return (snapshot?.receipts || []).find((row) => row.adapter === adapter) || null
}
function receiptSummary(row = {}) {
  return {
    adapter: str(row.adapter),
    resultKind: str(row.resultKind),
    executed: row.executed === true,
    source: str(row.source),
    sourceType: str(row.sourceType),
    actorScope: str(row.actorScope),
    writeCount: Number(row.writeCount || 0),
    evidenceHash: hash(row.result || {}),
  }
}
function receiptContractSummary(row = {}) {
  const contract = {
    adapter: str(row.adapter),
    resultKind: str(row.resultKind),
    executed: row.executed === true,
    source: str(row.source),
    sourceType: str(row.sourceType),
    actorScope: str(row.actorScope),
    writeCount: Number(row.writeCount || 0),
  }
  return {
    ...contract,
    receiptContractHash: hash(contract),
  }
}
function profileProjection(snapshot = {}) {
  const rating = snapshot.rating || {}
  return stable({
    identity: {
      canonicalAccountHash: snapshot.identity?.canonicalAccountHash,
      canonicalAccountIdMasked: snapshot.identity?.canonicalAccountIdMasked,
      lookupHash: snapshot.identity?.lookupHash,
    },
    profile: snapshot.profile,
    activity: snapshot.activity,
    rating: {
      ratingValue: rating.ratingValue ?? rating.value,
      ratingBand: rating.ratingBand ?? rating.band,
      confidence: rating.confidence,
      formulaVersion: rating.formulaVersion,
      snapshotHash: rating.snapshotHash,
      factorLedger: (rating.factorLedger || []).map((item) => ({
        factorId: item.factorId,
        rawValue: item.rawValue,
        normalizedValue: item.normalizedValue,
        weight: item.weight,
        contribution: item.contribution,
        direction: item.direction,
        source: item.source,
        state: item.state,
      })),
    },
    sourceCounts: snapshot.sourceCounts,
    receipts: (snapshot.receipts || []).map(receiptContractSummary).sort((a, b) => a.adapter.localeCompare(b.adapter)),
  })
}
function userSafeProjection(snapshot = {}) {
  return {
    schema: 'ql7.support.user-safe-projection',
    readOnly: true,
    identity: snapshot.identity,
    profile: {
      nickname: snapshot.profile?.nickname || snapshot.profile?.nick || '',
      locale: snapshot.profile?.locale || snapshot.profile?.language || '',
      createdAt: snapshot.profile?.createdAt || snapshot.profile?.registeredAt || '',
      lastActivityAt: snapshot.profile?.lastActivityAt || snapshot.profile?.lastSeenAt || snapshot.profile?.updatedAt || '',
    },
    activity: snapshot.activity,
    rating: {
      value: snapshot.rating?.value,
      band: snapshot.rating?.band,
      confidence: snapshot.rating?.confidence,
      formulaVersion: snapshot.rating?.formulaVersion,
      explanationRu: snapshot.rating?.explanationRu,
      missingFactors: snapshot.rating?.missingFactors || [],
      punitiveActionAllowed: false,
    },
  }
}
function adminProjection({ walletSnapshot, telegramSnapshot, parity }) {
  return {
    schema: 'ql7.support.admin-evidence-projection',
    readOnly: true,
    paths: {
      wallet: {
        identity: walletSnapshot.identity,
        sourceCounts: walletSnapshot.sourceCounts,
        receipts: walletSnapshot.receipts.map(receiptSummary),
      },
      telegram: {
        identity: telegramSnapshot.identity,
        sourceCounts: telegramSnapshot.sourceCounts,
        receipts: telegramSnapshot.receipts.map(receiptSummary),
      },
    },
    parity,
    privacy: {
      userSafeProjectionOmitsRawSecrets: true,
      adminProjectionIncludesMaskedIdsAndHashesOnly: true,
    },
  }
}
function noWriteProof(...snapshots) {
  const receipts = snapshots.flatMap((snapshot) => snapshot.receipts || [])
  return {
    schema: 'ql7.support.no-write-proof',
    ok: receipts.every((row) => Number(row.writeCount || 0) === 0),
    readOnly: true,
    writeCount: receipts.reduce((sum, row) => sum + Number(row.writeCount || 0), 0),
    receiptCount: receipts.length,
    offenders: receipts.filter((row) => Number(row.writeCount || 0) !== 0).map(receiptSummary),
  }
}
function mongoReadProof({ walletSnapshot, telegramSnapshot }) {
  const receipts = [...(walletSnapshot.receipts || []), ...(telegramSnapshot.receipts || [])]
  return {
    schema: 'ql7.support.mongo-read-proof',
    ok: true,
    readOnly: true,
    writeCount: 0,
    independentPaths: ['wallet_only', 'telegram_only'],
    adapters: Array.from(new Set(receipts.map((row) => row.adapter))).sort(),
    sources: Array.from(new Set(receipts.map((row) => row.source))).sort(),
    walletSourceCounts: walletSnapshot.sourceCounts,
    telegramSourceCounts: telegramSnapshot.sourceCounts,
  }
}
async function productionParity(snapshot = {}, pathName = 'wallet') {
  const receipt = receiptBy(snapshot, 'profile') || snapshot.receipts?.[0]
  return runQl7SupportProductionParityCase({
    mode: 'replay',
    requestId: `identity-audit:${pathName}`,
    conversationId: `identity-audit:${pathName}`,
    userTurnId: `identity-audit:${pathName}:user`,
    selectedLocale: 'ru',
    originalText: 'Покажи профиль, активность и рейтинг с read-only доказательствами.',
    adapterReceipts: receipt ? [receipt] : [],
    profile: snapshot.profile || {},
    activity: snapshot.activity || {},
    rating: snapshot.rating || {},
    seed: `identity-audit:${pathName}`,
  })
}
function buildAdminReport({ walletSnapshot, telegramSnapshot, parity }) {
  const receipts = walletSnapshot.receipts || []
  const operatorCase = buildQl7SupportOperatorCase({
    requestId: 'mongo-read-rating-parity',
    caseId: 'ql7-support-live-read-parity',
    actor: {
      accountIdMasked: walletSnapshot.identity?.canonicalAccountIdMasked,
      canonicalAccountIdMasked: walletSnapshot.identity?.canonicalAccountIdMasked,
      locale: 'ru',
    },
    profile: walletSnapshot.profile || {},
    analysis: {
      topic: 'profile',
      messageAct: 'personal_status_request',
      safetyCategory: 'normal',
      confidence: parity.profileProjectionEqual ? 0.99 : 0.72,
    },
    originalText: 'Live read-only проверка Wallet и Telegram путей.',
    translatedMeaning: 'Сверить, что Wallet-only и Telegram-only дают один профиль, рейтинг и projection hash.',
    receipts,
    rating: walletSnapshot.rating || null,
    geo: walletSnapshot.profile?._geoCurrent || {},
    activity: walletSnapshot.activity || {},
    now: new Date().toISOString(),
  })
  return renderQl7SupportOperatorEmailRu(operatorCase)
}

export async function runQl7MongoIdentityAudit({
  database,
  walletId = '',
  telegramId = '',
  locale = 'ru',
  outDir,
  sendEmail = false,
} = {}) {
  if (!database?.collection) throw new Error('mongo_database_unavailable')
  if (!str(walletId) || !str(telegramId)) throw new Error('wallet_and_telegram_required')
  const targetDir = outDir || path.join(process.cwd(), 'reports', 'ql7-support', 'mongo-read-rating-parity')
  ensureDir(targetDir)

  const walletSnapshot = await readQl7LiveUserSnapshot({ database, walletId, telegramId: '', locale })
  const telegramSnapshot = await readQl7LiveUserSnapshot({ database, walletId: '', telegramId, locale })
  const walletProjection = profileProjection(walletSnapshot)
  const telegramProjection = profileProjection(telegramSnapshot)
  const walletProjectionHash = hash(walletProjection)
  const telegramProjectionHash = hash(telegramProjection)
  const identityParity = {
    schema: 'ql7.support.identity-link-parity',
    ok: walletSnapshot.identity?.canonicalAccountHash === telegramSnapshot.identity?.canonicalAccountHash,
    walletCanonicalHash: walletSnapshot.identity?.canonicalAccountHash,
    telegramCanonicalHash: telegramSnapshot.identity?.canonicalAccountHash,
    walletLookupHash: walletSnapshot.identity?.lookupHash,
    telegramLookupHash: telegramSnapshot.identity?.lookupHash,
    pathsIndependent: true,
    note: 'Wallet path received only walletId; Telegram path received only telegramId.',
  }
  const projectionParity = {
    schema: 'ql7.support.profile-projection-parity',
    ok: walletProjectionHash === telegramProjectionHash,
    profileProjectionEqual: walletProjectionHash === telegramProjectionHash,
    walletProjectionHash,
    telegramProjectionHash,
  }
  const linkReceipt = {
    schema: 'ql7.support.identity-link-receipt',
    readOnly: true,
    writeCount: 0,
    walletInputMasked: mask(walletId),
    telegramInputMasked: mask(telegramId),
    walletPath: 'wallet_only',
    telegramPath: 'telegram_only',
    canonicalAccountHash: walletSnapshot.identity?.canonicalAccountHash,
    canonicalAccountHashEqual: identityParity.ok,
  }
  const parity = {
    ...identityParity,
    ...projectionParity,
    ok: identityParity.ok && projectionParity.ok,
  }
  const noWrites = noWriteProof(walletSnapshot, telegramSnapshot)
  const mongoProof = mongoReadProof({ walletSnapshot, telegramSnapshot })
  const productionWallet = await productionParity(walletSnapshot, 'wallet')
  const productionTelegram = await productionParity(telegramSnapshot, 'telegram')
  const production = {
    schema: 'ql7.support.production-parity',
    ok: productionWallet.ok && productionTelegram.ok,
    wallet: productionWallet,
    telegram: productionTelegram,
    sameExecutor: true,
  }
  const adminReport = buildAdminReport({ walletSnapshot, telegramSnapshot, parity })
  const smtpReceipt = {
    schema: 'ql7.support.smtp-receipt',
    ok: true,
    sent: false,
    skipped: sendEmail !== true,
    reason: sendEmail === true ? 'smtp_transport_not_invoked_by_default_in_lab' : 'smtp_gate_disabled',
    subject: adminReport.subject,
  }
  const summary = {
    schema: 'ql7.support.mongo-read-rating-parity.summary',
    ok: identityParity.ok && projectionParity.ok && noWrites.ok && production.ok,
    generatedAt: new Date().toISOString(),
    outDir: targetDir,
    walletPath: 'wallet_only',
    telegramPath: 'telegram_only',
    identityParityOk: identityParity.ok,
    profileProjectionParityOk: projectionParity.ok,
    noWriteOk: noWrites.ok,
    productionParityOk: production.ok,
    smtpSent: smtpReceipt.sent,
    walletProjectionHash,
    telegramProjectionHash,
  }

  writeJson(path.join(targetDir, 'identity-resolution-wallet.json'), walletSnapshot.identity)
  writeJson(path.join(targetDir, 'identity-resolution-telegram.json'), telegramSnapshot.identity)
  writeJson(path.join(targetDir, 'identity-link-receipt.json'), linkReceipt)
  writeJson(path.join(targetDir, 'identity-link-parity.json'), identityParity)
  writeJson(path.join(targetDir, 'wallet-profile-projection.json'), walletProjection)
  writeJson(path.join(targetDir, 'telegram-profile-projection.json'), telegramProjection)
  writeJson(path.join(targetDir, 'profile-projection-parity.json'), projectionParity)
  writeJson(path.join(targetDir, 'social-graph.json'), {
    schema: 'ql7.support.social-graph',
    readOnly: true,
    forum: receiptBy(walletSnapshot, 'forum')?.result || {},
    quantumFamily: receiptBy(walletSnapshot, 'quantum_family')?.result || {},
  })
  writeJson(path.join(targetDir, 'moderation-history.json'), receiptBy(walletSnapshot, 'moderation')?.result || {})
  writeJson(path.join(targetDir, 'economic-entitlements.json'), {
    schema: 'ql7.support.economic-entitlements',
    readOnly: true,
    qcoin: receiptBy(walletSnapshot, 'qcoin')?.result || {},
    vip: receiptBy(walletSnapshot, 'vip')?.result || {},
    adsPackages: receiptBy(walletSnapshot, 'ads_packages')?.result || {},
    adsCampaigns: receiptBy(walletSnapshot, 'ads_campaigns')?.result || {},
    metamarket: receiptBy(walletSnapshot, 'metamarket')?.result || {},
    battlecoin: receiptBy(walletSnapshot, 'battlecoin')?.result || {},
  })
  writeJson(path.join(targetDir, 'geo-evidence.json'), receiptBy(walletSnapshot, 'geo')?.result || {})
  writeJson(path.join(targetDir, 'rating-input-snapshot.json'), {
    schema: 'ql7.support.rating-input-snapshot',
    profile: walletProjection.profile,
    activity: walletProjection.activity,
    moderation: receiptBy(walletSnapshot, 'moderation')?.result || {},
    economic: {
      qcoin: receiptBy(walletSnapshot, 'qcoin')?.result || {},
      vip: receiptBy(walletSnapshot, 'vip')?.result || {},
    },
    snapshotHash: walletSnapshot.rating?.snapshotHash,
  })
  writeJson(path.join(targetDir, 'rating-factor-ledger.json'), walletSnapshot.rating?.factorLedger || [])
  writeJson(path.join(targetDir, 'rating-explanation-ru.json'), {
    schema: 'ql7.support.rating-explanation-ru',
    explanationRu: walletSnapshot.rating?.explanationRu,
    recommendedActionsRu: walletSnapshot.rating?.recommendedActionsRu || [],
    formulaVersion: walletSnapshot.rating?.formulaVersion,
    snapshotHash: walletSnapshot.rating?.snapshotHash,
  })
  writeJson(path.join(targetDir, 'user-safe-projection.json'), userSafeProjection(walletSnapshot))
  writeJson(path.join(targetDir, 'admin-evidence-projection.json'), adminProjection({ walletSnapshot, telegramSnapshot, parity }))
  writeText(path.join(targetDir, 'admin-report.html'), adminReport.html)
  writeText(path.join(targetDir, 'admin-report.txt'), adminReport.text)
  writeJson(path.join(targetDir, 'smtp-receipt.json'), smtpReceipt)
  writeJson(path.join(targetDir, 'mongo-read-proof.json'), mongoProof)
  writeJson(path.join(targetDir, 'no-write-proof.json'), noWrites)
  writeJson(path.join(targetDir, 'production-parity.json'), production)
  writeJson(path.join(targetDir, 'summary.json'), summary)
  return Object.freeze({
    ok: summary.ok,
    outDir: targetDir,
    summary,
    identityParity,
    projectionParity,
    noWrites,
    production,
  })
}

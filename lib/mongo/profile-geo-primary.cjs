// lib/mongo/profile-geo-primary.cjs
// QL7_GEO111_GEO_IDENTITY_V1
// Private profile geo repository. Only writes profiles._geoCurrent and internal profile_geo_events.

const crypto = require('node:crypto')
const { getMongoDb } = require('./client.cjs')
const { buildPrivateGeoCurrent, isUnknownGeoWriteAllowed } = require('../geo/request-geo.cjs')

const INDEX_KEY = '__ql7ProfileGeoPrimaryIndexesV1'
let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
}

function nowIso() {
  return new Date().toISOString()
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex')
}

async function db(options = {}) {
  if (testDatabase) return testDatabase
  const handle = await getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  if (options.skipEnsureIndexes) return database
  if (!globalThis[INDEX_KEY]) {
    globalThis[INDEX_KEY] = ensureIndexes(database).catch((error) => {
      delete globalThis[INDEX_KEY]
      throw error
    })
  }
  await globalThis[INDEX_KEY]
  return database
}

async function ensureIndexes(database) {
  await Promise.allSettled([
    database.collection('profiles').createIndex({ accountId: 1 }, { unique: true, sparse: true }),
    database.collection('profiles').createIndex({ userId: 1 }),
    database.collection('profiles').createIndex({ canonicalAccountId: 1 }),
    database.collection('profiles').createIndex({ '_geoCurrent.geoKey': 1, '_geoCurrent.lastSeenAt': -1 }),
    database.collection('profiles').createIndex({ '_geoCurrent.country': 1, '_geoCurrent.region': 1, '_geoCurrent.city': 1 }),
    database.collection('profile_geo_events').createIndex({ canonicalAccountId: 1, createdAt: -1 }),
    database.collection('profile_geo_events').createIndex({ geoKey: 1, createdAt: -1 }),
    database.collection('profile_geo_events').createIndex({ action: 1, createdAt: -1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

function addProfileAliasVariants(out, raw) {
  const value = str(raw)
  if (!value) return
  out.add(value)
  const lower = value.toLowerCase()
  if (/^0x[a-f0-9]{40}$/i.test(value)) {
    out.add(lower)
    out.add('wallet:' + lower)
    return
  }
  if (/^wallet:0x[a-f0-9]{40}$/i.test(value)) {
    const bare = value.slice('wallet:'.length)
    out.add(bare)
    out.add(bare.toLowerCase())
    out.add('wallet:' + bare.toLowerCase())
    return
  }
  for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:', 'tma:']) {
    if (lower.startsWith(prefix)) {
      const bare = str(value.slice(prefix.length))
      if (bare) out.add(bare)
      return
    }
  }
}

function profileAliasList(accountId) {
  const ids = new Set()
  addProfileAliasVariants(ids, accountId)
  return Array.from(ids).filter(Boolean)
}

function profileFilter(accountId) {
  const id = str(accountId)
  const ids = profileAliasList(id)
  return {
    $or: [
      { _id: { $in: ids.map((item) => 'profile:' + item) } },
      { accountId: { $in: ids } },
      { userId: { $in: ids } },
      { canonicalAccountId: { $in: ids } },
    ],
  }
}

async function readProfileGeo(accountId, options = {}) {
  const id = str(accountId)
  if (!id) return null
  const database = await db({ skipEnsureIndexes: !!options.skipEnsureIndexes })
  const doc = await database.collection('profiles').findOne(profileFilter(id), {
    projection: { accountId: 1, userId: 1, canonicalAccountId: 1, _geoCurrent: 1 },
  })
  return doc?._geoCurrent || null
}

function shouldWriteGeo(geo = {}) {
  if (geo?.known) return true
  return isUnknownGeoWriteAllowed()
}

function classifyGeoAction(previousGeo = null, nextGeo = {}) {
  if (!previousGeo || !previousGeo.geoKey) return 'first_seen'
  if (str(previousGeo.geoKey) !== str(nextGeo.geoKey)) return 'changed'
  return 'unchanged'
}

async function touchProfileGeo({ accountId, geo, reason = 'session_touch', identitySafeDebug = null } = {}) {
  const id = str(accountId)
  if (!id) {
    const error = new Error('missing_account_id')
    error.code = 'QL7_PROFILE_GEO_MISSING_ACCOUNT_ID'
    throw error
  }

  const resolvedGeo = geo && typeof geo === 'object' ? geo : {}
  if (!shouldWriteGeo(resolvedGeo)) {
    return {
      ok: true,
      action: 'unknown_no_write',
      accountId: id,
      known: false,
      precision: 'global',
      geoStored: false,
      eventWritten: false,
    }
  }

  const database = await db()
  const existing = await database.collection('profiles').findOne(profileFilter(id), {
    projection: { _id: 1, accountId: 1, userId: 1, canonicalAccountId: 1, _geoCurrent: 1 },
  })
  const previousGeo = existing?._geoCurrent || null
  const nextGeo = buildPrivateGeoCurrent(resolvedGeo, previousGeo ? { _geoCurrent: previousGeo } : null)
  const action = classifyGeoAction(previousGeo, nextGeo)
  const iso = str(nextGeo.lastSeenAt) || nowIso()
  if (action === 'changed') nextGeo.changedAt = iso
  const filter = existing?._id ? { _id: existing._id } : { accountId: id }

  const set = {
    accountId: id,
    userId: id,
    canonicalAccountId: id,
    _geoCurrent: nextGeo,
    updatedAt: iso,
    storagePrimary: 'mongo',
    geoSessionTouchVersion: 'ql7-geo111-v1',
  }
  await database.collection('profiles').updateOne(
    filter,
    {
      $set: set,
      $setOnInsert: { _id: 'profile:' + id, createdAt: iso },
    },
    { upsert: true },
  )

  let eventWritten = false
  if (action === 'first_seen' || action === 'changed') {
    const eventId = 'profile_geo:' + id + ':' + sha256([action, nextGeo.geoKey, iso].join('|')).slice(0, 24)
    await database.collection('profile_geo_events').updateOne(
      { _id: eventId },
      {
        $setOnInsert: {
          _id: eventId,
          canonicalAccountId: id,
          accountId: id,
          action,
          reason: str(reason) || 'session_touch',
          geoKey: nextGeo.geoKey,
          precision: nextGeo.precision,
          country: nextGeo.country,
          region: nextGeo.region,
          city: nextGeo.city,
          source: nextGeo.source,
          confidence: nextGeo.confidence,
          previousGeoKey: previousGeo?.geoKey || '',
          identitySafeDebug: identitySafeDebug && typeof identitySafeDebug === 'object' ? identitySafeDebug : undefined,
          createdAt: iso,
          storagePrimary: 'mongo',
          geoSessionTouchVersion: 'ql7-geo111-v1',
        },
      },
      { upsert: true },
    )
    eventWritten = true
  }

  return {
    ok: true,
    action,
    accountId: id,
    known: !!nextGeo.known,
    precision: nextGeo.precision,
    geoStored: true,
    eventWritten,
    geoKeyHash: sha256(nextGeo.geoKey).slice(0, 16),
  }
}

module.exports = {
  __setTestDb,
  ensureIndexes,
  profileAliasList,
  readProfileGeo,
  touchProfileGeo,
}

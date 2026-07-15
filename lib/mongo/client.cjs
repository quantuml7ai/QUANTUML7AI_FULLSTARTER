// lib/mongo/client.cjs
// QL7_MONGO_CLIENT_DOH_DIRECT_SEED_V7
// Runtime-safe Mongo client for Next.js product routes.
// Adds DNS override + optional DNS-over-HTTPS direct seed conversion for Atlas SRV URIs.

const dns = require('node:dns')
const https = require('node:https')
const { URLSearchParams } = require('node:url')
const { MongoClient } = require('mongodb')

const CLIENT_PROMISE_KEY = '__ql7MongoClientPromise'
const CLIENT_META_KEY = '__ql7MongoClientRuntimeMeta'
const DNS_OVERRIDE_KEY = '__ql7MongoDnsOverrideApplied'
const DOH_CACHE_KEY = '__ql7MongoDohDirectSeedCacheV7'

function parseCsv(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function boolEnv(name, fallback = false) {
  const raw = process.env[name]

  if (raw == null || raw === '') return Boolean(fallback)

  const normalized = String(raw).trim().toLowerCase()

  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false

  return Boolean(fallback)
}

function applyMongoDnsOverride() {
  const servers = parseCsv(process.env.MONGO_DNS_SERVERS)

  if (!servers.length) return dns.getServers()

  const signature = servers.join(',')

  if (globalThis[DNS_OVERRIDE_KEY] !== signature) {
    dns.setServers(servers)
    globalThis[DNS_OVERRIDE_KEY] = signature
  }

  return dns.getServers()
}

function getMongoUri() {
  const uri = String(process.env.MONGODB_URI ?? '').trim()

  if (!uri) {
    const error = new Error('MONGODB_URI is not configured')
    error.code = 'MONGODB_URI_MISSING'
    error.exitCode = 3
    throw error
  }

  return uri
}

function getMongoDbName() {
  const dbName = String(process.env.MONGODB_DB ?? '').trim()

  if (!dbName) {
    const error = new Error('MONGODB_DB is not configured')
    error.code = 'MONGODB_DB_MISSING'
    error.exitCode = 3
    throw error
  }

  return dbName
}

function httpsJson(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let settled = false
    let deadline = null
    const settle = (callback, value) => {
      if (settled) return
      settled = true
      if (deadline) clearTimeout(deadline)
      callback(value)
    }
    const req = https.get(url, {
      timeout: timeoutMs,
      headers: { accept: 'application/dns-json' },
    }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const error = new Error('DoH HTTP ' + res.statusCode)
          error.code = 'MONGO_DOH_HTTP_' + res.statusCode
          settle(reject, error)
          return
        }
        try {
          settle(resolve, JSON.parse(body))
        } catch (e) {
          const error = new Error('DoH JSON parse failed: ' + String(e && e.message ? e.message : e))
          error.code = 'MONGO_DOH_JSON_PARSE_FAILED'
          settle(reject, error)
        }
      })
    })

    req.on('timeout', () => {
      const error = new Error('DoH request timed out')
      error.code = 'MONGO_DOH_TIMEOUT'
      req.destroy(error)
      settle(reject, error)
    })
    req.on('error', (error) => settle(reject, error))
    deadline = setTimeout(() => {
      if (settled) return
      const error = new Error('DoH request deadline exceeded')
      error.code = 'MONGO_DOH_DEADLINE_EXCEEDED'
      req.destroy(error)
      settle(reject, error)
    }, Math.max(1000, Number(timeoutMs) || 8000))
    if (settled && deadline) clearTimeout(deadline)
  })
}

async function resolveDoh(name, type) {
  const cleanName = String(name || '').replace(/\.$/, '')
  const cleanType = String(type || '').toUpperCase()
  const endpoints = [
    'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(cleanName) + '&type=' + encodeURIComponent(cleanType),
    'https://dns.google/resolve?name=' + encodeURIComponent(cleanName) + '&type=' + encodeURIComponent(cleanType),
  ]
  const errors = []

  for (const endpoint of endpoints) {
    try {
      const json = await httpsJson(endpoint)
      if (json && Array.isArray(json.Answer) && json.Answer.length) return json
      errors.push(endpoint + ' returned no Answer')
    } catch (e) {
      errors.push(endpoint + ' failed: ' + String(e && e.message ? e.message : e))
    }
  }

  const error = new Error('DoH ' + cleanType + ' resolve failed for ' + cleanName + ': ' + errors.join(' | '))
  error.code = 'MONGO_DOH_RESOLVE_FAILED'
  throw error
}

function parseSrvAnswer(answer) {
  const rows = Array.isArray(answer && answer.Answer) ? answer.Answer : []
  return rows
    .map((row) => {
      const parts = String(row && row.data ? row.data : '').trim().split(/\s+/)
      if (parts.length < 4) return null
      const priority = Number(parts[0])
      const weight = Number(parts[1])
      const port = Number(parts[2])
      const host = String(parts.slice(3).join(' ')).replace(/\.$/, '')
      if (!host || !Number.isFinite(port)) return null
      return {
        host,
        port,
        priority: Number.isFinite(priority) ? priority : 0,
        weight: Number.isFinite(weight) ? weight : 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a.priority - b.priority) || (b.weight - a.weight) || a.host.localeCompare(b.host))
}

function parseTxtAnswer(answer) {
  const rows = Array.isArray(answer && answer.Answer) ? answer.Answer : []
  const params = new URLSearchParams()

  for (const row of rows) {
    const raw = String(row && row.data ? row.data : '')
      .replace(/^"|"$/g, '')
      .replace(/"\s+"/g, '')
      .trim()
    if (!raw) continue
    const itemParams = new URLSearchParams(raw)
    for (const [key, value] of itemParams.entries()) {
      if (key) params.set(key, value)
    }
  }

  return params
}

function parseMongoSrvUriParts(uri) {
  const withoutScheme = String(uri).slice('mongodb+srv://'.length)
  const queryIndex = withoutScheme.indexOf('?')
  const beforeQuery = queryIndex >= 0 ? withoutScheme.slice(0, queryIndex) : withoutScheme
  const query = queryIndex >= 0 ? withoutScheme.slice(queryIndex + 1) : ''
  const slashIndex = beforeQuery.indexOf('/')
  const authority = slashIndex >= 0 ? beforeQuery.slice(0, slashIndex) : beforeQuery
  const pathPart = slashIndex >= 0 ? beforeQuery.slice(slashIndex) : '/'
  const atIndex = authority.lastIndexOf('@')
  const authPart = atIndex >= 0 ? authority.slice(0, atIndex + 1) : ''
  const clusterHost = atIndex >= 0 ? authority.slice(atIndex + 1) : authority

  return {
    authPart,
    clusterHost: clusterHost.replace(/\.$/, ''),
    pathPart: pathPart || '/',
    query,
  }
}

function shouldUseDohDirectSeed(uri) {
  // QL7_MONGO_PERMANENT_CODE_POLICY_V16: Atlas SRV is always converted through DoH/direct seed in runtime.
  return String(uri).startsWith('mongodb+srv://')
}

async function convertSrvUriToDirectSeedUri(uri) {
  if (!shouldUseDohDirectSeed(uri)) {
    return {
      uri,
      mode: String(uri).startsWith('mongodb+srv://') ? 'mongodb_srv_driver_dns' : 'mongodb_direct_configured',
      clusterHost: null,
      seedHosts: [],
    }
  }

  const cacheKey = String(uri)
  const cache = globalThis[DOH_CACHE_KEY] || (globalThis[DOH_CACHE_KEY] = new Map())
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const parts = parseMongoSrvUriParts(uri)
  const srvAnswer = await resolveDoh('_mongodb._tcp.' + parts.clusterHost, 'SRV')
  const srvRows = parseSrvAnswer(srvAnswer)

  if (!srvRows.length) {
    const error = new Error('Atlas SRV did not return seed hosts for ' + parts.clusterHost)
    error.code = 'MONGO_DOH_EMPTY_SRV'
    throw error
  }

  let txtParams = new URLSearchParams()
  try {
    txtParams = parseTxtAnswer(await resolveDoh(parts.clusterHost, 'TXT'))
  } catch {}

  const merged = new URLSearchParams()
  for (const [key, value] of txtParams.entries()) merged.set(key, value)
  for (const [key, value] of new URLSearchParams(parts.query).entries()) merged.set(key, value)

  if (!merged.has('tls')) merged.set('tls', 'true')
  if (!merged.has('ssl')) merged.set('ssl', 'true')
  if (!merged.has('authSource')) merged.set('authSource', 'admin')
  if (!merged.has('retryWrites')) merged.set('retryWrites', 'true')
  if (!merged.has('w')) merged.set('w', 'majority')
  merged.delete('directConnection')

  const seedHosts = srvRows.map((row) => row.host + ':' + row.port)
  const directUri = 'mongodb://' + parts.authPart + seedHosts.join(',') + parts.pathPart + '?' + merged.toString()
  const value = {
    uri: directUri,
    mode: 'mongodb_doh_direct_seed_v7',
    clusterHost: parts.clusterHost,
    seedHosts,
    replicaSet: merged.get('replicaSet') || null,
  }

  cache.set(cacheKey, { value, expiresAt: Date.now() + 10 * 60 * 1000 })
  return value
}

async function getMongoRuntimeUri() {
  applyMongoDnsOverride()
  const configuredUri = getMongoUri()
  const runtime = await convertSrvUriToDirectSeedUri(configuredUri)
  return {
    configuredScheme: configuredUri.startsWith('mongodb+srv://') ? 'mongodb+srv' : (configuredUri.startsWith('mongodb://') ? 'mongodb' : 'unknown'),
    ...runtime,
  }
}

function mongoClientOptions() {
  return {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE ?? 10),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE ?? 0),
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 10000),
    connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS ?? 10000),
    socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS ?? 30000),
    retryWrites: true,
  }
}

function getMongoClient() {
  if (!globalThis[CLIENT_PROMISE_KEY]) {
    const promise = (async () => {
      const runtime = await getMongoRuntimeUri()
      globalThis[CLIENT_META_KEY] = {
        mode: runtime.mode,
        configuredScheme: runtime.configuredScheme,
        clusterHost: runtime.clusterHost,
        seedHostsTotal: Array.isArray(runtime.seedHosts) ? runtime.seedHosts.length : 0,
        replicaSet: runtime.replicaSet || null,
      }

      const client = new MongoClient(runtime.uri, mongoClientOptions())
      try {
        await client.connect()
        return client
      } catch (error) {
        await client.close().catch(() => {})
        throw error
      }
    })()
    globalThis[CLIENT_PROMISE_KEY] = promise
    promise.catch(() => {
      if (globalThis[CLIENT_PROMISE_KEY] === promise) {
        delete globalThis[CLIENT_PROMISE_KEY]
        delete globalThis[CLIENT_META_KEY]
      }
    })
  }

  return globalThis[CLIENT_PROMISE_KEY]
}

function getMongoClientRuntimeMeta() {
  return globalThis[CLIENT_META_KEY] || null
}

async function getMongoDb(dbName = getMongoDbName()) {
  const client = await getMongoClient()

  return {
    client,
    db: client.db(dbName),
    dbName,
    runtime: getMongoClientRuntimeMeta(),
  }
}

async function pingMongo() {
  const { db, dbName, runtime } = await getMongoDb()
  const startedAt = Date.now()

  await db.command({ ping: 1 })

  return {
    ok: true,
    dbName,
    latencyMs: Date.now() - startedAt,
    runtime,
  }
}

async function closeMongoClient() {
  const promise = globalThis[CLIENT_PROMISE_KEY]

  if (!promise) return false

  delete globalThis[CLIENT_PROMISE_KEY]
  delete globalThis[CLIENT_META_KEY]

  const client = await promise
  await client.close()

  return true
}

function mongoFeatureFlags() {
  // QL7_MONGO_PERMANENT_CODE_POLICY_V17: non-secret Mongo/Redis ownership is code-owned, not ENV-owned.
  const { getMongoPermanentPolicy } = require('./permanent-policy.cjs')
  const p = getMongoPermanentPolicy()
  const rd = p.readDomains || {}
  return {
    enabled: Boolean(p.mongoEnabled),
    parallelPermanentWrites: Boolean(p.parallelPermanentWrites),
    readProfile: Boolean(rd.profile),
    readAds: Boolean(rd.ads),
    readForum: Boolean(rd.forum),
    readDm: Boolean(rd.dm),
    readQcoin: Boolean(rd.qcoin),
    readBattlecoin: Boolean(rd.battlecoin),
    readPayments: Boolean(rd.payments || rd.pay),
    readMetaMarket: Boolean(rd.metamarket),
    readPush: Boolean(rd.push),
    readQuest: Boolean(rd.quest),
    readSubscription: Boolean(rd.subscription),
    readTelegram: Boolean(rd.telegram),
    verifyParityReads: Boolean(p.verifyParityReads),
    runtimeComparisonReads: Boolean(p.runtimeComparisonReads),
    readCutover: Boolean(p.readCutover),
    mongoPrimaryWrites: Boolean(p.mongoPrimaryWrites),
    redisFallbackEnabled: Boolean(p.redisFallbackEnabled),
    migrationLockEnabled: Boolean(p.migrationLockEnabled),
  }
}

module.exports = {
  applyMongoDnsOverride,
  closeMongoClient,
  convertSrvUriToDirectSeedUri,
  getMongoClient,
  getMongoClientRuntimeMeta,
  getMongoDb,
  getMongoDbName,
  getMongoRuntimeUri,
  getMongoUri,
  mongoFeatureFlags,
  pingMongo,
}



// lib/adsCore.js
// "Мозг" рекламы: тарифы, пакеты, кампании, инвойсы, аналитика, upload, NOWPayments.

import { Redis } from '@upstash/redis'
import { put } from '@vercel/blob'

// ========== БАЗА / КОНСТАНТЫ ==========

const redis = Redis.fromEnv()

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

// Общий базовый URL NOWPayments: сначала общий, потом ads-специфичный
const NOWPAYMENTS_API_BASE =
  (process.env.NOWPAYMENTS_API_BASE ||
    process.env.NOWPAYMENTS_API_BASE_ADS ||
    'https://api.nowpayments.io/v1').trim()

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  ''

// Общий API-ключ NOWPayments: сначала общий, потом ads-специфичный
const NOWPAYMENTS_API_KEY_ADS = (
  process.env.NOWPAYMENTS_API_KEY ||
  process.env.NOWPAYMENTS_API_KEY_ADS ||
  ''
).trim()

// Общий callback для IPN: сначала ads-специфичный, потом общий, потом дефолт /api/pay/webhook
const NOWPAYMENTS_IPN_CALLBACK_URL_ADS = (
  process.env.NOWPAYMENTS_IPN_CALLBACK_URL_ADS ||
  process.env.NOWPAYMENTS_IPN_CALLBACK_URL ||
  (SITE_URL ? `${SITE_URL}/api/pay/webhook` : '')
).trim()

const BLOB_TOKEN =
  process.env.FORUM_READ_WRITE_TOKEN ||
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.ADS_READ_WRITE_TOKEN ||
  ''

// ========== УТИЛИТЫ ==========

function nowIso() {
  return new Date().toISOString()
}

function nowMs() {
  return Date.now()
}

// те же вспомогательные ключи, что и в lib/subscriptions.js
const ACC_KEY = (addr) => `acc:${addr}`       // HASH { tg_id: <uid> }
const TG_UID_KEY = (uid) => `tg:uid:${uid}`   // STRING "<0x...>"

// Нормализация accountId: кошелёк или Telegram uid / идентификатор
function normalizeAccountId(raw) {
  if (!raw) return null
  let s = String(raw).trim()
  if (!s) return null

  const lower = s.toLowerCase()

  // поддержка форматов вида "tguid:<id>" / "tg:<id>"
  if (lower.startsWith('tguid:')) {
    s = s.slice('tguid:'.length)
  } else if (lower.startsWith('tg:')) {
    s = s.slice('tg:'.length)
  }

  return s.toLowerCase() || null
}

// Возвращаем все связанные accountId для чтения пакетов/кампаний:
// - сам переданный (кошелёк ИЛИ tg uid / telegram id)
// - если это кошелёк → добираем tg_id / uid из acc:<addr>
// - если это числовой uid → ищем привязанный кошелёк в tg:uid:<uid> или telegramid:<id>
async function resolveAccountIds(raw) {
  const rawStr = String(raw ?? '').trim()
  const primary = normalizeAccountId(rawStr)
  if (!primary) return []

  const ids = new Set([primary])

  // Кошелёк → uid (tg_id)
  if (primary.startsWith('0x')) {
    try {
      // сначала по нормализованному (lowercase) ключу
      let tgId = await redis.hget(ACC_KEY(primary), 'tg_id')

      // если не нашли — пробуем по "сырому" checksum-адресу, как мог быть записан в БД
      if (!tgId && rawStr.toLowerCase().startsWith('0x') && rawStr.toLowerCase() !== primary) {
        tgId = await redis.hget(ACC_KEY(rawStr), 'tg_id')
      }

      if (tgId) {
        ids.add(String(tgId))
      }
    } catch {
      /* noop */
    }
  }

  // Числовой id (tg uid) → кошелёк
  if (/^\d+$/.test(primary)) {
    try {
      let addr = await redis.get(TG_UID_KEY(primary)) // "0x...."

      // на всякий случай поддержим возможный старый ключ вида telegramid:<id>
      if (!addr) {
        addr = await redis.get(`telegramid:${primary}`)
      }

      if (addr) {
        ids.add(String(addr).trim().toLowerCase())
      }
    } catch {
      /* noop */
    }
  }

  return Array.from(ids)
}

function safeJSONparse(str) {
  if (typeof str !== 'string') return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

// FNV-1a 32-bit, как в ForumAds.js
function hash32(str) {
  str = String(str || '')
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Нормализация URL ровно как в ForumAds.normalizeUrl
function normalizeUrlForHash(raw) {
  if (!raw) return null
  let s = String(raw).trim()
  if (!s) return null

  if (!/^https?:\/\//i.test(s)) s = 'https://' + s

  let u
  try {
    u = new URL(s)
  } catch {
    return null
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null

  u.hostname = u.hostname.toLowerCase()

  if (u.pathname !== '/' && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.slice(0, -1)
  }

  if (u.search) {
    const entries = Array.from(u.searchParams.entries()).sort((a, b) =>
      a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0,
    )
    u.search = ''
    for (const [k, val] of entries) u.searchParams.append(k, val)
  }

  return u.toString()
}

function computeUrlHash(clickUrl) {
  const norm = normalizeUrlForHash(clickUrl)
  if (!norm) return null
  return hash32(norm)
}
// ---- Обёртки над Upstash Redis ----

async function setJSON(key, value) {
  return redis.set(key, JSON.stringify(value))
}

async function getJSON(key) {
  const v = await redis.get(key)
  if (!v) return null
  if (typeof v === 'string') return safeJSONparse(v)
  // Upstash может вернуть уже объект
  return v
}

async function setString(key, value) {
  return redis.set(key, String(value))
}

async function getString(key) {
  const v = await redis.get(key)
  if (v == null) return null
  if (typeof v === 'string') return v
  return String(v)
}

async function incr(key) {
  return redis.incr(key)
}

async function sadd(key, member) {
  return redis.sadd(key, member)
}

async function srem(key, member) {
  return redis.srem(key, member)
}
async function smembers(key) {
  const arr = await redis.smembers(key)
  return Array.isArray(arr) ? arr : []
}

async function delKey(key) {
  return redis.del(key)
}

// ========== ТАРИФЫ ==========

function envNum(name, fallback) {
  const raw = process.env[name]
  const n = Number(raw)
  if (!raw || !Number.isFinite(n) || n <= 0) return fallback
  return n
}

const ADS_CURRENCY =
  (process.env.NOWPAYMENTS_CURRENCY || 'USD').trim().toUpperCase()

// Серверный источник правды по тарифам рекламы.
// Должен совпадать с фронтовыми NEXT_PUBLIC_ADS_*.
const ADS_PLANS = [
  {
    internalName: 'STARTER',
    displayName: 'Starter',
    description: 'Стартовый пакет для небольших кампаний.',
    durationDays: envNum('NEXT_PUBLIC_ADS_STARTER_DAYS', 7),
    maxCampaigns: envNum('NEXT_PUBLIC_ADS_STARTER_MAX_CAMPAIGNS', 1),
    maxMediaPerCampaign: envNum('NEXT_PUBLIC_ADS_STARTER_MAX_MEDIA', ),
    price: envNum('NEXT_PUBLIC_ADS_STARTER_PRICE_USD', 300),
    currency: ADS_CURRENCY,
  },
  {
    internalName: 'PRO',
    displayName: 'Pro',
    description: 'Пакет для регулярного трафика.',
    durationDays: envNum('NEXT_PUBLIC_ADS_PRO_DAYS', 30),
    maxCampaigns: envNum('NEXT_PUBLIC_ADS_PRO_MAX_CAMPAIGNS', 5),
    maxMediaPerCampaign: envNum('NEXT_PUBLIC_ADS_PRO_MAX_MEDIA', ),
    price: envNum('NEXT_PUBLIC_ADS_PRO_PRICE_USD', 1500),
    currency: ADS_CURRENCY,
  },
  {
    internalName: 'ELITE',
    displayName: 'Elite',
    description: 'Годовой пакет максимального охвата.',
    durationDays: envNum('NEXT_PUBLIC_ADS_ELITE_DAYS', 365),
    maxCampaigns: envNum('NEXT_PUBLIC_ADS_ELITE_MAX_CAMPAIGNS', 20),
    maxMediaPerCampaign: envNum('NEXT_PUBLIC_ADS_ELITE_MAX_MEDIA', ),
    price: envNum('NEXT_PUBLIC_ADS_ELITE_PRICE_USD', 9000),
    currency: ADS_CURRENCY,
  },
]

export function getAdsPackageConfig(pkgType) {
  if (!pkgType) return null
  const name = String(pkgType).toUpperCase()
  return ADS_PLANS.find((p) => p.internalName === name) || null
}

// ========== СУЩНОСТИ / КЛЮЧИ ==========

// Account: ads:account:<accountId>
async function touchAccount(accountIdRaw) {
  const accountId = normalizeAccountId(accountIdRaw)
  if (!accountId) return null

  const key = `ads:account:${accountId}`
  const now = nowIso()
  const existing = await getJSON(key)

  if (!existing) {
    const acc = {
      id: accountId,
      createdAt: now,
      lastSeenAt: now,
    }
    await setJSON(key, acc)
    return acc
  }

  existing.lastSeenAt = now
  await setJSON(key, existing)
  return existing
}

// AdPackage: ads:package:<id> + ads:packages:<accountId> + ads:package:byInvoice:<invoiceId>

function computeDaysLeft(expiresAt) {
  if (!expiresAt) return null
  const ts = new Date(expiresAt).getTime()
  if (!Number.isFinite(ts)) return null
  const diff = ts - nowMs()
  if (diff <= 0) return 0
  return Math.ceil(diff / DAY_MS)
}

async function hydratePackage(pkg) {
  if (!pkg) return null
  const daysLeft = computeDaysLeft(pkg.expiresAt)
  return { ...pkg, daysLeft }
}

async function getPackageById(id) {
  if (!id) return null
  const pkg = await getJSON(`ads:package:${id}`)
  return hydratePackage(pkg)
}

export async function grantAdsPackageForAccount({
  accountId: rawAccountId,
  pkgType = 'ELITE',
  note = 'manual-grant',
}) {
  if (!rawAccountId) {
    throw new Error('grantAdsPackageForAccount: accountId is required')
  }

  // 1) Нормализуем (tguid:/tg:/0x и т.п.)
  const accountId = normalizeAccountId(rawAccountId)
  if (!accountId) {
    throw new Error('grantAdsPackageForAccount: invalid accountId')
  }

  const plan = getAdsPackageConfig(pkgType)
  if (!plan) {
    throw new Error(`Unknown pkgType: ${pkgType}`)
  }

  const now = nowMs()
  const id = `pkg_${accountId}_${now}`

  const startsAt = new Date(now).toISOString()
  const expiresAt = new Date(
    now + (plan.durationDays || plan.days || 30) * DAY_MS,
  ).toISOString()

  const raw = {
    id,
    accountId, // <<< уже нормализованный ID
    planId: plan.internalName,
    pkgType: plan.internalName,
    type: plan.internalName,
    status: 'active',
    createdAt: startsAt,
    updatedAt: startsAt,
    startsAt,
    expiresAt,
    usedCampaigns: 0,
    maxCampaigns: plan.maxCampaigns,
    maxMediaPerCampaign: plan.maxMediaPerCampaign,
    note,
  }

  // Ключи такие же, как используются в getPackagesForAccount / hydratePackage
  await setJSON(`ads:package:${id}`, raw)

  // 2) Индексируем и по нормализованному, и по «сырому», чтобы не потерять старые кейсы
  const keysToIndex = new Set([accountId])
  const rawTrimmed = String(rawAccountId || '').trim()
  if (rawTrimmed && rawTrimmed !== accountId) {
    keysToIndex.add(rawTrimmed)
  }

  for (const key of keysToIndex) {
    await redis.sadd(`ads:packages:${key}`, id)
  }

  return hydratePackage(raw, plan)
}

async function getPackagesForAccount(accountIdRaw) {
  const accountIds = await resolveAccountIds(accountIdRaw)
  if (!accountIds.length) return []

  const out = []
  const seenPkgIds = new Set()

  // собираем пакеты для всех связанных идентификаторов:
  // wallet, telegram uid и т.п.
  for (const accId of accountIds) {
    const ids = await smembers(`ads:packages:${accId}`)
    for (const id of ids) {
      if (seenPkgIds.has(id)) continue
      const pkg = await getJSON(`ads:package:${id}`)
      if (pkg) {
        seenPkgIds.add(id)
        out.push(pkg)
      }
    }
  }

  // newest first
  out.sort((a, b) => {
    const aTs = new Date(a.startsAt || a.createdAt || 0).getTime()
    const bTs = new Date(b.startsAt || b.createdAt || 0).getTime()
    return bTs - aTs
  })
  return out
}


async function findActivePackageForAccount(accountIdRaw) {
  const list = await getPackagesForAccount(accountIdRaw)
  const now = nowMs()
  const active = list.find((p) => {
    if (p.status !== 'active') return false
    if (!p.expiresAt) return true
    const ts = new Date(p.expiresAt).getTime()
    return Number.isFinite(ts) && ts > now
  })
  if (active) return hydratePackage(active)
  return null
}

// Campaign: ads:campaign:<id>, ads:campaigns:<accountId>, ads:campaigns:pkg:<packageId>, ads:campaigns:all

async function getCampaignById(id) {
  if (!id) return null
  return getJSON(`ads:campaign:${id}`)
}

async function getCampaignsForAccount(accountIdRaw) {
  const accountIds = await resolveAccountIds(accountIdRaw)
  if (!accountIds.length) return []

  const out = []
  const seenCampaignIds = new Set()

  for (const accId of accountIds) {
    const ids = await smembers(`ads:campaigns:${accId}`)
    for (const id of ids) {
      if (seenCampaignIds.has(id)) continue
      const c = await getCampaignById(id)
      if (c) {
        seenCampaignIds.add(id)
        out.push(c)
      }
    }
  }

  // Активные наверх
  const activeStatuses = new Set(['pending', 'active', 'running', 'paused'])
  out.sort((a, b) => {
    const aActive = activeStatuses.has(a.status)
    const bActive = activeStatuses.has(b.status)
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    const aTs = new Date(a.createdAt || a.startsAt || 0).getTime()
    const bTs = new Date(b.createdAt || b.startsAt || 0).getTime()
    return bTs - aTs
  })
  return out
}


// Invoice: ads:invoice:<id>, ads:invoice:external:<externalId>
// (используется только для legacy-потока adspkg:<internalId>)

async function getInvoiceById(id) {
  if (!id) return null
  return getJSON(`ads:invoice:${id}`)
}

async function saveInvoice(inv) {
  if (!inv || !inv.id) return
  await setJSON(`ads:invoice:${inv.id}`, inv)
}

async function getInvoiceByExternalId(extId) {
  if (!extId) return null
  const internalId = await getString(`ads:invoice:external:${extId}`)
  if (!internalId) return null
  return getInvoiceById(internalId)
}

// Analytics: ads:analytics:<campaignId>:<groupBy>:<bucketStart>

// ========== ПУБЛИЧНЫЕ ФУНКЦИИ ДЛЯ API ==========

// 1. Пакеты + кабинет
export async function getPackagesWithCurrent(accountIdRaw) { 
  const accountId = normalizeAccountId(accountIdRaw)

  let currentPackage = null
  if (accountId) {
    // для чтения используем сырой accountId,
    // внутри getPackagesForAccount / findActivePackageForAccount работает resolveAccountIds
    const pkgs = await getPackagesForAccount(accountIdRaw)
    const active = await findActivePackageForAccount(accountIdRaw)
    if (active) {
      currentPackage = active
    } else if (pkgs[0]) {
      currentPackage = await hydratePackage(pkgs[0])
    }
  }

  return {
    ok: true,
    packages: ADS_PLANS,
    currentPackage,
  }
}



export async function getCabinet(accountIdRaw) {
  const accountId = normalizeAccountId(accountIdRaw)
  if (!accountId) {
    return { ok: false, error: 'NO_ACCOUNT' }
  }

  // логируем активность по нормализованному ID
  await touchAccount(accountId)

  // а пакеты/кампании читаем по ВСЕМ связанным id (wallet + uid + telegram)
  const pkg = await findActivePackageForAccount(accountIdRaw)
  const allPkgs = await getPackagesForAccount(accountIdRaw)
  const effectivePkg =
    pkg || (allPkgs[0] ? await hydratePackage(allPkgs[0]) : null)

  const campaigns = await getCampaignsForAccount(accountIdRaw)

  return {
    ok: true,
    package: effectivePkg,
    campaigns,
  }
}


// 2. Покупка пакета (NOWPayments) — legacy поток adspkg:<internalId>

export async function createPurchase({ accountId: rawAccountId, pkgType }) {
  const accountId = normalizeAccountId(rawAccountId)
  if (!accountId) {
    return { ok: false, error: 'NO_ACCOUNT' }
  }

  const plan = getAdsPackageConfig(pkgType)
  if (!plan) {
    return { ok: false, error: 'UNKNOWN_PACKAGE' }
  }

  const apiKey = NOWPAYMENTS_API_KEY_ADS
  if (!apiKey) {
    return {
      ok: false,
      error: 'NO_NOWPAYMENTS_API_KEY',
    }
  }

  const now = nowIso()
  const internalId = String(await incr('ads:seq:invoice'))

  // ВАЖНО: префикс adspkg: — по нему общий вебхук поймёт, что это реклама
  // Здесь legacy формат: adspkg:<internalId>
  const orderId = `adspkg:${internalId}`

  const invoice = {
    id: internalId,
    externalId: null,
    accountId,
    pkgType: plan.internalName,
    amount: plan.price,
    currency: plan.currency,
    status: 'pending',
    paymentUrl: null,
    orderId,
    meta: {},
    createdAt: now,
    paidAt: null,
    expiresAt: null,
    updatedAt: now,
    lastStatus: null,
  }

  await saveInvoice(invoice)

  const payload = {
    price_amount: plan.price,
    price_currency: plan.currency,
    order_id: orderId,
    order_description: `Ads package ${plan.internalName} for ${accountId}`,
    success_url: `${SITE_URL}/ads/home?status=success`,
    cancel_url: `${SITE_URL}/ads/home?status=cancel`,
    // Единый IPN-вебхук: /api/pay/webhook (или что задашь в ENV)
    ipn_callback_url: NOWPAYMENTS_IPN_CALLBACK_URL_ADS,
  }

  const res = await fetch(`${NOWPAYMENTS_API_BASE}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    return {
      ok: false,
      error: `NOWPAYMENTS_HTTP_${res.status}`,
      details: txt.slice(0, 500),
    }
  }

  const data = await res.json().catch(() => null)

  const externalId = data?.id || data?.invoice_id || null
  const paymentUrl = data?.invoice_url || data?.pay_address || null

  if (!externalId || !paymentUrl) {
    return {
      ok: false,
      error: 'NOWPAYMENTS_BAD_RESPONSE',
    }
  }

  invoice.externalId = String(externalId)
  invoice.paymentUrl = String(paymentUrl)
  invoice.updatedAt = nowIso()

  await saveInvoice(invoice)
  await setString(`ads:invoice:external:${invoice.externalId}`, invoice.id)

  return {
    ok: true,
    invoiceId: invoice.id,
    paymentUrl: invoice.paymentUrl,
  }
}

// 3. Активация пакета по оплаченному инвойсу

export async function applyPaidInvoice(invoice, nowDate = new Date()) {
  if (!invoice || !invoice.id) return null

  // Идемпотентность: если по этому инвойсу уже есть пакет — возвращаем его.
  const packageByInvoiceId = await getString(`ads:package:byInvoice:${invoice.id}`)
  if (packageByInvoiceId) {
    return getPackageById(packageByInvoiceId)
  }

  // Определяем тип пакета: сначала meta.pkgType (новая схема),
  // потом invoice.pkgType (legacy), всё приводим к верхнему регистру.
  const rawType =
    (invoice.meta && invoice.meta.pkgType) ||
    invoice.pkgType ||
    (invoice.meta && invoice.meta.plan && invoice.meta.plan.internalName) ||
    null

  const plan = getAdsPackageConfig(rawType)
  if (!plan) return null

  const nowTs = nowDate.getTime()
  const startsAt = new Date(nowTs).toISOString()
  const expiresAt = new Date(nowTs + plan.durationDays * DAY_MS).toISOString()

  const pkgId = String(await incr('ads:seq:package'))

  // Нормализуем accountId из инвойса (важно для tguid:/tg:)
  const normalizedAccountId = normalizeAccountId(invoice.accountId)
  const effectiveAccountId = normalizedAccountId || invoice.accountId

  const pkg = {
    id: pkgId,
    invoiceId: invoice.id,
    accountId: effectiveAccountId, // <<< используем нормализованный ID
    pkgType: plan.internalName,
    status: 'active',
    maxCampaigns: plan.maxCampaigns,
    usedCampaigns: 0,
    maxMediaPerCampaign: plan.maxMediaPerCampaign,
    startsAt,
    expiresAt,
    createdAt: startsAt,
    updatedAt: startsAt,
  }

  await setJSON(`ads:package:${pkgId}`, pkg)

  // Индексы пакетов: и по нормализованному, и по исходному значению
  const keysToIndex = new Set()
  if (effectiveAccountId) keysToIndex.add(effectiveAccountId)

  const rawAcc = String(invoice.accountId || '').trim()
  if (rawAcc && rawAcc !== effectiveAccountId) {
    keysToIndex.add(rawAcc)
  }

  for (const key of keysToIndex) {
    await sadd(`ads:packages:${key}`, pkgId)
  }

  await setString(`ads:package:byInvoice:${invoice.id}`, pkgId)

  return hydratePackage(pkg)
}

// Алиас под контракт из ТЗ: applyPaidAdsInvoice(invoice, nowDate)
export async function applyPaidAdsInvoice(invoice, nowDate = new Date()) {
  return applyPaidInvoice(invoice, nowDate)
}

// 4. Создание кампании (мультикреатив)

function normalizeClickUrl(raw) {
  if (!raw) return null
  let url = String(raw).trim()
  if (!url) return null

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  let u
  try {
    u = new URL(url)
  } catch {
    return null
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return null
  }

  return u.toString()
}

function inferMediaTypeFromUrl(url) {
  if (!url) return 'none'
  const lower = String(url).toLowerCase()
  if (lower.endsWith('.mp4') || lower.includes('video')) return 'video'
  return 'image'
}

export async function createCampaign({
  accountId: rawAccountId,
  name,
  clickUrl,
  mediaUrl,
  mediaType,
  // новый формат: массив креативов
  creatives,
}) {
  const accountId = normalizeAccountId(rawAccountId)
  if (!accountId) {
    return { ok: false, error: 'NO_ACCOUNT' }
  }

  const pkg = await findActivePackageForAccount(accountId)
  if (!pkg) {
    return {
      ok: false,
      error: 'NO_ACTIVE_PACKAGE',
    }
  }

  const title = String(name || '').trim()
  if (!title) {
    return {
      ok: false,
      error: 'NAME_AND_URL_REQUIRED',
    }
  }

  const maxC = Number(pkg.maxCampaigns || 0)
  const used = Number(pkg.usedCampaigns || 0)
  if (maxC > 0 && used >= maxC) {
    return { ok: false, error: 'LIMIT_REACHED' }
  }

  // ---- Собираем список сырых креативов ----
  let rawCreatives = []

  if (Array.isArray(creatives) && creatives.length) {
    rawCreatives = creatives
  } else {
    const clickRawSingle = String(clickUrl || '').trim()
    if (!clickRawSingle) {
      return {
        ok: false,
        error: 'NAME_AND_URL_REQUIRED',
      }
    }
    rawCreatives = [
      {
        clickUrl: clickRawSingle,
        mediaUrl,
        mediaType,
      },
    ]
  }

  // ---- Нормализация креативов ----
  const normalizedCreatives = []

  for (const raw of rawCreatives) {
    const clickRawLocal = String(raw.clickUrl || '').trim()
    if (!clickRawLocal) continue

    const normalizedUrl = normalizeClickUrl(clickRawLocal)
    if (!normalizedUrl) {
      return {
        ok: false,
        error: 'INVALID_CLICK_URL',
      }
    }

    let finalMediaUrl = String(raw.mediaUrl || '').trim()
    let finalMediaType = raw.mediaType || inferMediaTypeFromUrl(finalMediaUrl)

    if (!finalMediaUrl) {
      finalMediaType = 'none'
    }

    normalizedCreatives.push({
      clickUrl: normalizedUrl,
      mediaUrl: finalMediaUrl || '',
      mediaType: finalMediaType,
    })
  }

  if (!normalizedCreatives.length) {
    return {
      ok: false,
      error: 'NAME_AND_URL_REQUIRED',
    }
  }

  const maxMedia = Number(pkg.maxMediaPerCampaign || 0)
  if (maxMedia > 0 && normalizedCreatives.length > maxMedia) {
    return {
      ok: false,
      error: 'MEDIA_LIMIT_REACHED',
    }
  }

  const id = String(await incr('ads:seq:campaign'))
  const now = nowIso()

  const urlHashes = []
  const creativesWithMeta = normalizedCreatives.map((c, idx) => {
    const h = computeUrlHash(c.clickUrl)
    const hStr = h != null ? String(h) : null
    if (hStr) urlHashes.push(hStr)
    return {
      id: `${id}_c${idx + 1}`,
      clickUrl: c.clickUrl,
      mediaUrl: c.mediaUrl,
      mediaType: c.mediaType,
      urlHash: hStr,
      createdAt: now,
    }
  })

  const primary = creativesWithMeta[0]
  const primaryHash = primary.urlHash || (urlHashes[0] ?? null)

  const campaign = {
    id,
    campaignId: id,
    accountId,
    packageId: pkg.id,
    name: title,

    // primary-креатив для совместимости со старым фронтом
    clickUrl: primary.clickUrl,
    mediaUrl: primary.mediaUrl,
    mediaType: primary.mediaType,

    urlHash: primaryHash,
    creatives: creativesWithMeta,

    status: 'active',
    startsAt: now,
    endsAt: null,
    createdAt: now,
    updatedAt: now,
  }

  await setJSON(`ads:campaign:${id}`, campaign)
  await sadd(`ads:campaigns:${accountId}`, id)
  await sadd(`ads:campaigns:pkg:${pkg.id}`, id)
  await sadd('ads:campaigns:all', id)

  // Индексы по всем хэшам креативов
  for (const h of urlHashes) {
    await sadd(`ads:campaigns:byHash:${h}`, id)
  }

  // Обновляем пакет (usedCampaigns)
  const pkgKey = `ads:package:${pkg.id}`
  const freshPkg = await getJSON(pkgKey)
  if (freshPkg) {
    const newUsed = Number(freshPkg.usedCampaigns || 0)
    freshPkg.usedCampaigns = maxC > 0 ? Math.min(maxC, newUsed + 1) : newUsed + 1
    freshPkg.updatedAt = nowIso()
    await setJSON(pkgKey, freshPkg)
  }

  return {
    ok: true,
    campaignId: id,
    campaign,
  }
}

// 5. Links для ForumAds (учитываем мультикреатив, без дедупа)

export async function getLinksForForum() {
  const ids = await smembers('ads:campaigns:all')
  if (!ids.length) {
    return { ok: true, linksString: '' }
  }

  const now = nowMs()
  const active = []

  // Собираем только активные кампании
  for (const id of ids) {
    const c = await getJSON(`ads:campaign:${id}`)
    if (!c) continue
    if (c.status !== 'active' && c.status !== 'running') continue
    if (!c.clickUrl && !(Array.isArray(c.creatives) && c.creatives.length))
      continue
    if (c.endsAt && new Date(c.endsAt).getTime() <= now) continue
    active.push(c)
  }

  if (!active.length) {
    return { ok: true, linksString: '' }
  }

  const lines = []

  // ВАЖНО: больше НЕТ дедупа по hostname/path.
  // Каждый креатив → отдельная строка click|media.
  const pushLine = (clickUrl, mediaUrl) => {
    if (!clickUrl) return

    try {
      const u = new URL(clickUrl)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return
    } catch {
      // битый URL — пропускаем
      return
    }

    let line = clickUrl
    if (mediaUrl) {
      line = `${clickUrl}|${mediaUrl}`
    }
    lines.push(line)
  }

  for (const c of active) {
    if (Array.isArray(c.creatives) && c.creatives.length) {
      // мультикреатив: каждый creative → отдельная строка
      for (const cr of c.creatives) {
        pushLine(cr.clickUrl, cr.mediaUrl)
      }
    } else {
      // старый формат
      pushLine(c.clickUrl, c.mediaUrl)
    }
  }

  const linksString = lines.join('\n') 
  return { ok: true, linksString }
}

// 6. Аналитика: запись событий

function getCountryFromHeaders(headers) {
  const h = headers || {}
  const get = (name) =>
    (typeof headers?.get === 'function' ? headers.get(name) : null) ||
    h[name] ||
    h[name?.toLowerCase?.()] ||
    h[name?.toUpperCase?.()] ||
    null

  const cand =
    get('x-vercel-ip-country') ||
    get('x-geo-country') ||
    get('cf-ipcountry') ||
    'ZZ'

  return String(cand || 'ZZ').toUpperCase()
}

// PATCH: расширенный парсер GEO (страна / регион / город)
function getGeoFromBodyAndRequest(body, req) {
  const headers = req?.headers || {}
  const h = headers
  const get = (name) =>
    (typeof headers?.get === 'function' ? headers.get(name) : null) ||
    h[name] ||
    h[name?.toLowerCase?.()] ||
    h[name?.toUpperCase?.()] ||
    null

  const bodyCountry =
    body?.country ||
    body?.geoCountry ||
    body?.geo_country ||
    body?.countryCode ||
    body?.country_code

  let country =
    bodyCountry ||
    get('x-vercel-ip-country') ||
    get('x-geo-country') ||
    get('cf-ipcountry') ||
    'ZZ'
  country = String(country || 'ZZ').toUpperCase()

  const bodyRegion =
    body?.region ||
    body?.regionCode ||
    body?.region_code ||
    body?.subdivision ||
    body?.subdivision_code

  let region =
    bodyRegion ||
    get('x-vercel-ip-country-region') ||
    get('x-geo-region') ||
    get('cf-region') ||
    ''
  region = region ? String(region).trim() : ''

  const bodyCity = body?.city || body?.city_name || body?.locality

  let city =
    bodyCity ||
    get('x-vercel-ip-city') ||
    get('x-geo-city') ||
    get('cf-ipcity') ||
    get('cf-city') ||
    ''
  city = city ? String(city).trim() : ''

  return { country, region, city }
}

function getBucketStart(ts, groupBy) {
  if (!Number.isFinite(ts)) ts = nowMs()
  if (groupBy === 'hour') {
    return Math.floor(ts / HOUR_MS) * HOUR_MS
  }
  // day — начало суток по UTC
  const d = new Date(ts)
  d.setUTCHours(0, 0, 0, 0)
  return d.getTime()
}


// PATCH: форматирование подписи бакета по UTC
function formatBucketLabelUtc(ts, groupBy) {
  const d = new Date(ts)
  if (!Number.isFinite(d.getTime())) return String(ts)
  const pad = (n) => String(n).padStart(2, '0')
  const y = d.getUTCFullYear()
  const m = pad(d.getUTCMonth() + 1)
  const day = pad(d.getUTCDate())
  const h = pad(d.getUTCHours())
  if (groupBy === 'hour') {
    return `${day}.${m}.${y} ${h}:00 UTC`
  }
  return `${day}.${m}.${y} UTC`
}

export async function registerEvent(body, req) {
  try {
    const { type, campaignId, url_hash, slot_kind, near_id } = body || {}

    const normalizedType =
      type === 'ad_click'
        ? 'click'
        : type === 'ad_impression'
        ? 'impression'
        : null

    if (!normalizedType) {
      return { ok: false, error: 'UNKNOWN_EVENT' }
    }

    const now = nowMs()

    // PATCH: расширенное GEO (страна/регион/город)
    const { country, region, city } = getGeoFromBodyAndRequest(body, req) || {
      country: getCountryFromHeaders(req?.headers),
      region: '',
      city: '',
    }

    const deltaImpressions = normalizedType === 'impression' ? 1 : 0
    const deltaClicks = normalizedType === 'click' ? 1 : 0

    // Кого апдейтить
    const targetCampaignIds = []

    // 1) Если форум/клиент явно передал campaignId — используем его
    if (campaignId) {
      targetCampaignIds.push(String(campaignId))
    }

    // 2) Иначе пытаемся сопоставить по url_hash (то, что шлёт ForumAds)
    const hashKey =
      url_hash !== undefined && url_hash !== null
        ? String(url_hash)
        : null

    if (!targetCampaignIds.length && hashKey) {
      // Сначала быстрый путь: индекс по хэшу
      const indexedIds = await smembers(
        `ads:campaigns:byHash:${hashKey}`,
      )
      const nowTs = now

      for (const id of indexedIds) {
        const c = await getJSON(`ads:campaign:${id}`)
        if (!c) continue
        if (
          c.status !== 'active' &&
          c.status !== 'running' &&
          c.status !== 'paused' &&
          c.status !== 'pending'
        ) {
          continue
        }
        if (c.endsAt && new Date(c.endsAt).getTime() <= nowTs) continue
        targetCampaignIds.push(String(id))
      }

      // Медленный путь для старых кампаний без urlHash: просканировать и проиндексировать
      if (!targetCampaignIds.length) {
        const allIds = await smembers('ads:campaigns:all')
        for (const id of allIds) {
          const c = await getJSON(`ads:campaign:${id}`)
          if (!c || !c.clickUrl) continue
          if (
            c.status !== 'active' &&
            c.status !== 'running' &&
            c.status !== 'paused' &&
            c.status !== 'pending'
          ) {
            continue
          }
          if (c.endsAt && new Date(c.endsAt).getTime() <= nowTs) continue

          let h = c.urlHash != null ? String(c.urlHash) : null
          if (!h) {
            const computed = computeUrlHash(c.clickUrl)
            if (computed != null) {
              h = String(computed)
              c.urlHash = h
              await setJSON(`ads:campaign:${id}`, c)
              await sadd(`ads:campaigns:byHash:${h}`, id)
            }
          }

          if (h && h === hashKey) {
            targetCampaignIds.push(String(id))
          }
        }
      }
    }

    if (!targetCampaignIds.length) {
      // Кампанию не нашли — событие просто пропускаем, но не считаем ошибкой.
      return { ok: true, skipped: 'NO_CAMPAIGN_FOR_EVENT' }
    }

    const buckets = ['hour', 'day']

    for (const campId of targetCampaignIds) {
      for (const gb of buckets) {
        const bucketStart = getBucketStart(now, gb)
        const key = `ads:analytics:${campId}:${gb}:${bucketStart}`
        const record = (await getJSON(key)) || {
          campaignId: campId,
          bucketStart,
          groupBy: gb,
          impressions: 0,
          clicks: 0,
          geo: {},
          updatedAt: nowIso(),
        }

        record.impressions += deltaImpressions
        record.clicks += deltaClicks

        const geoKeyParts = [country, region, city].filter(Boolean)
        const geoKey = (geoKeyParts.join('|') || country || 'ZZ').toUpperCase()

        if (!record.geo[geoKey]) {
          record.geo[geoKey] = {
            country,
            region: region || null,
            city: city || null,
            impressions: 0,
            clicks: 0,
          }
        }
        record.geo[geoKey].impressions += deltaImpressions
        record.geo[geoKey].clicks += deltaClicks
        record.updatedAt = nowIso()

        await setJSON(key, record)
      }
    }

    // пока просто помечаем, чтобы линтер не ругался
    void slot_kind
    void near_id

    return { ok: true, campaignIds: targetCampaignIds }
  } catch (e) {
    console.error('[ADS] registerEvent error', e)
    return {
      ok: false,
      error: 'EVENT_ERROR',
    }
  }
}

// 7. Аналитика: чтение

export async function getAnalyticsForCampaign({
  campaignId,
  from,
  to,
  groupBy,
}) {
  const campId = campaignId ? String(campaignId) : null
  if (!campId) {
    return { ok: false, error: 'NO_CAMPAIGN_ID' }
  }

  const gb = groupBy === 'hour' ? 'hour' : 'day'
  const now = nowMs()

  let toMs = to ? new Date(to).getTime() : now
  let fromMs = from ? new Date(from).getTime() : now - 7 * DAY_MS

  if (!Number.isFinite(fromMs)) {
    fromMs = now - 7 * DAY_MS
  }
  if (!Number.isFinite(toMs)) {
    toMs = now
  }

  if (fromMs > toMs) {
    const tmp = fromMs
    fromMs = toMs
    toMs = tmp
  }

  const step = gb === 'hour' ? HOUR_MS : DAY_MS

  const series = []
  let impressionsTotal = 0
  let clicksTotal = 0

  // PATCH: geoAgg содержит страну/регион/город
  const geoAgg = {}

  const startBucket = getBucketStart(fromMs, gb)
  const endBucket = getBucketStart(toMs, gb)

  for (let ts = startBucket; ts <= endBucket; ts += step) {
    const key = `ads:analytics:${campId}:${gb}:${ts}`
    const rec = await getJSON(key)
    const impressions = Number(rec?.impressions || 0)
    const clicks = Number(rec?.clicks || 0)

    impressionsTotal += impressions
    clicksTotal += clicks

    if (rec?.geo) {
      for (const [k, val] of Object.entries(rec.geo)) {
        // поддерживаем старый формат (val без country) и новый
        const country = (val && val.country) || k || 'ZZ'
        const region = val && val.region
        const city = val && val.city
        const aggKey = `${country}|${region || ''}|${city || ''}`

        if (!geoAgg[aggKey]) {
          geoAgg[aggKey] = {
            country,
            region: region || null,
            city: city || null,
            impressions: 0,
            clicks: 0,
          }
        }
        geoAgg[aggKey].impressions += Number(val.impressions || 0)
        geoAgg[aggKey].clicks += Number(val.clicks || 0)
      }
    }

    series.push({
      ts,
      label: formatBucketLabelUtc(ts, gb), // PATCH: человекочитаемый UTC-лейбл
      impressions,
      clicks,
    })
  }

  const ctrTotal = impressionsTotal > 0 ? clicksTotal / impressionsTotal : 0

  const geo = Object.values(geoAgg)
    .map((g) => ({
      country: g.country || 'ZZ',
      region: g.region || null,
      city: g.city || null,
      impressions: g.impressions,
      clicks: g.clicks,
      ctr: g.impressions > 0 ? g.clicks / g.impressions : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions)

  return {
    ok: true,
    impressionsTotal,
    clicksTotal,
    ctrTotal,
    series,
    geo,
  }
}

// 8. Serve (выдача одной кампании; с мультикреативом)

export async function serveAd() {
  const ids = await smembers('ads:campaigns:all')
  if (!ids.length) {
    return { ok: true, campaign: null }
  }
  const now = nowMs()
  const active = []
  for (const id of ids) {
    const c = await getJSON(`ads:campaign:${id}`)
    if (!c) continue
    if (c.status !== 'active' && c.status !== 'running') continue
    if (!c.clickUrl && !(Array.isArray(c.creatives) && c.creatives.length))
      continue
    if (c.endsAt && new Date(c.endsAt).getTime() <= now) continue
    active.push(c)
  }
  if (!active.length) {
    return { ok: true, campaign: null }
  }
  const idx = Math.floor(Math.random() * active.length)
  const campaign = active[idx]

  // Если есть мультикреативы — выбираем один рандомный и подставляем в поля
  if (Array.isArray(campaign.creatives) && campaign.creatives.length) {
    const crIdx = Math.floor(Math.random() * campaign.creatives.length)
    const cr = campaign.creatives[crIdx]
    const outCampaign = {
      ...campaign,
      clickUrl: cr.clickUrl || campaign.clickUrl,
      mediaUrl: cr.mediaUrl || campaign.mediaUrl,
      mediaType: cr.mediaType || campaign.mediaType,
    }
    return { ok: true, campaign: outCampaign }
  }

  return { ok: true, campaign }
}

// 9. Upload медиа (Vercel Blob)

// 9. Upload медиа (Vercel Blob)

export async function uploadMedia(file, opts = {}) {
  if (!file) {
    return { ok: false, error: 'NO_FILE' }
  }
  if (!BLOB_TOKEN) {
    return {
      ok: false,
      error: 'NO_BLOB_TOKEN',
    }
  }

  const { forceUniqueName = true } = opts || {}

  // Оригинальное имя файла (если есть)
  const rawName = (file.name && String(file.name)) || 'ad'

  // Выделяем базу и расширение
  const lastDot = rawName.lastIndexOf('.')
  const base =
    lastDot > 0 ? rawName.slice(0, lastDot) : rawName
  const ext =
    lastDot > 0 ? rawName.slice(lastDot) : ''

  // Чистим базу от странных символов
  const safeBase = base.replace(/[^\w.-]+/g, '_') || 'ad'

  // Уникальный суффикс
  const suffix = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`

  const finalName = forceUniqueName
    ? `${safeBase}-${suffix}${ext}`
    : `${safeBase}${ext}`

  const path = `ads/${finalName}`

  try {
    const blob = await put(path, file, {
      access: 'public',
      token: BLOB_TOKEN,
    })

    return {
      ok: true,
      url: blob.url,
      // на всякий случай отдаём имя, если пригодится на фронте
      name: finalName,
    }
  } catch (e) {
    console.error('[ADS] uploadMedia error', e)
    return {
      ok: false,
      error: 'UPLOAD_ERROR',
      details: String(e),
    }
  }
}


// 10. Управление кампаниями: остановка и удаление

export async function stopCampaign(campaignIdRaw) {
  const id = campaignIdRaw ? String(campaignIdRaw) : ''
  if (!id) {
    return { ok: false, error: 'NO_CAMPAIGN_ID' }
  }

  const key = `ads:campaign:${id}`
  const campaign = await getJSON(key)
  if (!campaign) {
    return { ok: false, error: 'NOT_FOUND' }
  }

  const now = nowIso()

  if (
    campaign.status !== 'stopped' &&
    campaign.status !== 'finished' &&
    campaign.status !== 'expired'
  ) {
    campaign.status = 'stopped'
  }

  if (!campaign.endsAt) {
    campaign.endsAt = now
  }
  campaign.updatedAt = now

  await setJSON(key, campaign)

  return { ok: true, campaign }
}

// Запуск (рестарт) остановленной кампании
export async function startCampaign(campaignIdRaw) {
  const id = campaignIdRaw ? String(campaignIdRaw) : ''
  if (!id) {
    return { ok: false, error: 'NO_CAMPAIGN_ID' }
  }

  const key = `ads:campaign:${id}`
  const campaign = await getJSON(key)
  if (!campaign) {
    return { ok: false, error: 'NOT_FOUND' }
  }

  const now = nowIso()

  // Если кампания окончательно завершена/просрочена — не даём её запускать
  if (
    campaign.status === 'finished' ||
    campaign.status === 'expired'
  ) {
    return { ok: false, error: 'CANNOT_START_FINISHED_CAMPAIGN' }
  }

  // Разрешаем поднимать из состояний stopped / paused / pending и т.п.
  campaign.status = 'active'

  // VERY IMPORTANT: убираем endsAt, иначе serveAd / getLinksForForum / registerEvent её будут игнорить
  campaign.endsAt = null

  // Если вдруг не было startsAt (старые данные) — ставим
  if (!campaign.startsAt) {
    campaign.startsAt = now
  }

  campaign.updatedAt = now

  await setJSON(key, campaign)

  return { ok: true, campaign }
}
export async function deleteCampaign(campaignIdRaw) {
  const id = campaignIdRaw ? String(campaignIdRaw) : ''
  if (!id) {
    return { ok: false, error: 'NO_CAMPAIGN_ID' }
  }

  const key = `ads:campaign:${id}`
  const campaign = await getJSON(key)
  if (!campaign) {
    return { ok: false, error: 'NOT_FOUND' }
  }

  const accountId = normalizeAccountId(campaign.accountId)
  const packageId = campaign.packageId || null

  // Собираем все хэши, которые могли быть записаны в индекс
  const hashSet = new Set()

  if (campaign.urlHash != null) {
    hashSet.add(String(campaign.urlHash))
  }

  if (Array.isArray(campaign.creatives)) {
    for (const cr of campaign.creatives) {
      if (cr.urlHash != null) {
        hashSet.add(String(cr.urlHash))
      } else if (cr.clickUrl) {
        const h = computeUrlHash(cr.clickUrl)
        if (h != null) hashSet.add(String(h))
      }
    }
  } else if (campaign.clickUrl) {
    const h = computeUrlHash(campaign.clickUrl)
    if (h != null) hashSet.add(String(h))
  }

  const urlHashes = Array.from(hashSet)

  // Удаляем саму кампанию
  await delKey(key)

  // Выпиливаем из множеств
  if (accountId) {
    await srem(`ads:campaigns:${accountId}`, id)
  }
  if (packageId) {
    await srem(`ads:campaigns:pkg:${packageId}`, id)
  }
  await srem('ads:campaigns:all', id)
  for (const h of urlHashes) {
    await srem(`ads:campaigns:byHash:${h}`, id)
  }

  // PATCH: слот в пакете НЕ возвращаем — usedCampaigns остаётся как есть,
  // чтобы лимиты и факт создания кампаний совпадали с реальностью.

  return { ok: true, deleted: true }
}

// 11. Вебхук NOWPayments (IPN) — вызывается общим /api/pay/webhook для legacy adspkg:<internalId>
// Здесь НЕТ проверки подписи — она должна быть в route /api/pay/webhook

export async function handleNowPaymentsWebhook(payload) {
  try {
    const orderId = payload?.order_id || payload?.orderId || ''
    const externalInvoiceId = payload?.invoice_id || payload?.id || null

    let invoice = null

    if (orderId && orderId.startsWith('adspkg:')) {
      const internalId = orderId.slice('adspkg:'.length) || ''
      invoice = await getInvoiceById(internalId)
    }

    if (!invoice && externalInvoiceId) {
      invoice = await getInvoiceByExternalId(String(externalInvoiceId))
    }

    if (!invoice) {
      return {
        ok: false,
        error: 'INVOICE_NOT_FOUND',
      }
    }

    if (invoice.status === 'paid') {
      const pkg = await getPackageById(
        await getString(`ads:package:byInvoice:${invoice.id}`),
      )
      return {
        ok: true,
        alreadyPaid: true,
        invoice,
        package: pkg,
      }
    }

    const rawStatus = String(
      payload?.payment_status || payload?.status || '',
    ).toLowerCase()

    const successStatuses = [
      'finished',
      'confirmed',
      'sending',
      'partially_paid',
      'completed',
      'paid',
    ]

    const isSuccess =
      successStatuses.some((s) => rawStatus.includes(s)) || rawStatus === 'done'

    invoice.lastStatus = rawStatus
    invoice.updatedAt = nowIso()

    if (!isSuccess) {
      invoice.status = 'failed'
      await saveInvoice(invoice)
      return {
        ok: true,
        invoice,
        package: null,
      }
    }

    invoice.status = 'paid'
    invoice.paidAt = nowIso()
    await saveInvoice(invoice)

    const pkg = await applyPaidInvoice(invoice, new Date())

    return {
      ok: true,
      invoice,
      package: pkg,
    }
  } catch (e) {
    console.error('[ADS] handleNowPaymentsWebhook error', e)
    return {
      ok: false,
      error: 'WEBHOOK_ERROR',
    }
  }
}

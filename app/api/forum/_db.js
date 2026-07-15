// app/api/forum/_db.js
import { Buffer } from 'node:buffer'
import { Redis } from '@upstash/redis'
import { now, parseIntSafe } from './_utils.js'
import { resolveCanonicalAccountIds } from '../profile/_identity.js'
import profilePrimary from '../../../lib/mongo/profile-primary.cjs'
import forumPrimary from '../../../lib/mongo/forum-primary.cjs'

/* =========================
   helpers
========================= */
export const safeParse = (raw) => {
  if (raw == null) return null
  if (typeof raw === 'object') return raw
  if (raw === '[object Object]') return null
  try { return JSON.parse(raw) } catch { return null }
}

export const redis = Redis.fromEnv()

// Р”РµРґСѓРїР»РёРєР°С†РёСЏ РїСЂРѕСЃРјРѕС‚СЂРѕРІ РЅРµ В«РЅР°РІСЃРµРіРґР°В», Р° РІ РѕРєРЅРµ TTL (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ Р±РµСЂС‘Рј env РёР»Рё 1800 СЃРµРє)
const VIEW_TTL_SEC = Number(process.env.FORUM_VIEW_TTL_SEC ?? 1800)
const winBucket = (ttlSec = VIEW_TTL_SEC, ts = Date.now()) => {
  const s = Math.max(1, Number(ttlSec) || VIEW_TTL_SEC)
  return Math.floor((ts / 1000) / s)
}

const str = (x) => String(x ?? '').trim()
async function initUserTotalsFromSnapshot(userId) {
  const uid = str(userId)
  if (!uid) return null

  const [totals, cachedStats] = await Promise.all([
    forumPrimary.getUserTotals(uid).catch(() => null),
    profilePrimary.getUserStats(uid).catch(() => null),
  ])
  const hasLiveTotals = totals && (
    Number.isFinite(Number(totals.postsTotal)) ||
    Number.isFinite(Number(totals.topicsTotal)) ||
    Number.isFinite(Number(totals.likesTotal))
  )
  const stats = {
    posts: hasLiveTotals ? parseIntSafe(totals?.postsTotal, 0) : parseIntSafe(cachedStats?.posts, 0),
    topics: hasLiveTotals ? parseIntSafe(totals?.topicsTotal, 0) : parseIntSafe(cachedStats?.topics, 0),
    likes: hasLiveTotals ? parseIntSafe(totals?.likesTotal, 0) : parseIntSafe(cachedStats?.likes, 0),
  }
  await profilePrimary.setUserStats(uid, stats)
  return { postsTotal: stats.posts, topicsTotal: stats.topics, likesTotal: stats.likes }
}

export async function getUserPostsTotal(userId) {
  const uid = str(userId)
  if (!uid) return 0
  try {
    const totals = await initUserTotalsFromSnapshot(uid)
    if (totals) return parseIntSafe(totals.postsTotal, 0)
  } catch {}
  try {
    const stats = await profilePrimary.getUserStats(uid)
    if (stats?.hasStats) return parseIntSafe(stats.posts, 0)
  } catch { return 0 }
  return 0
}

export async function getUserTopicsTotal(userId) {
  const uid = str(userId)
  if (!uid) return 0
  try {
    const totals = await initUserTotalsFromSnapshot(uid)
    if (totals) return parseIntSafe(totals.topicsTotal, 0)
  } catch {}
  try {
    const stats = await profilePrimary.getUserStats(uid)
    if (stats?.hasStats) return parseIntSafe(stats.topics, 0)
  } catch { return 0 }
  return 0
}

export async function getUserLikesTotal(userId) {
  const uid = str(userId)
  if (!uid) return 0
  try {
    const totals = await initUserTotalsFromSnapshot(uid)
    if (totals) return parseIntSafe(totals.likesTotal, 0)
  } catch {}
  try {
    const stats = await profilePrimary.getUserStats(uid)
    if (stats?.hasStats) return parseIntSafe(stats.likes, 0)
  } catch { return 0 }
  return 0
}

export async function incrUserPostsTotal(userId, delta = 1) {
  const uid = str(userId)
  if (!uid) return 0
  return profilePrimary.incrementUserStat(uid, 'posts', Number(delta) || 0)
}

export async function incrUserTopicsTotal(userId, delta = 1) {
  const uid = str(userId)
  if (!uid) return 0
  return profilePrimary.incrementUserStat(uid, 'topics', Number(delta) || 0)
}

export async function incrUserLikesTotal(userId, delta = 1) {
  const uid = str(userId)
  if (!uid) return 0
  return profilePrimary.incrementUserStat(uid, 'likes', Number(delta) || 0)
}

/* =========================
   РљР»СЋС‡Рё (BACKWARD-COMPAT)
========================= */
export const K = {
  dedupViewTopic: (topicId, userId, bucket) => `forum:dedup:view:topic:${topicId}:${userId}:${bucket}`,
  dedupViewPost: (postId, userId, bucket) => `forum:dedup:view:post:${postId}:${userId}:${bucket}`,
  mediaLockKey: (userId) => `forum:lock:media:${userId}`,
}
const PORN_THRESHOLD = Number(process.env.FORUM_REPORT_PORN_THRESHOLD ?? 3)
const VIOLENCE_THRESHOLD = Number(process.env.FORUM_REPORT_VIOLENCE_THRESHOLD ?? 3)
const BORING_THRESHOLD = Number(process.env.FORUM_REPORT_BORING_THRESHOLD ?? 20)
const MEDIA_LOCK_MS = Number(process.env.FORUM_MEDIA_LOCK_MS ?? (3 * 24 * 60 * 60 * 1000))

/* =========================
   Р РµРІРёР·РёРё / РёР·РјРµРЅРµРЅРёСЏ
========================= */
export async function nextRev() {
  return parseIntSafe(await forumPrimary.nextRev(), 0)
}
export async function nextTopicId() {
  return parseIntSafe(await forumPrimary.nextTopicId(), 0)
}
export async function nextPostId() {
  return parseIntSafe(await forumPrimary.nextPostId(), 0)
}

/** Р—Р°РїРёСЃСЊ СЃРѕР±С‹С‚РёСЏ РІ Р¶СѓСЂРЅР°Р» РёР·РјРµРЅРµРЅРёР№ */
export async function pushChange(evt) {
  await forumPrimary.writeChange(evt)
}

/* =========================
   РџРµСЂРµСЃР±РѕСЂРєР° СЃРЅР°РїС€РѕС‚Р°
========================= */
export async function rebuildSnapshot() {
  return forumPrimary.rebuildSnapshot()
}
// ===== SNAPSHOT PATCH (С‚РѕС‡РµС‡РЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ Р±РµР· rebuild O(N)) =====
export async function patchSnapshotPartial({ rev, patch = {} }) {
  return forumPrimary.patchSnapshot({ rev, patch })
}

/* =========================
   CRUD: С‚РµРјС‹ / РїРѕСЃС‚С‹
========================= */
export async function createTopic({ title, description, userId, nickname, icon, ts, _geoOrigin }) {
  const result = await forumPrimary.createTopic({ title, description, userId, nickname, icon, ts, _geoOrigin })
  try { await incrUserTopicsTotal(result.topic.userId, 1) } catch {}
  return result
}

export async function createPost({ topicId, parentId, text, userId, nickname, icon, ts, _geoOrigin }) {
  const result = await forumPrimary.createPost({ topicId, parentId, text, userId, nickname, icon, ts, _geoOrigin })
  try { await incrUserPostsTotal(result.post.userId, 1) } catch {}
  return result
}

/** РёРЅРєСЂРµРјРµРЅС‚С‹ РїСЂРѕСЃРјРѕС‚СЂРѕРІ (СЃСѓРјРјР°С‚РѕСЂС‹) */
export async function incrementTopicViews(topicId, delta = 1) {
  return forumPrimary.incrementTopicViews(topicId, delta)
}
export async function incrementPostViews(postId, delta = 1) {
  return forumPrimary.incrementPostViews(postId, delta)
}

/** СѓСЃС‚Р°СЂРµРІС€РµРµ (СЃСѓРјРјР°С‚РѕСЂ), РѕСЃС‚Р°РІР»РµРЅРѕ РґР»СЏ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё */
export async function reactPost(postId, kind /* 'like'|'dislike' */, delta = 1) {
  if (kind !== 'like' && kind !== 'dislike') throw new Error('bad_reaction_kind')
  const post = await forumPrimary.incrementPostCounters(postId, {
    [kind === 'like' ? 'likes' : 'dislikes']: Number(delta) || 0,
  })
  const rev = await nextRev()
  await pushChange({ rev, kind: 'react', id: postId, data: { kind, delta }, ts: now() })
  return { rev, post }
}

/** СѓРЅРёРєР°Р»СЊРЅС‹Рµ СЂРµР°РєС†РёРё С‡РµСЂРµР· РјРЅРѕР¶РµСЃС‚РІР° */
export async function reactPostUnique(postId, userId, kind) {
  if (!postId || !userId || !['like','dislike'].includes(kind)) {
    throw new Error('bad_react_args')
  }
  const result = await forumPrimary.setPostReactionState({ postId, userId, state: kind })
  return { likes: result.likes, dislikes: result.dislikes }
}

/* =========================
   РЎС‚СЂРѕРіР°СЏ Р±РёР·РЅРµСЃ-Р»РѕРіРёРєР°
========================= */
export async function incrementTopicViewsUnique(topicId, userId, ttlSec = VIEW_TTL_SEC) {

  const tid = str(topicId), uid = str(userId)
  if (!tid || !uid) {
    const topic = tid ? await forumPrimary.getTopic(tid) : null
    return { inc: false, views: parseIntSafe(topic?.views, 0) }
  }
  const ttl = Math.min(24 * 60 * 60, Math.max(1, Number(ttlSec) || VIEW_TTL_SEC))
  const key = K.dedupViewTopic(tid, uid, winBucket(ttl))
  const ok = await redis.set(key, '1', { nx: true, ex: ttl })
  let views = 0
  if (ok) {
    try { views = parseIntSafe(await forumPrimary.incrementTopicViews(tid, 1), 0) } catch { await incrementTopicViews(tid, 1) }
  }
  if (!views) {
    const topic = await forumPrimary.getTopic(tid)
    views = parseIntSafe(topic?.views, 0)
  }
  return { inc: !!ok, views }
}
export async function incrementPostViewsUnique(postId, userId, ttlSec = VIEW_TTL_SEC) {
 
  const pid = str(postId), uid = str(userId)
  if (!pid || !uid) {
    const post = pid ? await forumPrimary.getPost(pid) : null
    return { inc: false, views: parseIntSafe(post?.views, 0) }
  }
  const ttl = Math.min(24 * 60 * 60, Math.max(1, Number(ttlSec) || VIEW_TTL_SEC))
  const key = K.dedupViewPost(pid, uid, winBucket(ttl))
  const ok = await redis.set(key, '1', { nx: true, ex: ttl })

  let views = 0
  if (ok) {
    try { views = parseIntSafe(await forumPrimary.incrementPostViews(pid, 1), 0) } catch { await incrementPostViews(pid, 1) }
  }
  if (!views) {
    const post = await forumPrimary.getPost(pid)
    views = parseIntSafe(post?.views, 0)
  }
  return { inc: !!ok, views }
}

export async function reactPostExclusiveDaily(postId, userId, kind) {
  const pid = str(postId), uid = str(userId)
  const target = kind === 'dislike' ? 'dislike' : 'like'
  if (!pid || !uid) throw new Error('bad_react_args')

  return forumPrimary.setPostReactionState({ postId: pid, userId: uid, state: target })
}

/* =========================
   Р‘Р°РЅС‹ (СЋРІРµР»РёСЂРЅС‹Рµ РїСЂР°РІРєРё)
========================= */
export async function isBannedUser(userId) {
  const id = String(userId || '').trim().toLowerCase()
  if (!id) return false
  return forumPrimary.isBannedUser(id)
}

export async function isBannedIp(ip) {
  const ipLc = String(ip || '').trim().toLowerCase()
  if (!ipLc) return false
  return forumPrimary.isBannedIp(ipLc)
}

export async function isBanned(userId, ip) {
  return (await isBannedUser(userId)) || (await isBannedIp(ip))
}

export async function dbBanUser(accountId) {
  const id = String(accountId || '').trim().toLowerCase()
  const result = await forumPrimary.setBannedUser(id, true)
  await pushChange({ rev: result.rev, kind: 'ban', id, ts: now() })
  return result
}
export async function dbUnbanUser(accountId) {
  const id = String(accountId || '').trim().toLowerCase()
  const result = await forumPrimary.setBannedUser(id, false)
  await pushChange({ rev: result.rev, kind: 'unban', id, ts: now() })
  return result
}
export async function dbBanIp(ip) {
  const ipLc = String(ip || '').trim().toLowerCase()
  const result = await forumPrimary.setBannedIp(ipLc, true)
  await pushChange({ rev: result.rev, kind: 'ban_ip', id: ipLc, ts: now() })
  return result
}
export async function dbUnbanIp(ip) {
  const ipLc = String(ip || '').trim().toLowerCase()
  const result = await forumPrimary.setBannedIp(ipLc, false)
  await pushChange({ rev: result.rev, kind: 'unban_ip', id: ipLc, ts: now() })
  return result
}

/* =========================
   РЈРґР°Р»РµРЅРёСЏ (HARD)
========================= */
export async function dbDeletePost(postId) {
  const result = await forumPrimary.deletePostHard(postId)
  if (result && !result.notFound) {
    await pushChange({ rev: result.rev, kind: 'post', id: String(postId), _del: 1, ts: now(), topicId: result.post?.topicId })
    return result
  }
  return null
}

export async function dbDeletePostHard(postId) {
  const pid = str(postId)
  const result = await forumPrimary.deletePostHard(pid)
  if (result && !result.notFound) {
    await pushChange({ rev: result.rev, kind: 'post', id: pid, _del: 1, ts: now(), topicId: result.post?.topicId })
  }
  return result
}

export async function dbDeleteTopic(topicId) {
  const result = await forumPrimary.deleteTopicHard(topicId)
  if (result && !result.notFound) {
    await pushChange({ rev: result.rev, kind: 'topic', id: String(topicId), _del: 1, ts: now(), deletedPosts: result.deletedPosts || [] })
    return result
  }
  return null
}

export async function dbDeleteTopicHard(topicId) {
  const tid = str(topicId)
  const result = await forumPrimary.deleteTopicHard(tid)
  if (result && !result.notFound) {
    await pushChange({ rev: result.rev, kind: 'topic', id: tid, _del: 1, ts: now(), deletedPosts: result.deletedPosts || [] })
  }
  return result
}
/* =========================
   Reports / Media Locks
========================= */
export async function getMediaLockUntil(userId) {
  const key = K.mediaLockKey(str(userId))
  const raw = await redis.get(key)
  return parseIntSafe(raw, 0)
}

export async function setMediaLockUntil(userId, untilMs) {
  const key = K.mediaLockKey(str(userId))
  const ttlMs = Math.max(1, Number(untilMs || 0) - now())
  await redis.set(key, String(Number(untilMs || 0)), { px: ttlMs })
  return { ok: true, untilMs: Number(untilMs || 0) }
}

export async function isMediaLocked(userId) {
  const untilMs = await getMediaLockUntil(userId)
  const locked = Number(untilMs || 0) > now()
  if (!locked && untilMs) {
    try { await redis.del(K.mediaLockKey(str(userId))) } catch {}
  }
  return { locked, untilMs: locked ? Number(untilMs || 0) : 0 }
}

// O(N) РѕР±С…РѕРґ РїРѕ РІСЃРµРј РїРѕСЃС‚Р°Рј вЂ” СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓРµС‚ С‚РµРєСѓС‰РµР№ СЃС…РµРјРµ
export async function collectPostBranch(rootId) {
  const root = str(rootId)
  return forumPrimary.collectPostBranch(root)
}

export async function deletePostBranchHard(rootId) {
  return forumPrimary.deletePostBranchHard(rootId)
}

export async function reportPost({ postId, reporterId, reason }) {
  const result = await forumPrimary.reportPost({
    postId,
    reporterId,
    reason,
    thresholds: { porn: PORN_THRESHOLD, violence: VIOLENCE_THRESHOLD, boring: BORING_THRESHOLD },
  })
  if (result?.lockedUserId) {
    const lockedUntil = now() + MEDIA_LOCK_MS
    await setMediaLockUntil(result.lockedUserId, lockedUntil)
    return { ...result, lockedUntil }
  }
  return result
}

/* =========================
   Read helpers
========================= */
export async function getBannedUsers() {
  const ids = await forumPrimary.listBannedUsers()
  return new Set(ids || [])
}

export async function snapshot(sinceRev = 0, limit = 10000) {
  return forumPrimary.readSnapshot({ sinceRev, limit })

}
// --- Nickname helpers (compat) ---
export function normNick(raw) {
  const s = String(raw || '').trim().replace(/\s+/g, ' ')
  return s.slice(0, 24)
}
export function nickKeyLower(raw) {
  return normNick(raw).toLowerCase()
}

export async function isNickFree(nick) {
  return profilePrimary.isNickAvailable(nick)
}

export async function isNickAvailable(nick, userId) {
  return profilePrimary.isNickAvailable(nick, userId)
}

export async function getUserNick(userId) {
  return profilePrimary.getUserNick(userId)
}

/**
 * РђС‚РѕРјР°СЂРЅР°СЏ СѓСЃС‚Р°РЅРѕРІРєР° РЅРёРєР°:
 * - SET NX СЂРµР·РµСЂРІРёСЂСѓРµС‚ РЅРѕРІС‹Р№ РЅРёРє
 * - РїРёС€РµРј РЅРёРє СЋР·РµСЂСѓ
 * - РѕСЃРІРѕР±РѕР¶РґР°РµРј СЃС‚Р°СЂС‹Р№ РёРЅРґРµРєСЃ, РµСЃР»Рё РѕРЅ РїСЂРёРЅР°РґР»РµР¶Р°Р» СЌС‚РѕРјСѓ userId
 */
export async function setUserNick(userId, newNick) {
  const nn = normNick(newNick)
  if (!nn) throw new Error('empty_nick')
  return profilePrimary.setUserNick(userId, nn)

  // РЅРµ РјРµРЅСЏРµС‚СЃСЏ вЂ” СЃСЂР°Р·Сѓ РІРµСЂРЅСѓС‚СЊ
  // РїРѕРїС‹С‚РєР° Р·Р°Р±СЂРѕРЅРёСЂРѕРІР°С‚СЊ РЅРѕРІС‹Р№ РЅРёРє (Upstash РІРµСЂРЅС‘С‚ 'OK' РёР»Рё null)
}
export async function getUserAvatar(userId) {
  return profilePrimary.getUserAvatar(userId)
}

export function normAvatar(raw) {
  const s0 = str(raw)
  if (!s0) return ''
  // URL РёР· blob/uploads РјРѕР¶РµС‚ Р±С‹С‚СЊ РґР»РёРЅРЅС‹Рј (query/hash/tokens).
  // Р–С‘СЃС‚РєР°СЏ РѕР±СЂРµР·РєР° РґРѕ 256 Р»РѕРјР°РµС‚ СѓР¶Рµ Р·Р°РіСЂСѓР¶РµРЅРЅС‹Рµ Р°РІР°С‚Р°СЂС‹.
  if (/^https?:\/\//i.test(s0) || s0.startsWith('/uploads/') || s0.startsWith('/avatars/') || s0.startsWith('/vip/')) {
    return s0.slice(0, 4096)
  }
  return s0.slice(0, 512)
}


export async function setUserAvatar(userId, icon) {
  const v = normAvatar(icon)
  return profilePrimary.setUserAvatar(userId, v)
}

      // РїСѓСЃС‚РѕРµ Р·РЅР°С‡РµРЅРёРµ вЂ” РїСЂРѕСЃС‚Рѕ РѕС‡РёС‰Р°РµРј
export function normUserGender(raw) {
  const value = str(raw).toLowerCase()
  if (value === 'male' || value === 'female') return value
  return ''
}

export async function getUserGender(userId) {
  return profilePrimary.getUserGender(userId)
}

export async function setUserGender(userId, gender) {
  const value = normUserGender(gender)
  return profilePrimary.setUserGender(userId, value)
}

export function getBirthYearBounds(nowYear = new Date().getFullYear()) {
  const max = Math.max(1900, Number(nowYear || 0) - 14)
  const min = max - 99
  return { min, max }
}

export function normUserBirthYear(raw, nowYear = new Date().getFullYear()) {
  const parsed = parseIntSafe(raw, 0)
  if (!parsed) return 0
  const { min, max } = getBirthYearBounds(nowYear)
  if (parsed < min || parsed > max) return 0
  return parsed
}

export async function getUserBirthYear(userId) {
  return profilePrimary.getUserBirthYear(userId)
}

export async function setUserBirthYear(userId, birthYear) {
  const value = normUserBirthYear(birthYear)
  return profilePrimary.setUserBirthYear(userId, value)
}

export function normAbout(raw) {
  const s = String(raw ?? '').replace(/\r\n/g, '\n')
  const trimmed = s.replace(/^[ \t]+|[ \t]+$/g, '')
  return trimmed.slice(0, 200)
}

export async function getUserAbout(userId) {
  return profilePrimary.getUserAbout(userId)
}

export async function setUserAbout(userId, about) {
  const v = normAbout(about)
  return profilePrimary.setUserAbout(userId, v)
}

export async function getUserProfile(userId) {
  return profilePrimary.getUserProfile(userId)
}

export async function setUserProfile(userId, { nickname, icon, gender, birthYear } = {}) {
  const out = {}

  if (nickname != null && nickname !== '') {
    out.nickname = await setUserNick(userId, nickname)
  }

  if (icon != null) {
    out.icon = await setUserAvatar(userId, icon)
  }

  if (gender != null) {
    out.gender = await setUserGender(userId, gender)
  }

  if (birthYear != null) {
    out.birthYear = await setUserBirthYear(userId, birthYear)
  }

  return out
}
/* =========================
   SUBSCRIPTIONS (viewer -> authors)
========================= */

const normId = (x) => String(x ?? '').trim()
const SUBS_PAGE_LIMIT_DEFAULT = 50
const SUBS_PAGE_LIMIT_MAX = 100
export const SUBS_SEARCH_MIN_CHARS = 2
export const SUBS_SEARCH_MAX_CANDIDATES = 1000

export function normalizeUserSearchText(raw) {
  const s = String(raw ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  return Array.from(s).slice(0, 64).join('')
}

export function buildUserSearchPrefixes(nickname) {
  const normalized = normalizeUserSearchText(nickname)
  const chars = Array.from(normalized)
  const out = new Set()
  const max = Math.min(24, chars.length)
  for (let len = SUBS_SEARCH_MIN_CHARS; len <= max; len += 1) {
    out.add(chars.slice(0, len).join(''))
  }
  return Array.from(out).filter(Boolean)
}

export function isLikelyExactUserId(raw) {
  const s = normId(raw)
  if (!s) return false
  return /^(?:web_|tg:|tguid:|0x)[a-z0-9:_-]{1,}$/i.test(s) || /^[a-z0-9_-]{6,}$/i.test(s) || /^\d{5,}$/.test(s)
}


export async function searchUsersByPrefixPage({ q, cursor = '', limit = SUBS_PAGE_LIMIT_DEFAULT } = {}) {
  const query = normalizeUserSearchText(q)
  const safeLimit = normalizeLimit(limit)
  if (!query || Array.from(query).length < SUBS_SEARCH_MIN_CHARS) {
    return { ids: [], query, nextCursor: null, hasMore: false }
  }
  const page = await profilePrimary.searchUsersByNickPrefix({ q: query, cursor, limit: safeLimit })
  return {
    ...page,
    query,
  }
}

async function resolveSubscriptionIdsPreservingOrder(ids) {
  const pairs = await resolveSubscriptionPairsPreservingOrder(ids)
  return pairs.map((pair) => pair.canonical).filter(Boolean)
}

async function resolveSubscriptionPairsPreservingOrder(ids) {
  const rawList = Array.from(new Set((Array.isArray(ids) ? ids : []).map(normId).filter(Boolean)))
  if (!rawList.length) return []
  try {
    const resolved = await resolveCanonicalAccountIds(rawList, redis)
    const aliases = resolved?.aliases || {}
    const canonicalPool = Array.isArray(resolved?.ids) ? resolved.ids.map(normId).filter(Boolean) : []
    return rawList.map((id, idx) => ({
      raw: id,
      canonical: normId(aliases[id] || canonicalPool[idx] || id),
    })).filter((pair) => pair.raw && pair.canonical)
  } catch {
    return rawList.map((id) => ({ raw: id, canonical: id }))
  }
}


export async function getUsersPublicMini(ids) {
  const rawList = Array.from(new Set((Array.isArray(ids) ? ids : []).map(normId).filter(Boolean)))
    .slice(0, SUBS_PAGE_LIMIT_MAX)
  if (!rawList.length) return []

  const pairs = await resolveSubscriptionPairsPreservingOrder(rawList)
  const byRaw = new Map(pairs.map((pair) => [pair.raw, pair.canonical]))

  return Promise.all(rawList.map(async (raw) => {
    const canonical = normId(byRaw.get(raw) || raw)
    const candidates = Array.from(new Set([raw, canonical].map(normId).filter(Boolean)))
    let chosenId = raw
    let chosenProfile = null
    for (const uid of candidates) {
      const profile = await profilePrimary.getUserProfile(uid).catch(() => null)
      if (!chosenProfile) {
        chosenId = uid
        chosenProfile = profile
      }
      if (normId(profile?.nickname) || normId(profile?.icon)) {
        chosenId = uid
        chosenProfile = profile
        break
      }
    }
    return {
      userId: chosenId || raw,
      nickname: normId(chosenProfile?.nickname),
      icon: normId(chosenProfile?.icon),
    }
  }))
}

export async function getSubscriptionCounts(userId) {
  const uid = normId(userId)
  if (!uid) return { followers: 0, following: 0 }
  const counts = await forumPrimary.getSubscriptionCounts(uid)
  return { followers: Number(counts?.followers || 0), following: Number(counts?.following || 0) }
}

export async function listSubscriptions(viewerId) {
  const vid = normId(viewerId)
  if (!vid) return []
  const list = await forumPrimary.listSubscriptions(vid)
  return (Array.isArray(list) ? list : []).map(normId).filter(Boolean)
}

export async function getFollowersCount(authorId) {
  const aid = normId(authorId)
  if (!aid) return 0
  return Number(await forumPrimary.getFollowersCount(aid) || 0)
}

export async function listSubscriptionPeoplePage({
  userId,
  mode = 'followers',
  limit = SUBS_PAGE_LIMIT_DEFAULT,
  cursor = '',
} = {}) {
  const uid = normId(userId)
  if (!uid) {
    return { ids: [], users: [], totalCount: 0, nextCursor: null, hasMore: false }
  }

  const safeMode = mode === 'following' ? 'following' : 'followers'
  const safeLimit = normalizeLimit(limit)
  const page = await forumPrimary.listSubscriptionPeoplePage({
    userId: uid,
    mode: safeMode,
    limit: safeLimit,
    cursor,
  })
  const pageIds = []
  for (const id of (Array.isArray(page?.ids) ? page.ids : [])) {
    const safeId = normId(id)
    if (!safeId || safeId === uid || pageIds.includes(safeId)) continue
    pageIds.push(safeId)
  }
  let users = []
  try {
    users = await getUsersPublicMini(pageIds)
  } catch {
    users = []
  }
  if (!users.length && pageIds.length) {
    users = pageIds.map((userId) => ({ userId, nickname: '', icon: '' }))
  }
  const counts = await getSubscriptionCounts(uid)
  return {
    ids: pageIds,
    users,
    totalCount: safeMode === 'following' ? counts.following : counts.followers,
    counts,
    nextCursor: page?.nextCursor || null,
    hasMore: page?.hasMore === true,
    source: 'mongo',
  }
}

export async function filterCandidatesBySubscriptionRelation({
  ownerId,
  mode = 'followers',
  candidateIds = [],
} = {}) {
  return forumPrimary.filterCandidatesBySubscriptionRelation({ ownerId, mode, candidateIds })
}

export async function toggleSubscription(viewerId, authorId) {
  const vid = normId(viewerId)
  const aid = normId(authorId)
  if (!vid) return { ok:false, error:'no_viewer' }
  if (!aid) return { ok:false, error:'no_author' }
  if (vid === aid) return { ok:false, error:'self_subscribe' }
  return forumPrimary.toggleSubscription(vid, aid)
}

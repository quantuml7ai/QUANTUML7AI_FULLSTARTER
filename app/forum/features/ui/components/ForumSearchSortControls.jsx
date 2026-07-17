'use client'

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { MetaMarketCloseIcon } from '../../../../../components/MetaMarketIcons'
import { cls } from '../../../shared/utils/classnames'
import {
  buildSearchVideoMedia,
  getYouTubeId,
  isTikTokUrl,
  isYouTubeUrl,
} from '../../media/utils/mediaLinks'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'
import useVipFlag from '../../profile/hooks/useVipFlag'
import {
  resolveIconForDisplay,
  resolveNickForDisplay,
  resolveProfileAccountId,
  safeReadProfile,
} from '../../profile/utils/profileCache'
import QuantumWalletLaunchIcon from '../../../../../components/QuantumWalletLaunchIcon'
import ForumControlNavIcon from './ForumControlNavIcon'
import { api as forumApi, readForumActorId } from '../../../services/forumApi'

const SEARCH_MODES = ['posts', 'topics', 'people']
function tText(t, key, fallback) {
  const value = typeof t === 'function' ? t(key) : ''
  return value && value !== key ? value : fallback
}


// QL7_GEO888_STAGE1A_EXPLICIT_RANDOM_I18N_SORT_FIX_V14A
const QL7_FORUM_FEED_SORT_VALUES = new Set(['random', 'new', 'top', 'likes', 'reactions', 'views', 'replies'])
const QL7_FORUM_FEED_SORT_EXPLICIT_KEY = 'ql7_forum_feed_sort_explicit_v14a'
const QL7_FORUM_GEO_MODE_STORAGE_KEYS = ['ql7_forum_geo_mode', 'ql7_forum_geo_feed_mode']
const QL7_FORUM_SORT_STORAGE_KEYS = ['ql7_forum_feed_sort', QL7_FORUM_FEED_SORT_EXPLICIT_KEY]
let ql7ForumSortControlsBootstrapped = false

function bootstrapForumFeedRuntimeDefaults() {
  if (typeof window === 'undefined') return
  if (ql7ForumSortControlsBootstrapped) return
  ql7ForumSortControlsBootstrapped = true
  try {
    const mode = String(window.__ql7ForumGeoFeedMode || '').trim().toLowerCase()
    window.__ql7ForumGeoFeedMode = mode === 'world' ? 'world' : 'geo'
  } catch {}
  try {
    const rawSort = String(window.__ql7ForumFeedSort || '').trim().toLowerCase()
    const explicit = String(window.__ql7ForumFeedSortExplicit || '').trim() === '1'
    window.__ql7ForumFeedSort = explicit && QL7_FORUM_FEED_SORT_VALUES.has(rawSort) ? rawSort : 'random'
    window.__ql7ForumFeedSortExplicit = explicit && QL7_FORUM_FEED_SORT_VALUES.has(rawSort) ? '1' : ''
  } catch {}
  try {
    const stores = [window.localStorage, window.sessionStorage].filter(Boolean)
    stores.forEach((store) => {
      ;[...QL7_FORUM_GEO_MODE_STORAGE_KEYS, ...QL7_FORUM_SORT_STORAGE_KEYS].forEach((key) => {
        try { store.removeItem(key) } catch {}
      })
    })
  } catch {}
}

function normalizeGeoFeedMode(value) {
  const raw = String(value || '').trim().toLowerCase(); return raw === 'world' ? 'world' : 'geo'
}
function normalizeFeedSort(value, fallback = 'random') {
  const raw = String(value || '').trim().toLowerCase()
  if (QL7_FORUM_FEED_SORT_VALUES.has(raw)) return raw
  const fb = String(fallback || 'random').trim().toLowerCase()
  return QL7_FORUM_FEED_SORT_VALUES.has(fb) ? fb : 'random'
}
function normalizePostSurfaceSort(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'reactions') return 'likes'
  return raw && raw !== 'random' && QL7_FORUM_FEED_SORT_VALUES.has(raw) ? raw : 'new'
}
function readInitialGeoFeedMode() {
  bootstrapForumFeedRuntimeDefaults()
  try {
    const raw = window.__ql7ForumGeoFeedMode || 'geo'
    return normalizeGeoFeedMode(raw)
  } catch { return 'geo' }
}
function writeGeoFeedMode(mode, options = {}) {
  bootstrapForumFeedRuntimeDefaults()
  const next = normalizeGeoFeedMode(mode)
  try { window.__ql7ForumGeoFeedMode = next } catch {}
  if (options?.emit !== false) {
    try { window.dispatchEvent(new CustomEvent('forum:geo-feed-mode-change', { detail: { mode: next } })) } catch {}
  }
  return next
}
function hasExplicitForumFeedSortPreference() {
  bootstrapForumFeedRuntimeDefaults()
  try {
    return String(window.__ql7ForumFeedSortExplicit || '').trim() === '1'
  } catch { return false }
}
function readInitialForumFeedSortPreference() {
  bootstrapForumFeedRuntimeDefaults()
  try {
    const raw = String(window.__ql7ForumFeedSort || '').trim().toLowerCase()
    if (hasExplicitForumFeedSortPreference() && QL7_FORUM_FEED_SORT_VALUES.has(raw)) return raw
    if (raw && raw !== 'random') window.__ql7ForumFeedSort = 'random'
    return 'random'
  } catch { return 'random' }
}
function writeForumFeedSortPreference(sortKey) {
  bootstrapForumFeedRuntimeDefaults()
  const next = normalizeFeedSort(sortKey, 'random')
  try { window.__ql7ForumFeedSort = next } catch {}
  try { window.__ql7ForumFeedSortExplicit = '1' } catch {}
  try { window.dispatchEvent(new CustomEvent('forum:server-feed-sort-change', { detail: { sort: next, explicit: true } })) } catch {}
  return next
}
function geoSummaryText(viewerGeo, t) {
  const value = viewerGeo && typeof viewerGeo === 'object' ? viewerGeo : null
  if (!value) return tText(t, 'forum_sort_geo_unknown', 'Detecting region')
  const precision = String(value.precision || '').toLowerCase()
  const label = cleanText(value.cityLabel || value.city || value.regionLabel || value.region || value.countryLabel || value.countryCode || '')
  if (label) return label
  if (precision === 'global' || value.known === false) return tText(t, 'forum_sort_geo_world', 'World')
  return tText(t, 'forum_sort_geo_unknown', 'Detecting region')
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function cropText(value, max = 100) {
  const text = cleanText(value)
  if (!text) return ''
  if (text.length <= max) return text
  const cutAt = Math.max(1, max - 3)
  return `${text.slice(0, cutAt).trimEnd()}...`
}

function formatSearchTs(ts) {
  const n = Number(ts || 0)
  if (!Number.isFinite(n) || n <= 0) return ''
  try {
    return new Date(n).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function shortId(id) {
  const raw = String(id || '').trim()
  if (!raw) return ''
  if (raw.length <= 14) return raw
  return `${raw.slice(0, 6)}...${raw.slice(-4)}`
}

function normalizeSearchValue(value) {
  return String(value || '').toLowerCase().trim().replace(/^@+/, '')
}

function finiteSearchCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function readSearchTopicPostCount(topic) {
  const counters = topic?.counters && typeof topic.counters === 'object' ? topic.counters : {}
  return Math.max(
    finiteSearchCount(topic?.postsCount),
    finiteSearchCount(topic?.posts),
    finiteSearchCount(topic?.replies),
    finiteSearchCount(topic?.repliesCount),
    finiteSearchCount(counters.posts),
    finiteSearchCount(counters.replies),
    finiteSearchCount(counters.repliesCount),
    finiteSearchCount(topic?.sort?.replies),
    finiteSearchCount(topic?.sort?.posts),
  )
}



// QL7_GEO111_SERVER_SEARCH_CLIENT_HELPERS_V1
function normalizeServerSearchPost(item) {
  const src = item?.item && typeof item.item === 'object' ? item.item : item
  const postId = cleanText(item?.postId || src?.postId || src?.id || item?.id || item?.entityId)
  if (!postId) return null
  const topicId = cleanText(item?.topicId || src?.topicId)
  const post = { ...src, id: postId, postId, topicId }
  const media = pickPostMedia(post)
  const text = stripMediaUrls(cleanText(src?.text || src?.body || src?.textSnippet || ''))
  return {
    id: postId,
    post,
    media,
    text,
    ts: src?.ts || item?.ts || item?.score || 0,
    source: 'mongo_projection_search',
  }
}
function normalizeServerSearchTopic(item) {
  const src = item?.item && typeof item.item === 'object' ? item.item : item
  const topicId = cleanText(item?.topicId || src?.topicId || src?.id || item?.id || item?.entityId)
  if (!topicId) return null
  return { ...src, id: topicId, topicId, source: 'mongo_projection_search' }
}
function normalizeServerSearchPerson(item) {
  const src = item?.item && typeof item.item === 'object' ? item.item : item
  const accountId = cleanText(item?.accountId || src?.accountId || src?.userId || item?.entityId || item?.id)
  if (!accountId) return null
  const nickname = cleanText(src?.nickname || src?.nick || '')
  if (!nickname) return null
  const icon = cleanText(src?.icon || src?.avatar || '')
  return {
    ...src,
    userId: cleanText(src?.userId || accountId),
    accountId,
    nickname,
    icon,
    avatar: icon,
    vipActive: !!src?.vipActive || !!src?.isVip || !!src?.vip,
    sourceKind: 'mongo_profile_search',
    sourceId: accountId,
  }
}
function dedupeServerSearchPeople(items = []) {
  const out = []
  const seen = new Set()
  for (const user of Array.isArray(items) ? items : []) {
    if (!user) continue
    const key = cleanText(user.canonicalAccountId || user.accountId || user.userId || user.sourceId || user.id).toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(user)
  }
  return out
}
function dispatchServerItemsMerge({ posts = [], topics = [], reason = 'search_navigation' } = {}) {
  if (typeof window === 'undefined') return
  const cleanPosts = (Array.isArray(posts) ? posts : []).filter((item) => item && item.id)
  const cleanTopics = (Array.isArray(topics) ? topics : []).filter((item) => item && item.id)
  if (!cleanPosts.length && !cleanTopics.length) return
  try {
    window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
      detail: { posts: cleanPosts, topics: cleanTopics, reason, rev: Date.now() },
    }))
  } catch {}
}

function matchesSearchPrefix(value, term) {
  const hay = normalizeSearchValue(value)
  const needle = normalizeSearchValue(term)
  if (!hay || !needle) return false
  if (hay.startsWith(needle)) return true
  return hay.split(/[\s_\-.#@/\\]+/).filter(Boolean).some((part) => part.startsWith(needle))
}

function readAuthorId(entity) {
  const raw = String(entity?.userId || entity?.accountId || entity?.authorId || entity?.ownerId || '').trim()
  return raw
}

function readResolvedAuthorId(entity) {
  const raw = readAuthorId(entity)
  return String(resolveProfileAccountId(raw) || raw || '').trim()
}

function readAuthorNick(entity) {
  const raw = readAuthorId(entity)
  const resolved = readResolvedAuthorId(entity)
  const cached = safeReadProfile(resolved)
  return cleanText(cached?.nickname || resolveNickForDisplay(resolved || raw, entity?.nickname || entity?.nick || entity?.name || '') || shortId(raw || resolved))
}

function readAuthorIcon(entity) {
  const raw = readAuthorId(entity)
  const resolved = readResolvedAuthorId(entity)
  return resolveIconForDisplay(resolved || raw, entity?.icon || entity?.avatar || entity?.pIcon || '')
}

function readVipHint(entity) {
  return entity?.vipActive ?? entity?.isVip ?? entity?.vip ?? entity?.vipUntil ?? null
}

function isImageUrl(url) {
  return /\.(?:png|jpe?g|webp|gif|avif|svg)(?:$|[?#])/i.test(String(url || ''))
}

function isDirectVideoUrl(url) {
  return /\.(?:mp4|webm|mov|m4v|ogv)(?:$|[?#])/i.test(String(url || ''))
}

function isAudioUrl(url) {
  return /\.(?:mp3|wav|ogg|m4a|aac|flac)(?:$|[?#])/i.test(String(url || ''))
}

function classifyMediaUrl(url, hint = '') {
  const u = String(url || '').trim()
  const type = String(hint || '').toLowerCase()
  if (!u) return null
  if (type.includes('sticker')) return { kind: 'sticker', url: u }
  if (type.startsWith('image/') || type === 'image' || isImageUrl(u)) return { kind: 'image', url: u }
  if (type.startsWith('video/') || type === 'video' || isDirectVideoUrl(u) || isYouTubeUrl(u) || isTikTokUrl(u)) return buildSearchVideoMedia(u)
  if (type.startsWith('audio/') || type === 'audio' || isAudioUrl(u)) return { kind: 'audio', url: u }
  return { kind: 'file', url: u }
}

function extractUrls(text) {
  return String(text || '').match(/https?:\/\/[^\s<>'")]+/gi) || []
}

const STICKER_TOKEN_RE = /\[(VIP_EMOJI|MOZI|STICKER):([^\]]+)\]/gi

function extractStickerMedia(text) {
  const raw = String(text || '')
  STICKER_TOKEN_RE.lastIndex = 0
  const match = STICKER_TOKEN_RE.exec(raw)
  STICKER_TOKEN_RE.lastIndex = 0
  if (!match?.[2]) return null
  const url = String(match[2] || '').trim()
  if (!url) return null
  return { kind: 'sticker', url }
}

function stripMediaUrls(text) {
  const withoutStickerTokens = String(text || '').replace(STICKER_TOKEN_RE, '')
  return cleanText(withoutStickerTokens.replace(/https?:\/\/[^\s<>'")]+/gi, (url) => {
    if (isImageUrl(url) || isDirectVideoUrl(url) || isYouTubeUrl(url) || isTikTokUrl(url) || isAudioUrl(url)) return ''
    return url
  }))
}

function pickPostMedia(post) {
  const stickerTokenMedia = extractStickerMedia(post?.text || post?.body || '')
  if (stickerTokenMedia) return stickerTokenMedia
  const directCandidates = [
    post?.stickerUrl,
    post?.sticker?.url,
    post?.imageUrl,
    post?.media?.imageUrl,
    post?.videoUrl,
    post?.media?.videoUrl,
    post?.audioUrl,
    post?.media?.audioUrl,
    post?.url,
  ]
  for (const raw of directCandidates) {
    const media = classifyMediaUrl(raw, raw === post?.stickerUrl || raw === post?.sticker?.url ? 'sticker' : '')
    if (media) return media
  }

  const lists = []
  if (Array.isArray(post?.stickers)) lists.push(post.stickers.map((item) => ({ ...item, type: 'sticker' })))
  if (Array.isArray(post?.attachments)) lists.push(post.attachments)
  if (Array.isArray(post?.files)) lists.push(post.files)
  if (Array.isArray(post?.media)) lists.push(post.media)
  for (const item of lists.flat().filter(Boolean)) {
    const url = String(item?.url || item?.src || item?.href || item?.file || item?.path || '').trim()
    const hint = String(item?.type || item?.mime || item?.mediaType || item?.kind || '').trim()
    const media = classifyMediaUrl(url, hint)
    if (media) return media
  }

  for (const url of extractUrls(post?.text || post?.body || '')) {
    const media = classifyMediaUrl(url)
    if (media && media.kind !== 'file') return media
  }

  return null
}

function SearchResultFallbackIcon({ kind }) {
  if (kind === 'video') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 9.5l4 2.5-4 2.5z" fill="currentColor" />
      </svg>
    )
  }
  if (kind === 'audio') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 17a2.6 2.6 0 1 1-2.6-2.6A2.6 2.6 0 0 1 9 17zm8-2.8a2.6 2.6 0 1 1-2.6-2.6A2.6 2.6 0 0 1 17 14.2z" fill="currentColor" />
        <path d="M9 17V6.4l8-1.6v9.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h8l4 4v16H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 2v4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function SearchMediaPreview({ media, t }) {
  if (!media?.url) return null
  const kind = String(media.kind || '').toLowerCase()
  const label = kind === 'video'
    ? (media.label || tText(t, 'forum_search_media_video', 'Video preview'))
    : kind === 'audio'
      ? tText(t, 'forum_search_media_audio', 'Audio')
      : kind === 'file'
        ? tText(t, 'forum_search_media_file', 'File')
        : ''

  if (kind === 'image' || kind === 'sticker') {
    return (
      <span className={cls('searchPortalMedia', kind === 'sticker' && 'searchPortalMedia--sticker')}>
        <img className="searchPortalMediaObject" src={media.url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      </span>
    )
  }

  if (kind === 'video' && isDirectVideoUrl(media.url)) {
    return (
      <span className="searchPortalMedia searchPortalMedia--video">
        <video className="searchPortalMediaObject" src={media.url} data-search-preview-video="true" muted loop playsInline preload="metadata" aria-label={label} />
        <span className="searchPortalMediaBadge">{label}</span>
      </span>
    )
  }

  if (kind === 'video' && media.thumb) {
    return (
      <span className="searchPortalMedia searchPortalMedia--video">
        <img className="searchPortalMediaObject" src={media.thumb} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        <span className="searchPortalMediaBadge">{label}</span>
      </span>
    )
  }

  if (kind === 'video' && getYouTubeId(media.url)) {
    const thumb = `https://i.ytimg.com/vi/${getYouTubeId(media.url)}/hqdefault.jpg`
    return (
      <span className="searchPortalMedia searchPortalMedia--video">
        <img className="searchPortalMediaObject" src={thumb} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        <span className="searchPortalMediaBadge">{label}</span>
      </span>
    )
  }

  return (
    <span className="searchPortalMedia searchPortalMedia--fallback">
      <span className="searchPortalMediaIcon" aria-hidden="true"><SearchResultFallbackIcon kind={kind} /></span>
      <span className="searchPortalMediaBadge">{label}</span>
    </span>
  )
}

function AuthorIdentity({ entity, avatarRef = null, size = 'regular', className = '' }) {
  const rawUserId = readAuthorId(entity)
  const authorId = readResolvedAuthorId(entity)
  const cachedProfile = safeReadProfile(authorId)
  const nickname = readAuthorNick(entity)
  const icon = readAuthorIcon(entity)
  const isVipAuthor = useVipFlag(authorId || rawUserId, cachedProfile?.vipActive ?? cachedProfile?.vipUntil ?? readVipHint(entity))
  const hasIdentity = !!(rawUserId || authorId || nickname)
  if (!hasIdentity) return null

  return (
    <span className={cls('searchPortalAuthor', `searchPortalAuthor--${size}`, className)}>
      <span ref={avatarRef} className="avaMini searchPortalAuthorAvatar" aria-hidden="true">
        <AvatarEmoji userId={authorId || rawUserId} pIcon={icon} />
      </span>
      <span className={cls('nick-badge nick-animate searchPortalNickBadge', isVipAuthor && 'vipNick')} translate="no">
        <span className="nick-text truncate">{nickname || shortId(authorId || rawUserId)}</span>
      </span>
      {isVipAuthor && <VipFlipBadge className="searchPortalVip" />}
    </span>
  )
}

function PostResultCard({ item, topic, onOpen, t }) {
  const post = item?.post || null
  const media = item?.media || pickPostMedia(post)
  const ts = formatSearchTs(post?.ts || item?.ts)
  const text = cropText(stripMediaUrls(post?.text || post?.body || item?.text || ''), 100)
  const topicTitle = cleanText(topic?.title || '')
  const hasMedia = !!media?.url
  const hasBody = !!(text || topicTitle || readAuthorId(post) || readAuthorNick(post))
  if (!post || (!hasMedia && !hasBody)) return null

  return (
    <button
      type="button"
      className={cls('searchPortalResultCard searchPortalPostCard', !hasMedia && 'searchPortalCardNoMedia')}
      onClick={() => onOpen(post)}
    >
      <span className="searchPortalCardBody searchPortalPostBody">
        <span className="searchPortalAuthorLine">
          <AuthorIdentity entity={post} size="small" />
        </span>
        {!!topicTitle && <span className="searchPortalContext">{topicTitle}</span>}
        {!!text && <span className="searchPortalText searchPortalPostText">{text}</span>}
        {!!ts && <span className="searchPortalDate searchPortalPostDate">{ts}</span>}
      </span>
      {hasMedia && <SearchMediaPreview media={media} t={t} />}
    </button>
  )
}


function TopicResultCard({ topic, count, onOpen, t }) {
  const createdTs = formatSearchTs(topic?.createdAt || topic?.createdTs || topic?.created || topic?.ts)
  const desc = cropText(topic?.description || topic?.desc || '', 100)
  const title = cleanText(topic?.title || '')
  const safeCount = Math.max(readSearchTopicPostCount(topic), finiteSearchCount(count))
  const postsLabel = tText(t, 'forum_search_tab_posts', 'Posts')
  const createdLabel = tText(t, 'forum_search_topic_created', 'Created')
  if (!title && !desc && !readAuthorId(topic)) return null

  return (
    <button type="button" className="searchPortalResultCard searchPortalTopicCard" onClick={() => onOpen(topic)}>
      <span className="searchPortalCardBody searchPortalTopicBody">
        <span className="searchPortalAuthorLine">
          <AuthorIdentity entity={topic} size="small" />
        </span>
        {!!title && <span className="searchPortalTopicTitle">{title}</span>}
        {!!desc && <span className="searchPortalText searchPortalTopicText">{desc}</span>}
        <span className="searchPortalTopicFoot">
          {Number.isFinite(safeCount) && safeCount > 0 && (
            <span className="searchPortalTopicBadge searchPortalTopicBadge--posts" title={`${postsLabel}: ${safeCount}`} aria-label={`${postsLabel}: ${safeCount}`}>
              <span className="searchPortalTopicBadgeIcon searchPortalTopicBadgeIcon--posts" aria-hidden="true" />
              <span className="searchPortalTopicBadgeValue">{safeCount}</span>
              <span className="searchPortalTopicBadgeLabel">{postsLabel}</span>
            </span>
          )}
          {!!createdTs && (
            <span className="searchPortalTopicBadge searchPortalTopicBadge--date" title={`${createdLabel}: ${createdTs}`} aria-label={`${createdLabel}: ${createdTs}`}>
              <span className="searchPortalTopicBadgeIcon searchPortalTopicBadgeIcon--date" aria-hidden="true" />
              <span className="searchPortalTopicBadgeLabel">{createdLabel}</span>
              <span className="searchPortalTopicBadgeText">{createdTs}</span>
            </span>
          )}
        </span>
      </span>
    </button>
  )
}


function UserResultCard({ user, onOpen }) {
  const avatarRef = useRef(null)
  return (
    <button
      type="button"
      className="searchPortalResultCard searchPortalUserCard"
      onClick={(event) => onOpen(user, avatarRef.current || event.currentTarget)}
    >
      <AuthorIdentity entity={user} avatarRef={avatarRef} size="regular" />
    </button>
  )
}

function GeoDetectControlMark() {
  return (
    <svg className="forumGeoDetectControlSvg" viewBox="0 0 116 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="forum-geodetect-plate" x1="8" y1="4" x2="108" y2="36">
          <stop offset="0" stopColor="#06101f" />
          <stop offset=".52" stopColor="#0a1830" />
          <stop offset="1" stopColor="#07111f" />
        </linearGradient>
        <linearGradient id="forum-geodetect-geo" x1="28" y1="0" x2="72" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".52" stopColor="#eaf7ff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="forum-geodetect-detect" x1="30" y1="0" x2="88" y2="0">
          <stop offset="0" stopColor="#dffaff" />
          <stop offset=".46" stopColor="#75ddff" />
          <stop offset="1" stopColor="#9bbcff" />
        </linearGradient>
        <filter id="forum-geodetect-glow" x="-45%" y="-100%" width="190%" height="300%">
          <feDropShadow dx="0" dy="0" stdDeviation=".8" floodColor="#ffffff" floodOpacity=".92" />
          <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#69dcff" floodOpacity=".72" />
        </filter>
      </defs>
      <rect className="forumGeoDetectPlate" x="2" y="2" width="112" height="36" rx="12" fill="url(#forum-geodetect-plate)" />
      <path className="forumGeoDetectCircuit forumGeoDetectCircuit--top" d="M8 10H23L29 6H45M72 6H89L95 10H108" />
      <path className="forumGeoDetectCircuit forumGeoDetectCircuit--bottom" d="M8 30H29L35 34H80L86 30H108" />
      <path className="forumGeoDetectScanner" d="M13 20H103" />
      <circle className="forumGeoDetectNode forumGeoDetectNode--a" cx="9" cy="20" r="1.25" />
      <circle className="forumGeoDetectNode forumGeoDetectNode--b" cx="107" cy="20" r="1.25" />
      <g className="forumGeoDetectGeoWord" filter="url(#forum-geodetect-glow)">
        <text className="forumGeoDetectGeoLetter forumGeoDetectGeoLetter--g" x="35" y="26">G</text>
        <text className="forumGeoDetectGeoLetter forumGeoDetectGeoLetter--e" x="49" y="26">e</text>
        <text className="forumGeoDetectGeoLetter forumGeoDetectGeoLetter--o" x="61" y="26">o</text>
      </g>
      <g className="forumGeoDetectFragments" filter="url(#forum-geodetect-glow)">
        <circle className="forumGeoDetectShard forumGeoDetectShard--1" cx="42" cy="17" r="1" />
        <circle className="forumGeoDetectShard forumGeoDetectShard--2" cx="49" cy="23" r=".8" />
        <circle className="forumGeoDetectShard forumGeoDetectShard--3" cx="55" cy="15" r=".9" />
        <circle className="forumGeoDetectShard forumGeoDetectShard--4" cx="61" cy="24" r=".8" />
        <circle className="forumGeoDetectShard forumGeoDetectShard--5" cx="67" cy="17" r="1" />
        <circle className="forumGeoDetectShard forumGeoDetectShard--6" cx="73" cy="22" r=".75" />
        <path className="forumGeoDetectShard forumGeoDetectShard--7" d="M45 19l4 -3" />
        <path className="forumGeoDetectShard forumGeoDetectShard--8" d="M64 18l5 3" />
      </g>
      <g className="forumGeoDetectDetectWord" filter="url(#forum-geodetect-glow)">
        <text x="58" y="26" textAnchor="middle">Detect</text>
      </g>
      <path className="forumGeoDetectComet" d="M18 31H98" />
    </svg>
  )
}

export default function ForumSearchSortControls({
  t,
  locale = 'en',
  q,
  setQ,
  openOnly,
  drop,
  setDrop,
  results,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  getScrollEl,
  data,
  pushNavState,
  setTopicFilterId,
  setSel,
  setThreadRoot,
  openThreadForPost,
  sortOpen,
  setSortOpen,
  videoFeedOpen,
  setVideoFeedUserSortLocked,
  setFeedSort,
  feedSort,
  topicSort,
  postSort,
  sel,
  forcePostSort,
  profileBranchMode,
  sortControlsDisabled = false,
  geoSortAllowed = true,
  setPostSort,
  setTopicSort,
  questEnabled,
  questBtnClass,
  openQuests,
  onCommitSortChange,
}) {
  const [portalReady, setPortalReady] = useState(false)
  const [mode, setMode] = useState('posts')
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const rawQuery = String(q || '')
  const query = rawQuery.trim()
  const [geoFeedMode, setGeoFeedMode] = useState(() => readInitialGeoFeedMode())
  const [controlFeedSort, setControlFeedSort] = useState(() => readInitialForumFeedSortPreference())
  const [geoPreview, setGeoPreview] = useState({ loading: false, viewerGeo: null, count: 0, source: '' })
  const [geoApply, setGeoApply] = useState({ loading: false, mode: '', token: 0 })
  const [feedApply, setFeedApply] = useState({ loading: false, mode: '', sort: '', token: 0 })
  const [serverSearch, setServerSearch] = useState({ query: '', loading: false, ok: false, posts: [], topics: [], people: [] })
  const sortControlsInactive = !!sortControlsDisabled

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    const syncSort = (event) => {
      const next = normalizeFeedSort(event?.detail?.sort || readInitialForumFeedSortPreference(), 'random')
      setControlFeedSort(next)
    }
    try { syncSort() } catch {}
    window.addEventListener('forum:server-feed-sort-change', syncSort)
    return () => window.removeEventListener('forum:server-feed-sort-change', syncSort)
  }, [])

  const closeSearch = useCallback(() => {
    setDrop(false)
    setQ('')
  }, [setDrop, setQ])

  useEffect(() => {
    if (!drop) return undefined
    const id = window.setTimeout(() => {
      try { inputRef.current?.focus?.({ preventScroll: true }) } catch {}
    }, 30)
    return () => window.clearTimeout(id)
  }, [drop])

  useEffect(() => {
    if (!drop || mode !== 'posts') return undefined
    const root = resultsRef.current
    if (!root) return undefined
    let raf = 0

    function selectFocusedSearchPreviewVideo() {
      raf = 0
      const videos = Array.from(root.querySelectorAll('video[data-search-preview-video]'))
      if (!videos.length) return
      const rootRect = root.getBoundingClientRect()
      const center = rootRect.top + rootRect.height / 2
      let best = null
      let bestDistance = Infinity
      for (const video of videos) {
        const rect = video.getBoundingClientRect()
        const visible = rect.bottom > rootRect.top && rect.top < rootRect.bottom
        if (!visible) continue
        const distance = Math.abs((rect.top + rect.height / 2) - center)
        if (distance < bestDistance) {
          bestDistance = distance
          best = video
        }
      }
      for (const video of videos) {
        if (video === best) {
          try { video.muted = true } catch {}
          try { video.play?.().catch?.(() => {}) } catch {}
        } else {
          try { video.pause?.() } catch {}
        }
      }
    }

    const schedule = () => {
      if (raf) return
      raf = window.requestAnimationFrame(selectFocusedSearchPreviewVideo)
    }
    schedule()
    root.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      root.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      for (const video of Array.from(root.querySelectorAll('video[data-search-preview-video]'))) {
        try { video.pause?.() } catch {}
      }
    }
  }, [drop, mode, query])

  useEffect(() => {
    if (!drop) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') closeSearch(false)
    }
    const onBranchClose = () => closeSearch(true)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('forum:search-popover-close', onBranchClose)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('forum:search-popover-close', onBranchClose)
    }
  }, [closeSearch, drop])

  const commitSelectedSort = (sortKey) => {
    if (sortControlsInactive) return
    const isFeedSurface = videoFeedOpen || (!sel && !forcePostSort && !profileBranchMode)
    if (videoFeedOpen) {
      const nextSort = writeForumFeedSortPreference(sortKey)
      setControlFeedSort(nextSort)
      setVideoFeedUserSortLocked(true)
      setFeedSort(nextSort)
    } else if (sel || forcePostSort) {
      const nextSort = normalizePostSurfaceSort(sortKey)
      setPostSort(nextSort)
    } else if (profileBranchMode === 'topics') {
      const nextSort = writeForumFeedSortPreference(sortKey)
      setControlFeedSort(nextSort)
      setTopicSort(nextSort)
    } else {
      const nextSort = writeForumFeedSortPreference(sortKey)
      setControlFeedSort(nextSort)
      setTopicSort(nextSort)
    }
    const nextSort = videoFeedOpen || !(sel || forcePostSort)
      ? normalizeFeedSort(sortKey, 'random')
      : normalizePostSurfaceSort(sortKey)
    if (isFeedSurface || sel || forcePostSort) {
      setFeedApply({ loading: true, mode: geoSortAllowed ? geoFeedMode : 'world', sort: nextSort, token: Date.now() })
    }
    onCommitSortChange?.({
      kind: 'sort',
      sortKey: nextSort,
      target: videoFeedOpen ? 'video' : (sel || forcePostSort ? 'post' : 'topic'),
    })
  }

  const forceRandomFeedRebuildForMode = useCallback((modeKey, reason = 'geo_mode_random_rebuild') => {
    if (sortControlsInactive) return 'random'
    const nextMode = normalizeGeoFeedMode(modeKey)
    const nextSort = writeForumFeedSortPreference('random')
    setControlFeedSort(nextSort)
    if (videoFeedOpen) {
      setVideoFeedUserSortLocked(true)
      setFeedSort(nextSort)
    } else if (sel || forcePostSort) {
      setPostSort(normalizePostSurfaceSort(nextSort))
    } else {
      setTopicSort(nextSort)
    }
    setFeedApply({ loading: true, mode: geoSortAllowed ? nextMode : 'world', sort: nextSort, token: Date.now() })
    const payload = {
      kind: 'sort',
      sortKey: nextSort,
      target: videoFeedOpen ? 'video' : (sel || forcePostSort ? 'post' : 'topic'),
      mode: geoSortAllowed ? nextMode : 'world',
      reason,
    }
    onCommitSortChange?.(payload)
    try {
      window.setTimeout(() => {
        try { onCommitSortChange?.({ ...payload, reason: `${reason}_retry` }) } catch {}
      }, 460)
    } catch {}
    return nextSort
  }, [
    forcePostSort,
    geoSortAllowed,
    onCommitSortChange,
    sel,
    setFeedSort,
    setPostSort,
    setTopicSort,
    setVideoFeedUserSortLocked,
    sortControlsInactive,
    videoFeedOpen,
  ])

  const activeSortKey = videoFeedOpen
    ? normalizeFeedSort(feedSort || controlFeedSort, 'random')
    : (sel || forcePostSort
      ? normalizePostSurfaceSort(postSort)
      : normalizeFeedSort(controlFeedSort || topicSort, 'random'))
  const geoApplyActive = !!geoApply.loading || !!feedApply.loading


  useEffect(() => {
    if (!sortOpen) return undefined
    if (sortControlsInactive) {
      setGeoPreview((prev) => ({ ...prev, loading: false }))
      return undefined
    }
    let alive = true
    setGeoPreview((prev) => ({ ...prev, loading: true }))
    const previewMode = geoSortAllowed ? geoFeedMode : 'world'
    forumApi.feedPage({ mode: previewMode, sort: activeSortKey || 'random', pageSize: 1, lang: locale || 'en' })
      .then((json) => {
        if (!alive) return
        setGeoPreview({ loading: false, viewerGeo: json?.viewerGeo || null, count: Number(json?.count || 0) || 0, source: json?.source || '' })
      })
      .catch(() => { if (alive) setGeoPreview((prev) => ({ ...prev, loading: false })) })
    return () => { alive = false }
  }, [activeSortKey, geoFeedMode, geoSortAllowed, locale, sortControlsInactive, sortOpen]) // QL7_GEO111_SORT_GEO_PREVIEW_FETCH_V1

  const primeGeoSession = useCallback(async () => {
    const accountId = readForumActorId()
    if (!accountId) return null
    try {
      const response = await fetch('/api/geo/session-touch', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'content-type': 'application/json',
          'x-forum-user-id': accountId,
        },
        body: JSON.stringify({ accountId, reason: 'sort_popover_geo_apply', lang: locale || 'en' }),
      })
      return await response.json().catch(() => null)
    } catch {
      return null
    }
  }, [locale])

  const commitGeoFeedMode = useCallback(async (modeKey) => {
    if (sortControlsInactive) return
    const wantsGeo = normalizeGeoFeedMode(modeKey) === 'geo'
    if (wantsGeo && !geoSortAllowed) return
    if (!geoSortAllowed) {
      setGeoFeedMode('world')
      setGeoApply({ loading: false, mode: 'world', token: Date.now() })
      setFeedApply((prev) => ({ ...prev, loading: false }))
      return
    }
    const next = writeGeoFeedMode(modeKey, { emit: !wantsGeo })
    setGeoFeedMode(next)
    if (next === 'geo') {
      const token = Date.now()
      setFeedApply((prev) => ({ ...prev, loading: false }))
      setGeoApply({ loading: true, mode: next, token })
      await primeGeoSession()
      try {
        const json = await forumApi.feedPage({ mode: next, sort: 'random', pageSize: 1, lang: locale || 'en' })
        setGeoPreview({ loading: false, viewerGeo: json?.viewerGeo || null, count: Number(json?.count || 0) || 0, source: json?.source || '' })
      } catch {}
      try { window.dispatchEvent(new CustomEvent('forum:geo-feed-mode-change', { detail: { mode: next, geoReady: true } })) } catch {}
    } else {
      setGeoApply({ loading: false, mode: next, token: Date.now() })
    }
    forceRandomFeedRebuildForMode(next, next === 'geo' ? 'geo_mode_geo_random_rebuild' : 'geo_mode_world_random_rebuild')
  }, [forceRandomFeedRebuildForMode, geoSortAllowed, locale, primeGeoSession, sortControlsInactive])

  useEffect(() => {
    if (!geoApply.loading) return undefined
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setGeoApply((prev) => ({ ...prev, loading: false }))
    }
    const onApplied = (event) => {
      const mode = normalizeGeoFeedMode(event?.detail?.mode || '')
      if (mode === geoApply.mode) finish()
    }
    const timer = window.setTimeout(finish, 12000)
    window.addEventListener('forum:server-feed-applied', onApplied)
    return () => {
      done = true
      window.clearTimeout(timer)
      window.removeEventListener('forum:server-feed-applied', onApplied)
    }
  }, [geoApply.loading, geoApply.mode, geoApply.token])

  useEffect(() => {
    if (!feedApply.loading) return undefined
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setFeedApply((prev) => ({ ...prev, loading: false }))
    }
    const onApplied = (event) => {
      const detail = event?.detail || {}
      const mode = normalizeGeoFeedMode(detail?.mode || feedApply.mode)
      const sort = normalizeFeedSort(detail?.sort || feedApply.sort, 'random')
      if (mode === feedApply.mode && sort === feedApply.sort) finish()
    }
    const timer = window.setTimeout(finish, 12000)
    window.addEventListener('forum:server-feed-applied', onApplied)
    return () => {
      done = true
      window.clearTimeout(timer)
      window.removeEventListener('forum:server-feed-applied', onApplied)
    }
  }, [feedApply.loading, feedApply.mode, feedApply.sort, feedApply.token])

  const closeSort = useCallback(() => {
    setSortOpen(false)
  }, [setSortOpen])

  useEffect(() => {
    if (!sortOpen) return undefined
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      closeSort()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [closeSort, sortOpen]) // QL7_SORT_PORTAL_ESC_CLOSE_V1

  const geoLabel = geoSummaryText(geoPreview.viewerGeo, t)
  const geoModeIsWorld = sortControlsInactive || !geoSortAllowed || geoFeedMode === 'world'

  const sortOptions = [
    ['random', tText(t, 'forum_sort_random', 'Random')],
    ['new', t('forum_sort_new')],
    ['top', t('forum_sort_top')],
    ['likes', t('forum_sort_likes')],
    ['views', t('forum_sort_views')],
    ['replies', t('forum_sort_replies')],
  ]



  // QL7_GEO111_SERVER_SEARCH_POPUP_LOAD_V1
  useEffect(() => {
    if (!drop || !query) {
      setServerSearch((prev) => prev.query || prev.loading || prev.posts.length || prev.topics.length || prev.people.length
        ? { query: '', loading: false, ok: false, posts: [], topics: [], people: [] }
        : prev)
      return undefined
    }
    let alive = true
    const queryText = query
    const timer = window.setTimeout(async () => {
      setServerSearch((prev) => ({ ...prev, query: queryText, loading: true }))
      try {
        const [postResp, topicResp, peopleResp] = await Promise.all([
          forumApi.searchPage({ q: queryText, mode: 'posts', pageSize: 40, sort: 'relevance' }),
          forumApi.searchPage({ q: queryText, mode: 'topics', pageSize: 30, sort: 'relevance' }),
          forumApi.searchPage({ q: queryText, mode: 'people', pageSize: 40, sort: 'relevance' }),
        ])
        if (!alive) return
        const posts = (Array.isArray(postResp?.items) ? postResp.items : [])
          .map(normalizeServerSearchPost)
          .filter(Boolean)
        const topics = (Array.isArray(topicResp?.items) ? topicResp.items : [])
          .map(normalizeServerSearchTopic)
          .filter(Boolean)
        const people = (Array.isArray(peopleResp?.items) ? peopleResp.items : [])
          .map(normalizeServerSearchPerson)
          .filter(Boolean)
        dispatchServerItemsMerge({
          posts: posts.map((item) => item.post).filter(Boolean),
          topics,
          reason: 'server_search_results',
        })
        setServerSearch({
          query: queryText,
          loading: false,
          ok: !!(postResp?.ok || topicResp?.ok || peopleResp?.ok),
          posts,
          topics,
          people,
        })
      } catch {
        if (alive) setServerSearch({ query: queryText, loading: false, ok: false, posts: [], topics: [], people: [] })
      }
    }, 160)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [drop, query])

  const topicsById = useMemo(() => new Map((data?.topics || []).map((topic) => [String(topic?.id || ''), topic])), [data?.topics])
  const postsById = useMemo(() => new Map((data?.posts || []).map((post) => [String(post?.id || ''), post])), [data?.posts])
  const postCountByTopic = useMemo(() => {
    const map = new Map()
    for (const post of data?.posts || []) {
      const topicId = String(post?.topicId || '')
      if (!topicId) continue
      map.set(topicId, (map.get(topicId) || 0) + 1)
    }
    return map
  }, [data?.posts])

  const searchModel = useMemo(() => {
    if (!query) return { posts: [], topics: [], people: [] }
    const term = query.toLowerCase().replace(/^@/, '').trim()
    const sourceResults = Array.isArray(results) ? results : []

    const topicIds = new Set(sourceResults.filter((item) => item?.k === 't').map((item) => String(item.id || '')))
    const postIds = new Set(sourceResults.filter((item) => item?.k === 'p').map((item) => String(item.id || '')))

    if (!topicIds.size) {
      for (const topic of data?.topics || []) {
        const hay = [topic?.title, topic?.description, readAuthorNick(topic), readAuthorId(topic), readResolvedAuthorId(topic)]
          .map((value) => String(value || '').toLowerCase())
          .join(' ')
        if (hay.includes(term)) topicIds.add(String(topic?.id || ''))
      }
    }
    if (!postIds.size) {
      for (const post of data?.posts || []) {
        const topic = topicsById.get(String(post?.topicId || ''))
        const hay = [post?.text, post?.body, topic?.title, readAuthorNick(post), readAuthorId(post), readResolvedAuthorId(post)]
          .map((value) => String(value || '').toLowerCase())
          .join(' ')
        if (hay.includes(term)) postIds.add(String(post?.id || ''))
      }
    }

    const topicItems = Array.from(topicIds)
      .map((id) => topicsById.get(id))
      .filter((topic) => !!(topic && (topic.title || topic.description || readAuthorId(topic))))
      .slice(0, 30)

    const postItems = Array.from(postIds)
      .map((id) => {
        const post = postsById.get(id)
        if (!post) return null
        const source = sourceResults.find((item) => item?.k === 'p' && String(item.id || '') === id) || null
        const media = source?.media || pickPostMedia(post)
        const text = stripMediaUrls(source?.text || post?.text || post?.body || '')
        const topic = topicsById.get(String(post?.topicId || ''))
        const hasVisibleContent = !!(media?.url || text || topic?.title || readAuthorId(post))
        if (!hasVisibleContent) return null
        return {
          id,
          post,
          media,
          text,
          ts: source?.ts || post?.ts,
        }
      })
      .filter(Boolean)
      .slice(0, 40)

    const serverReady = serverSearch?.ok && String(serverSearch.query || '') === String(query || '')
    const serverPosts = serverReady && Array.isArray(serverSearch.posts) ? serverSearch.posts : []
    const serverTopics = serverReady && Array.isArray(serverSearch.topics) ? serverSearch.topics : []
    const serverPeople = serverReady && Array.isArray(serverSearch.people) ? serverSearch.people : []

    const strictServerPeople = serverPeople
      .filter((user) => matchesSearchPrefix(user?.nickname || user?.nick || '', term))
    const uniqueServerPeople = dedupeServerSearchPeople(strictServerPeople).slice(0, 40)

    return {
      posts: serverPosts.length ? serverPosts : postItems,
      topics: serverTopics.length ? serverTopics : topicItems,
      people: serverReady ? uniqueServerPeople : [],
    }
  }, [data?.posts, data?.topics, postsById, query, results, serverSearch, topicsById])

  const activeItems = searchModel[mode] || []
  const hasQuery = !!query

  const prepareNavigationClose = useCallback(() => {
    closeSearch(true)
    try { headAutoOpenRef.current = false } catch {}
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(true) } catch {}
    setTimeout(() => {
      try {
        const sc = getScrollEl?.()
        if (sc && sc.scrollHeight > sc.clientHeight + 1) sc.scrollTop = 0
        else window.scrollTo({ top: 0, behavior: 'auto' })
      } catch {}
    }, 0)
  }, [closeSearch, getScrollEl, headAutoOpenRef, setHeadHidden, setHeadPinned])

  const openTopic = useCallback((topic) => {
    if (!topic?.id) return
    prepareNavigationClose()
    pushNavState(`search_topic_${topic.id}`)
    setTopicFilterId(topic.id)
    setSel(topic)
    setThreadRoot(null)
  }, [prepareNavigationClose, pushNavState, setSel, setThreadRoot, setTopicFilterId])

  const openPost = useCallback(async (post) => {
    const postId = String(post?.id || post?.postId || '').trim()
    if (!postId) return
    prepareNavigationClose()

    let targetPost = { ...post, id: postId, postId }
    let topicId = String(post?.topicId || '').trim()
    let topic = topicId ? topicsById.get(topicId) : null

    try {
      const locate = await forumApi.threadLocate({ postId })
      if (locate?.ok) {
        topicId = String(locate.topicId || topicId || '').trim()
        const rootPostId = String(locate.rootPostId || postId).trim()
        const [byId, branch] = await Promise.all([
          forumApi.postById({ postId }),
          forumApi.threadPage({ mode: 'branch', topicId, rootPostId, pageSize: 80 }),
        ])
        const hydratedPost = byId?.post && typeof byId.post === 'object' ? byId.post : null
        if (hydratedPost?.id) targetPost = { ...hydratedPost, id: String(hydratedPost.id), topicId: String(hydratedPost.topicId || topicId) }
        const branchPosts = Array.isArray(branch?.items) ? branch.items : []
        topic = (topicId ? topicsById.get(topicId) : null) || (topicId ? { id: topicId, topicId, title: '', description: '', source: 'server_thread_locate' } : null)
        dispatchServerItemsMerge({
          topics: topic ? [topic] : [],
          posts: [...branchPosts, targetPost].filter((item) => item && item.id),
          reason: 'search_post_navigation',
        })
      }
    } catch {}

    if (!topic && topicId) topic = { id: topicId, topicId, title: '', description: '', source: 'server_search_navigation' }
    if (topic?.id) {
      try { setTopicFilterId(topic.id) } catch {}
      try { setSel(topic) } catch {}
    }

    const open = () => {
      try { openThreadForPost({ ...targetPost, topicId: topicId || targetPost.topicId }, { entryId: `search_post_${postId}` }) } catch {}
    }
    if (topic && !topicsById.has(String(topic.id))) window.setTimeout(open, 80)
    else open()
  }, [openThreadForPost, prepareNavigationClose, setSel, setTopicFilterId, topicsById])

  const openUserInfo = useCallback((user, anchor) => {
    const userId = String(user?.userId || user?.accountId || '').trim()
    if (!userId || !anchor || typeof window === 'undefined') return
    try {
      window.dispatchEvent(new CustomEvent('forum:user-info-open', {
        detail: {
          userId,
          anchor,
          userPreview: {
            userId,
            nickname: user?.nickname || '',
            icon: user?.icon || user?.avatar || '',
            avatar: user?.avatar || user?.icon || '',
            vipActive: !!user?.vipActive || !!user?.isVip || !!user?.vip,
            sourceKind: 'forum-search-user',
            sourceId: user?.sourceId || '',
          },
        },
      }))
    } catch {}
  }, [])

  const openSearch = useCallback(() => {
    openOnly('search')
  }, [openOnly])

  const portal = portalReady && drop ? createPortal(
    <div
      className="profileOverlay searchPortalOverlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeSearch(false)
      }}
    >
      <section
        className="profilePop searchPortalPop"
        aria-modal="true"
        role="dialog"
        aria-label={tText(t, 'forum_search_portal_title', 'Forum search')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="searchPortalHead">
          <span className="searchPortalBrandBlock">
            <span className="searchPortalQuantumLogo" aria-hidden="true" translate="no">
              <svg viewBox="0 0 168 52" role="img" focusable="false">
                <defs>
                  <linearGradient id="searchQuantumGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#f8fbff" />
                    <stop offset=".25" stopColor="#8be7ff" />
                    <stop offset=".55" stopColor="#ffd95c" />
                    <stop offset="1" stopColor="#fff3ba" />
                  </linearGradient>
                  <radialGradient id="searchQuantumCore" cx="50%" cy="45%" r="55%">
                    <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
                    <stop offset=".36" stopColor="#7be7ff" stopOpacity=".88" />
                    <stop offset="1" stopColor="#4a7cff" stopOpacity=".08" />
                  </radialGradient>
                  <filter id="searchQuantumGlow" x="-40%" y="-60%" width="180%" height="220%">
                    <feGaussianBlur stdDeviation="2.4" result="blur" />
                    <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.25 0 0 0 0 0.75 0 0 0 0 1 0 0 0 .75 0" />
                    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <g filter="url(#searchQuantumGlow)">
                  <circle cx="25" cy="25" r="10" fill="url(#searchQuantumCore)" />
                  <ellipse cx="25" cy="25" rx="21" ry="8.4" fill="none" stroke="url(#searchQuantumGold)" strokeWidth="1.5" transform="rotate(-18 25 25)" opacity=".9" />
                  <ellipse cx="25" cy="25" rx="21" ry="8.4" fill="none" stroke="#69dfff" strokeWidth="1.1" transform="rotate(35 25 25)" opacity=".55" />
                  <path d="M34 34l9 9" stroke="#fff0ad" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M39.5 41.5l5 5" stroke="#77e8ff" strokeWidth="1.4" strokeLinecap="round" opacity=".9" />
                  <circle cx="44" cy="10" r="2" fill="#ffe07a" />
                  <circle cx="9" cy="36" r="1.8" fill="#76eaff" />
                </g>
                <text x="56" y="23" fill="url(#searchQuantumGold)" fontSize="14" fontWeight="950" letterSpacing=".4">Quantum</text>
                <text x="56" y="39" fill="#dff7ff" fontSize="14" fontWeight="950" letterSpacing=".7">Search</text>
              </svg>
            </span>
            <span className="searchPortalTitleGroup">
              <span className="searchPortalTitle">{tText(t, 'forum_search_portal_title', 'Forum search')}</span>
              <span className="searchPortalSubtitle">{tText(t, 'forum_search_portal_subtitle', 'Search posts, topics, and people')}</span>
            </span>
          </span>
          <button
            type="button"
            className="searchPortalCloseBtn"
            onClick={() => closeSearch(false)}
            aria-label={tText(t, 'forum_search_close_aria', 'Close search')}
            title={tText(t, 'forum_search_close_aria', 'Close search')}
          >
            <MetaMarketCloseIcon />
          </button>
        </header>

        <div className="searchPortalInputShell">
          <span className="searchPortalInputIcon" aria-hidden="true">
            <ForumControlNavIcon kind="search" active size={18} />
          </span>
          <input
            ref={inputRef}
            className="searchPortalInput"
            value={rawQuery}
            onChange={(event) => setQ(event.target.value)}
            placeholder={tText(t, 'forum_search_portal_placeholder', 'Search inside forum...')}
            autoComplete="off"
            spellCheck="false"
          />
          {!!rawQuery && (
            <button
              type="button"
              className="searchPortalClearBtn"
              onClick={() => {
                setQ('')
                try { inputRef.current?.focus?.({ preventScroll: true }) } catch {}
              }}
              aria-label={tText(t, 'forum_search_clear_aria', 'Clear search')}
              title={tText(t, 'forum_search_clear_aria', 'Clear search')}
            >
              <span aria-hidden="true">{'\u00d7'}</span>
            </button>
          )}
        </div>

        <div className="searchPortalTabs" role="tablist" aria-label={tText(t, 'forum_search_portal_title', 'Forum search')}>
          {SEARCH_MODES.map((item) => {
            const active = mode === item
            const label = item === 'posts'
              ? tText(t, 'forum_search_tab_posts', 'Posts')
              : item === 'topics'
                ? tText(t, 'forum_search_tab_topics', 'Topics')
                : tText(t, 'forum_search_tab_people', 'People')
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={active}
                className={cls('searchPortalTab', active && 'isActive')}
                onClick={() => setMode(item)}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div ref={resultsRef} className="searchPortalResults">
          {!hasQuery && (
            <div className="searchPortalEmptyState">
              <div className="searchPortalEmptyOrb" aria-hidden="true" />
              <div className="searchPortalEmptyTitle">{tText(t, 'forum_search_idle_title', 'Start typing')}</div>
              <div className="searchPortalEmptyText">{tText(t, 'forum_search_idle_body', 'Choose a search mode and enter a query.')}</div>
            </div>
          )}

          {hasQuery && activeItems.length === 0 && (
            <div className="searchPortalEmptyState">
              <div className="searchPortalEmptyOrb" aria-hidden="true" />
              <div className="searchPortalEmptyTitle">
                {mode === 'posts'
                  ? tText(t, 'forum_search_empty_posts', 'No posts found')
                  : mode === 'topics'
                    ? tText(t, 'forum_search_empty_topics', 'No topics found')
                    : tText(t, 'forum_search_empty_people', 'No people found')}
              </div>
              <div className="searchPortalEmptyText">{tText(t, 'forum_search_empty', 'Nothing found')}</div>
            </div>
          )}

          {hasQuery && mode === 'posts' && activeItems.map((item) => (
            <PostResultCard
              key={`post:${item.id}`}
              item={item}
              topic={topicsById.get(String(item.post?.topicId || ''))}
              onOpen={openPost}
              t={t}
            />
          ))}

          {hasQuery && mode === 'topics' && activeItems.map((topic) => (
            <TopicResultCard
              key={`topic:${topic.id}`}
              topic={topic}
              count={postCountByTopic.get(String(topic.id || '')) || 0}
              onOpen={openTopic}
              t={t}
            />
          ))}

          {hasQuery && mode === 'people' && activeItems.map((user) => (
            <UserResultCard
              key={`user:${user.accountId || user.userId}`}
              user={user}
              onOpen={openUserInfo}
            />
          ))}
        </div>
      </section>
    </div>,
    document.body,
  ) : null

  // QL7_SORT_GLOBAL_PORTAL_V1
  const sortPortal = portalReady && sortOpen ? createPortal(
    <div
      className="profileOverlay sortPortalOverlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.stopPropagation()
      }}
    >
      <section
        className={cls('profilePop sortPortalPop', sortControlsInactive && 'sortPortalPop--disabled')}
        aria-modal="true"
        role="dialog"
        aria-label={tText(t, 'forum_sort', 'Sort')}
        data-disabled={sortControlsInactive ? '1' : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sortPortalHead sortPortalHead--floatingSort" data-ql7-sort-brand="quantum-geodetect-floating-sort">
          {/* QL7_SORT_BRAND_FLOATING_SORT_V3B */}
          <span className="sortPortalBladeBrand" aria-hidden="true" translate="no">
            <svg className="sortPortalBrandSvg" viewBox="0 0 392 78" aria-hidden="true" focusable="false">
              <g className="sortBrandGeoConstellation">
                <path d="M22 17 C54 9 78 15 106 27 S158 43 204 30" />
                <path d="M26 58 C58 50 91 51 123 61 S170 67 220 51" />
                <path d="M38 37 C80 30 119 35 151 42 S195 44 238 28" />
                <circle cx="22" cy="17" r="2" />
                <circle cx="106" cy="27" r="1.8" />
                <circle cx="204" cy="30" r="1.9" />
                <circle cx="26" cy="58" r="1.7" />
                <circle cx="123" cy="61" r="1.9" />
                <circle cx="220" cy="51" r="1.7" />
              </g>
              <g className="sortBrandTextStack">
                <text className="sortBrandText sortBrandText--quantum" x="26" y="31">Quantum</text>
                <text className="sortBrandText sortBrandText--geodetect" x="26" y="61">GeoDetect</text>
              </g>
              <g className="sortBrandSortFloat" aria-hidden="true">
                <text className="sortBrandSortWord sortBrandSortWord--aura" x="263" y="51">SORT</text>
                <text className="sortBrandSortWord" x="263" y="51">SORT</text>
                <circle className="sortBrandSortOrbit sortBrandSortOrbit--a" cx="258" cy="23" r="1.35" />
                <circle className="sortBrandSortOrbit sortBrandSortOrbit--b" cx="337" cy="22" r="1.15" />
                <circle className="sortBrandSortOrbit sortBrandSortOrbit--c" cx="350" cy="55" r="1.25" />
                <circle className="sortBrandSortOrbit sortBrandSortOrbit--d" cx="252" cy="58" r="1.05" />
              </g>
            </svg>
          </span>
          <button
            type="button"
            className="sortPortalClose sortPortalClose--visibleX"
            aria-label={tText(t, 'close', 'Close')}
            title={tText(t, 'close', 'Close')}
            onClick={closeSort}
          >
            <svg className="sortPortalCloseSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path className="sortPortalCloseSvgGlow" d="M6 6 L18 18 M18 6 L6 18" />
              <path className="sortPortalCloseSvgCore" d="M6.8 6.8 L17.2 17.2 M17.2 6.8 L6.8 17.2" />
            </svg>
          </button>
        </header>
        <div className={cls('sortDrop sortPortalBody', sortControlsInactive && 'sortPortalBody--disabled')}>
          <div className="sortGeoRail" data-ql7-geo-sort-rail="true">
            <div className="sortGeoRailHead">
              <span className="sortGeoRailOrb" aria-hidden="true" />
              <span className="sortGeoRailCopy">
                <span className="sortGeoRailTitle">{tText(t, 'forum_sort_geo_detect_title', 'GeoDetect')}</span>
                <span className="sortGeoRailSub">{geoModeIsWorld ? tText(t, 'forum_sort_geo_world_hint', 'Show posts from everywhere') : geoLabel}</span>
              </span>
              <span className={cls('sortGeoRailPulse', geoModeIsWorld ? 'sortGeoRailPulse--world' : 'sortGeoRailPulse--geo')} aria-hidden="true" />
            </div>
            <div className="sortGeoRailBtns" role="group" aria-label={tText(t, 'forum_sort_geo_detect_title', 'GeoDetect')}>
              <button type="button" className={cls('sortGeoRailBtn', !geoModeIsWorld && 'sortGeoRailBtn--active', !geoSortAllowed && 'sortGeoRailBtn--disabled')} aria-pressed={!geoModeIsWorld} disabled={sortControlsInactive || geoApplyActive || !geoSortAllowed} onClick={() => commitGeoFeedMode('geo')}>
                <span className="sortGeoRailBtnMain">{tText(t, 'forum_sort_geo_detect_on', 'Geo')}</span>
                <span className="sortGeoRailBtnMeta">{geoLabel}</span>
              </button>
              <button type="button" className={cls('sortGeoRailBtn', geoModeIsWorld && 'sortGeoRailBtn--active')} aria-pressed={geoModeIsWorld} disabled={sortControlsInactive || geoApplyActive} onClick={() => commitGeoFeedMode('world')}>
                <span className="sortGeoRailBtnMain">{tText(t, 'forum_sort_geo_world', 'World')}</span>
                <span className="sortGeoRailBtnMeta">{tText(t, 'forum_sort_geo_world_hint', 'Show posts from everywhere')}</span>
              </button>
            </div>
            {geoApplyActive && (
              <div className="sortGeoApplyOverlay" role="status" aria-live="polite">
                <span className="sortGeoApplySpinner" aria-hidden="true" />
                <svg className="sortGeoApplyBrand" viewBox="0 0 188 42" aria-hidden="true" focusable="false">
                  <text x="8" y="29">GeoDetect</text>
                </svg>
              </div>
            )}
          </div>
          <div className="sortGeoBladeDivider" aria-hidden="true"><span /><span /></div>
          {sortOptions.map(([k, txt]) => {
            const isActive = activeSortKey === k
            return (
              <button
                key={k}
                type="button"
                className={cls('sortDropItem', isActive && 'sortDropItem--active')}
                aria-pressed={isActive}
                disabled={sortControlsInactive || geoApplyActive}
                onClick={() => commitSelectedSort(k)}
              >
                <span className="sortDropItemRail" aria-hidden="true" />
                <span className="sortDropItemText">{txt}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>,
    document.body,
  ) : null

  return (
    <div className="search">
      <div className="searchInputWrap">
        <input
          className="searchInput"
          value={rawQuery}
          readOnly
          onFocus={openSearch}
          onClick={openSearch}
          placeholder={t('forum_search_ph')}
          aria-label={tText(t, 'forum_search', 'Search')}
        />
        <button
          type="button"
          className={cls('forumSearchInputAction', drop && 'forumSearchInputAction--active')}
          aria-label={tText(t, 'forum_search', 'Search')}
          title={tText(t, 'forum_search', 'Search')}
          aria-expanded={!!drop}
          aria-haspopup="dialog"
          onClick={() => (drop ? closeSearch(false) : openOnly('search'))}
        >
          <ForumControlNavIcon kind="search" active={!!drop} size={20} />
        </button>
      </div>
      <button
        type="button"
        className={cls('forumGeoDetectControlBtn', sortOpen && 'forumGeoDetectControlBtn--active')}
        aria-label={tText(t, 'forum_sort_geo_detect_title', 'GeoDetect')}
        title={tText(t, 'forum_sort_geo_detect_title', 'GeoDetect')}
        aria-expanded={!!sortOpen}
        aria-haspopup="dialog"
        onClick={() => { if (!sortOpen) openOnly('sort') }}
        data-ql7-geodetect-control="animated"
      >
        <span className="sr-only">{tText(t, 'forum_sort_geo_detect_title', 'GeoDetect')}</span>
        <GeoDetectControlMark />
      </button>
      <QuantumWalletLaunchIcon
        t={t}
        q={q}
        questEnabled={questEnabled}
        questBtnClass={questBtnClass}
        openQuests={openQuests}
      />
      {sortPortal}
      {portal}
    </div>
  )
}

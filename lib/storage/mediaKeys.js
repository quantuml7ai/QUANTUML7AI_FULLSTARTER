// lib/storage/mediaKeys.js

import crypto from 'node:crypto'

const EXT_BY_MIME = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
  ['video/mp4', 'mp4'],
  ['video/webm', 'webm'],
  ['video/quicktime', 'mov'],
  ['video/x-matroska', 'mkv'],
  ['audio/webm', 'webm'],
  ['audio/mpeg', 'mp3'],
  ['audio/mp3', 'mp3'],
  ['audio/mp4', 'm4a'],
  ['audio/m4a', 'm4a'],
  ['audio/wav', 'wav'],
  ['audio/x-wav', 'wav'],
  ['audio/ogg', 'ogg'],
  ['text/plain', 'txt'],
])

const EXT_NORMALIZE = new Map([
  ['jpeg', 'jpg'],
  ['jpe', 'jpg'],
  ['quicktime', 'mov'],
])

function cleanMime(contentType = '') {
  return String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase()
}

function cleanExtension(ext = '') {
  const value = String(ext || '')
    .trim()
    .toLowerCase()
    .replace(/^\.+/, '')
    .replace(/[^a-z0-9]+/g, '')

  return EXT_NORMALIZE.get(value) || value
}

function extensionFromFilename(filename = '') {
  const cleanName = String(filename || '')
    .split(/[?#]/)[0]
    .replace(/\\/g, '/')
    .split('/')
    .pop()

  const match = /\.([a-z0-9]{1,12})$/i.exec(cleanName || '')
  return cleanExtension(match?.[1] || '')
}

export function resolveMediaExtension({
  filename = '',
  contentType = '',
  fallback = '',
  fallbackExt = '',
} = {}) {
  const fromName = extensionFromFilename(filename)
  if (fromName) return fromName

  const fromMime = EXT_BY_MIME.get(cleanMime(contentType))
  if (fromMime) return fromMime

  return cleanExtension(fallbackExt || fallback || 'bin') || 'bin'
}

export function sanitizeFileBaseName(filename = '', fallback = 'media') {
  const rawName = String(filename || '')
    .split(/[?#]/)[0]
    .replace(/\\/g, '/')
    .split('/')
    .pop()

  const withoutExt = rawName
    ? rawName.replace(/\.[a-z0-9]{1,12}$/i, '')
    : ''

  const safe = String(withoutExt || fallback || 'media')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/[-_.]{2,}/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
    .slice(0, 80)

  return safe || String(fallback || 'media')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
    .slice(0, 80) || 'media'
}

export function getMediaPrefixByKind(kind = '', contentType = '') {
  const normalizedKind = String(kind || '').trim().toLowerCase()

  if (normalizedKind === 'forum_image' || normalizedKind === 'image') return 'forum/images'
  if (normalizedKind === 'forum_audio' || normalizedKind === 'audio' || normalizedKind === 'voice') return 'forum/audio'
  if (normalizedKind === 'forum_video' || normalizedKind === 'video') return 'forum/videos'
  if (normalizedKind === 'forum_avatar' || normalizedKind === 'avatar') return 'forum/avatars'
  if (normalizedKind === 'ads_video' || normalizedKind === 'ad_video') return 'ads/videos'
  if (normalizedKind === 'ads_image' || normalizedKind === 'ad_image') return 'ads/images'
  if (normalizedKind === 'ads_media' || normalizedKind === 'ad_media') {
    const mime = cleanMime(contentType)
    if (mime.startsWith('video/')) return 'ads/videos'
    if (mime.startsWith('image/')) return 'ads/images'
    return 'ads/images'
  }

  const mime = cleanMime(contentType)
  if (mime.startsWith('image/')) return 'forum/images'
  if (mime.startsWith('video/')) return 'forum/videos'
  if (mime.startsWith('audio/')) return 'forum/audio'

  return 'misc'
}

export function createUniqueMediaSuffix() {
  let random = ''
  try {
    random = crypto.randomBytes(6).toString('hex')
  } catch {
    random = Math.random().toString(36).slice(2, 14)
  }

  return `${Date.now()}-${random}`
}

export function createMediaObjectKey({
  kind = '',
  filename = '',
  contentType = '',
  prefix = '',
  fallbackBase = '',
  fallbackName = '',
  fallbackExt = 'bin',
} = {}) {
  const cleanPrefix = String(prefix || getMediaPrefixByKind(kind, contentType) || 'misc')
    .replace(/^\/+|\/+$/g, '')
    .trim() || 'misc'

  const base = sanitizeFileBaseName(filename, fallbackBase || fallbackName || 'media')
  const ext = resolveMediaExtension({ filename, contentType, fallbackExt })
  const suffix = createUniqueMediaSuffix()

  return `${cleanPrefix}/${base}-${suffix}.${ext}`
}

export function createForumImageKey(filename = 'image.webp', contentType = 'image/webp') {
  return createMediaObjectKey({
    kind: 'forum_image',
    filename,
    contentType,
    fallbackBase: 'image',
    fallbackExt: 'webp',
  })
}

export function createForumAudioKey(filename = 'voice.webm', contentType = 'audio/webm') {
  return createMediaObjectKey({
    kind: 'forum_audio',
    filename,
    contentType,
    fallbackBase: 'voice',
    fallbackExt: 'webm',
  })
}

export function createForumVideoKey(filename = 'video.mp4', contentType = 'video/mp4') {
  return createMediaObjectKey({
    kind: 'forum_video',
    filename,
    contentType,
    fallbackBase: 'video',
    fallbackExt: 'mp4',
  })
}

export function createAdsImageKey(filename = 'ad-image.webp', contentType = 'image/webp') {
  return createMediaObjectKey({
    kind: 'ads_image',
    filename,
    contentType,
    fallbackBase: 'ad-image',
    fallbackExt: 'webp',
  })
}

export function createAdsVideoKey(filename = 'ad-video.mp4', contentType = 'video/mp4') {
  return createMediaObjectKey({
    kind: 'ads_video',
    filename,
    contentType,
    fallbackBase: 'ad-video',
    fallbackExt: 'mp4',
  })
}

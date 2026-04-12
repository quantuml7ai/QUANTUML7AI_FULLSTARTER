'use client'

import React from 'react'
import { extractDmStickersFromText } from '../../dm/utils/mediaParsing'

const IMG_RE = /^(?:\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)|https?:\/\/[^\s]+?\.(?:webp|png|jpe?g|gif))(?:[?#].*)?$/i
const VIDEO_RE = /^(?:blob:[^\s]+|https?:\/\/[^\s]+(?:\/video-\d+\.(?:webm|mp4)|\.mp4)(?:[?#].*)?)$/i
const YT_RE = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
const TIKTOK_RE = /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/(@[\w.\-]+\/video\/(\d+)|t\/[A-Za-z0-9]+)(?:[?#].*)?$/i
const AUDIO_EXT = /\.(?:webm|ogg|mp3|m4a|wav)(?:$|[?#])/i
const URL_RE = /(https?:\/\/[^\s<>'")]+)/gi
const TIKTOK_PLAYABLE_RE = /^(?:https?:\/\/)?(?:(?:www|m)\.)?tiktok\.com\/@[\w.\-]+\/video\/\d+(?:[?#].*)?$/i
const POST_MEDIA_URL_CACHE = new Map()

function isAudioLine(s) {
  const t = String(s).trim()
  if (!t) return false
  if (!/^\S+$/.test(t)) return false
  if (/^blob:/.test(t)) return false
  if (VIDEO_RE.test(t)) return false
  if (/^https?:\/\//i.test(t) || /^\/uploads\/audio\//i.test(t) || /\/forum\/voice/i.test(t)) {
    if (AUDIO_EXT.test(t) && !VIDEO_RE.test(t)) return true
    if (/[?&]filename=.*\.(webm|ogg|mp3|m4a|wav)(?:$|[&#])/i.test(t)) return true
  }
  return false
}

function collectMatches(lines, testRe) {
  const out = []
  const normalizeUrl = (raw) => String(raw || '').replace(/[)\].,!?;:]+$/g, '')
  for (const s of lines) {
    const str = String(s || '')
    if (!str) continue
    const it = str.matchAll(URL_RE)
    for (const m of it) {
      const u = normalizeUrl(m[0])
      if (testRe.test(u)) out.push(u)
    }
  }
  return Array.from(new Set(out))
}

function buildMediaTextCacheKey(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const short = raw.slice(0, 4096)
  let h = 2166136261
  for (let i = 0; i < short.length; i += 1) {
    h ^= short.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `txt:${short.length}:${(h >>> 0).toString(36)}`
}

export default function usePostMediaTextModel({ text, postId = null, isVideoFeed = false }) {
  const { textWithoutStickerTags, stickerEntries } = React.useMemo(() => {
    const parsed = extractDmStickersFromText(text)
    return {
      textWithoutStickerTags: String(parsed?.text || ''),
      stickerEntries: Array.isArray(parsed?.stickers) ? parsed.stickers : [],
    }
  }, [text])

  const allLines = React.useMemo(() => String(textWithoutStickerTags || '').split(/\r?\n/), [textWithoutStickerTags])
  const trimmed = React.useMemo(() => allLines.map((s) => s.trim()), [allLines])

  const imgInline = React.useMemo(() => collectMatches(allLines, IMG_RE), [allLines])
  const videoInline = React.useMemo(() => collectMatches(allLines, VIDEO_RE), [allLines])
  const audioInline = React.useMemo(
    () => collectMatches(allLines, AUDIO_EXT).filter((u) => !VIDEO_RE.test(u)),
    [allLines],
  )
  const ytInline = React.useMemo(() => collectMatches(allLines, YT_RE), [allLines])
  const tiktokInline = React.useMemo(() => collectMatches(allLines, TIKTOK_RE), [allLines])

  const ytLines = React.useMemo(() => Array.from(new Set(ytInline)), [ytInline])
  const tiktokLines = React.useMemo(() => Array.from(new Set(tiktokInline)), [tiktokInline])
  const mediaCacheKey = React.useMemo(() => {
    const id = String(postId || '').trim()
    return id ? `id:${id}` : ''
  }, [postId])
  const mediaTextKey = React.useMemo(() => buildMediaTextCacheKey(text), [text])
  const cacheKeys = React.useMemo(() => {
    const keys = []
    if (mediaCacheKey) keys.push(mediaCacheKey)
    if (mediaTextKey) keys.push(mediaTextKey)
    return Array.from(new Set(keys))
  }, [mediaCacheKey, mediaTextKey])

  const ytLinesStable = React.useMemo(() => {
    if (ytLines.length > 0) return ytLines
    for (const key of cacheKeys) {
      const cached = POST_MEDIA_URL_CACHE.get(key)
      if (cached?.yt?.length) return cached.yt
    }
    return ytLines
  }, [ytLines, cacheKeys])

  const tiktokLinesStable = React.useMemo(() => {
    if (tiktokLines.length > 0) return tiktokLines
    for (const key of cacheKeys) {
      const cached = POST_MEDIA_URL_CACHE.get(key)
      if (cached?.tiktok?.length) return cached.tiktok
    }
    return tiktokLines
  }, [tiktokLines, cacheKeys])

  React.useEffect(() => {
    if (!cacheKeys.length) return
    const hasYt = ytLines.length > 0
    const hasTiktok = tiktokLines.length > 0
    if (!hasYt && !hasTiktok) return
    const nowTs = Date.now()
    cacheKeys.forEach((key) => {
      const prev = POST_MEDIA_URL_CACHE.get(key) || {}
      const next = {
        yt: hasYt ? ytLines : (prev.yt || []),
        tiktok: hasTiktok ? tiktokLines : (prev.tiktok || []),
        ts: nowTs,
      }
      POST_MEDIA_URL_CACHE.set(key, next)
    })
    if (POST_MEDIA_URL_CACHE.size > 2400) {
      const keys = Array.from(POST_MEDIA_URL_CACHE.keys())
      for (let i = 0; i < keys.length - 1800; i += 1) {
        POST_MEDIA_URL_CACHE.delete(keys[i])
      }
    }
  }, [cacheKeys, ytLines, tiktokLines])

  const imgLines = React.useMemo(
    () =>
      Array.from(
        new Set([
          ...trimmed.filter((s) => IMG_RE.test(s)),
          ...imgInline,
        ]),
      ),
    [trimmed, imgInline],
  )

  const imgSet = React.useMemo(() => new Set(imgLines), [imgLines])

  const videoLines = React.useMemo(
    () =>
      Array.from(
        new Set([
          ...trimmed.filter((s) => VIDEO_RE.test(s)),
          ...videoInline,
        ]),
      ).filter((u) => !imgSet.has(u)),
    [trimmed, videoInline, imgSet],
  )

  const videoSet = React.useMemo(() => new Set(videoLines), [videoLines])

  const audioLines = React.useMemo(
    () =>
      Array.from(
        new Set([
          ...trimmed.filter(isAudioLine).filter((s) => !VIDEO_RE.test(s)),
          ...audioInline.filter((u) => !VIDEO_RE.test(u)),
        ]),
      ).filter((u) => !imgSet.has(u) && !videoSet.has(u)),
    [trimmed, audioInline, imgSet, videoSet],
  )

  const cleanedText = React.useMemo(
    () =>
      allLines
        .map((s) => {
          let line = String(s ?? '')
          const raw = line.trim()
          if (!raw) return ''

          if (isVideoFeed) {
            const mOnlyUrl = raw.match(/^(https?:\/\/\S+)$/i)
            if (mOnlyUrl) {
              const u = mOnlyUrl[1]
              const playable =
                IMG_RE.test(u) ||
                VIDEO_RE.test(u) ||
                isAudioLine(u) ||
                YT_RE.test(u) ||
                TIKTOK_PLAYABLE_RE.test(u)

              if (!playable) return ''
            }
          }

          line = line.replace(URL_RE, (u) => {
            const uTrim = u.trim()
            if (
              IMG_RE.test(uTrim) ||
              VIDEO_RE.test(uTrim) ||
              isAudioLine(uTrim) ||
              YT_RE.test(uTrim) ||
              TIKTOK_RE.test(uTrim) ||
              ytLinesStable.some((x) => x === uTrim) ||
              tiktokLinesStable.some((x) => x === uTrim)
            ) {
              return ''
            }
            return u
          })

          line = line.replace(/\s{2,}/g, ' ').trim()
          return line
        })
        .filter((line) => {
          if (!line) return false
          const t = line.trim()
          return (
            t &&
            !IMG_RE.test(t) &&
            !VIDEO_RE.test(t) &&
            !isAudioLine(t) &&
            !YT_RE.test(t) &&
            !TIKTOK_RE.test(t)
          )
        })
        .join('\n'),
    [allLines, isVideoFeed, ytLinesStable, tiktokLinesStable],
  )

  const ytOrigin = React.useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    [],
  )

  const ytEmbedParams = React.useMemo(() => {
    const params = new URLSearchParams({
      enablejsapi: '1',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
    })
    if (ytOrigin) params.set('origin', ytOrigin)
    return params.toString()
  }, [ytOrigin])

  return {
    cleanedText,
    stickerEntries,
    imgLines,
    videoLines,
    ytLines: ytLinesStable,
    tiktokLines: tiktokLinesStable,
    audioLines,
    ytEmbedParams,
    YT_RE,
  }
}

'use client'

import React from 'react'

const IMG_RE = /^(?:\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)|https?:\/\/[^\s]+?\.(?:webp|png|jpe?g|gif))(?:[?#].*)?$/i
const VIDEO_RE = /^(?:blob:[^\s]+|https?:\/\/[^\s]+(?:\/video-\d+\.(?:webm|mp4)|\.mp4)(?:[?#].*)?)$/i
const YT_RE = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
const TIKTOK_RE = /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/(@[\w.\-]+\/video\/(\d+)|t\/[A-Za-z0-9]+)(?:[?#].*)?$/i
const AUDIO_EXT = /\.(?:webm|ogg|mp3|m4a|wav)(?:$|[?#])/i
const URL_RE = /(https?:\/\/[^\s<>'")]+)/gi
const TIKTOK_PLAYABLE_RE = /^(?:https?:\/\/)?(?:(?:www|m)\.)?tiktok\.com\/@[\w.\-]+\/video\/\d+(?:[?#].*)?$/i

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
  for (const s of lines) {
    const str = String(s || '')
    if (!str) continue
    const it = str.matchAll(URL_RE)
    for (const m of it) {
      const u = m[0]
      if (testRe.test(u)) out.push(u)
    }
  }
  return Array.from(new Set(out))
}

export default function usePostMediaTextModel({ text, isVideoFeed = false }) {
  const allLines = React.useMemo(() => String(text || '').split(/\r?\n/), [text])
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
              TIKTOK_RE.test(uTrim)
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
    [allLines, isVideoFeed],
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
    imgLines,
    videoLines,
    ytLines,
    tiktokLines,
    audioLines,
    ytEmbedParams,
    YT_RE,
  }
}

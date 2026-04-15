'use client'

import { __appendForumMediaTrace } from './mediaDebugRuntime'

export const MEDIA_MUTED_KEY = 'forum:mediaMuted'
export const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'
export const MEDIA_MUTED_EVENT = 'forum:media-mute'

export function readMutedPrefFromStorage() {
  try {
    let v = localStorage.getItem(MEDIA_MUTED_KEY)
    if (v == null) v = localStorage.getItem(MEDIA_VIDEO_MUTED_KEY)
    if (v == null) return null
    return v === '1' || v === 'true'
  } catch {
    return null
  }
}

export function __writeMediaMutedPref(nextMuted, meta = {}) {
  try {
    const v = nextMuted ? '1' : '0'
    localStorage.setItem(MEDIA_MUTED_KEY, v)
    localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, v)
  } catch {}
  __appendForumMediaTrace('mute_persist_write', {
    muted: !!nextMuted,
    source: String(meta?.source || 'unknown'),
    userAction: !!meta?.userAction,
  })
}

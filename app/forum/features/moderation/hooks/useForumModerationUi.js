import { useCallback } from 'react'

const FORUM_MODERATION_MODE =
  (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_FORUM_MODERATION_MODE) ||
  'BALANCED'

const isStrictModeration = String(FORUM_MODERATION_MODE || '').toUpperCase() === 'STRICT'

export default function useForumModerationUi({ t, toast }) {
  const toastI18n = useCallback((kind, key, enFallback) => {
    const msg = (t?.(key) || enFallback || '').toString()
    try {
      if (kind === 'ok') return toast?.ok?.(msg)
      if (kind === 'warn') return toast?.warn?.(msg)
      if (kind === 'err') return toast?.err?.(msg)
      if (kind === 'info') return toast?.info?.(msg)
      return toast?.info?.(msg)
    } catch {}
    return undefined
  }, [t, toast])

  const reasonKey = useCallback((reason) => {
    const r = String(reason || 'unknown').toLowerCase()
    if (r === 'porn') return 'forum_moderation_reason_porn'
    if (r === 'explicit_nudity') return 'forum_moderation_reason_explicit_nudity'
    if (r === 'sexual') return 'forum_moderation_reason_sexual'
    if (r === 'hentai') return 'forum_moderation_reason_hentai'
    if (r === 'violence') return 'forum_moderation_reason_violence'
    if (r === 'gore') return 'forum_moderation_reason_gore'
    return 'forum_moderation_reason_unknown'
  }, [])

  const reasonFallbackEN = useCallback((reason) => reasonKey(reason), [reasonKey])

  return {
    isStrictModeration,
    toastI18n,
    reasonKey,
    reasonFallbackEN,
  }
}

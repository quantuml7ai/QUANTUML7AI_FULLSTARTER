'use client'

const MEDIA_TRACE_LIMIT = 420

function isMediaDebugEnabled(raw) {
  const value = String(raw || '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'on'
}

function readMediaDebugFlags() {
  let traceEnabled = false
  let auditEnabled = false
  let overlayEnabled = false
  try {
    const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const devLike = nodeEnv !== 'production'
    traceEnabled = devLike && isMediaDebugEnabled(process.env.NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED)
    auditEnabled = devLike && isMediaDebugEnabled(process.env.NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED)
    overlayEnabled = devLike && isMediaDebugEnabled(process.env.NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY)
  } catch {}
  return {
    traceEnabled,
    auditEnabled,
    overlayEnabled,
  }
}

export function __getForumMediaDebugFlags() {
  return readMediaDebugFlags()
}

export function __appendForumMediaTrace(event, extra = {}) {
  try {
    if (typeof window === 'undefined') return
    const flags = readMediaDebugFlags()
    if (!flags.traceEnabled) return
    const bucket = Array.isArray(window.__forumMediaTrace) ? window.__forumMediaTrace : []
    bucket.push({
      ts: Date.now(),
      event: String(event || ''),
      ...((extra && typeof extra === 'object') ? extra : {}),
    })
    while (bucket.length > MEDIA_TRACE_LIMIT) bucket.shift()
    window.__forumMediaTrace = bucket
    window.__forumMediaDebugFlags = flags
    if (typeof window.dumpForumMediaTrace !== 'function') {
      window.dumpForumMediaTrace = () => {
        try {
          return Array.isArray(window.__forumMediaTrace) ? [...window.__forumMediaTrace] : []
        } catch {
          return []
        }
      }
    }
  } catch {}
}

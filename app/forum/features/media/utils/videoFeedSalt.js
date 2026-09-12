'use client'

export function createVideoFeedPageSalt() {
  let nextSalt = ''
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const a = new Uint32Array(4)
      crypto.getRandomValues(a)
      nextSalt = Array.from(a)
        .map((n) => n.toString(16).padStart(8, '0'))
        .join('')
    }
  } catch {}
  if (!nextSalt) {
    const ts = Date.now().toString(36)
    const perfTs = (() => {
      try {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
          return Math.floor(performance.now() * 1000).toString(36)
        }
      } catch {}
      return ''
    })()
    nextSalt = `${ts}-${perfTs}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  }
  return nextSalt
}

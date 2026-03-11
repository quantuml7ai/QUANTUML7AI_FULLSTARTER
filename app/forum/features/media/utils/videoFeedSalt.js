'use client'

export function createVideoFeedPageSalt() {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const a = new Uint32Array(4)
      crypto.getRandomValues(a)
      return Array.from(a)
        .map((n) => n.toString(16).padStart(8, '0'))
        .join('')
    }
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

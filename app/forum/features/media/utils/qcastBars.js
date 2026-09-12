'use client'

export function buildQCastControlBars(src) {
  const s = String(src || '')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let x = h >>> 0
  const rnd = () => {
    x ^= x << 13
    x >>>= 0
    x ^= x >> 17
    x >>>= 0
    x ^= x << 5
    x >>>= 0
    return (x >>> 0) / 4294967295
  }
  const n = 38
  const out = []
  for (let i = 0; i < n; i++) out.push(0.22 + rnd() * 0.78)
  return out
}

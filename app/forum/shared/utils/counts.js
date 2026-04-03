'use client'

export function formatCount(input) {
  const x = Number(input || 0)
  if (!Number.isFinite(x)) return '0'
  const abs = Math.abs(x)
  if (abs < 1000) return String(Math.trunc(x))
  const units = [
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' },
  ]
  for (const { v, s } of units) {
    if (abs >= v) {
      const num = x / v
      const out = num >= 10 ? Math.round(num) : Math.round(num * 10) / 10
      return `${out}${s}`
    }
  }
  return String(Math.trunc(x))
}

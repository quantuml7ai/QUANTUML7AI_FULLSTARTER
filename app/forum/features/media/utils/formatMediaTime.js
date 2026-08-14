'use client'

export function formatMediaTime(value) {
  const total = Math.max(0, Math.floor(value || 0))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

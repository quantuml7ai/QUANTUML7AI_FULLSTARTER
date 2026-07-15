'use client'

export function formatBattleChatTime(ms) {
  const value = Number(ms || 0)
  if (!Number.isFinite(value) || value <= 0) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

export function compactBattleChatCount(value) {
  const n = Math.max(0, Math.floor(Number(value) || 0))
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  return String(n)
}

export function battleChatErrorKey(error) {
  const key = String(error?.message || error?.data?.error || error || '').trim()
  if (!key) return 'battlecoin_chat_error'
  return key
}

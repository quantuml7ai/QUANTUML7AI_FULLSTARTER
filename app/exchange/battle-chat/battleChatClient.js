'use client'

import { getStoredWalletSession } from '../../../lib/walletSessionClient'

export const BATTLE_CHAT_INITIAL_LIMIT = 100
export const BATTLE_CHAT_FALLBACK_FOREGROUND_MS = 9000
export const BATTLE_CHAT_FALLBACK_HIDDEN_MS = 45000
export const BATTLE_CHAT_FOLLOW_TAIL_THRESHOLD_PX = 56
export const BATTLE_CHAT_SESSION_HARD_LIMIT = 1000
export const BATTLE_CHAT_QUICK_EMOJIS = [
  '\u2764\uFE0F',
  '\u{1F604}',
  '\u{1F621}',
  '\u{1F525}',
  '\u{1F680}',
  '\u{1F911}',
  '\u{1F4B0}',
  '\u{1F48E}',
  '\u{1F4C8}',
  '\u26A1\uFE0F',
]

function str(value) {
  return String(value ?? '').trim()
}

function tmaInitData() {
  try {
    return str(window?.Telegram?.WebApp?.initData)
  } catch {
    return ''
  }
}

export function battleChatAuthHeaders() {
  const session = getStoredWalletSession()
  const headers = {}
  if (session?.token) headers['x-battlecoin-chat-session-token'] = session.token
  if (session?.walletAddress) headers['x-wallet-address'] = session.walletAddress
  if (session?.accountId) headers['x-wallet-account-id'] = session.accountId
  const initData = tmaInitData()
  if (initData) headers['x-telegram-init-data'] = initData
  return headers
}

async function readJson(res) {
  const data = await res.json().catch(() => null)
  if (!res.ok || data?.ok === false) {
    const error = new Error(data?.error || `battlecoin_chat_http_${res.status}`)
    error.status = res.status
    error.data = data
    throw error
  }
  return data || {}
}

export async function fetchBattleChatSnapshot({ limit = BATTLE_CHAT_INITIAL_LIMIT } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  const res = await fetch(`/api/battlecoin/chat/messages?${params}`, {
    method: 'GET',
    cache: 'no-store',
    headers: battleChatAuthHeaders(),
  })
  return readJson(res)
}

export async function fetchBattleChatDelta({ syncToken = '', limit = BATTLE_CHAT_INITIAL_LIMIT } = {}) {
  if (!syncToken) return fetchBattleChatSnapshot({ limit })
  const params = new URLSearchParams({ after: syncToken, limit: String(limit) })
  const res = await fetch(`/api/battlecoin/chat/messages?${params}`, {
    method: 'GET',
    cache: 'no-store',
    headers: battleChatAuthHeaders(),
  })
  return readJson(res)
}

export async function postBattleChatMessage({ text, clientMutationId }) {
  const res = await fetch('/api/battlecoin/chat/messages', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      ...battleChatAuthHeaders(),
    },
    body: JSON.stringify({ text, clientMutationId }),
  })
  return readJson(res)
}

export async function postBattleChatReaction({ messageId, like }) {
  const res = await fetch('/api/battlecoin/chat/reaction', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      ...battleChatAuthHeaders(),
    },
    body: JSON.stringify({ messageId, like }),
  })
  return readJson(res)
}

export function makeBattleChatMutationId() {
  const random = (() => {
    try {
      const arr = new Uint32Array(3)
      window.crypto?.getRandomValues?.(arr)
      return Array.from(arr).map((n) => n.toString(36)).join('')
    } catch {
      return Math.random().toString(36).slice(2)
    }
  })()
  return `bc:${Date.now().toString(36)}:${random}`.slice(0, 96)
}

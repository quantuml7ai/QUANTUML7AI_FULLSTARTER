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

function readCookie(name) {
  try {
    const escaped = String(name || '').replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')
    const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  } catch {
    return ''
  }
}

function readBattleChatAccountId() {
  try {
    if (typeof window === 'undefined') return ''
    const globalAccount = str(
      window.__AUTH_ACCOUNT__ ||
      window.__ASHER_ID__ ||
      window.__QL7_UID__ ||
      window.__FORUM_USER__ ||
      window.account ||
      window.wallet ||
      ''
    )
    if (globalAccount) return globalAccount

    const local = window.localStorage
    for (const key of [
      'asherId',
      'ql7_uid',
      'ql7_account',
      'account',
      'wallet',
      'ql7_wallet_account_id',
      'forum_user_id',
    ]) {
      const value = str(local?.getItem(key))
      if (value) return value
    }

    return str(readCookie('asherId'))
  } catch {
    return ''
  }
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
  const accountId = readBattleChatAccountId()
  if (accountId) {
    headers['x-auth-account-id'] = accountId
    headers['x-forum-user-id'] = accountId
  }
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

const BATTLE_CHAT_CHANNEL = 'global'
const BATTLE_CHAT_INITIAL_LIMIT = 100
const BATTLE_CHAT_SERVER_MAX_LIMIT = 100
const BATTLE_CHAT_MESSAGE_MAX_GRAPHEMES = 190
const BATTLE_CHAT_SEND_COOLDOWN_MS = 10_000
const BATTLE_CHAT_FOLLOW_TAIL_THRESHOLD_PX = 56
const BATTLE_CHAT_RETENTION_DAYS = 7
const BATTLE_CHAT_SESSION_HARD_LIMIT = 1000
const BATTLE_CHAT_HEART_RATE_LIMIT_PER_MINUTE = 60
const BATTLE_CHAT_MESSAGE_RATE_LIMIT_PER_MINUTE = 6
const BATTLE_CHAT_SSE_LIFETIME_MS = 52_000
const BATTLE_CHAT_SSE_HEARTBEAT_MS = 15_000
const BATTLE_CHAT_FALLBACK_FOREGROUND_MS = 9_000
const BATTLE_CHAT_FALLBACK_HIDDEN_MS = 45_000
const BATTLE_CHAT_QUICK_EMOJIS = ['\u2764\uFE0F', '\u{1F604}', '\u{1F621}']

const ZERO_WIDTH_RE = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/gu
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu
const FULLWIDTH_DOTS_RE = /[\uFF0E\uFF61\u3002]/gu

function collapseBlankLines(value) {
  return String(value || '').replace(/\n{4,}/gu, '\n\n\n')
}

function normalizeBattleChatText(input) {
  const value = String(input ?? '')
    .replace(/\r\n?/gu, '\n')
    .replace(CONTROL_RE, '')
    .replace(ZERO_WIDTH_RE, '')
    .normalize('NFC')
  return collapseBlankLines(value).trim()
}

function countGraphemes(input) {
  const value = String(input || '')
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length
    }
  } catch {}
  return Array.from(value).length
}

function normalizeForLinkDetection(input) {
  return String(input || '')
    .normalize('NFKC')
    .replace(ZERO_WIDTH_RE, '')
    .replace(FULLWIDTH_DOTS_RE, '.')
    .replace(/\[\s*\.\s*\]|\(\s*\.\s*\)/gu, '.')
    .replace(/\s+dot\s+/giu, '.')
    .replace(/hxxps?:\/\//giu, 'http://')
    .toLowerCase()
}

function hasForbiddenBattleChatLink(input) {
  const s = normalizeForLinkDetection(input)
  if (!s) return false

  const patterns = [
    /\b(?:https?|ftp):\/\//iu,
    /\bmailto:/iu,
    /\bwww\./iu,
    /\b(?:t\.me|telegram\.me|discord\.gg|x\.com|youtube\.com|youtu\.be)\//iu,
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/iu,
    /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?(?:\/|$)/iu,
    /\[[^\]]+\]\(\s*(?:https?|ftp|mailto):/iu,
    /<a\s+[^>]*href\s*=/iu,
    /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:[/?#:]|$)/iu,
  ]

  return patterns.some((pattern) => pattern.test(s))
}

function validateBattleChatText(input) {
  const text = normalizeBattleChatText(input)
  if (!text) return { ok: false, error: 'battlecoin_chat_empty', text: '' }
  const graphemes = countGraphemes(text)
  if (graphemes > BATTLE_CHAT_MESSAGE_MAX_GRAPHEMES) {
    return { ok: false, error: 'battlecoin_chat_too_long', text, graphemes }
  }
  if (hasForbiddenBattleChatLink(text)) {
    return { ok: false, error: 'battlecoin_chat_links_forbidden', text, graphemes }
  }
  if (text.includes('\uFFFD')) {
    return { ok: false, error: 'battlecoin_chat_invalid_text', text, graphemes }
  }
  return { ok: true, text, graphemes }
}

function normalizeBattleChatLimit(value) {
  const n = Math.floor(Number(value || BATTLE_CHAT_INITIAL_LIMIT))
  if (!Number.isFinite(n) || n <= 0) return BATTLE_CHAT_INITIAL_LIMIT
  return Math.min(BATTLE_CHAT_SERVER_MAX_LIMIT, n)
}

function normalizeClientMutationId(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 96)
}

module.exports = {
  BATTLE_CHAT_CHANNEL,
  BATTLE_CHAT_INITIAL_LIMIT,
  BATTLE_CHAT_SERVER_MAX_LIMIT,
  BATTLE_CHAT_MESSAGE_MAX_GRAPHEMES,
  BATTLE_CHAT_SEND_COOLDOWN_MS,
  BATTLE_CHAT_FOLLOW_TAIL_THRESHOLD_PX,
  BATTLE_CHAT_RETENTION_DAYS,
  BATTLE_CHAT_SESSION_HARD_LIMIT,
  BATTLE_CHAT_HEART_RATE_LIMIT_PER_MINUTE,
  BATTLE_CHAT_MESSAGE_RATE_LIMIT_PER_MINUTE,
  BATTLE_CHAT_SSE_LIFETIME_MS,
  BATTLE_CHAT_SSE_HEARTBEAT_MS,
  BATTLE_CHAT_FALLBACK_FOREGROUND_MS,
  BATTLE_CHAT_FALLBACK_HIDDEN_MS,
  BATTLE_CHAT_QUICK_EMOJIS,
  countGraphemes,
  hasForbiddenBattleChatLink,
  normalizeBattleChatLimit,
  normalizeBattleChatText,
  normalizeClientMutationId,
  validateBattleChatText,
}

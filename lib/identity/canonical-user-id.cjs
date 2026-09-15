// QL7 canonical human-identity syntax adapter.
//
// Permanent human identity forms:
//   wallet   -> bare EIP-55 address
//   Telegram -> bare decimal string
//
// Legacy prefixes are accepted only as compatibility input. This module is
// pure: it has no Mongo/Redis/domain access and never creates alias arrays.

const { getAddress } = require('viem')

const TELEGRAM_PREFIXES = Object.freeze([
  'telegram:id:',
  'telegramid:',
  'telegram:',
  'tg:uid:',
  'tguid:',
  'tg:',
  'tma:',
])

function str(value) {
  return String(value ?? '').trim()
}

function stripWalletPrefix(raw) {
  const value = str(raw)
  if (!value) return ''
  return /^wallet:/i.test(value)
    ? value.slice('wallet:'.length).trim()
    : value
}

function stripTelegramPrefix(raw) {
  const value = str(raw)
  if (!value) return ''
  const lower = value.toLowerCase()
  for (const prefix of TELEGRAM_PREFIXES) {
    if (lower.startsWith(prefix)) return value.slice(prefix.length).trim()
  }
  return value
}

function normalizeWalletId(raw) {
  const value = stripWalletPrefix(raw)
  if (!/^0x[a-f0-9]{40}$/i.test(value)) return ''
  try {
    // Lower first so historical mixed-case strings are normalized instead of
    // being trusted as already-valid EIP-55 input.
    return getAddress(value.toLowerCase())
  } catch {
    return ''
  }
}

function normalizeTelegramId(raw) {
  const value = stripTelegramPrefix(raw)
  if (!/^\d+$/.test(value)) return ''
  try {
    return BigInt(value).toString()
  } catch {
    return ''
  }
}

function classifyHumanId(raw) {
  if (normalizeWalletId(raw)) return 'wallet'
  if (normalizeTelegramId(raw)) return 'telegram'
  return ''
}

function normalizeHumanId(raw) {
  return normalizeWalletId(raw) || normalizeTelegramId(raw) || ''
}

function normalizePrincipalSyntax(raw) {
  return normalizeHumanId(raw) || str(raw)
}

function isCanonicalWalletId(raw) {
  const value = str(raw)
  return !!value && normalizeWalletId(value) === value
}

function isCanonicalTelegramId(raw) {
  const value = str(raw)
  return !!value && normalizeTelegramId(value) === value
}

module.exports = {
  TELEGRAM_PREFIXES,
  classifyHumanId,
  isCanonicalTelegramId,
  isCanonicalWalletId,
  normalizeHumanId,
  normalizePrincipalSyntax,
  normalizeTelegramId,
  normalizeWalletId,
  stripTelegramPrefix,
  stripWalletPrefix,
}

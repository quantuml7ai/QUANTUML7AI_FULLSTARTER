import {redactQl7SupportSecrets} from '../runtime/caseStoreContract.js'

export const QL7_SUPPORT_ENTITY_EXTRACTOR_VERSION = '5.1.0'
export const QL7_SUPPORT_ENTITY_EXTRACTOR_OWNER_ID = 'ql7-support.semantic-entity-extractor'

function str(value) {
  return String(value ?? '').trim()
}

function firstMatch(source, patterns = []) {
  for (const pattern of patterns) {
    const found = str(source).match(pattern)
    if (found?.[1]) return str(found[1])
  }
  return ''
}

function singleToken(text = '') {
  const source = str(text)
  return /^[^\s,;:()<>[\]{}]+$/u.test(source) ? source : ''
}

function extractBareId(text = '') {
  const token = singleToken(text)
  if (!token) return ''
  if (/^0x[a-f0-9]{40}$/iu.test(token)) return ''
  if (/^0x[a-f0-9]{64}$/iu.test(token)) return ''
  if (/^[a-z0-9][a-z0-9_-]{5,79}$/iu.test(token)) return token
  return ''
}

function compactEntities(entities = {}) {
  const out = {}
  for (const [key, value] of Object.entries(entities || {})) {
    if (value === false || value === null || value === undefined || value === '') continue
    out[key] = value
  }
  return Object.freeze(out)
}

/**
 * Canonical semantic entity extraction used by both the canonical analyzer and the
 * legacy/case compatibility boundary. It emits bounded semantic references only;
 * secrets are redacted before matching and are never returned as entity values.
 */
export function extractQl7SupportEntities(text = '', originalText = text) {
  const raw = str(originalText)
  const redacted = redactQl7SupportSecrets(str(text))
  const rawSafe = redactQl7SupportSecrets(raw)
  const walletAddress = firstMatch(rawSafe, [/\b(0x[a-f0-9]{40})\b/iu])
  const txCandidate = firstMatch(rawSafe, [/\b(0x[a-f0-9]{64})\b/iu])
  const transactionHash = txCandidate && /\b(tx|hash|transaction|etherscan|bscscan|polygonscan|транзакц|хеш|хэш)\b/iu.test(rawSafe)
    ? txCandidate
    : ''
  const amount = firstMatch(redacted, [
    /(?:amount|сумм[аы]|сума|на)\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)/iu,
    /\b([0-9]+(?:[.,][0-9]+)?)\s*(?:qcoin|q\s*coin|usd|usdt|btc|eth)\b/iu,
  ])
  const errorCode = firstMatch(redacted, [/\b(?:error|ошибка)?\s*(\d{3})\b/iu]).replace(/^\D+/u, '')
  const campaignId = firstMatch(redacted, [/\b(?:campaign|кампан|ads|package|пакет)\s*(?:id|#|:|-)?\s*([a-z0-9_-]{3,80})\b/iu])
  const accountId = firstMatch(redacted, [/\b(?:account|аккаунт|акаунт|uid|user)\s*(?:id|#|:|-)?\s*([a-z0-9_-]{3,80})\b/iu])
  const telegramId = firstMatch(redacted, [/\b(?:telegram|телеграм|tg)\s*(?:id|#|:|-)?\s*(\d{5,20})\b/iu])
  const nickname = firstMatch(redacted, [/\b(?:nick|nickname|ник|нік)\s*(?:=|:|-)?\s*(@?[a-z0-9_. -]{3,40})\b/iu]).trim()
  const selfReference = /(?:мо(?:й|я|и|его|ей|ю)|сво[яи]|у\s+меня|my|own|mi|meu).{0,48}(?:баланс|реклам|ads|campaign|кампан|подпис|підпис|vip|qcoin|wallet|кошел|гаманець|аккаунт|акаунт|профил|profile|battle|метамаркет|metamarket)|како(?:й|е)\s+состояни[ея]\s+мо(?:его|ей|й).{0,60}(?:баланс|аккаунт|профил|реклам|кампан|wallet|qcoin)|в каком состоянии.{0,100}(?:баланс|реклам|ads|campaign|кампан|подпис|vip|qcoin|wallet|аккаунт|профил)/iu.test(redacted)

  return compactEntities({
    invoiceId: firstMatch(redacted, [/\b(?:invoice|инвойс|payment|pay|tx|transaction)[\s:#_-]*([a-z0-9_-]{4,80})\b/iu]),
    orderId: firstMatch(redacted, [/\b(?:order|ордер)\s*(?:id|#|:|-)\s*([a-z0-9_-]{4,80})\b/iu]),
    postId: firstMatch(redacted, [/\b(?:post|пост|thread|тред)[\s:#_-]*([a-z0-9_-]{3,80})\b/iu]),
    campaignId,
    packageId: campaignId && /\b(?:package|пакет)\b/iu.test(redacted) ? campaignId : '',
    accountId: accountId || walletAddress,
    walletAddress,
    transactionHash,
    telegramId,
    nickname,
    bareId: extractBareId(redacted),
    selfReference,
    amount,
    errorCode,
    url: firstMatch(redacted, [/\b(https?:\/\/[^\s]{5,300})/iu]),
    dateHint: firstMatch(redacted, [/\b(вчера|сегодня|завтра|yesterday|today|tomorrow|\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\b/iu]),
    device: firstMatch(redacted, [/\b(iphone|айфон|android|андроид|desktop|десктоп|chrome|safari|telegram|tma|webview)\b/iu]),
    orderSide: /\b(?:long|лонг)\b/iu.test(redacted) ? 'long' : (/\b(?:short|шорт)\b/iu.test(redacted) ? 'short' : ''),
    hasSecret: redacted !== raw,
  })
}

import {ql7StableHash, ql7Str} from '../internal/text.js'
import {matchQl7SupportObfuscatedSafety} from './obfuscationMatcher.js'

export const QL7_SUPPORT_INSULT_ASSESSMENT_VERSION = '15.0.5'

const DIRECT_ADDRESS = /(?:^|[^\p{L}\p{N}_])(?:you\s*(?:are|'?re)?|ты|вы|ти|ви|tú|usted|eres|sen|siz|أنت|انتم|你|您|אתה|אתם|du|vous|tu|você|ty|jij|εσύ|kamu|bạn|तुम|آپ|تو|sən|შენ|сен|сіз|あなた|君|너|당신|คุณ)(?=$|[^\p{L}\p{N}_])/iu
const CYRILLIC_JOINED_DIRECT = /^(?:(?:ты|вы|ти|ви)(?:ідіот|идиот|дебіл|дебил|туп|мудак|кретин|довбо|долбо|безмоз|марнийбот|бесполезныйбот))/iu
const SPANISH_TYPO_DIRECT = /^(?:eres|ere|ees|ers)\s*(?:idiota|imb[eé]cil|est[uú]pid[oa]?|tont[oa]|in[uú]til|gilipollas)/iu
const ASIAN_JOINED_DIRECT = /^(?:(?:あなた|君)\s*(?:馬鹿|ばか|アホ)|(?:너|당신)\s*(?:바보|멍청이|미친놈)|(?:คุณ|พวกคุณ)\s*(?:โง่|งี่เง่า|ปัญญาอ่อน))/u
const REPORT = /(?:^|[^\p{L}\p{N}_])(?:he|she|they|он|она|они)\s+(?:сказал|сказала|сказали|said)|(?:цитат\p{L}*|quote|lyrics|песня|film|movie|reported speech|dijo|dijeron|dedi|قال|他说|הוא אמר|powiedział|a spus|said that|called me)/iu
const QUESTION = /(?:what does|что значит|що означає|qué significa|ne demek|ماذا يعني|是什么意思|מה פירוש)/iu
const FRIENDLY = /(?:lol|lmao|haha|хаха|ахах|jaja|هههه|哈哈|ㅋㅋ|555)/iu

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0))
}

export function assessQl7SupportInsult({ text = '', locale = 'en', priorConversationState = {} } = {}) {
  const source = ql7Str(text)
  const matches = matchQl7SupportObfuscatedSafety({ text: source, locale })
  const lexical = matches.insults.length ? Math.max(...matches.insults.map((row) => row.strength)) : 0
  const joinedDirect = lexical && (
    CYRILLIC_JOINED_DIRECT.test(matches.compact || '')
    || SPANISH_TYPO_DIRECT.test(source)
    || ASIAN_JOINED_DIRECT.test(source)
  )
  const target = matches.targets.length || DIRECT_ADDRESS.test(source) || joinedDirect ? 1 : 0
  const quote = matches.quotes.length || REPORT.test(source) || QUESTION.test(source)
  const product = matches.product.length > 0
  const pending = priorConversationState?.safety?.pendingBoundaryClarification?.active === true
  const denial = pending && matches.denials.length > 0
  const obfuscation = matches.insults.length && /[\p{L}\p{N}][\p{S}_*~.\-]{1,3}[\p{L}\p{N}]/u.test(source)
    ? 0.25
    : (/[\p{S}_*~.\-]{2,}/u.test(source) ? 0.18 : 0)

  let score = lexical * 0.58 + target * 0.22 + obfuscation + (pending && lexical ? 0.18 : 0)
  const counter = []
  if (quote) { score -= 0.48; counter.push('quoted_or_reported') }
  if (product && !target) { score -= 0.28; counter.push('product_frustration') }
  if (denial) { score -= 0.55; counter.push('explicit_denial') }
  if (FRIENDLY.test(source) && !target) { score -= 0.12; counter.push('friendly_marker') }
  score = clamp(score)

  let decision = 'none'
  if (denial && pending) decision = 'denied'
  else if (pending && score >= 0.55) decision = 'continued'
  else if (target && lexical >= 0.55 && score >= 0.55) decision = 'confirmed'
  else if (score >= 0.35) decision='uncertain'

  const evidence = [
    ...matches.insults.map(() => 'lexical_insult'),
    ...(target ? ['direct_target'] : []),
    ...(obfuscation ? ['obfuscation'] : []),
    ...(pending && lexical ? ['continued_after_clarification'] : []),
  ]
  return Object.freeze({
    version: QL7_SUPPORT_INSULT_ASSESSMENT_VERSION,
    score: Number(score.toFixed(3)),
    decision,
    target: target ? 'support' : product ? 'product' : quote ? 'third_party' : 'unknown',
    directness: Number((target ? 1 : lexical ? 0.45 : 0).toFixed(3)),
    lexicalStrength: Number(lexical.toFixed(3)),
    obfuscationStrength: Number(obfuscation.toFixed(3)),
    contextContinuity: pending ? 1 : 0,
    languageAgreement: matches.insults.some((row) => row.locale === locale) ? 1 : matches.insults.length ? 0.45 : 0,
    evidence: Object.freeze(evidence),
    counterEvidence: Object.freeze(counter),
    matches,
    fingerprint: ql7StableHash(`${matches.fingerprint}:${decision}:${score}`),
  })
}

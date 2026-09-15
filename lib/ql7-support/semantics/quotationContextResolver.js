export const QL7_SUPPORT_QUOTATION_CONTEXT_VERSION = '5.1.1'

const QUOTED_SPAN = /["“”«»「」『』„”][^"“”«»「」『』„”]{1,500}["“”«»「」『』„”]/gu
const REPORTED_SPEECH = /(?:he|she|they)\s+(?:said|wrote)|(?:он|она|они)\s+(?:сказал|сказала|сказали|написал|написала)|reported\s+speech|quote|цитат|якоб[ыи]|мовляв|dijo|sagte|a dit|قال|说|述べ|말했|אמר/iu
const COUNTER_SPEECH = /(?:I\s+(?:disagree|condemn|reject)|я\s+(?:против|осуждаю|не согласен|отвергаю)|не\s+поддерживаю|не\s+підтримую|condemn|counter[- ]?speech)/iu

export function resolveQl7QuotationContext(text = '') {
  const source = String(text || '')
  const quotedMatches = [...source.matchAll(QUOTED_SPAN)].map((match) => Object.freeze({
    text: match[0],
    start: Number(match.index || 0),
    end: Number(match.index || 0) + match[0].length,
    scopeKind: 'explicit-quote',
  }))

  const reported = REPORTED_SPEECH.test(source)
  const counterSpeech = COUNTER_SPEECH.test(source)

  return Object.freeze({
    schema: 'ql7.support.quotation-context',
    schemaVersion: QL7_SUPPORT_QUOTATION_CONTEXT_VERSION,
    quoted: quotedMatches.length > 0,
    quotedMatches: Object.freeze(quotedMatches),
    reported,
    counterSpeech,
    speakerActionabilityReduced: quotedMatches.length > 0 || reported || counterSpeech,
  })
}

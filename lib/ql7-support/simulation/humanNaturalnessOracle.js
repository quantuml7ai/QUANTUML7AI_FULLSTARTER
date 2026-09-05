const VERSION = 'ql7.support.oracle.human-naturalness'

const BOT_PATTERNS = Object.freeze([
  /^(?:hello|hi|привет)[.!]?\s*(?:how can i help|чем могу помочь)/iu,
  /\b(?:as an ai|как ии|языковая модель)\b/iu,
  /\b(?:contact support again|обратитесь в поддержку снова)\b/iu,
  /\b(?:according to my internal|внутренн(?:ий|его) маршрут)\b/iu,
])

function sentences(text = '') {
  return String(text || '')
    .split(/(?<=[.!?。！？])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function normalize(sentence = '') {
  return String(sentence)
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

export function evaluateHumanNaturalnessIndependent({
  text = '',
  semanticPlan = {},
  surface = {},
} = {}) {
  const failures = []
  const value = String(text || '').trim()
  const sentenceRows = sentences(value)
  const normalizedRows = sentenceRows.map(normalize)

  if (!value) failures.push('empty_text')
  if (
    value.length > 24 &&
    /^((понял|понимаю|ясно|окей|okay|sure|конечно)[,!. ]+){1,2}/iu.test(value)
  ) {
    failures.push('generic_ack_opening')
  }
  if (BOT_PATTERNS.some((pattern) => pattern.test(value))) failures.push('bot_phrase')
  if (new Set(normalizedRows).size !== normalizedRows.length) {
    failures.push('exact_sentence_duplicate')
  }

  if (sentenceRows.length >= 3) {
    const starts = sentenceRows.map((sentence) =>
      normalize(sentence).split(' ').slice(0, 3).join(' '),
    )
    if (new Set(starts).size <= Math.ceil(starts.length / 2)) {
      failures.push('repetitive_rhetorical_skeleton')
    }
  }

  if ((surface?.actions || []).length > 1 && semanticPlan?.nextStepNeed === false) {
    failures.push('cta_overproduction')
  }
  if (/\b(?:classifier|mongo collection|receipt id|system prompt|internal route)\b/iu.test(value)) {
    failures.push('machine_process_disclosure')
  }

  return Object.freeze({
    schema: VERSION,
    ok: failures.length === 0,
    failures: Object.freeze(failures),
    metrics: Object.freeze({
      sentenceCount: sentenceRows.length,
      uniqueSentenceCount: new Set(normalizedRows).size,
      textLength: value.length,
    }),
  })
}

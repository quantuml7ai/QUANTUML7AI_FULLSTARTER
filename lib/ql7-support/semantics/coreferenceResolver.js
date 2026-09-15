export const QL7_SUPPORT_COREFERENCE_RESOLVER_VERSION = '5.2.0'

const WORD_EDGE_LEFT = '(?:^|[^\\p{L}\\p{N}_])'
const WORD_EDGE_RIGHT = '(?=$|[^\\p{L}\\p{N}_])'
const bounded = (source) => new RegExp(`${WORD_EDGE_LEFT}(?:${source})${WORD_EDGE_RIGHT}`, 'iu')
const BACK_REFERENCE_PATTERNS = Object.freeze([
  bounded('it|its|them|their|that|this|those|these|there|same|again|previous|before'),
  bounded('eso|esto|aquello|ellos|ellas|mismo|otra\\s+vez'),
  bounded('onu|onları|bunu|şunu|aynı|tekrar'),
  bounded('es|das|dies|diese|jene|nochmals'),
  bounded('le|la|les|ça|cela|ceci|encore'),
  bounded('lo|la|li|quest[oaie]|quell[oaie]|ancora'),
  bounded('isso|isto|aquilo|eles|elas|novamente'),
  bounded('tego|ich|je|znowu|toho|znovu'),
  bounded('asta|acel|aceasta|iar|azt|ezt|őket|újra'),
  bounded('dit|dat|deze|die|opnieuw'),
  bounded('det|den|dem|dessa|disse|igen|igjen'),
  bounded('se|sitä|ne|niitä|uudelleen'),
  bounded('itu|ini|mereka|lagi|semula'),
  bounded('nó|này|đó|chúng|lại'),
  bounded('это|этого|эту|эти|тот|его|е[её]|их|там|снова|ещ[её]\\s+раз|к\\s+этому|до\\s+этого|ранее|раньше'),
  bounded('це|цього|цю|ці|той|їх|його|її|знову|повторно'),
  bounded('това|този|тези|пак|ово|то|они|поново|ono|ponovno'),
  bounded('αυτό|εκείνο|ξανά'),
  bounded('هذا|هذه|ذلك|تلك|هم|ها|مرة\\s+أخرى'),
  bounded('אותו|אותה|אותם|זה|זאת|שוב'),
  /(?:這個|这个|那個|那个|它|它們|它们|再次)/u,
  /(?:นี่|นั้น|พวกมัน|อีกครั้ง)/u,
])
const TEMPORAL_ELLIPSIS = /(?:за\s+(?:последн\p{L}*\s+)?(?:день|сутк\p{L}*|недел\p{L}*|месяц\p{L}*|квартал\p{L}*|год)|за\s+(?:останн\p{L}*\s+)?(?:день|тижд\p{L}*|місяц\p{L}*|рік)|\b(?:for|over)\s+(?:the\s+)?(?:last|past)?\s*(?:day|week|month|quarter|year)\b|\b(?:durante|de)\s+(?:la\s+)?(?:últim[oa]\s+)?(?:día|semana|mes|trimestre|año)\b|(?:خلال|لآخر)\s+(?:يوم|أسبوع|شهر|سنة)|(?:过去|過去|最近)(?:一天|一周|一个月|一個月|一年)|(?:ביום|בשבוע|בחודש|בשנה)\s+האחרו\p{L}*)/iu

function activeFrame(memoryGraph = {}) {
  if (memoryGraph?.activeTopicFrame && typeof memoryGraph.activeTopicFrame === 'object') {
    return memoryGraph.activeTopicFrame
  }
  const frameId = String(memoryGraph?.activeTopicFrameId || '')
  return frameId ? memoryGraph?.topicFrames?.[frameId] || null : null
}

export function resolveQl7Coreference({ text = '', memoryGraph = {} } = {}) {
  const source = String(text || '')
  const frame = activeFrame(memoryGraph)
  const directReference = BACK_REFERENCE_PATTERNS.some((pattern) => pattern.test(source))
  const temporalEllipsis = TEMPORAL_ELLIPSIS.test(source)
  const refersBack = directReference || temporalEllipsis
  const topicId = refersBack
    ? String(frame?.topicId || frame?.domainId || frame?.microtopicId || '')
    : ''
  const returnPointId = refersBack
    ? String(frame?.returnPoint?.propositionId || frame?.exactReturnPoint?.propositionId || '')
    : ''

  return Object.freeze({
    schema: 'ql7.support.coreference-resolution',
    schemaVersion: QL7_SUPPORT_COREFERENCE_RESOLVER_VERSION,
    refersBack,
    topicId,
    returnPointId,
    activeTopicFrameId: String(frame?.topicFrameId || memoryGraph?.activeTopicFrameId || ''),
    resolvedFromMemory: Boolean(refersBack && frame),
    ambiguity: Boolean(refersBack && !frame),
    referenceKind: directReference ? 'anaphora' : temporalEllipsis ? 'temporal_ellipsis' : 'none',
  })
}

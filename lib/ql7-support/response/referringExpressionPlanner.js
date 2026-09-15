export const QL7_SUPPORT_REFERENCE_PLANNER_VERSION = '5.1.1'

const str = (value) => String(value ?? '').trim()

function activeFrame(memoryGraph = {}) {
  const id = str(memoryGraph?.activeTopicFrameId)
  return id ? memoryGraph?.topicFrames?.[id] || {} : {}
}

export function buildQl7SupportReferencePlan({
  scopeReceipt = {},
  memoryGraph = {},
  locale = 'en',
} = {}) {
  const frame = activeFrame(memoryGraph)
  const subjectId = str(
    scopeReceipt.primaryMicrotopicId ||
    scopeReceipt.primaryDomainId ||
    frame.microtopicId ||
    frame.domainId,
  )

  const rejected = new Set((memoryGraph?.rejectedHypotheses || []).map((value) => str(value)).filter(Boolean))
  const ambiguous = !subjectId || rejected.has(subjectId)

  return Object.freeze({
    schema: 'ql7.support.reference-plan',
    schemaVersion: QL7_SUPPORT_REFERENCE_PLANNER_VERSION,
    locale: str(locale) || 'en',
    subjectId,
    avoidRepeatedBrand: true,
    usePronounOnlyWhenUnambiguous: !ambiguous,
    activeTopicFrameId: str(memoryGraph?.activeTopicFrameId),
    ambiguity: ambiguous,
    preferUserTerminology: true,
    rejectedReferenceIds: Object.freeze([...rejected]),
  })
}

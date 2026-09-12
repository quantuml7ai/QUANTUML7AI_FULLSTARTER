export const QL7_SUPPORT_EMOTION_ONTOLOGY_VERSION = '5.1.1'

const EMOTIONS = Object.freeze([
  ['neutral', 0, false],
  ['confusion', 1, false],
  ['irritation', 1, false],
  ['fatigue', 1, false],
  ['gratitude', 1, false],
  ['joy', 1, false],
  ['sadness', 2, true],
  ['anxiety', 2, true],
  ['loneliness', 2, true],
  ['loss', 3, true],
  ['fear', 3, true],
  ['anger', 2, true],
])

export const QL7_SUPPORT_EMOTION_ONTOLOGY = Object.freeze(
  EMOTIONS.map(([emotionId, evidenceFloor, sensitive]) => Object.freeze({
    emotionId,
    evidenceFloor,
    sensitive,
    diagnosisAllowed: false,
    acknowledgementRequiresEvidence: emotionId !== 'neutral',
    version: QL7_SUPPORT_EMOTION_ONTOLOGY_VERSION,
  })),
)

export function validateQl7SupportEmotionEvidence({
  emotionId = 'neutral',
  evidence = [],
} = {}) {
  const definition = QL7_SUPPORT_EMOTION_ONTOLOGY.find((row) => row.emotionId === String(emotionId))
  const evidenceCount = Array.isArray(evidence) ? evidence.length : 0
  const failures = []
  if (!definition) failures.push('emotion_unknown')
  if (definition && evidenceCount < definition.evidenceFloor) failures.push('emotion_evidence_insufficient')
  return Object.freeze({
    ok: failures.length === 0,
    definition: definition || null,
    evidenceCount,
    failures: Object.freeze(failures),
  })
}

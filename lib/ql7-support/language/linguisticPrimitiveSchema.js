import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_LINGUISTIC_PRIMITIVE_SCHEMA_VERSION = '5.1.0'

const REQUIRED_FIELDS = Object.freeze([
  'entryId',
  'schemaVersion',
  'locale',
  'semanticRole',
  'speechAct',
  'register',
  'formality',
  'politeness',
  'emotionCompatibility',
  'domainCompatibility',
  'requiredContext',
  'forbiddenContext',
  'morphologyFeatures',
  'syntacticFrame',
  'lexicalChoices',
  'discourseRelation',
  'pragmaticEffect',
  'provenance',
  'reviewReceiptIds',
  'contentHash',
])

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

function uniqueRows(values = []) {
  return [...new Set(ql7Arr(values).map(ql7Str).filter(Boolean))]
}

function hashableBody(value = {}) {
  const { contentHash: _contentHash, ...body } = value
  return body
}

export function validateQl7SupportLinguisticPrimitive(value = {}) {
  const failures = []
  if (value.schema !== 'ql7.support.linguistic-primitive') failures.push('invalid_schema')
  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(value, field)) failures.push(`missing_field:${field}`)
  }
  if (value.schemaVersion !== QL7_SUPPORT_LINGUISTIC_PRIMITIVE_SCHEMA_VERSION) failures.push('unknown_schema_version')
  if (!ql7Str(value.entryId)) failures.push('empty_entry_id')
  if (!ql7Str(value.locale)) failures.push('empty_locale')
  if (!ql7Str(value.semanticRole)) failures.push('empty_semantic_role')
  if (!ql7Str(value.speechAct)) failures.push('empty_speech_act')
  if (!ql7Str(value.syntacticFrame?.type)) failures.push('invalid_syntactic_frame')
  if (!ql7Arr(value.lexicalChoices).length) failures.push('empty_lexical_choices')
  if (!ql7Str(value.provenance?.owner) || !ql7Str(value.provenance?.sourceId)) failures.push('invalid_provenance')
  const expectedHash = ql7StableHash(JSON.stringify(hashableBody(value)))
  if (ql7Str(value.contentHash) !== expectedHash) failures.push('content_hash_mismatch')
  return deepFreeze({ ok: failures.length === 0, failures, expectedHash })
}

export function createQl7SupportLinguisticPrimitive({
  entryId,
  locale,
  semanticRole,
  speechAct,
  register = 'natural',
  formality = 'adaptive',
  politeness = 'neutral-polite',
  emotionCompatibility = ['neutral'],
  domainCompatibility = ['*'],
  requiredContext = [],
  forbiddenContext = [],
  morphologyFeatures = {},
  syntacticFrame = { type: 'lexical-concept', slots: [] },
  lexicalChoices = [],
  discourseRelation = 'none',
  pragmaticEffect = 'semantic-support',
  provenance = {},
  reviewReceiptIds = [],
} = {}) {
  const body = {
    schema: 'ql7.support.linguistic-primitive',
    schemaVersion: QL7_SUPPORT_LINGUISTIC_PRIMITIVE_SCHEMA_VERSION,
    entryId: ql7Str(entryId),
    locale: ql7Str(locale),
    semanticRole: ql7Str(semanticRole),
    speechAct: ql7Str(speechAct),
    register: ql7Str(register),
    formality: ql7Str(formality),
    politeness: ql7Str(politeness),
    emotionCompatibility: uniqueRows(emotionCompatibility),
    domainCompatibility: uniqueRows(domainCompatibility),
    requiredContext: uniqueRows(requiredContext),
    forbiddenContext: uniqueRows(forbiddenContext),
    morphologyFeatures: { ...morphologyFeatures },
    syntacticFrame: {
      type: ql7Str(syntacticFrame?.type),
      slots: uniqueRows(syntacticFrame?.slots),
    },
    lexicalChoices: uniqueRows(lexicalChoices),
    discourseRelation: ql7Str(discourseRelation),
    pragmaticEffect: ql7Str(pragmaticEffect),
    provenance: {
      owner: ql7Str(provenance?.owner),
      sourceId: ql7Str(provenance?.sourceId),
      sourceVersion: ql7Str(provenance?.sourceVersion || QL7_SUPPORT_LINGUISTIC_PRIMITIVE_SCHEMA_VERSION),
    },
    reviewReceiptIds: uniqueRows(reviewReceiptIds),
  }
  const value = { ...body, contentHash: ql7StableHash(JSON.stringify(body)) }
  const validation = validateQl7SupportLinguisticPrimitive(value)
  if (!validation.ok) {
    const error = new Error(`ql7_linguistic_primitive_invalid:${validation.failures.join(',')}`)
    error.code = 'ql7_linguistic_primitive_invalid'
    error.failures = validation.failures
    throw error
  }
  return deepFreeze(value)
}


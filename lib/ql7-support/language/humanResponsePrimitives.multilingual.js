import {ql7Locale} from '../internal/text.js'

export const QL7_SUPPORT_MULTILINGUAL_RESPONSE_PRIMITIVE_VERSION = '16.0.0-primitives-only'

const OPERATIONS = Object.freeze({
  clarify: 'targetClarify',
  apology: 'denialRepair',
  resume: 'topicRecall',
  help: 'smallTalk',
  cooldown: 'boundary',
  threat: 'threat',
})

function row(locale, semanticRole, operation) {
  return Object.freeze({
    schema: 'ql7.support.native32-linguistic-primitive-reference',
    schemaVersion: QL7_SUPPORT_MULTILINGUAL_RESPONSE_PRIMITIVE_VERSION,
    locale,
    semanticRole,
    operation,
    readyToSend: false,
    finalText: false,
    realizationOwner: 'language/compositionalGrammar.js',
  })
}

export function getQl7SupportBoundaryResponsePack(locale = 'en') {
  const lang = ql7Locale(locale)
  return Object.freeze(Object.fromEntries(Object.entries(OPERATIONS).map(([key, operation]) => [key, Object.freeze([row(lang, key, operation)])])))
}

export function getQl7SupportBoundaryPrimitiveCoverage() {
  return Object.freeze({
    schema: 'ql7.support.native32-primitive-coverage',
    schemaVersion: QL7_SUPPORT_MULTILINGUAL_RESPONSE_PRIMITIVE_VERSION,
    operationCount: Object.keys(OPERATIONS).length,
    readyToSendRows: 0,
    finalSentenceRows: 0,
    operations: OPERATIONS,
  })
}

import {
  readQl7SupportPersonalityState as readPersonalityStateStore,
  recordQl7SupportCognitiveTurn as recordCognitiveTurnStore,
  recordQl7SupportResponseQuality as recordResponseQualityStore,
  recordQl7SupportTranslationOutcome as recordTranslationOutcomeStore,
  writeQl7SupportPersonalityState as writePersonalityStateStore,
} from '../cognitiveMemory.js'
import {readQl7SupportRuntimeCapability as readRuntimeCapabilityStore} from '../runtimeCapabilityRegistry.js'
import {buildQl7SupportPersonalityState as buildPersonalityStateModel} from '../personalityEngine.js'
import {recordQl7LearningSignal as recordLearningObservationStore} from '../learningGovernance.js'

export const QL7_SUPPORT_CANONICAL_TELEMETRY_VERSION = '5.1.0'
export const QL7_SUPPORT_CANONICAL_TELEMETRY_OWNER = 'ql7-support.telemetry.canonical'

export async function readQl7SupportPersonalityState(input = {}) {
  return readPersonalityStateStore(input)
}
export function buildQl7SupportPersonalityState(input = {}) {
  return buildPersonalityStateModel(input)
}
export async function readQl7SupportRuntimeCapability(input = {}) {
  return readRuntimeCapabilityStore(input)
}
export async function recordQl7SupportCanonicalTurnTelemetry(input = {}) {
  return recordCognitiveTurnStore(input)
}
export async function writeQl7SupportCanonicalPersonalityState(input = {}) {
  return writePersonalityStateStore(input)
}
export async function recordQl7SupportCanonicalTranslationOutcome(input = {}) {
  return recordTranslationOutcomeStore(input)
}
export async function recordQl7SupportCanonicalResponseQuality(input = {}) {
  return recordResponseQualityStore(input)
}
export async function recordQl7SupportCanonicalLearningObservation(input = {}) {
  return recordLearningObservationStore(input)
}

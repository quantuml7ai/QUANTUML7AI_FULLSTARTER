import { QL7_PREMIUM_MICRO_INTENTS_V11_6 } from '../microIntentCatalogV11_6.js'
import { QL7_SUPPORT_SIMULATION_LANGUAGES_V11 } from '../simulationOntologyV11.js'
import { getQl7SupportAdaptiveResponseVariationStatsV12 } from './adaptiveResponseVariationV12.js'
import { getQl7SupportBattleExpansionStatsV12 } from './semanticBattleExpansionV12.js'
import { getQl7SupportSafeLearningCalibrationStatsV12 } from './safeLearningCalibrationV12.js'

export const QL7_SUPPORT_SEMANTIC_ONTOLOGY_VERSION_V12 = '12.0.0'
export const QL7_SUPPORT_SCENARIO_CLASSES_V12 = Object.freeze(['direct', 'context', 'slang', 'noise', 'identity', 'translation', 'safety', 'visual'])
export const QL7_SUPPORT_DIALECT_PACKS_V12 = Object.freeze(['standard', 'regional', 'youth_slang', 'technical', 'transliteration', 'code_switch', 'typo_noise', 'emoji_noise', 'polite', 'urgent', 'sarcastic', 'accessibility'])

function str(value) { return String(value ?? '').trim() }

export function buildQl7SupportSemanticOntologyNodeV12(base = {}, className = 'direct', dialect = 'standard') {
  const id = `v12.${base.id}.${className}.${dialect}`
  return Object.freeze({
    id,
    domain: str(base.domain),
    topic: str(base.topic),
    goal: str(base.goal),
    operation: str(base.operation),
    scenarioClass: className,
    dialectPack: dialect,
    entities: Object.freeze(['actor', 'locale', 'current_account', `${base.topic || base.domain}_entity`]),
    prerequisites: Object.freeze(className === 'identity' ? ['valid_wallet_session', 'read_only_actor_fixture'] : ['selected_locale', 'support_runtime']),
    negativeExamples: Object.freeze(['raw_id_request', 'screenshot_request', 'classifier_only_verdict']),
    responsePolicy: Object.freeze({
      requiresActualAnswer: true,
      requiresCardCheck: ['identity', 'visual', 'safety', 'translation'].includes(className),
      noRawIdRequest: true,
      localizationRequired: className === 'translation',
      safetyPolicyRequired: className === 'safety',
    }),
  })
}

export function listQl7SupportSemanticOntologyNodesV12() {
  const nodes = []
  for (const base of QL7_PREMIUM_MICRO_INTENTS_V11_6) {
    for (const className of QL7_SUPPORT_SCENARIO_CLASSES_V12) {
      for (const dialect of QL7_SUPPORT_DIALECT_PACKS_V12) nodes.push(buildQl7SupportSemanticOntologyNodeV12(base, className, dialect))
    }
  }
  return Object.freeze(nodes)
}

export function getQl7SupportSemanticOntologyStatsV12() {
  const nodes = listQl7SupportSemanticOntologyNodesV12()
  const battleExpansion = getQl7SupportBattleExpansionStatsV12()
  const responseVariation = getQl7SupportAdaptiveResponseVariationStatsV12()
  const safeLearning = getQl7SupportSafeLearningCalibrationStatsV12()
  return Object.freeze({
    version: QL7_SUPPORT_SEMANTIC_ONTOLOGY_VERSION_V12,
    nodeCount: nodes.length,
    baseMicroIntentCount: QL7_PREMIUM_MICRO_INTENTS_V11_6.length,
    scenarioClassCount: QL7_SUPPORT_SCENARIO_CLASSES_V12.length,
    dialectPackCount: QL7_SUPPORT_DIALECT_PACKS_V12.length,
    languageCount: QL7_SUPPORT_SIMULATION_LANGUAGES_V11.length,
    battleExpansion,
    responseVariation,
    safeLearning,
    meetsV12Minimum: nodes.length >= 10000 &&
      QL7_SUPPORT_SIMULATION_LANGUAGES_V11.length >= 32 &&
      battleExpansion.readyForBattlePreflight &&
      responseVariation.productionVisibleOutputBounded &&
      responseVariation.estimatedResponseCombinations >= 100000 &&
      safeLearning.protectsAgainstOneDialoguePoisoning,
  })
}

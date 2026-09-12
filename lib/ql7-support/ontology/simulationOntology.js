import {QL7_PREMIUM_MICRO_INTENTS} from '../microIntentCatalog.js'
import {QL7_SUPPORT_SIMULATION_LANGUAGES} from '../simulationOntology.js'
import {getQl7SupportResponseLengthStats} from '../response/responseLengthPlanner.js'
import {getQl7SupportBattleExpansionStats} from '../semantics/battleExpansion.js'
import {getQl7SupportSafeLearningCalibrationStats} from '../learning/safeCalibration.js'

export const QL7_SUPPORT_SEMANTIC_ONTOLOGY_VERSION = '12.0.0'
export const QL7_SUPPORT_SCENARIO_CLASSES = Object.freeze(['direct', 'context', 'slang', 'noise', 'identity', 'translation', 'safety', 'visual'])
export const QL7_SUPPORT_DIALECT_PACKS = Object.freeze(['standard', 'regional', 'youth_slang', 'technical', 'transliteration', 'code_switch', 'typo_noise', 'emoji_noise', 'polite', 'urgent', 'sarcastic', 'accessibility'])

function str(value) { return String(value ?? '').trim() }

export function buildQl7SupportSemanticOntologyNode(base = {}, className = 'direct', dialect = 'standard') {
  const id = `canonical.${base.id}.${className}.${dialect}`
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

export function listQl7SupportSemanticOntologyNodes() {
  const nodes = []
  for (const base of QL7_PREMIUM_MICRO_INTENTS) {
    for (const className of QL7_SUPPORT_SCENARIO_CLASSES) {
      for (const dialect of QL7_SUPPORT_DIALECT_PACKS) nodes.push(buildQl7SupportSemanticOntologyNode(base, className, dialect))
    }
  }
  return Object.freeze(nodes)
}

export function getQl7SupportSemanticOntologyStats() {
  const nodes = listQl7SupportSemanticOntologyNodes()
  const battleExpansion = getQl7SupportBattleExpansionStats()
  const responseVariation = getQl7SupportResponseLengthStats()
  const safeLearning = getQl7SupportSafeLearningCalibrationStats()
  return Object.freeze({
    version: QL7_SUPPORT_SEMANTIC_ONTOLOGY_VERSION,
    nodeCount: nodes.length,
    baseMicroIntentCount: QL7_PREMIUM_MICRO_INTENTS.length,
    scenarioClassCount: QL7_SUPPORT_SCENARIO_CLASSES.length,
    dialectPackCount: QL7_SUPPORT_DIALECT_PACKS.length,
    languageCount: QL7_SUPPORT_SIMULATION_LANGUAGES.length,
    battleExpansion,
    responseVariation,
    safeLearning,
    meetsV12Minimum: nodes.length >= 10000 &&
      QL7_SUPPORT_SIMULATION_LANGUAGES.length >= 32 &&
      battleExpansion.readyForBattlePreflight &&
      responseVariation.productionVisibleOutputBounded &&
      responseVariation.estimatedResponseCombinations >= 100000 &&
      safeLearning.protectsAgainstOneDialoguePoisoning,
  })
}

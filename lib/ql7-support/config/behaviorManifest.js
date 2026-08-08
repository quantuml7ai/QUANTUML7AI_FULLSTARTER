import { QL7_SUPPORT_ECOSYSTEM_TOPICS } from '../ecosystemCatalog.js'
import { ql7StableHash } from '../internal/text.js'

export const QL7_SUPPORT_RUNTIME_VERSION = '15.0.0'
export const QL7_SUPPORT_RUNTIME_EXECUTOR_ID = 'executeQl7SupportTurnRuntime'
export const QL7_SUPPORT_NATIVE_LOCALES = Object.freeze(['en','ru','uk','es','tr','ar','zh','he'])
export const QL7_SUPPORT_PROVIDER_LOCALES = Object.freeze(['de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','bg','sr','hr','sl','el','ka','az','kk','ja','ko'])
export const QL7_SUPPORT_ALL_LOCALES = Object.freeze([...QL7_SUPPORT_NATIVE_LOCALES,...QL7_SUPPORT_PROVIDER_LOCALES])
export const QL7_SUPPORT_CANONICAL_OWNERS = Object.freeze({
  capability:'config/capabilitySnapshot.js',
  runtime:'runtime/executeTurn.js',
  productionRuntime:'runtime/productionTurn.js',
  state:'runtimeStateMachine.js',
  normalization:'language/normalizeInput.js',
  nativeCopy:'language/nativeBanks.js',
  humanVariations:'language/humanVariationBanks.js',
  semanticBanks:'language/semanticBanks.js',
  safetyLexicons:'language/safetyLexicon.native.js + language/safetyLexicon.provider.js',
  insultAssessment:'safety/insultAssessment.js',
  insultStateMachine:'safety/insultStateMachine.js',
  factProjection:'data/factProjection.js',
  responseLocalePolicy:'language/responseLocalePolicy.js',
  learningGovernance:'learning/governancePolicy.js',
  semantics:'semantics/analyzeTurn.js',
  safety:'safety/evaluateTurn.js',
  ledger:'conversation/ledger.js',
  receipts:'data/adapterReceipt.js',
  contentPlan:'response/buildContentPlan.js',
  realization:'response/realizeNatural.js',
  critic:'response/critiqueResponse.js',
  surface:'presentation/buildSupportSurface.js',
  svg:'presentation/svgRegistry.js',
  tables:'presentation/tableRegistry.js',
  operator:'operator/buildCase.js',
  operatorStickyUi:'app/forum/features/dm/components/InboxTabsHeader.jsx + app/forum/features/dm/components/DmMessagesPane.jsx + app/forum/features/dm/components/DmThreadHeader.jsx + app/forum/features/dm/components/Ql7SupportOperator.jsx + app/forum/styles/modules/dmStyles.js + app/forum/styles/modules/ql7SupportGlobalStyles.js',
  smtp:'operator/smtpRendererRu.js',
  learning:'learningPipeline.js',
  simulation:'simulation/executeScenario.js',
  simulationCatalog:'simulation/scenarioCatalog.js',
  mutationEngine:'simulation/mutationEngine.js',
  reportWriter:'simulation/reportWriter.js',
  liveRead:'simulation/liveRead.js',
  oracle:'simulation/independentOracle.js',
  productionParity:'simulation/productionParityHarness.js + scripts/ql7-support/v14-production-parity-proof.mjs',
  operatorStickyProof:'scripts/ql7-support/v14-operator-sticky-contract-proof.mjs',
  v11ProfileSmoke:'scripts/ql7-support/v14-v11-profile-smoke-proof.mjs',
  legacyIntelligenceCorpus:'simulation/corpora/legacyIntelligenceV14.js',
  anonymousIncidentPersistence:'learningPipeline.js + server.js',
})
export const QL7_SUPPORT_STATE_GRAPH = Object.freeze([
  'idle',
  'greeting',
  'understanding',
  'checking',
  'analyzing',
  'preparing_response',
  'answer_ready',
  'needs_clarification',
  'attention_required',
  'temporarily_unavailable',
])
const manifest = Object.freeze({
  runtimeVersion:QL7_SUPPORT_RUNTIME_VERSION,
  executor:QL7_SUPPORT_RUNTIME_EXECUTOR_ID,
  owners:QL7_SUPPORT_CANONICAL_OWNERS,
  locales:QL7_SUPPORT_ALL_LOCALES,
  topics:QL7_SUPPORT_ECOSYSTEM_TOPICS,
  stateGraph:QL7_SUPPORT_STATE_GRAPH,
  rules:Object.freeze({maxVisibleGraphemes:400,svgRoles:32,svgVariantsPerRole:5,svgRepeatWindow:20,exactRepeatWindow:200000,writeCountForSelfReads:0,simulationEvidenceSchema:'15.0.0',mutationFamilies:29,projectRegulation:'project:docs:full_then_test:codex',runtimeIdentity:'canonical-single-executor-stable-pnpm-no-active-version-split',contactRuntime:'disabled-redirect-guard-mail-api-only',svgQualityTier:'premium-detailed',svgHeavyEffects:0,operatorMediaStatic:'/ql7/static.png',operatorMediaVideo:'/ql7/video.mp4',operatorMediaPublicStates:'10-public-states-4-video-6-static',operatorMediaLifecycle:'one-video-session-per-operation-graceful-stop-after-current-loop-static-return-to-native-slot',semanticBankVersion:'15.3.2',humanVariationBankVersion:'15.3.1',humanVariationCoverage:'32-tz-locales-min-41600-critical-banks-1000-10000-compositional-emotional-humor-business-warning-small-talk-ambiguity-noise',knowledge32Corpus:'46-domains-32-tz-locales-50-paraphrases-8-mutations',semanticScoringEvidence:'topicCandidates_topicScores_margin_entropy_adapterEligibility_adapterGates_marketSignals_aliases_47_topics_665_terms_tz_locale_list',businessOperatorIntake:'collect_brief_collect_contact_handoff_with_contacts_dm_only_after_three_turns',crisisSafetyCoverage:'self_harm_language_operator_review_no_input_lock',cryptoAiRecommendation:'exchange_ai_price_timeframe_aiquota_vip_no_financial_advice_1000_ready_and_1000_quota_variants',eventNotificationCoverage:'vip_3_2_1_expired_ads_3_2_1_expired_qcoin_credit_success_failed_purchase_success_failure_banks',fraudCrimeEscalation:'security_fraud_crime_operator_report_qcoin_incident_1000_variants',supportEntryBridge:'auth_gate_to_forum_dm_deeplink_contact_redirect_guard_1200_fresh_continue_greetings_per_locale',learningGovernance:'redaction_poisoning_review_eval_shadow_canary_rollback_delete',responseVariationFloor:'per-tz-locale-min-41600-compositional-measured-critical-1000-10000-ambiguity-noise',productionLaboratoryParity:'shared-productionTurn-input-executor-final-user-visible-text-surface-actions-hashes',legacyCompatibilityRevision:'full12-natural-greeting-contract-and-table-row-metadata'}),
})
export const QL7_SUPPORT_BEHAVIOR_MANIFEST = manifest
export const QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH = ql7StableHash(JSON.stringify(manifest))

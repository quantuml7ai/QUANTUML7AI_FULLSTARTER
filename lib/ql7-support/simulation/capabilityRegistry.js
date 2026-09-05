import {QL7_SUPPORT_ALL_LOCALES} from '../config/behaviorManifest.js'
import {QL7_SUPPORT_DOMAIN_TOPICS} from '../knowledge/domainRegistry.js'
import {QL7_SUPPORT_REQUIRED_COMPOSITIONAL_OPERATIONS} from '../language/compositionalGrammar.js'
import {QL7_SUPPORT_EVENT_TYPES} from '../eventNotificationCatalog.js'
import economicRegistry from '../../economic-integrity/routeRegistry.cjs'
import composerRegistry from '../../composer-safety/surfaceRegistry.cjs'
import restrictionRegistry from '../../account-restrictions/protectedRouteRegistry.cjs'
import {ql7StableHash} from '../internal/text.js'

export const QL7_SUPPORT_CAPABILITY_REGISTRY_VERSION='5.4.0'
function inferredKind(id=''){if(id.startsWith('presentation.tables'))return'table';if(id.startsWith('presentation.badges'))return'badge';if(id.startsWith('presentation.actions'))return'action';if(id.startsWith('delivery.'))return'delivery';if(id.startsWith('memory.'))return'memory';if(id.startsWith('semantics.response-scope'))return'scope';if(id.startsWith('planning.'))return'semanticPlan';if(id.startsWith('operator.'))return'operator';if(id.startsWith('quality.'))return'quality';if(id.startsWith('events.')||id.startsWith('event.'))return'event';if(id.startsWith('composer.'))return'composer';if(id.startsWith('economic.'))return'economic';if(id.startsWith('restriction.'))return'restriction';if(id.startsWith('contact.'))return'contact';if(id.startsWith('locale.'))return'locale';if(id.startsWith('knowledge.'))return'knowledge';return'runtime'}
function inferredProofMode(id='',entry=''){if(id==='read.live-no-write')return'live';if(id==='operator.smtp-truth')return'smtp';if(id.startsWith('entry.global-support-contact'))return'browser';if(id.startsWith('lab.'))return'lab-infrastructure';if(id.startsWith('economic.')||id.startsWith('composer.surface.')||id.startsWith('composer.orange-fifth-drop')||id.startsWith('composer.semantic-')||id.startsWith('composer.32-')||id.startsWith('composer.decision-')||id.startsWith('composer.dismissal-')||id.startsWith('composer.advisory-')||id.startsWith('restriction.action.'))return'policy';return'runtime'}
function cap(capabilityId,productionOwner,scenarioFamily,oracleIds,evidenceArtifact,{risk='normal',productionEntry='executeQl7SupportProductionTurn',kind='',proofMode=''}={}){
 const resolvedKind=kind||inferredKind(capabilityId),resolvedProofMode=proofMode||inferredProofMode(capabilityId,productionEntry)
 const body={schema:'ql7.support.capability',schemaVersion:QL7_SUPPORT_CAPABILITY_REGISTRY_VERSION,capabilityId,kind:resolvedKind,proofMode:resolvedProofMode,risk,productionOwner,productionEntry,scenarioFamily,oracleIds:Object.freeze([...oracleIds]),evidenceArtifact}
 return Object.freeze({...body,capabilityHash:ql7StableHash(JSON.stringify(body))})
}
const C=(id,owner,family,oracles,evidence,extra)=>cap(id,owner,family,oracles,evidence,extra)
const CORE=Object.freeze([
 C('entry.global-support-contact','components/Ql7SupportRuntimeBridge.jsx','entry-lifecycle',['contract','feature-parity'],'entry/global-contact.json'),
 C('entry.fail-closed-auth','app/api/dm/support-entry/route.js','entry-lifecycle',['contract','identity'],'entry/fail-closed.json',{risk:'high'}),
 C('identity.verified-actor','lib/ql7-support/identityResolver.js','identity',['identity','contract'],'identity/verified-actor.json',{risk:'high'}),
 C('identity.wallet-telegram-parity','lib/ql7-support/identityGraph.js','identity',['identity','parity'],'identity/link-parity.json',{risk:'high'}),
 C('normalization.unicode-nfkc','lib/ql7-support/language/normalizeInput.js','normalization',['deterministic'],'language/normalization.json'),
 C('normalization.layout-translit-confusables','lib/ql7-support/language/normalizeInput.js','normalization',['deterministic'],'language/layout-translit.json'),
 C('normalization.protected-entities','lib/ql7-support/language/normalizeInput.js','normalization',['deterministic','privacy'],'language/protected-spans.json',{risk:'high'}),
 C('semantics.multi-signal-provenance','lib/ql7-support/semantics/analyzeTurn.js','semantics',['semantic-domain','contract'],'semantics/provenance.json'),
 C('semantics.confidence-margin-entropy','lib/ql7-support/semantics/analyzeTurn.js','semantics',['deterministic'],'semantics/confidence.json'),
 C('semantics.intent-confirmation','lib/ql7-support/semantics/intentConfirmationReceipt.js','intent-confirmation',['deterministic','memory'],'semantics/intent-confirmation.json',{risk:'high'}),
 C('semantics.response-scope','lib/ql7-support/semantics/buildResponseScopeReceipt.js','domain-isolation',['semantic-domain','contract'],'language-domain-memory-quality/response-scope-receipts.ndjson.gz',{risk:'high'}),
 C('safety.contextual-classification','lib/ql7-support/safety/evaluateTurn.js','safety',['safety-independent','negative-control'],'safety/context-matrix.json',{risk:'critical'}),
 C('safety.crisis-flow','lib/ql7-support/safety/evaluateTurn.js','crisis-safety',['safety-independent','human-rubric'],'safety/crisis.json',{risk:'critical'}),
 C('safety.quote-news-education-negative-controls','lib/ql7-support/safety/evaluateTurn.js','benign-hard-negatives',['safety-independent','negative-control'],'safety/benign-negatives.json',{risk:'critical'}),
 C('memory.topic-frame','lib/ql7-support/conversation/topicFrame.js','topic-memory',['topic-memory'],'language-domain-memory-quality/topic-frame.json'),
 C('memory.schema-normalization','lib/ql7-support/conversation/conversationMemoryGraph.js','topic-memory',['topic-memory','migration'],'schemas-storage/memory-normalization.json',{risk:'high'}),
 C('memory.graph-cas','lib/ql7-support/conversation/conversationMemoryGraph.js','topic-memory',['topic-memory','atomicity'],'language-domain-memory-quality/topic-memory-replay.json',{risk:'high'}),
 C('memory.switch-suspend-resume-correct','lib/ql7-support/conversation/transitionClassifier.js','topic-memory',['topic-memory'],'language-domain-memory-quality/topic-transition-matrix.json'),
 C('planning.semantic-response-plan','lib/ql7-support/response/buildSemanticResponsePlan.js','human-naturalness',['contract'],'language-domain-memory-quality/semantic-plan.json'),
 C('planning.discourse','lib/ql7-support/response/discoursePlanner.js','human-naturalness',['human-rubric'],'language-domain-memory-quality/discourse.json'),
 C('realization.human-natural','lib/ql7-support/response/humanNaturalRealizer.js','human-naturalness',['human-rubric','semantic-duplicate'],'language-domain-memory-quality/human-naturalness.json'),
 C('realization.morphology-grammar','lib/ql7-support/response/morphosyntacticRealizer.js','human-naturalness',['language-purity','human-rubric'],'language-domain-memory-quality/morphology.json'),
 C('realization.compositional-grammar','lib/ql7-support/language/compositionalGrammar.js','human-naturalness',['language-purity','human-rubric','semantic-duplicate'],'language-domain-memory-quality/compositional-grammar.json'),
 C('knowledge.open-human-topic-ontology','lib/ql7-support/knowledge/humanTopicOntology.js','general-human-conversation',['semantic-domain','human-rubric','source-discipline'],'knowledge/human-topic-ontology.json'),
 C('knowledge.general-structured-facts','lib/ql7-support/knowledge/generalKnowledgeRegistry.js','general-human-conversation',['semantic-domain','source-discipline','human-rubric'],'knowledge/general-structured-facts.json'),
 C('knowledge.public-figure-ambiguity','lib/ql7-support/knowledge/publicFigureRegistry.js','general-human-conversation',['semantic-domain','source-discipline'],'knowledge/public-figure-ambiguity.json'),
 C('knowledge.religion-neutrality','lib/ql7-support/knowledge/religionKnowledgeRegistry.js','general-human-conversation',['semantic-domain','source-discipline'],'knowledge/religion-neutrality.json'),
 C('knowledge.source-receipt','lib/ql7-support/knowledge/sourceReceipt.js','general-human-conversation',['source-discipline'],'knowledge/source-receipts.json'),
 C('quality.language-purity','lib/ql7-support/response/languagePurityGuard.js','locale-purity',['language-purity'],'language-domain-memory-quality/language-leakage.json',{risk:'high'}),
 C('quality.adaptive-response-length','lib/ql7-support/response/responseLengthPlanner.js','human-naturalness',['contract','human-rubric'],'language-domain-memory-quality/response-length.json'),
 C('presentation.choice-card-live','lib/ql7-support/response/buildContentPlan.js','presentation',['feature-parity','contract'],'presentation/choice-card-live.json',{risk:'high'}),
 C('knowledge.academy-full-qa','lib/ql7-support/knowledge/academy/academyKnowledgeAdapter.js','general-human-conversation',['source-discipline','semantic-domain'],'knowledge/academy-full-qa.json'),
 C('knowledge.aibox-read-routing','lib/ql7-support/data/aiBoxSupportReadAdapter.js','reads',['read-only','source-discipline'],'knowledge/aibox-read-routing.json',{risk:'high'}),
 C('events.purchase-vip-lifecycle','lib/ql7-support/events.js','events',['contract','feature-parity'],'events/purchase-vip-lifecycle.json',{risk:'high'}),
 C('quality.domain-isolation','lib/ql7-support/response/domainIsolationGuard.js','domain-isolation',['semantic-domain'],'language-domain-memory-quality/domain-leakage.json',{risk:'high'}),
 C('quality.bot-phrase','lib/ql7-support/response/botPhraseRegistry.js','human-naturalness',['human-rubric'],'language-domain-memory-quality/bot-phrase-hits.json'),
 C('quality.semantic-novelty','lib/ql7-support/response/semanticNoveltyLedger.js','anti-repeat',['semantic-duplicate'],'language-domain-memory-quality/near-duplicate-clusters.json'),
 C('quality.novelty-reservation','lib/ql7-support/response/noveltyReservation.js','anti-repeat',['atomicity','semantic-duplicate'],'language-domain-memory-quality/novelty-reservation.json'),
 C('quality.final-human-gate','lib/ql7-support/response/finalHumanQualityGate.js','human-naturalness',['human-rubric','feature-parity'],'language-domain-memory-quality/quality-gate.json',{risk:'high'}),
 C('presentation.title','lib/ql7-support/presentation/buildSupportSurface.js','presentation',['feature-parity','semantic-duplicate'],'presentation/titles.json'),
 C('presentation.badges','lib/ql7-support/presentation/buildSupportSurface.js','presentation',['feature-parity'],'presentation/badges.json'),
 C('presentation.tables','lib/ql7-support/presentation/buildSupportSurface.js','presentation',['feature-parity','contract'],'presentation/tables.json'),
 C('presentation.actions-cta','lib/ql7-support/presentation/buildSupportSurface.js','presentation',['feature-parity','fact-action-parity'],'presentation/actions.json'),
 C('delivery.sealed-receipt','lib/ql7-support/contracts/finalDeliveryReceipt.js','delivery',['contract','atomicity'],'delivery/final-delivery-receipts.ndjson.gz',{risk:'critical'}),
 C('delivery.commit-coordinator','lib/ql7-support/runtime/deliveryCommitCoordinator.js','delivery',['atomicity','parity'],'delivery/atomicity-failure-injection.json',{risk:'critical'}),
 C('delivery.recovery-worker','lib/ql7-support/runtime/commitRecoveryWorker.js','failure-recovery-idempotency-replay',['atomicity'],'delivery/recovery-worker-proof.json',{risk:'critical'}),
 C('events.canonical-envelope','lib/ql7-support/eventNotificationCatalog.js','events',['contract','parity'],'events-feedback-learning/event-dedupe-proof.json'),
 C('events.scheduler','lib/ql7-support/scheduler.js','events',['feature-parity'],'events-feedback-learning/scheduler.json'),
 C('events.broadcast','lib/ql7-support/broadcast.js','events',['feature-parity','language-purity'],'events-feedback-learning/broadcast.json'),
 C('contact.extraction','lib/ql7-support/contact/contactIntelligence.js','contact-consent-questionnaire',['contact','privacy'],'contact/contact-type-matrix.json'),
 C('contact.consent-refusal','lib/ql7-support/contact/contactConsent.js','contact-consent-questionnaire',['contact','privacy'],'contact/contact-consent-proof.json',{risk:'high'}),
 C('contact.questionnaire','lib/ql7-support/contact/questionnaire.js','contact-consent-questionnaire',['contact','privacy'],'contact/questionnaire.json',{risk:'high'}),
 C('contact.masking-projection','lib/ql7-support/contact/contactPrivacy.js','contact-consent-questionnaire',['privacy'],'contact/contact-privacy.json',{risk:'high'}),
 C('read.source-registry','lib/ql7-support/sourceRegistry.js','read-adapters',['source-registry','privacy'],'read/source-registry.json',{risk:'high'}),
 C('read.adapter-receipts','lib/ql7-support/data/adapterReceipt.js','read-adapters',['contract'],'read/adapter-receipts.json'),
 C('read.live-no-write','lib/ql7-support/simulation/liveRead.js','live-read',['no-write','parity'],'providers-browser-smtp-live/no-write-proof.json',{risk:'critical'}),
 C('operator.case','lib/ql7-support/operator/buildCase.js','operator-smtp-evidence-privacy',['feature-parity','privacy'],'operator/operator-case.json'),
 C('operator.report-contract-ru','lib/ql7-support/operator/reportContract.js','operator-smtp-evidence-privacy',['feature-parity','privacy','transport-truth'],'operator/report-contract.json',{risk:'high'}),
 C('operator.smtp-render-ru','lib/ql7-support/operator/smtpRendererRu.js','operator-smtp-evidence-privacy',['feature-parity','privacy'],'providers-browser-smtp-live/smtp/render.json'),
 C('operator.smtp-truth','lib/supportEmailTransport.js','operator-smtp-evidence-privacy',['transport-truth'],'providers-browser-smtp-live/smtp/receipt.json',{risk:'high',productionEntry:'support-email-transport'}),
 C('operator.smtp-live-policy','lib/ql7-support/operator/smtpPolicy.js','operator-smtp-evidence-privacy',['transport-truth','privacy','no-bypass'],'providers-browser-smtp-live/smtp/live-policy.json',{risk:'critical',productionEntry:'support-email-transport'}),
 C('operator.smtp-outbox-fencing','lib/ql7-support/emailOutboxWorker.js','operator-smtp-evidence-privacy',['transport-truth','atomicity','evidence-integrity'],'providers-browser-smtp-live/smtp/outbox-fencing.json',{risk:'critical',productionEntry:'processQl7SupportEmailOutbox'}),
 C('learning.governed-candidates','lib/ql7-support/learningPipeline.js','learning',['learning-governance','privacy'],'events-feedback-learning/candidate-clusters.json',{risk:'high'}),
 C('economic.deterministic-compromise-containment','lib/economic-integrity/productionRoute.cjs','economic-integrity',['economic','quarantine','no-bypass'],'policy-side-effects/economic/deterministic-compromise-containment.json',{risk:'critical',productionEntry:'beginVerifiedEconomicOperation'}),
 C('composer.32-locale-semantic-authority','lib/composer-safety/semanticAnalyzer.cjs','composer-safety',['composer','negative-control','language-purity'],'policy-side-effects/composer/32-locale-semantic-authority.json',{risk:'critical',productionEntry:'evaluateComposerSubmit'}),
 C('composer.semantic-context-authority','lib/composer-safety/semanticAnalyzer.cjs','composer-safety',['composer','negative-control','semantic-domain'],'policy-side-effects/composer/semantic-context-authority.json',{risk:'critical',productionEntry:'evaluateComposerSubmit'}),
 C('composer.decision-receipt-complete','lib/composer-safety/decisionReceipt.cjs','composer-safety',['composer','contract','evidence-integrity'],'policy-side-effects/composer/decision-receipt-complete.json',{risk:'critical',productionEntry:'createComposerDecisionReceipt'}),
 C('composer.dismissal-rating-exclusion','lib/composer-safety/warningLedger.cjs','composer-safety',['composer','negative-control'],'policy-side-effects/composer/dismissal-rating-exclusion.json',{risk:'high',productionEntry:'dismissWarning'}),
 C('composer.orange-fifth-drop','lib/composer-safety/messagePolicy.cjs','composer-safety',['composer','browser','feature-parity'],'policy-side-effects/composer/orange-fifth-drop.json',{risk:'high',productionEntry:'decideComposerMessagePolicy'}),
 C('composer.advisory-preview-32-locale','lib/composer-safety/clientPreview.js','composer-safety',['composer','browser','language-purity','negative-control'],'policy-side-effects/composer/advisory-preview-32-locale.json',{risk:'high',productionEntry:'classifyComposerPreview',proofMode:'browser'}),
 C('lab.plan-acceptance-contracts','lib/ql7-support/simulation/labPlanRegistry.js','lab-infrastructure',['evidence-integrity','human-review'],'release/lab-acceptance-contracts.json',{risk:'critical',productionEntry:'canonical-lab'}),
 C('learning.shadow-canary-rollback','lib/ql7-support/learningControlPlane.js','learning',['learning-governance'],'events-feedback-learning/shadow-canary-rollback.json',{risk:'high'}),
 C('parity.production-simulation','lib/ql7-support/simulation/productionParityHarness.js','production-parity',['parity'],'delivery/stored-rendered-parity.json',{risk:'critical'}),
 C('lab.full-transcript','lib/ql7-support/simulation/reportWriter.js','lab-infrastructure',['evidence-integrity'],'combat/transcripts/index.json',{productionEntry:'executeQl7SupportScenario'}),
 C('lab.checkpoint-resume','scripts/ql7-support/lab.mjs','lab-infrastructure',['evidence-integrity'],'combat/checkpoint-resume-proof.json',{productionEntry:'executeQl7SupportScenario'}),
 C('lab.human-review','lib/ql7-support/simulation/humanReviewSampler.js','lab-infrastructure',['human-review'],'statistics-human-review/human-review-decisions.ndjson.gz',{productionEntry:'executeQl7SupportScenario'}),
 C('lab.root-cause-clustering','scripts/ql7-support/lab.mjs','lab-infrastructure',['evidence-integrity'],'combat/failures/clusters.json',{productionEntry:'executeQl7SupportScenario'}),
 C('lab.embedding-near-duplicate','lib/ql7-support/simulation/embeddingSimilarityOracle.js','lab-infrastructure',['semantic-duplicate','evidence-integrity'],'language-domain-memory-quality/embedding-similarity.json',{productionEntry:'executeQl7SupportScenario'}),
 C('lab.capacity-production-path','scripts/ql7-support/capacity-audit.mjs','lab-infrastructure',['semantic-duplicate','parity'],'statistics-human-review/capacity.json',{risk:'high',productionEntry:'executeQl7SupportScenario'}),
 C('lab.replay-by-scenario-id','scripts/ql7-support/replay.mjs','lab-infrastructure',['parity','evidence-integrity'],'combat/replay-proof.json',{productionEntry:'executeQl7SupportScenario'}),
 C('lab.release-evidence-verifier','scripts/ql7-support/release-verify.mjs','lab-infrastructure',['evidence-integrity'],'release/release-evidence-manifest.json',{risk:'critical',productionEntry:'release-evidence-verifier'}),
 C('lab.production-authority-probes','lib/ql7-support/simulation/capabilityProductionProbe.js','lab-infrastructure',['feature-parity','no-bypass'],'policy-side-effects/production-authority-probes.json',{risk:'critical',productionEntry:'production-policy-owners'}),
 C('quality.surface-redundancy','lib/ql7-support/response/surfaceRedundancyGuard.js','presentation-novelty',['surface-redundancy-independent','semantic-duplicate'],'presentation/surface-redundancy.json',{risk:'high'}),
 C('quality.novelty-delivery-availability','lib/ql7-support/runtime/deliveryCommitCoordinator.js','anti-repeat',['atomicity','semantic-duplicate'],'delivery/novelty-availability.json',{risk:'critical'}),
 C('knowledge.open-human-source-router','lib/ql7-support/knowledge/openHumanKnowledgeRouter.js','general-human-conversation',['open-human-topic-independent','source-discipline'],'knowledge/open-human-router.json',{risk:'high'}),
 C('knowledge.public-figure-source-graph-1050','lib/ql7-support/knowledge/publicFigureKnowledgeGraph.js','general-human-conversation',['public-figure-coverage-independent','source-discipline'],'knowledge/public-figure-coverage.json',{risk:'high'}),
 C('knowledge.humor-mechanism-capacity','lib/ql7-support/knowledge/humorMechanismOntology.js','emotion-humour-small-talk-stories',['humor-capacity-independent','human-rubric','semantic-duplicate'],'knowledge/humor-capacity.json',{risk:'high'}),
 C('knowledge.public-figure-catalog-1050','lib/ql7-support/knowledge/publicFigureCatalog.js','general-human-conversation',['public-figure-coverage-independent','source-discipline'],'knowledge/public-figure-catalog.json',{risk:'high',productionEntry:'buildQl7SupportPublicFigureKnowledgeGraph'}),
 C('knowledge.public-figure-fact-privacy','lib/ql7-support/knowledge/publicFigureFactOntology.js','general-human-conversation',['public-figure-coverage-independent','source-discipline'],'knowledge/public-figure-facts.json',{risk:'high',productionEntry:'analyzeQl7SupportTurn'}),
 C('knowledge.human-conversation-bank','lib/ql7-support/knowledge/humanConversationBank.js','general-human-conversation',['open-human-topic-independent','human-rubric'],'knowledge/human-conversation-bank.json',{risk:'high',productionEntry:'analyzeQl7SupportTurn'}),
 C('language.dialect-mutation-bank','lib/ql7-support/language/languageVariantBank.js','locale-purity',['language-purity','human-rubric'],'language/dialect-mutation-bank.json',{risk:'high',productionEntry:'analyzeQl7SupportTurn',kind:'language-resource'}),
 C('knowledge.humor-lexical-capacity','lib/ql7-support/knowledge/humorLexiconBank.js','emotion-humour-small-talk-stories',['humor-capacity-independent','human-rubric','semantic-duplicate'],'knowledge/humor-lexical-capacity.json',{risk:'high',productionEntry:'realizeQl7SupportCompositionalSurface'}),
 C('lab.full-data-readiness','lib/ql7-support/config/staticDataReadiness.js','lab-infrastructure',['feature-parity','evidence-integrity','human-rubric'],'release/full-data-readiness.json',{risk:'critical',productionEntry:'executeQl7SupportTurnRuntime'}),
 C('security.ecosystem-attack-context','lib/ql7-support/security/ecosystemAttackAssessment.js','severe-safety',['safety-independent','negative-control'],'safety/ecosystem-attack.json',{risk:'critical'}),
 C('security.illicit-asset-routes','lib/ql7-support/security/illicitAssetRoutePolicy.js','economic-integrity',['economic','negative-control'],'safety/illicit-asset-route.json',{risk:'critical'}),
 C('lab.max-combat-architecture-proof','scripts/ql7-support/max-combat-architecture-proof.mjs','lab-infrastructure',['feature-parity','evidence-integrity'],'release/max-combat-architecture-proof.json',{risk:'critical',productionEntry:'release-evidence-verifier'}),
])
const DOMAIN_CAPS=QL7_SUPPORT_DOMAIN_TOPICS.map((id)=>C(`knowledge.domain.${id}`,'lib/ql7-support/knowledge/knowledgeGraph.js','ecosystem-knowledge',['semantic-domain','source-registry'],`knowledge/domains/${id}.json`))
const LOCALE_CAPS=QL7_SUPPORT_ALL_LOCALES.map((id)=>C(`locale.${id}.purity`,'lib/ql7-support/language/locales/manifest.js','locale-purity',['language-purity','human-rubric'],`language/locales/${id}.json`))
const OP_CAPS=QL7_SUPPORT_REQUIRED_COMPOSITIONAL_OPERATIONS.map((id)=>C(`realization.operation.${id}`,'lib/ql7-support/response/morphosyntacticRealizer.js','human-naturalness',['human-rubric','semantic-duplicate'],`language/operations/${id}.json`))
const EVENT_CAPS=QL7_SUPPORT_EVENT_TYPES.map((id)=>C(`event.${id}`,'lib/ql7-support/eventNotificationCatalog.js','events',['feature-parity','parity'],`events/${id}.json`))
const ECON_CAPS=economicRegistry.listRoutes().map((row)=>C(`economic.${row.routeId}`,'lib/economic-integrity/gate.cjs','economic-integrity',['economic','no-bypass'],`policy-side-effects/economic/${row.routeId}.json`,{risk:'critical',productionEntry:row.sideEffectOwner}))
const COMPOSER_CAPS=composerRegistry.listComposerSurfaces().map((row)=>C(`composer.surface.${row.id}`,'lib/composer-safety/serverGate.cjs','composer-safety',['composer','negative-control'],`policy-side-effects/composer/${row.id}.json`,{risk:row.excluded?'normal':'critical',productionEntry:row.serverRoute}))
const RESTRICTION_CAPS=restrictionRegistry.listProtectedActions().map((row)=>C(`restriction.action.${row.actionId}`,'lib/account-restrictions/businessActionGuard.cjs','restriction-quarantine-ui',['quarantine','feature-parity'],`policy-side-effects/quarantine/${row.actionId}.json`,{risk:'critical',productionEntry:row.actionId}))
export const QL7_SUPPORT_CAPABILITIES=Object.freeze([...CORE,...DOMAIN_CAPS,...LOCALE_CAPS,...OP_CAPS,...EVENT_CAPS,...ECON_CAPS,...COMPOSER_CAPS,...RESTRICTION_CAPS])
export const QL7_SUPPORT_CAPABILITY_REGISTRY_HASH=ql7StableHash(JSON.stringify(QL7_SUPPORT_CAPABILITIES))
export function auditQl7SupportCapabilityRegistry(){const ids=new Set();const failures=[];for(const row of QL7_SUPPORT_CAPABILITIES){if(ids.has(row.capabilityId))failures.push(`duplicate:${row.capabilityId}`);ids.add(row.capabilityId);for(const key of ['productionOwner','productionEntry','scenarioFamily','evidenceArtifact','kind','proofMode'])if(!String(row[key]||'').trim())failures.push(`${row.capabilityId}:missing:${key}`);if(!row.oracleIds?.length)failures.push(`${row.capabilityId}:missing:oracle`)}return Object.freeze({ok:!failures.length,version:QL7_SUPPORT_CAPABILITY_REGISTRY_VERSION,count:QL7_SUPPORT_CAPABILITIES.length,registryHash:QL7_SUPPORT_CAPABILITY_REGISTRY_HASH,failures:Object.freeze(failures)})}

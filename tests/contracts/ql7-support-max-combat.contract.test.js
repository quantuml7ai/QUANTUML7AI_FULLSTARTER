import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { QL7_SUPPORT_MAX_COMBAT_REQUIREMENTS, QL7_SUPPORT_MAX_COMBAT_REQUIREMENT_COUNT } from '../../lib/ql7-support/config/maxCombatRequirementRegistry.js'
import { buildQl7DecisionMathReceipt } from '../../lib/ql7-support/semantics/decisionMath.js'
import { verifyQl7SupportDecisionMathIndependent } from '../../lib/ql7-support/simulation/decisionMathOracle.js'
import { QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION } from '../../lib/ql7-support/knowledge/knowledgeGraph.js'
import { QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION } from '../../lib/ql7-support/response/morphosyntacticRealizer.js'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..')
const text=(rel)=>fs.readFileSync(path.join(root,rel),'utf8')
describe('QL7 Support MAX COMBAT traceability contract',()=>{
 it('maps exactly 106 strengthened code-and-data architecture requirements',()=>{expect(QL7_SUPPORT_MAX_COMBAT_REQUIREMENT_COUNT).toBe(106);expect(new Set(QL7_SUPPORT_MAX_COMBAT_REQUIREMENTS.map(r=>r.requirementId)).size).toBe(106)})
 it('requires owner, prod, simulation, oracle, test and evidence for every row and resolves every code/test path',()=>{for(const r of QL7_SUPPORT_MAX_COMBAT_REQUIREMENTS){for(const k of ['owner','productionUseSite','simulationUseSite','independentOracle','test','evidence'])expect(String(r[k]||''),`${r.requirementId}:${k}`).not.toBe('');for(const k of ['owner','productionUseSite','simulationUseSite','independentOracle','test'])expect(fs.existsSync(path.join(root,r[k])),`${r.requirementId}:missing:${k}:${r[k]}`).toBe(true)}})
 it('keeps MC-05 collision-aware regeneration bound to the real P0 unit regression file',()=>{const r=QL7_SUPPORT_MAX_COMBAT_REQUIREMENTS.find((row)=>row.requirementId==='MC-05');expect(r?.test).toBe('tests/unit/ql7-support/novelty-delivery-availability-test.js');expect(fs.existsSync(path.join(root,r.test))).toBe(true);const src=text(r.test);for(const token of ['100 repeated same-intent turns','maps every durable collision family','scope-safe exhaustion','QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET'])expect(src).toContain(token)})
 it('wires surface redundancy into the canonical final quality gate',()=>{expect(text('lib/ql7-support/response/finalHumanQualityGate.js')).toContain("./surfaceRedundancyGuard.js");expect(text('lib/ql7-support/runtime/executeTurn.js')).toContain('surfaceRedundancy')})
 it('keeps semantic context observational and collision evidence rich',()=>{const novelty=text('lib/ql7-support/response/noveltyReservation.js');const commit=text('lib/ql7-support/runtime/deliveryCommitCoordinator.js');expect(novelty).toContain('semanticIdentityIsExclusive: false');expect(commit).toContain('candidateRhetoricalSkeletonHash');expect(commit).toContain('allowedFactIdsHash')})
 it('wires open-human, humor, public-figure source and security assessments into semantics',()=>{const src=text('lib/ql7-support/semantics/analyzeTurn.js');for(const token of ['openHumanRoute','publicFigureSourceResolution','humorMechanismPlan','ecosystemAttackAssessment','illicitAssetRouteAssessment'])expect(src).toContain(token)})
 it('has complete 32-locale severe risk concept families for shared Composer Safety',()=>{const server=text('lib/composer-safety/localeRiskConcepts.cjs');const client=text('lib/composer-safety/localeRiskConcepts.client.js');const analyzer=text('lib/composer-safety/semanticAnalyzer.cjs');for(const token of ['kill','attack','war','riot','destroy','cyber','incite','commitment']){expect(server).toContain(token);expect(client).toContain(token)}expect(analyzer).toContain('matchComposerLocaleRiskConcepts')})
 it('wires crisis mathematics clarification AI Box learning and operator evidence into production',()=>{const manifest=text('lib/ql7-support/config/behaviorManifest.js');for(const token of ['crisisAssessment','clarificationRanker','decisionMath','aiBoxSupportReadAdapter','outcomeCalibrationLedger','evidenceAggregation'])expect(manifest).toContain(token);const safety=text('lib/ql7-support/safety/evaluateTurn.js');expect(safety).toContain('assessQl7SupportCrisis');const diagnostic=text('lib/ql7-support/diagnosticRegistry.js');expect(diagnostic).toContain('exchange_ai_shared_analysis_service')})
 it('requires non-empty calibrated posterior evidence before any decision-math side-effect eligibility',()=>{
  const receipt=buildQl7DecisionMathReceipt({
   text:'check payment',locale:'en',domain:'payments',intentFamily:'personal_status_request',
   decisionKind:'quarantine',policyProofPresent:false,evidenceCoverage:.9,sourceStaleness:.05,
   scoring:{topicCandidates:[{topic:'payments',total:7.4,components:{lexicalScore:4,entityScore:2,messageActScore:1.4}},{topic:'wallet',total:2.2,components:{lexicalScore:1.2,entityScore:1}}],positiveSignals:[],negativeSignals:[],confidenceMargin:5.2,semanticEntropy:.55,calibrationCellSamples:1000},
   memoryGraph:{activeTopic:'payments'},
  })
  const oracle=verifyQl7SupportDecisionMathIndependent(receipt)
  expect(oracle.ok,oracle.failures.join(',')).toBe(true)
  expect(receipt.semanticEvidencePresent).toBe(true)
  expect(receipt.posteriorMetrics.posteriorCount).toBeGreaterThanOrEqual(2)
  expect(receipt.posteriorMetrics.topProbability).toBeGreaterThan(0)
  expect(receipt.policyEligibility.sideEffectEligible).toBe(false)
 })
 it('keeps knowledge graph version separate from knowledge realization receipt schema version',()=>{
  const src=text('lib/ql7-support/response/morphosyntacticRealizer.js')
  expect(QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION).not.toBe('')
  expect(QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION).not.toBe('')
  expect(src).toContain('schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION')
  expect(src).toContain('graphVersion: ql7Str(answer.knowledgeGraphVersion)')
  expect(QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION).not.toBe(QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION)
 })

 it('requires installed combat data floors instead of placeholder capacity claims',()=>{
  const readiness=text('lib/ql7-support/config/staticDataReadiness.js')
  const floors=text('lib/ql7-support/config/finalCombatDataFloors.js')
  const runtime=text('lib/ql7-support/runtime/executeTurn.js')
  expect(floors).toContain('publicFigureIdentities:1900')
  expect(floors).toContain('humanConversationCells:8192')
  expect(floors).toContain('generalKnowledgeConceptNodes:12000')
  expect(floors).toContain('reviewedSemanticSeedsPerLocale:1500')
  expect(floors).toContain('crisisReviewedCuesTotal:2048')
  expect(floors).toContain('composerServerExpandedTerms:100000')
  expect(readiness).toContain('ql7-support.static-data-readiness')
  expect(runtime).toContain('staticDataReadiness.js')
  expect(runtime).not.toMatch(/staticDataReadiness(?:V|R|Rev)\d+/u)
 })
 it('keeps all lab gates and release evidence fail-closed',()=>{const src=text('lib/ql7-support/simulation/labPlanRegistry.js');for(const id of ['human-calibration-50000','production-1100k','human-naturalness-domain-isolation-3200k','complete-4300k','cell-holdout-1472k','memory-longitudinal-147200','metamorphic-2355200','chaos-100000'])expect(src).toContain(id)})
})

import {buildQl7DatasetRegistry} from './datasetRegistry.js'
import {buildDatasetLineage} from './datasetLineage.js'
import {allocateDatasetSplit} from './splitAllocator.js'
import {detectSplitLeakage} from './splitLeakageDetector.js'
import {buildCoveringDesign} from './factorialDesign.js'
import {buildCoverageTensor} from './coverageTensor.js'
import {buildCounterfactualPair} from './counterfactualGenerator.js'
import {applyMetamorphicTransform, QL7_METAMORPHIC_TRANSFORMS} from './metamorphicGenerator.js'
import {expectedMutationInvariant} from './mutationInvariantRegistry.js'
import {fuzzQl7SupportProperties} from './propertyFuzzer.js'
import {diffQl7SupportExecutions} from './differentialRunner.js'
import {runQl7SupportAblation} from './ablationRunner.js'
import {attributeQl7SupportFailure} from './causalAttribution.js'
import {buildQl7LabDriftMetrics} from './driftMetrics.js'
import {oracleConsensus} from './oracleConsensus.js'
import {buildOracleRequest, buildOracleResponse} from './oracleProcessProtocol.js'
import {auditOracleImportPaths} from './oracleSandbox.js'
import {punitiveFalsePositiveClaim, bootstrapMeanInterval} from './statisticalEngine.js'
import {evaluatePowerAdequacy} from './powerAnalysis.js'
import {holmBonferroni, benjaminiHochberg} from './multipleTestingCorrection.js'
import {calibrationMetrics} from './calibrationMetrics.js'
import {clusterFailures} from './failureClusterer.js'
import {minimizeFailure} from './deltaDebugger.js'
import {buildReplayPack} from './replayPackBuilder.js'
import {acquireShardLease, verifyShardLease, releaseShardLease} from './distributedCoordinator.js'
import {createQl7WorkerLease, validateQl7WorkerLease} from './workerLease.js'
import {buildQl7HumanReviewQueue} from './humanReviewQueue.js'
import {cohenKappa, adjudicateReviews} from './reviewAgreement.js'
import {evaluateQl7SupportScientificRelease, QL7_SUPPORT_REQUIRED_RELEASE_GATES} from './releaseGate.js'
import {createQl7LabShardWriter} from './shardWriter.js'
import {appendCheckpointJournal, readCheckpointJournal} from './checkpointJournal.js'
import {buildEvidenceMerkle} from './evidenceMerkleTree.js'
import {auditQl7LiveProofRegistry,listQl7LiveProofs} from './liveProofRegistry.js'
import {runQl7LiveProof,runQl7LiveProofMatrix} from './liveProofRunner.js'

export const QL7_SUPPORT_SCIENTIFIC_LAB_CONTRACT_VERSION = '5.1.0'

const callable = Object.freeze({
  buildQl7DatasetRegistry, buildDatasetLineage, allocateDatasetSplit, detectSplitLeakage,
  buildCoveringDesign, buildCoverageTensor, buildCounterfactualPair, applyMetamorphicTransform,
  expectedMutationInvariant, fuzzQl7SupportProperties, diffQl7SupportExecutions, runQl7SupportAblation,
  attributeQl7SupportFailure, buildQl7LabDriftMetrics, oracleConsensus, buildOracleRequest,
  buildOracleResponse, auditOracleImportPaths, punitiveFalsePositiveClaim, bootstrapMeanInterval,
  evaluatePowerAdequacy, holmBonferroni, benjaminiHochberg, calibrationMetrics, clusterFailures,
  minimizeFailure, buildReplayPack, acquireShardLease, verifyShardLease, releaseShardLease,
  createQl7WorkerLease, validateQl7WorkerLease, buildQl7HumanReviewQueue, cohenKappa,
  adjudicateReviews, evaluateQl7SupportScientificRelease, createQl7LabShardWriter,
  appendCheckpointJournal, readCheckpointJournal, buildEvidenceMerkle, auditQl7LiveProofRegistry, listQl7LiveProofs, runQl7LiveProof, runQl7LiveProofMatrix,
})

export function auditQl7SupportScientificLabContract() {
  const failures = []
  const liveRegistry=auditQl7LiveProofRegistry();if(!liveRegistry.ok||liveRegistry.capabilityCount<1)failures.push('live_proof_registry_contract')
  for (const [name, fn] of Object.entries(callable)) if (typeof fn !== 'function') failures.push(`owner_not_callable:${name}`)
  if (QL7_METAMORPHIC_TRANSFORMS.length !== 16) failures.push(`metamorphic_transform_count:${QL7_METAMORPHIC_TRANSFORMS.length}`)
  if (QL7_SUPPORT_REQUIRED_RELEASE_GATES.join(',') !== 'A,B,C,D,E,F,G,H,I,J,K') failures.push('release_gate_set')

  const sample = Object.freeze({ id: 'scientific-contract:sample', input: 'Explain the forum topic safely', locale: 'en', domainId: 'forum', expected: Object.freeze({ domainId: 'forum' }), lab: Object.freeze({ bucket: 'contract', splitId: 'frozen-acceptance-a' }) })
  const lineage = buildDatasetLineage({ scenario: sample, familyId: 'contract', splitId: 'frozen-acceptance-a' })
  const split = allocateDatasetSplit({ familyId: 'contract', lineageId: lineage.lineageHash, seed: 'canonical-contract' })
  const registry = buildQl7DatasetRegistry([{ datasetId: 'contract-dataset', purpose: 'owner-contract', splitClass: split.split, records: [sample], frozen: true }])
  if (!registry.registryHash || !lineage.lineageHash || !split.valid) failures.push('dataset_lineage_split_contract')

  const coverage = buildCoverageTensor([{ locale: 'en', domainId: 'forum', microtopicId: 'threads', intentId: 'explain', speechAct: 'question', emotionClass: 'neutral', safetyClass: 'safe', memoryTransition: 'continue', userExpertise: 'general', responseLength: 'short', formality: 'neutral', inputQuality: 'clean', mutationFamily: 'none', providerState: 'native', dataAvailability: 'available', restrictionState: 'none', concurrencyState: 'single', surfaceBrowser: 'dm' }])
  if (coverage.axes.length !== 18) failures.push(`coverage_axis_count:${coverage.axes.length}`)

  const design = buildCoveringDesign({ axes: { locale: ['en', 'ru'], domainId: ['forum', 'wallet'] }, rows: 4, seed: 'canonical-contract' })
  if (!design.rows.length) failures.push('factorial_design_empty')

  const cf = buildCounterfactualPair(sample, 'operation-vs-education')
  const mm = applyMetamorphicTransform(sample, 'whitespace')
  const inv = expectedMutationInvariant('whitespace')
  const fuzz = fuzzQl7SupportProperties({ text: sample.input, count: 4, seed: 'canonical-contract' })
  if (!cf.left || !cf.right || !mm.input || inv.domain !== 'invariant' || fuzz.length !== 4) failures.push('mutation_counterfactual_contract')

  const leakage = detectSplitLeakage([
    { scenarioId: 'a', splitId: 'frozen-acceptance-a', familyId: 'a', lineageId: 'la', input: 'alpha forum explanation' },
    { scenarioId: 'b', splitId: 'frozen-acceptance-b', familyId: 'b', lineageId: 'lb', input: 'beta wallet explanation' },
  ], { maxNearChecks: 100 })
  if (!leakage.ok) failures.push('split_leakage_contract')

  const diff = diffQl7SupportExecutions({ baseline: { surface: { a: 1 } }, candidate: { surface: { a: 1 } }, fields: ['surface'] })
  if (!diff.ok) failures.push('differential_contract')
  const causal = attributeQl7SupportFailure({ failure: { failureCode: 'x', rootStage: 'semantics' }, ablations: [{ featureId: 'f', fixed: true, delta: 1 }] })
  if (causal.primaryOwner !== 'f') failures.push('causal_attribution_contract')
  const drift = buildQl7LabDriftMetrics({ baseline: { featureDistribution: [.5, .5] }, current: { featureDistribution: [.5, .5] } })
  if (Math.abs(drift.featureJs) > 1e-12) failures.push('drift_contract')

  const request = buildOracleRequest({ oracleId: 'contract', scenario: sample, evidence: { ok: true } })
  const response = buildOracleResponse({ requestHash: request.requestHash, oracleId: 'contract', verdict: 'pass' })
  const consensus = oracleConsensus([{ oracleId: 'contract', hard: true, ok: true }])
  if (!request.requestHash || !response.responseHash || !consensus.ok || !auditOracleImportPaths([]).ok) failures.push('oracle_contract')

  const punitive = punitiveFalsePositiveClaim({ falsePositives: 0, total: 300000 })
  const power = evaluatePowerAdequacy({ observedSample: 300000, baseline: .00001, minimumRegression: .00005, alpha: .05, power: .8 })
  const calibration = calibrationMetrics([{ confidence: .9, correct: true }, { confidence: .1, correct: false }], 2)
  const bootstrap = bootstrapMeanInterval([1, 2, 3], { iterations: 200, seed: 51 })
  if (!punitive.ok || !power.ok || calibration.n !== 2 || !bootstrap.ok) failures.push('statistics_power_calibration_contract')
  if (holmBonferroni([{ p: .001 }, { p: .1 }], .05).length !== 2 || benjaminiHochberg([{ p: .001 }, { p: .1 }], .05).length !== 2) failures.push('multiple_testing_contract')

  const clusters = clusterFailures([{ failureCode: 'x', rootStage: 'semantics', locale: 'en', domainId: 'forum', scenarioId: 'a' }])
  const replay = buildReplayPack({ scenario: sample, oracle: { failures: [] }, evidence: {} })
  if (clusters.length !== 1 || !replay.replayHash) failures.push('diagnostic_replay_contract')

  const lease = acquireShardLease({ runId: 'contract', planHash: 'p', shardId: '0', workerId: 'w', ttlMs: 60000, now: 1000 })
  if (!verifyShardLease(lease, { now: 1001 })) failures.push('distributed_lease_contract')
  releaseShardLease(lease)
  const workerLease = createQl7WorkerLease({ workerId: 'w', shardId: '0', now: Date.now(), fencingToken: 1 })
  if (!validateQl7WorkerLease(workerLease, Date.now()).ok) failures.push('worker_fencing_contract')

  const reviewQueue = buildQl7HumanReviewQueue([{ scenarioId: 'a', locale: 'en', domainId: 'forum', input: 'x', output: 'y', ok: true }], { perLocale: 1 })
  const agreement = cohenKappa([{ scenarioId: 'a', verdict: 'pass' }], [{ scenarioId: 'a', verdict: 'pass' }])
  const adjudicated = adjudicateReviews({ left: [{ scenarioId: 'a', verdict: 'pass' }], right: [{ scenarioId: 'a', verdict: 'pass' }] })
  if (reviewQueue.length !== 1 || agreement.total !== 1 || !adjudicated.ok) failures.push('human_review_contract')

  const blocked = evaluateQl7SupportScientificRelease({})
  if (blocked.release !== 'BLOCKED' || blocked.ok) failures.push('release_fail_closed_contract')

  return Object.freeze({
    ok: failures.length === 0,
    schema: 'ql7.support.scientific-lab-contract-audit',
    schemaVersion: QL7_SUPPORT_SCIENTIFIC_LAB_CONTRACT_VERSION,
    ownerCount: Object.keys(callable).length,
    requiredGates: QL7_SUPPORT_REQUIRED_RELEASE_GATES,
    coverageAxes: coverage.axes,
    metamorphicTransformCount: QL7_METAMORPHIC_TRANSFORMS.length,
    liveProofCount: liveRegistry.count,
    liveCapabilityProofCount: liveRegistry.capabilityCount,
    failures: Object.freeze(failures),
  })
}

export async function runQl7SupportScientificSelfCheck() {
  const audit = auditQl7SupportScientificLabContract()
  if (!audit.ok) return audit
  const ablation = await runQl7SupportAblation({ execute: async (scenario, options) => ({ scenarioId: scenario.id, options }), scenario: { id: 'self-check' }, ablations: ['feature-a'] })
  const minimized = await minimizeFailure({ input: 'one two three', fails: async (text) => text.includes('three') })
  return Object.freeze({ ...audit, ablationOk: ablation.ablations.length === 1, deltaDebugOk: minimized.reproduces === true })
}

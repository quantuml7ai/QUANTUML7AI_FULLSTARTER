import {describe,it,expect} from 'vitest'
import {auditQl7SupportOntologyManifest} from '../../../lib/ql7-support/ontology/ontologyManifest.js'
import {QL7_SUPPORT_DOMAIN_MODULES} from '../../../lib/ql7-support/ontology/domains/index.js'
import {buildQl7DecisionMathReceipt} from '../../../lib/ql7-support/semantics/decisionMath.js'
import {normalizeQl7SupportTopicFrame,validateQl7SupportTopicFrame} from '../../../lib/ql7-support/conversation/topicFrame.js'
import {auditQl7SupportSurfaceCopyRegistry} from '../../../lib/ql7-support/language/supportSurfaceCopyRegistry.js'
import {buildQl7CalibrationCandidateReceipt} from '../../../lib/ql7-support/learning/calibrationCandidateReceipt.js'
import {validateQl7HumanReviewPair} from '../../../lib/ql7-support/simulation/humanReviewAgreement.js'
import {punitiveFalsePositiveClaim} from '../../../lib/ql7-support/simulation/statisticalAcceptance.js'
import {allocateDatasetSplit} from '../../../lib/ql7-support/simulation/lab/splitAllocator.js'
import {createQl7NativeModelReceipt} from '../../../lib/ql7-support/neural/modelReceipt.js'

describe('QL7 Support canonical late directive canonical contracts',()=>{
 it('owns a real typed ontology graph with 46 declarative domain modules',()=>{const a=auditQl7SupportOntologyManifest();expect(a.ok).toBe(true);expect(QL7_SUPPORT_DOMAIN_MODULES).toHaveLength(46);expect(a.manifest.nodeCount).toBeGreaterThan(1200);expect(a.manifest.edgeCount).toBeGreaterThan(6000);expect(a.validation.ok).toBe(true)})
 it('keeps semantic abstention separate from deterministic policy hold',()=>{const d=buildQl7DecisionMathReceipt({text:'maybe show my balance',locale:'en',domain:'qcoin',intentFamily:'personal_status_request',decisionKind:'personal_read',policyProofPresent:false,evidenceCoverage:0.5,collisionRisk:0.1,scoring:{confidenceMargin:0.12,semanticEntropy:0.72}});expect(d.abstention).toBeTruthy();expect(d.policyDecision).toBeTruthy();expect(d.abstention).toHaveProperty('semanticAbstain');expect(d.abstention).toHaveProperty('policyHold')})
 it('stores exact return points structurally',()=>{const f=normalizeQl7SupportTopicFrame({topicId:'wallet',exactReturnPoint:{propositionId:'p1',openQuestionId:'q1',pendingActionId:'a1',requiredFactIds:['f1'],lastUserCommitmentId:'u1',lastSystemCommitmentId:'s1',turnId:'t1',memoryVersion:7}});expect(validateQl7SupportTopicFrame(f).ok).toBe(true);expect(f.exactReturnPoint.memoryVersion).toBe(7)})
 it('has explicit 32 locale static Support UI copy without fallback',()=>{const a=auditQl7SupportSurfaceCopyRegistry();expect(a.ok).toBe(true);expect(a.localeCount).toBe(32)})
 it('learning candidates are receipts and never deployment authority',()=>{const r=buildQl7CalibrationCandidateReceipt({candidateId:'c1',actorIdHash:'a',locale:'en',domainId:'forum',actual:'x',expectedInvariants:['y']});expect(r.deploymentAuthority).toBe(false);expect(r.receiptHash).toMatch(/^[a-f0-9]{64}$/)})
 it('human review requires distinct blind reviewers',()=>{expect(validateQl7HumanReviewPair({leftReviewerId:'a',rightReviewerId:'a'}).ok).toBe(false);expect(validateQl7HumanReviewPair({leftReviewerId:'a',rightReviewerId:'b',left:[{scenarioId:'1',verdict:'pass'}],right:[{scenarioId:'1',verdict:'pass'}]}).ok).toBe(true)})
 it('uses exact punitive zero-FP confidence gate',()=>{const r=punitiveFalsePositiveClaim({falsePositives:0,total:300000});expect(r.ok).toBe(true);expect(r.upperBound).toBeLessThan(0.00001)})
 it('keeps descendants of the same semantic family in one split',()=>{const a=allocateDatasetSplit({familyId:'family',lineageId:'parent',seed:'s'}),b=allocateDatasetSplit({familyId:'family',lineageId:'child',seed:'s'});expect(a.split).toBe(b.split)})
 it('native model receipt binds release/model/tokenizer/request/output hashes',()=>{const r=createQl7NativeModelReceipt({modelRole:'generator',releaseId:'r',modelArtifactHash:'a'.repeat(64),tokenizerHash:'b'.repeat(64),requestHash:'c'.repeat(64),outputHash:'d'.repeat(64),inputLocale:'en',status:'ok'});expect(r.modelRole).toBe('generator');expect(r.outputHash).toMatch(/^[a-f0-9]{64}$/);expect(r.receiptHash).toMatch(/^[a-f0-9]{64}$/)})
})

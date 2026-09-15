import crypto from 'node:crypto'
import {buildQl7BeliefState} from './beliefState.js'
import {createQl7EvidenceGraph,findQl7MaterialContradictions} from './evidenceGraph.js'
import {createQl7PlanGraph} from './planGraph.js'
import {selectQl7CognitiveComputeTier} from './computePolicy.js'
export const QL7_COGNITIVE_TURN_STATE_VERSION='1.0.0'
const h=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export function createQl7CognitiveTurnState(input={}){
 const semantic=input.semantic||{};const hypotheses=semantic.hypotheses||semantic.topicsTopK||[];const beliefs=buildQl7BeliefState({hypotheses,temperature:input.temperature||1,counterEvidence:input.counterEvidence||{}})
 const evidence=createQl7EvidenceGraph(input.evidenceGraph||{});const contradictions=findQl7MaterialContradictions(evidence)
 const uncertainty=Object.freeze({entropy:beliefs.normalizedEntropy,margin:beliefs.margin,unknownProbability:beliefs.unknownProbability,materialContradictionCount:contradictions.length})
 const compute=selectQl7CognitiveComputeTier({entropy:uncertainty.entropy,risk:input.risk||0,multiIntent:input.multiIntent||0,sourceNeed:input.sourceNeed||0,contradiction:Math.min(1,contradictions.length/2),memoryDepth:input.memoryDepth||0,ood:semantic.oodScore||0})
 const plan=input.plan?createQl7PlanGraph(input.plan):null;const body={schema:'ql7.support.cognitive-turn-state',schemaVersion:QL7_COGNITIVE_TURN_STATE_VERSION,turnId:String(input.turnId||input.operationId||''),inputReceipt:input.inputReceipt||null,normalization:input.normalization||null,semantic,beliefs,discourse:input.discourse||null,memoryView:input.memoryView||null,evidence,constraints:input.constraints||null,goals:input.goals||null,plan,reads:input.reads||null,policies:input.policies||null,uncertainty,compute,generation:input.generation||null,critic:input.critic||null,stateVersion:Number(input.stateVersion||1),modelReleaseId:String(input.modelReleaseId||'')};return Object.freeze({...body,cognitiveStateHash:h(body)})
}

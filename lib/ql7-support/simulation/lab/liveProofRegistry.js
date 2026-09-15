import {QL7_SUPPORT_CAPABILITIES} from '../capabilityRegistry.js'
import {ql7StableHash} from '../../internal/text.js'
export const QL7_SUPPORT_LIVE_PROOF_REGISTRY_VERSION='ql7.live-proof-registry.1'
const extra=Object.freeze([
 {proofId:'native.model.health',family:'neural',mode:'live',risk:'high'},
 {proofId:'native.model.generation',family:'conversation',mode:'live',risk:'normal'},
 {proofId:'native.model.critic',family:'conversation',mode:'live',risk:'normal'},
 {proofId:'knowledge.hybrid-retrieval',family:'knowledge',mode:'live',risk:'normal'},
 {proofId:'read.typed-live',family:'read',mode:'live',risk:'high'},
 {proofId:'security.attack-protection',family:'security',mode:'live',risk:'critical'},
 {proofId:'security.asset-protection',family:'security',mode:'live',risk:'critical'},
 {proofId:'presentation.cards-tables-badges',family:'presentation',mode:'live',risk:'normal'},
 {proofId:'composer.forum',family:'composer',mode:'live',risk:'high'},
 {proofId:'composer.battle-chat',family:'composer',mode:'live',risk:'high'},
])
const capMap=new Map();for(const c of QL7_SUPPORT_CAPABILITIES){const proof=Object.freeze({proofId:`capability:${c.capabilityId}`,family:c.scenarioFamily||c.kind||'runtime',mode:c.proofMode||'runtime',risk:c.risk||'normal',capabilityId:c.capabilityId,productionOwner:c.productionOwner,productionEntry:c.productionEntry,evidenceArtifact:c.evidenceArtifact});if(!capMap.has(proof.proofId))capMap.set(proof.proofId,proof)}
const caps=Object.freeze([...capMap.values()])
export const QL7_SUPPORT_LIVE_PROOFS=Object.freeze([...caps,...extra])
export const QL7_SUPPORT_LIVE_PROOF_REGISTRY_HASH=ql7StableHash(JSON.stringify(QL7_SUPPORT_LIVE_PROOFS))
export function getQl7LiveProof(id=''){return QL7_SUPPORT_LIVE_PROOFS.find(p=>p.proofId===id)||null}
export function listQl7LiveProofs({family=''}={}){return Object.freeze(QL7_SUPPORT_LIVE_PROOFS.filter(p=>!family||p.family===family))}
export function auditQl7LiveProofRegistry(){const ids=new Set(),failures=[];for(const p of QL7_SUPPORT_LIVE_PROOFS){if(!p.proofId)failures.push('empty_id');if(ids.has(p.proofId))failures.push(`duplicate:${p.proofId}`);ids.add(p.proofId);if(p.capabilityId&&(!p.productionOwner||!p.productionEntry))failures.push(`unbound:${p.proofId}`)}return Object.freeze({ok:!failures.length,count:QL7_SUPPORT_LIVE_PROOFS.length,capabilityCount:caps.length,registryHash:QL7_SUPPORT_LIVE_PROOF_REGISTRY_HASH,failures:Object.freeze(failures)})}

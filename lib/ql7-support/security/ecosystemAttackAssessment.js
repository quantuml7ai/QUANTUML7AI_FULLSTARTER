import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
export const QL7_SUPPORT_ECOSYSTEM_ATTACK_ASSESSMENT_VERSION='6.0.0'
export const QL7_SUPPORT_ECOSYSTEM_ATTACK_ASSESSMENT_OWNER_ID='ql7-support.ecosystem-attack-assessment'
const HINT=/(?:ddos|dos attack|cyber ?attack|hack(?:ing)? attack|breach|take down|wipe data|destroy server|кибератак|ддос|взлом|положить сервер|стереть данные|атаковать quantum|атаковать квантум)/iu
const SAFE_HINT=/(?:defend|protect|prevent|mitigate|news|report|history|education|authorized|защит|предотврат|смягч|новост|истори|учебн|разрешенн|авторизован)/iu
const OPERATIONAL_CLASSES=new Set(['property_destruction_incitement','terrorism_operational_intent','murder_or_mass_harm_intent','violence_incitement'])
export function assessQl7SupportEcosystemAttack({text='',locale='en',safety={},analysis={},semanticSignals=[],entities={}}={}){
 const source=ql7Str(text);const hints=Object.freeze({attackLexicalHint:HINT.test(source),safeContextLexicalHint:SAFE_HINT.test(source)})
 const semanticClass=ql7Str(safety?.category||analysis?.safetyCategory);const actionability=Boolean(safety?.actionability?.material||safety?.materialActionability||analysis?.materialActionability||analysis?.actionability)
 const safeContext=Boolean(safety?.quoted||safety?.reportedSpeech||safety?.newsHistoricalEducational||safety?.counterSpeech||safety?.victimReport||analysis?.reportedSpeech||analysis?.newsHistoricalEducational||hints.safeContextLexicalHint)
 const ecosystemTarget=Boolean(analysis?.ecosystemTarget||entities?.product||entities?.service||hints.attackLexicalHint)
 const semanticOperational=OPERATIONAL_CLASSES.has(semanticClass)||Boolean(safety?.threat&&actionability)
 const operational=semanticOperational&&ecosystemTarget&&actionability&&!safeContext
 const evidence=Object.freeze([`safety:${semanticClass||'none'}`,actionability?'actionability:material':'actionability:not_proven',ecosystemTarget?'target:ecosystem_or_property':'target:not_proven',safeContext?'context:safe_or_reported':'context:no_safe_override',...ql7Arr(semanticSignals).slice(0,12).map((r)=>`signal:${ql7Str(r?.family||r?.id||r)}`)])
 const body={schema:'ql7.support.ecosystem-attack-assessment',schemaVersion:QL7_SUPPORT_ECOSYSTEM_ATTACK_ASSESSMENT_VERSION,ownerId:QL7_SUPPORT_ECOSYSTEM_ATTACK_ASSESSMENT_OWNER_ID,locale:ql7Str(locale),semanticClass,actionability,ecosystemTarget,safeContext,operational,evidence,hints,decision:operational?'deny_operational_guidance_and_route_to_security_policy':'allow_contextual_discussion',semanticAssessmentOnly:true,punitiveDecision:false,requiresDeterministicPolicyReceipt:operational,securityPlaneSignal:Object.freeze({signalType:'semantic_ecosystem_attack_risk',riskClass:operational?'high':'low',objectiveProof:false,enforcementAllowed:false})}
 const receiptHash=ql7StableHash(JSON.stringify({...body,textHash:ql7StableHash(source)}));return Object.freeze({...body,receiptId:`ecosystem-attack:${receiptHash}`,receiptHash})
}

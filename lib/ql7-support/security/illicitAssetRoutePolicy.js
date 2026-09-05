import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
export const QL7_SUPPORT_ILLICIT_ASSET_ROUTE_POLICY_VERSION='6.0.0'
export const QL7_SUPPORT_ILLICIT_ASSET_ROUTE_POLICY_OWNER_ID='ql7-support.illicit-asset-route-policy'
const LAWFUL=Object.freeze(['top_up','academy_exam_reward','qcoin_drop','heartbeat_activity','quest_reward','referral_reward','battlecoin_settlement','metamarket_sale_gift','correction_reversal'])
const ABUSE_HINT=/(?:steal|drain|take over|bypass|fake receipt|forge receipt|exploit reward|double spend|seed phrase|private key|stolen card|chargeback fraud|украсть|вывести чуж|обойти|подделать (?:чек|квитанц)|эксплойт|сид.?фраз|приватн(?:ый|ий) ключ|чужой кошел|взломать баланс|накрутить qcoin|краден|викрасти|обійти|підробити)/iu
const SAFE_HINT=/(?:news|article|report|victim|protect|defend|prevent|how to avoid|новост|статья|жертва|защит|предотврат|как избежать|як уникнути|захист)/iu
export function evaluateQl7SupportIllicitAssetRoute({text='',locale='en',analysis={},safety={},economicIntent={},semanticSignals=[]}={}){
 const source=ql7Str(text);const abuseLexicalHint=ABUSE_HINT.test(source),safeLexicalHint=SAFE_HINT.test(source)
 const materialIntent=ql7Str(analysis?.primaryIntent||analysis?.messageAct);const actionability=Boolean(safety?.materialActionability||analysis?.materialActionability||analysis?.actionability)
 const safeContext=Boolean(safety?.quoted||safety?.reportedSpeech||safety?.newsHistoricalEducational||safety?.counterSpeech||safety?.victimReport||safeLexicalHint)
 const economicAbuseEvidence=Boolean(economicIntent?.unauthorized===true||economicIntent?.bypassRequested===true||economicIntent?.fraudEvidence===true||analysis?.scamCrimeSignal===true)
 const operationalAbuse=actionability&&!safeContext&&(economicAbuseEvidence||Boolean(abuseLexicalHint&&['how_to_question','informational_question','incident_report'].includes(materialIntent)))
 const body={schema:'ql7.support.illicit-asset-route-assessment',schemaVersion:QL7_SUPPORT_ILLICIT_ASSET_ROUTE_POLICY_VERSION,ownerId:QL7_SUPPORT_ILLICIT_ASSET_ROUTE_POLICY_OWNER_ID,locale:ql7Str(locale),materialIntent,actionability,safeContext,economicAbuseEvidence,abuseLexicalHint,decision:operationalAbuse?'deny_operational_guidance':'allow_or_explain_lawful_route',lawfulRouteFamilies:LAWFUL,operatorCaseRequired:false,punitiveDecision:false,semanticAssessmentOnly:true,requiresEconomicPolicyReceipt:operationalAbuse,assetProtectionSignal:Object.freeze({signalType:'semantic_asset_abuse_risk',objectiveProof:false,enforcementAllowed:false,requiresServerEconomicReceipt:operationalAbuse}),evidence:Object.freeze([actionability?'actionability:material':'actionability:not_proven',economicAbuseEvidence?'economic:abuse_evidence':'economic:no_deterministic_abuse_evidence',safeContext?'context:safe_or_reported':'context:no_safe_override',...ql7Arr(semanticSignals).slice(0,12).map((r)=>`signal:${ql7Str(r?.family||r?.id||r)}`)])}
 const receiptHash=ql7StableHash(JSON.stringify({...body,textHash:ql7StableHash(source)}));return Object.freeze({...body,receiptId:`illicit-asset-route:${receiptHash}`,receiptHash})
}
export function listQl7SupportLawfulDigitalAssetRoutes(){return LAWFUL}

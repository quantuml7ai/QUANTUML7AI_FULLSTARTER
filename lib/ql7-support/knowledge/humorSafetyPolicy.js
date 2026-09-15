import {ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_HUMOR_SAFETY_POLICY_VERSION='5.2.2'
export const QL7_SUPPORT_HUMOR_SAFETY_OWNER_ID='ql7-support.humor-safety-policy'

const CRITICAL=new Set([
  'self_harm','crisis','crisis_ideation','crisis_immediate','credible_threat','credible_personal_threat',
  'terrorism_operational_intent','murder_or_mass_harm_intent','violence_incitement','war_or_riot_incitement',
  'property_destruction_incitement','account_compromise','fraud_loss','financial_incident','security_incident',
])
const SENSITIVE=new Set(['grief','loss','bereavement','bullying','loneliness','anxiety','shame','relapse_fear'])
const SAFE_CONTEXT=new Set(['clean_respectful','news_historical_educational_context','counter_speech','quoted_or_reported_harm'])

const normalize=(value)=>ql7Str(value).trim().toLowerCase().replace(/[\s-]+/gu,'_')
function unique(values=[]){return Object.freeze([...new Set(values.filter(Boolean))])}

export function evaluateQl7SupportHumorSafety({
  requested=false,
  userInitiatedHumor=false,
  safetyClass='',
  emotionClass='',
  incidentClass='',
  crisisAssessment=null,
  materialRequestPresent=false,
  financialOrSecurityComplaint=false,
  currentTurnRisk='low',
  conversationContext={},
}={}){
  const safety=normalize(safetyClass),emotion=normalize(emotionClass),incident=normalize(incidentClass),risk=normalize(currentTurnRisk||'low')
  const signals=unique([safety,emotion,incident])
  const criticalSignals=unique(signals.filter((value)=>CRITICAL.has(value)))
  const sensitiveSignals=unique(signals.filter((value)=>SENSITIVE.has(value)))
  const crisisActive=crisisAssessment?.selfHarm===true||crisisAssessment?.immediateDanger===true||['crisis_ideation','crisis_immediate'].includes(normalize(crisisAssessment?.decision))
  const materialPriority=materialRequestPresent===true&&requested!==true
  const operationalComplaint=financialOrSecurityComplaint===true||['fraud_loss','financial_incident','security_incident','account_compromise'].includes(incident)
  const explicitHighRisk=['critical','severe','high'].includes(risk)
  const sensitiveNeedsExplicitOptIn=sensitiveSignals.length>0&&userInitiatedHumor!==true
  const blockReasons=[]
  if(crisisActive)blockReasons.push('crisis_priority')
  if(criticalSignals.length)blockReasons.push(...criticalSignals.map((v)=>`critical:${v}`))
  if(operationalComplaint)blockReasons.push('financial_or_security_incident')
  if(explicitHighRisk)blockReasons.push(`risk:${risk}`)
  if(sensitiveNeedsExplicitOptIn)blockReasons.push('sensitive_context_without_user_humor_opt_in')
  if(materialPriority)blockReasons.push('material_request_priority')
  const allowed=requested===true&&blockReasons.length===0
  const benignContext=SAFE_CONTEXT.has(safety)||(!safety&&!incident&&!crisisActive)
  const body={
    schema:'ql7.support.humor-safety-decision',schemaVersion:QL7_SUPPORT_HUMOR_SAFETY_POLICY_VERSION,ownerId:QL7_SUPPORT_HUMOR_SAFETY_OWNER_ID,
    requested:requested===true,userInitiatedHumor:userInitiatedHumor===true,allowed,
    decision:requested!==true?'not_requested':allowed?'allow_humor':'suppress_humor',
    criticalSignals,sensitiveSignals,blockingSignals:unique(blockReasons),benignContext,
    materialRequestPresent:materialRequestPresent===true,financialOrSecurityComplaint:operationalComplaint,
    crisisPriority:crisisActive,humanSafetyPriority:crisisActive?'highest':criticalSignals.length?'critical':sensitiveSignals.length?'sensitive':'normal',
    policyNotes:Object.freeze({noHumorDuringCrisis:true,noHumorDuringOperationalLoss:true,materialIntentNotDisplaced:true,falseHumanBiographyForbidden:true}),
    contextHash:ql7StableHash(JSON.stringify({safety,emotion,incident,risk,crisisActive,requested,userInitiatedHumor,conversationContext})),
  }
  return Object.freeze({...body,receiptHash:ql7StableHash(JSON.stringify(body))})
}

export function auditQl7SupportHumorSafetyPolicy(){
  const cases=[
    {id:'clean-request',input:{requested:true,safetyClass:'clean_respectful'},allowed:true},
    {id:'crisis',input:{requested:true,userInitiatedHumor:true,crisisAssessment:{selfHarm:true,decision:'crisis_ideation'}},allowed:false},
    {id:'terror',input:{requested:true,safetyClass:'terrorism_operational_intent'},allowed:false},
    {id:'financial-loss',input:{requested:true,incidentClass:'financial_incident'},allowed:false},
    {id:'grief-no-optin',input:{requested:true,emotionClass:'grief'},allowed:false},
    {id:'grief-user-optin',input:{requested:true,userInitiatedHumor:true,emotionClass:'grief'},allowed:true},
  ]
  const rows=cases.map((row)=>{const result=evaluateQl7SupportHumorSafety(row.input);return Object.freeze({id:row.id,expected:row.allowed,actual:result.allowed,ok:result.allowed===row.allowed})})
  const failures=rows.filter((row)=>!row.ok).map((row)=>row.id)
  return Object.freeze({schema:'ql7.support.humor-safety-policy-audit',schemaVersion:QL7_SUPPORT_HUMOR_SAFETY_POLICY_VERSION,ok:failures.length===0,rows:Object.freeze(rows),failures:Object.freeze(failures)})
}

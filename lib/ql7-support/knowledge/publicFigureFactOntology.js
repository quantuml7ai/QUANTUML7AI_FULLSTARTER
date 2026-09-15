import {ql7StableHash, ql7Str} from '../internal/text.js'
import {buildQl7SupportKnowledgeSourceReceipt} from './sourceReceipt.js'

export const QL7_SUPPORT_PUBLIC_FIGURE_FACT_ONTOLOGY_VERSION='5.4.3'

const DEF=Object.freeze({
  stable_identity:{sourceRequired:false,currentSensitive:false,publicOnly:true},
  broad_category:{sourceRequired:false,currentSensitive:false,publicOnly:true},
  biography:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  birth_date:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  death_date:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  birth_place:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  occupation:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  known_for:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  notable_work:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  award:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  career_milestone:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  fame_start:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  education_public:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  nationality_public:{sourceRequired:true,currentSensitive:false,publicOnly:true},
  current_role:{sourceRequired:true,currentSensitive:true,publicOnly:true},
  current_team:{sourceRequired:true,currentSensitive:true,publicOnly:true},
  current_company:{sourceRequired:true,currentSensitive:true,publicOnly:true},
  current_status:{sourceRequired:true,currentSensitive:true,publicOnly:true},
  latest_event:{sourceRequired:true,currentSensitive:true,publicOnly:true},
  latest_award:{sourceRequired:true,currentSensitive:true,publicOnly:true},
  current_record:{sourceRequired:true,currentSensitive:true,publicOnly:true},
})

export const QL7_SUPPORT_PUBLIC_FIGURE_FACT_KINDS=Object.freeze(Object.keys(DEF))
export const QL7_SUPPORT_PUBLIC_FIGURE_FORBIDDEN_PRIVATE_FACTS=Object.freeze([
  'home_address','private_phone','private_email','private_location','live_location','credentials','session_token',
  'private_finance','bank_account','private_medical','private_family_detail','private_identifier','password','seed_phrase','private_key',
])

export function getQl7SupportPublicFigureFactPolicy(kind='stable_identity'){
  const id=ql7Str(kind)||'stable_identity'
  return Object.freeze({kind:id,...(DEF[id]||{sourceRequired:true,currentSensitive:false,publicOnly:true,unknownKind:true})})
}

export function validateQl7SupportPublicFigureFactBundle(bundle={}, {personId='',questionKind='stable_identity',expectedSourceReceiptId=''}={}){
  const failures=[],facts=[]
  const expectedPerson=ql7Str(personId)
  if(bundle&&typeof bundle==='object'&&bundle.personId&&expectedPerson&&ql7Str(bundle.personId)!==expectedPerson) failures.push('person_mismatch')
  for(const raw of Array.isArray(bundle?.facts)?bundle.facts:[]){
    const kind=ql7Str(raw?.kind)
    const policy=getQl7SupportPublicFigureFactPolicy(kind)
    if(policy.unknownKind) { failures.push(`unknown_fact_kind:${kind}`); continue }
    if(QL7_SUPPORT_PUBLIC_FIGURE_FORBIDDEN_PRIVATE_FACTS.includes(kind)){failures.push(`private_fact_forbidden:${kind}`);continue}
    const value=ql7Str(raw?.displayValue||raw?.value).slice(0,320)
    const sourceReceiptId=ql7Str(raw?.sourceReceiptId||bundle?.sourceReceiptId)
    if(!value) { failures.push(`fact_value_missing:${kind}`); continue }
    if(policy.sourceRequired&&!sourceReceiptId) { failures.push(`fact_source_missing:${kind}`); continue }
    if(policy.sourceRequired&&expectedSourceReceiptId&&sourceReceiptId!==ql7Str(expectedSourceReceiptId)){failures.push(`fact_source_receipt_mismatch:${kind}`);continue}
    facts.push(Object.freeze({
      factId:ql7Str(raw?.factId)||`public-figure:${expectedPerson}:${kind}`,
      kind,value,displayValue:value,sourceReceiptId,
      currentSensitive:policy.currentSensitive===true,publicOnly:true,
      semanticHash:ql7StableHash(JSON.stringify({kind,value,sourceReceiptId})),
    }))
  }
  const requested=getQl7SupportPublicFigureFactPolicy(questionKind)
  if(requested.sourceRequired&&facts.length===0&&bundle?.status==='verified') failures.push('verified_bundle_without_requested_fact')
  const body={schema:'ql7.support.public-figure-fact-projection',schemaVersion:QL7_SUPPORT_PUBLIC_FIGURE_FACT_ONTOLOGY_VERSION,
    personId:expectedPerson,questionKind:ql7Str(questionKind)||'stable_identity',publicOnly:true,privateFactsForbidden:true,
    facts:Object.freeze(facts),status:failures.length?'invalid':ql7Str(bundle?.status)||'none',failures:Object.freeze(failures)}
  return Object.freeze({...body,ok:failures.length===0,projectionHash:ql7StableHash(JSON.stringify(body))})
}

const MATERIAL_KIND_MAP=Object.freeze({
  occupation:'occupation',
  historical_period:'broad_category',
  field:'broad_category',
  notable_contribution:'known_for',
  legacy:'known_for',
  notable_work:'notable_work',
  award:'award',
  historical_role:'career_milestone',
  milestone:'career_milestone',
})
const WHOLE_PROFILE_QUESTIONS=new Set(['stable_identity','biography'])
const QUESTION_KIND_MATCH=Object.freeze({
  broad_category:new Set(['broad_category']),
  occupation:new Set(['occupation']),
  known_for:new Set(['known_for','broad_category']),
  notable_work:new Set(['notable_work']),
  award:new Set(['award']),
  career_milestone:new Set(['career_milestone']),
  fame_start:new Set(['career_milestone']),
})

export function buildQl7SupportBundledStablePublicFigureFactProjection({figure=null,questionKind='stable_identity'}={}){
  const personId=ql7Str(figure?.personId)
  const requestedKind=ql7Str(questionKind)||'stable_identity'
  const candidates=(Array.isArray(figure?.substantiveStableFacts)?figure.substantiveStableFacts:[]).filter((fact)=>{
    const mapped=MATERIAL_KIND_MAP[ql7Str(fact?.factType)]
    return Boolean(mapped&&ql7Str(fact?.value)&&fact?.displayEligible!==false&&fact?.publicOnly===true&&fact?.currentSensitive!==true&&Array.isArray(fact?.sourceRefs)&&fact.sourceRefs.some((ref)=>ql7Str(ref)&&!ql7Str(ref).startsWith('catalog:')))
  })
  const allowedKinds=QUESTION_KIND_MATCH[requestedKind]
  const selected=WHOLE_PROFILE_QUESTIONS.has(requestedKind)
    ? candidates.slice(0,4)
    : allowedKinds
      ? candidates.filter((fact)=>allowedKinds.has(MATERIAL_KIND_MAP[ql7Str(fact?.factType)])).slice(0,4)
      : []
  if(!personId||selected.length===0){
    return Object.freeze({
      available:false,
      sourceReceipt:null,
      projection:validateQl7SupportPublicFigureFactBundle({}, {personId,questionKind:requestedKind}),
    })
  }
  const sourceRefs=[...new Set(selected.flatMap((fact)=>fact.sourceRefs||[]).map(ql7Str).filter(Boolean))].sort()
  const checkedAt=selected.map((fact)=>ql7Str(fact?.sourceCheckedAt)).filter(Boolean).sort().at(-1)||''
  const claimHash=ql7StableHash(JSON.stringify(selected.map((fact)=>({factId:fact.factId,factType:fact.factType,value:fact.value}))))
  const evidenceHash=ql7StableHash(JSON.stringify(sourceRefs))
  const sourceReceipt=buildQl7SupportKnowledgeSourceReceipt({
    factId:`public-figure:${personId}:stable-bundle`,
    subjectId:personId,
    sourceClass:'curated_stable',
    sourceRef:sourceRefs[0],
    verifiedAt:checkedAt,
    freshnessClass:'stable_historical_public_fact',
    localeRealizationPlan:'public_figure_semantic_fact',
    currentSensitive:false,
    claimHash,
    evidenceHash,
    status:'verified',
  })
  const bundle={
    personId,
    status:'verified',
    sourceReceiptId:sourceReceipt.receiptId,
    facts:selected.map((fact)=>({
      factId:ql7Str(fact.factId)||`public-figure:${personId}:${ql7Str(fact.factType)}`,
      kind:MATERIAL_KIND_MAP[ql7Str(fact.factType)],
      rawKind:ql7Str(fact.factType),
      value:ql7Str(fact.value),
      sourceReceiptId:sourceReceipt.receiptId,
    })),
  }
  return Object.freeze({
    available:true,
    sourceReceipt,
    sourceRefs:Object.freeze(sourceRefs),
    projection:validateQl7SupportPublicFigureFactBundle(bundle, {
      personId,
      questionKind:requestedKind,
      expectedSourceReceiptId:sourceReceipt.receiptId,
    }),
  })
}

export function auditQl7SupportPublicFigureFactOntology(){
  const failures=[]
  for(const [kind,row] of Object.entries(DEF)){
    if(!kind||row.publicOnly!==true)failures.push(`public_only:${kind}`)
    if(row.currentSensitive===true&&row.sourceRequired!==true)failures.push(`current_source:${kind}`)
  }
  for(const kind of QL7_SUPPORT_PUBLIC_FIGURE_FORBIDDEN_PRIVATE_FACTS) if(DEF[kind]) failures.push(`private_kind_registered:${kind}`)
  return Object.freeze({schema:'ql7.support.public-figure-fact-ontology-audit',schemaVersion:QL7_SUPPORT_PUBLIC_FIGURE_FACT_ONTOLOGY_VERSION,
    ok:failures.length===0,factKindCount:Object.keys(DEF).length,forbiddenPrivateFactCount:QL7_SUPPORT_PUBLIC_FIGURE_FORBIDDEN_PRIVATE_FACTS.length,
    failures:Object.freeze(failures)})
}

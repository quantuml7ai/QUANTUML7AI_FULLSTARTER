import crypto from 'node:crypto'
import { normalizeQl7SupportCardV2, validateQl7SupportCardV2 } from './cardSchemaV2.js'
import { localizeQl7SupportBadgeRailLabelV11_6, resolveQl7SemanticBadgeV11_6 } from './semanticBadgeRegistryV11_6.js'
import { localizeQl7EvidenceValueV11_6, sanitizeQl7EvidenceRowsV11_6 } from './evidencePolicyV11_6.js'
import { isQl7MetricAllowedV9, ql7MetricFormatV9 } from './metricRegistryV9.js'
import { inferQl7PurposeV8, QL7_SUPPORT_THEME_BY_PURPOSE_V8, localizeQl7ContentTypeV8, localizeQl7MetricV8, localizeQl7StatusV8, ql7SupportDirectionV8, ql7SupportLabelsV8, ql7SupportLocaleV8, ql7SupportRenderLocaleV8, semanticDedupeV8 } from './presentationV8.js'
export const QL7_SUPPORT_CARD_VERSION_V3=3
const SAFE=/^[a-f0-9]{64}$/i
function s(v){return String(v??'').trim()}
function hash(v){return crypto.createHash('sha256').update(JSON.stringify(v??null)).digest('hex')}
function clone(v){try{return JSON.parse(JSON.stringify(v??null))}catch{return null}}
function safeText(v,n=2000){return s(v).slice(0,n)}
const UNAVAILABLE_STATUS_RE_V3=/^(?:unavailable|mongo_unavailable|provider_unavailable|provider_failure|timeout|source_unavailable)$/iu
const EVIDENCE_META_KEY_RE_V3=/^(?:status|branch|source|sourceStatus|adapterId|error|errors|raw|query|collections|businessCollectionsRead|businessCollectionsWritten|unavailableSources|asOf|updatedAt|checkedAt|generatedAt|readOnly|ok)$/iu
function machineKey(v=''){return s(v).replace(/([a-z])([A-Z])/g,'$1_$2').replace(/[\s-]+/g,'_').toLowerCase()}
function hasMeaningfulEvidenceV3(value,key=''){
 if(EVIDENCE_META_KEY_RE_V3.test(machineKey(key)))return false
 if(value===0||value===false)return true
 if(value===undefined||value===null||s(value)==='')return false
 if(Array.isArray(value))return value.some((item)=>hasMeaningfulEvidenceV3(item,key))
 if(typeof value==='object')return Object.entries(value).some(([childKey,childValue])=>hasMeaningfulEvidenceV3(childValue,childKey))
 return true
}
function hasVerifiedContentV3(base={},metrics=[]){
 if(Array.isArray(metrics)&&metrics.some((row)=>hasMeaningfulEvidenceV3(row?.value,row?.key||row?.label)))return true
 if(Array.isArray(base?.table?.rows)&&base.table.rows.some((row)=>hasMeaningfulEvidenceV3(row,'table')))return true
 if(Array.isArray(base?.facts)&&base.facts.some((item)=>hasMeaningfulEvidenceV3(item,'facts')))return true
 if(Array.isArray(base?.checks)&&base.checks.some((item)=>hasMeaningfulEvidenceV3(item,'checks')))return true
 return false
}
function effectiveStatusCodeV3(statusCode='',base={},metrics=[]){
 const code=s(statusCode)
 return UNAVAILABLE_STATUS_RE_V3.test(code)&&hasVerifiedContentV3(base,metrics)?'healthy':code
}
function shouldExposeCheckedAtV3(base={},purpose='',statusCode='',metrics=[]){
 const checkedAt=s(base.asOf||base.checkedAt)
 if(!checkedAt)return false
 const semantic=`${base.kind||''} ${base.purpose||''} ${purpose||''} ${statusCode||''}`
 const verified=/diagnostic|data_table|case_result|qcoin|ads|vip|payment|moderation|security|safety|restriction|success|healthy|active|confirmed|inconsistent|expired/iu.test(semantic)||hasVerifiedContentV3(base,metrics)
 const conversational=/choice|clarification|conversation|social|humor|partnership|greeting|notice|pending/iu.test(semantic)
 return verified&&!conversational
}
function metricRows(input={},locale='en'){
 const rows=[]
 const add=(key,label,value,format='text',tone='neutral')=>{if(value===undefined||value===null||value==='')return;rows.push({key,label:label||localizeQl7MetricV8(key,locale),value,format,tone,visibility:'both'})}
 const source=input.metrics&&typeof input.metrics==='object'?input.metrics:{}
 if(Array.isArray(source)){
  for(const item of source){const key=s(item?.key||item?.label);if(key)add(key,s(item?.label),item?.value,item?.format||(isQl7MetricAllowedV9(key)?ql7MetricFormatV9(key):(typeof item?.value==='number'?'integer':'text')),item?.tone||'neutral')}
 }else{
  for(const [key,value] of Object.entries(source))add(key,'',value,isQl7MetricAllowedV9(key)?ql7MetricFormatV9(key):(typeof value==='number'?'integer':'text'))
 }
 const columns=Array.isArray(input?.table?.columns)?input.table.columns:[]
 for(const [rowIndex,row] of (Array.isArray(input?.table?.rows)?input.table.rows:[]).entries()){
  for(const column of columns){const key=s(column?.key);if(key)add(`legacy-table-${rowIndex}-${key}`,s(column?.label),row?.[key],typeof row?.[key]==='number'?'integer':'text')}
 }
 return rows.filter((row,index,array)=>array.findIndex(x=>String(x.label).toLowerCase()===String(row.label).toLowerCase()&&String(x.value)===String(row.value))===index).slice(0,64)
}
function localizedSnapshot(input,locale){
 if(!input||typeof input!=='object')return input??null
 return{...clone(input),contentType:s(input.contentType)?localizeQl7ContentTypeV8(input.contentType,locale):input.contentType}
}
function sanitizeLegacyTableV3(table,locale){
 if(!table||typeof table!=='object')return null
 const columns=(Array.isArray(table.columns)?table.columns:[]).map((column,index)=>({key:s(column?.key||`column-${index}`).slice(0,80),label:s(column?.label).slice(0,160)})).filter((column)=>column.key&&column.label).slice(0,16)
 if(!columns.length)return{...clone(table),columns:[],rows:[]}
 const rows=[]
 for(const source of (Array.isArray(table.rows)?table.rows:[]).slice(0,32)){
  if(!source||typeof source!=='object')continue
  const row={}
  let meaningful=false
  for(const column of columns){
   const raw=source[column.key]
   if(raw===undefined||raw===null||s(raw)==='')continue
   const value=localizeQl7EvidenceValueV11_6(raw,locale)
   if(!value||/^(?:undefined|null|nan)$/iu.test(value))continue
   row[column.key]=value;meaningful=true
  }
  if(meaningful)rows.push(row)
 }
 return{...clone(table),columns,rows}
}
export function normalizeQl7SupportCardV3(input={}){
 const locale=ql7SupportRenderLocaleV8(input.locale);const dictionaryLocale=ql7SupportLocaleV8(input.locale);const purpose=inferQl7PurposeV8(input);const labels=ql7SupportLabelsV8(dictionaryLocale)
 const rawStatusCode=s(input?.status?.code||input.status||input.branch)
 const v2=Number(input.version)===2?normalizeQl7SupportCardV2(input):null
 const base=v2||input
 const sections=[]
 const push=(id,title,items,tone='neutral')=>{const clean=semanticDedupeV8(items).map((x,i)=>typeof x==='object'?{id:s(x.id||`${id}-${i}`),label:s(x.label),value:s(x.value||x.text||x.message),asOf:s(x.asOf)}:{id:`${id}-${i}`,value:s(x)}).filter(x=>x.label||x.value);if(clean.length)sections.push({id,title,tone,items:clean})}
 push('confirmed',labels.confirmed,base.facts)
 push('checks',labels.checks,base.checks)
 push('anomalies',labels.details,base.anomalies,'warning')
 push('next',labels.next,base.nextActions,'accent')
 const badges=(Array.isArray(base.badges)?base.badges:[]).map((b,i)=>({id:s(b.id||`badge-${i}`),label:localizeQl7SupportBadgeRailLabelV11_6(b,dictionaryLocale),tone:s(b.tone||'neutral'),icon:s(b.icon||b.iconKey),assetId:s(b.assetId)})).filter(b=>b.label).filter((b,i,a)=>a.findIndex(x=>x.label.toLowerCase()===b.label.toLowerCase())===i).slice(0,10)
 const rows=metricRows(base,dictionaryLocale)
 const statusCode=effectiveStatusCodeV3(rawStatusCode,base,rows)
 const statusTone=/inconsistent|expired|blocked|violation|fraud|threat/i.test(statusCode)?'warning':(/active|healthy|success|confirmed/i.test(statusCode)?'success':'neutral')
 const semanticBadge=resolveQl7SemanticBadgeV11_6({semanticIcon:base.semanticIcon||base.semanticRole,purpose,status:statusCode,topic:base.topic||base.domain,emotion:base.emotion?.emotion,locale:dictionaryLocale})
 const statusCandidate=statusCode?{code:statusCode,label:s(base?.status?.label)||localizeQl7StatusV8(statusCode,dictionaryLocale),tone:s(base?.status?.tone)||statusTone,icon:s(base?.status?.icon)||'status'}:null
 const duplicateStatus=statusCandidate&&badges.some((badge)=>badge.label.toLowerCase()===statusCandidate.label.toLowerCase()||(/confirmed|healthy|verified/iu.test(statusCandidate.code)&&/verified|confirmed|подтвержд|проверено/iu.test(`${badge.id} ${badge.label}`))||(/blocked|cooldown/iu.test(statusCandidate.code)&&/blocked|paused|приостанов/iu.test(`${badge.id} ${badge.label}`)))
 const normalizedTable=sanitizeLegacyTableV3(base.table,dictionaryLocale)
 const payload={
  version:3,schema:'ql7.support.card.v3',id:s(base.id||base.caseId||hash(base).slice(0,24)),caseId:s(base.caseId),
  purpose,sourceKind:s(base.sourceKind||base.kind||base.purpose||purpose),topic:s(base.topic||base.domain),semanticRole:s(base.semanticRole||base.purpose),surfaceKind:s(base.surfaceKind||base.kind||'structured'),semanticIcon:s(base.semanticIcon||base.semanticRole||semanticBadge.key),semanticTone:semanticBadge.tone,svgAssetId:s(base.svgAssetId||base.primarySvg?.assetId),primarySvg:clone(base.primarySvg)||null,presentationState:s(base.presentationState||base.mood||base.emotion?.emotion||'neutral'),microIntent:s(base.microIntent),visualTheme:s(base.visualTheme)||QL7_SUPPORT_THEME_BY_PURPOSE_V8[purpose]||'knowledge-blue',severity:s(base.severity||(/violation|restriction|safety/.test(purpose)?'critical':(purpose==='complaint'?'warning':'info'))),
  locale,direction:ql7SupportDirectionV8(locale),title:safeText(base.title,240),summary:safeText(base.summary||base.body||base.prompt,1200),
  status:duplicateStatus?null:statusCandidate,
  badges,sections,metrics:sanitizeQl7EvidenceRowsV11_6(rows,dictionaryLocale),timeline:clone(base.timeline)||[],media:clone(base.media)||[],actions:clone(base.actions)||[],
  options:clone(base.options)||[],other:clone(base.other)||null,snapshot:localizedSnapshot(base.snapshot,dictionaryLocale),table:normalizedTable,
  emotion:base.emotion&&typeof base.emotion==='object'?{emotion:s(base.emotion.emotion||'neutral'),intensity:s(base.emotion.intensity||'low'),confidence:Math.max(0,Math.min(1,Number(base.emotion.confidence||0))),pulse:s(base.emotion.pulse||'none'),glyph:s(base.emotion.glyph||'◈').slice(0,4)}:null,
  labels:{...labels,...(clone(base.labels)||{})},checkedAt:shouldExposeCheckedAtV3(base,purpose,statusCode,rows)?s(base.asOf||base.checkedAt):'',generatedAt:s(base.generatedAt)||new Date().toISOString()
 }
 if(!payload.title&&!payload.summary)throw new Error('ql7_support_card_v3_content')
 return payload
}
export function buildQl7SupportCardV3(input={}){const body=normalizeQl7SupportCardV3(input);return Object.freeze({...body,integrity:{algorithm:'sha256',signature:hash(body),signedAt:new Date().toISOString()}})}
export function validateQl7SupportCardAny(card={}){
 if(Number(card?.version)===2)return validateQl7SupportCardV2(card)
 if(Number(card?.version)!==3||card?.schema!=='ql7.support.card.v3')return{ok:false,error:'card_version'}
 const sig=s(card?.integrity?.signature);if(!SAFE.test(sig))return{ok:false,error:'card_integrity'}
 const {integrity,...raw}=card
 if(!s(raw.title)&&!s(raw.summary))return{ok:false,error:'card_schema'}
 if(hash(raw)!==sig)return{ok:false,error:'card_integrity'}
 return{ok:true,card:Object.freeze({...raw,integrity:{algorithm:'sha256',signature:sig,signedAt:s(card?.integrity?.signedAt)}})}
}

import crypto from 'node:crypto'
import {localizeQl7SupportBadgeRailLabel, resolveQl7SemanticBadge} from '../semanticBadgeRegistry.js'
import {localizeQl7EvidenceValue, sanitizeQl7EvidenceRows} from '../evidencePolicy.js'
import {isQl7MetricAllowed, ql7MetricFormat} from '../metricRegistry.js'
import {inferQl7Purpose, QL7_SUPPORT_THEME_BY_PURPOSE, localizeQl7ContentType, localizeQl7PresentationMetric, localizeQl7Status, ql7SupportDirection, ql7SupportLabels, ql7SupportLocale, ql7SupportRenderLocale, semanticDedupe} from '../presentation.js'
export const QL7_SUPPORT_PRESENTATION_CARD_SCHEMA=4
const SAFE=/^[a-f0-9]{64}$/i
function s(v){return String(v??'').trim()}
function hash(v){return crypto.createHash('sha256').update(JSON.stringify(v??null)).digest('hex')}
function clone(v){try{return JSON.parse(JSON.stringify(v??null))}catch{return null}}
function safeText(v,n=2000){return s(v).slice(0,n)}
const UNAVAILABLE_STATUS_RE=/^(?:unavailable|mongo_unavailable|native_dependency_unavailable|native_dependency_failure|timeout|source_unavailable)$/iu
const EVIDENCE_META_KEY_RE=/^(?:status|branch|source|sourceStatus|adapterId|error|errors|raw|query|collections|businessCollectionsRead|businessCollectionsWritten|unavailableSources|asOf|updatedAt|checkedAt|generatedAt|readOnly|ok)$/iu
function machineKey(v=''){return s(v).replace(/([a-z])([A-Z])/g,'$1_$2').replace(/[\s-]+/g,'_').toLowerCase()}
function hasMeaningfulEvidence(value,key=''){
 if(EVIDENCE_META_KEY_RE.test(machineKey(key)))return false
 if(value===0||value===false)return true
 if(value===undefined||value===null||s(value)==='')return false
 if(Array.isArray(value))return value.some((item)=>hasMeaningfulEvidence(item,key))
 if(typeof value==='object')return Object.entries(value).some(([childKey,childValue])=>hasMeaningfulEvidence(childValue,childKey))
 return true
}
function hasVerifiedContent(base={},metrics=[]){
 if(Array.isArray(metrics)&&metrics.some((row)=>hasMeaningfulEvidence(row?.value,row?.key||row?.label)))return true
 if(Array.isArray(base?.table?.rows)&&base.table.rows.some((row)=>hasMeaningfulEvidence(row,'table')))return true
 if(Array.isArray(base?.facts)&&base.facts.some((item)=>hasMeaningfulEvidence(item,'facts')))return true
 if(Array.isArray(base?.checks)&&base.checks.some((item)=>hasMeaningfulEvidence(item,'checks')))return true
 return false
}
function effectiveStatusCode(statusCode='',base={},metrics=[]){
 const code=s(statusCode)
 return UNAVAILABLE_STATUS_RE.test(code)&&hasVerifiedContent(base,metrics)?'healthy':code
}
function shouldExposeCheckedAt(base={},purpose='',statusCode='',metrics=[]){
 const checkedAt=s(base.asOf||base.checkedAt)
 if(!checkedAt)return false
 const semantic=`${base.kind||''} ${base.purpose||''} ${purpose||''} ${statusCode||''}`
 const verified=/diagnostic|data_table|case_result|qcoin|ads|vip|payment|moderation|security|safety|restriction|success|healthy|active|confirmed|inconsistent|expired/iu.test(semantic)||hasVerifiedContent(base,metrics)
 const conversational=/choice|clarification|conversation|social|humor|partnership|greeting|notice|pending/iu.test(semantic)
 return verified&&!conversational
}
function metricRows(input={},locale='en'){
 const rows=[]
 const add=(key,label,value,format='text',tone='neutral')=>{if(value===undefined||value===null||value==='')return;rows.push({key,label:label||localizeQl7PresentationMetric(key,locale),value,format,tone,visibility:'both'})}
 const source=input.metrics&&typeof input.metrics==='object'?input.metrics:{}
 if(Array.isArray(source)){
  for(const item of source){const key=s(item?.key||item?.label);if(key)add(key,s(item?.label),item?.value,item?.format||(isQl7MetricAllowed(key)?ql7MetricFormat(key):(typeof item?.value==='number'?'integer':'text')),item?.tone||'neutral')}
 }else{
  for(const [key,value] of Object.entries(source))add(key,'',value,isQl7MetricAllowed(key)?ql7MetricFormat(key):(typeof value==='number'?'integer':'text'))
 }
 const columns=Array.isArray(input?.table?.columns)?input.table.columns:[]
 for(const [rowIndex,row] of (Array.isArray(input?.table?.rows)?input.table.rows:[]).entries()){
  for(const column of columns){const key=s(column?.key);if(key)add(`legacy-table-${rowIndex}-${key}`,s(column?.label),row?.[key],typeof row?.[key]==='number'?'integer':'text')}
 }
 return rows.filter((row,index,array)=>array.findIndex(x=>String(x.label).toLowerCase()===String(row.label).toLowerCase()&&String(x.value)===String(row.value))===index).slice(0,64)
}
function localizedSnapshot(input,locale){
 if(!input||typeof input!=='object')return input??null
 return{...clone(input),contentType:s(input.contentType)?localizeQl7ContentType(input.contentType,locale):input.contentType}
}
function sanitizeTable(table,locale){
 if(!table||typeof table!=='object')return null
 const columns=(Array.isArray(table.columns)?table.columns:[]).map((column,index)=>({key:s(column?.key||`column-${index}`).slice(0,80),label:s(column?.label).slice(0,160),format:s(column?.format||'text').slice(0,24)})).filter((column)=>column.key&&column.label).slice(0,16)
 if(!columns.length)return{...clone(table),columns:[],rows:[]}
 const rows=[]
 for(const source of (Array.isArray(table.rows)?table.rows:[]).slice(0,32)){
  if(!source||typeof source!=='object')continue
  const row={}
  let meaningful=false
  for(const column of columns){
   const raw=source[column.key]
   if(raw===undefined||raw===null||s(raw)==='')continue
   const value=typeof raw==='number'||typeof raw==='boolean'?raw:localizeQl7EvidenceValue(raw,locale)
   if((value===undefined||value===null||s(value)==='')||/^(?:undefined|null|nan)$/iu.test(s(value)))continue
   row[column.key]=value;meaningful=true
  }
  if(meaningful)rows.push(row)
 }
 return{...clone(table),columns,rows}
}
export function normalizeQl7SupportPresentationCard(input={}){
 const locale=ql7SupportRenderLocale(input.locale);const dictionaryLocale=ql7SupportLocale(input.locale);const purpose=inferQl7Purpose(input);const labels=ql7SupportLabels(dictionaryLocale)
 const rawStatusCode=s(input?.status?.code||input.status||input.branch)
 const base=input
 const sections=[]
 const push=(id,title,items,tone='neutral')=>{const clean=semanticDedupe(items).map((x,i)=>typeof x==='object'?{id:s(x.id||`${id}-${i}`),label:s(x.label),value:s(x.value||x.text||x.message),asOf:s(x.asOf)}:{id:`${id}-${i}`,value:s(x)}).filter(x=>x.label||x.value);if(clean.length)sections.push({id,title,tone,items:clean})}
 push('confirmed',labels.confirmed,base.facts)
 push('checks',labels.checks,base.checks)
 push('anomalies',labels.details,base.anomalies,'warning')
 push('next',labels.next,base.nextActions,'accent')
 const badges=(Array.isArray(base.badges)?base.badges:[]).map((b,i)=>({id:s(b.id||`badge-${i}`),label:localizeQl7SupportBadgeRailLabel(b,dictionaryLocale),tone:s(b.tone||'neutral'),icon:s(b.icon||b.iconKey),assetId:s(b.assetId)})).filter(b=>b.label).filter((b,i,a)=>a.findIndex(x=>x.label.toLowerCase()===b.label.toLowerCase())===i).slice(0,10)
 const rows=metricRows(base,dictionaryLocale)
 const statusCode=effectiveStatusCode(rawStatusCode,base,rows)
 const statusTone=/inconsistent|expired|blocked|violation|fraud|threat/i.test(statusCode)?'warning':(/active|healthy|success|confirmed/i.test(statusCode)?'success':'neutral')
 const semanticBadge=resolveQl7SemanticBadge({semanticIcon:base.semanticIcon||base.semanticRole,purpose,status:statusCode,topic:base.topic||base.domain,emotion:base.emotion?.emotion,locale:dictionaryLocale})
 const statusCandidate=statusCode?{code:statusCode,label:s(base?.status?.label)||localizeQl7Status(statusCode,dictionaryLocale),tone:s(base?.status?.tone)||statusTone,icon:s(base?.status?.icon)||'status'}:null
 const duplicateStatus=statusCandidate&&badges.some((badge)=>badge.label.toLowerCase()===statusCandidate.label.toLowerCase()||(/confirmed|healthy|verified/iu.test(statusCandidate.code)&&/verified|confirmed|подтвержд|проверено/iu.test(`${badge.id} ${badge.label}`))||(/blocked|cooldown/iu.test(statusCandidate.code)&&/blocked|paused|приостанов/iu.test(`${badge.id} ${badge.label}`)))
 const normalizedTable=sanitizeTable(base.table,dictionaryLocale)
 const payload={
  version:4,schema:'ql7.support.card',id:s(base.id||base.caseId||hash(base).slice(0,24)),caseId:s(base.caseId),
  purpose,sourceKind:s(base.sourceKind||base.kind||base.purpose||purpose),topic:s(base.topic||base.domain),semanticRole:s(base.semanticRole||base.purpose),surfaceKind:s(base.surfaceKind||base.kind||'structured'),semanticIcon:s(base.semanticIcon||base.semanticRole||semanticBadge.key),semanticTone:semanticBadge.tone,svgAssetId:s(base.svgAssetId||base.primarySvg?.assetId),primarySvg:clone(base.primarySvg)||null,presentationState:s(base.presentationState||base.mood||base.emotion?.emotion||'neutral'),microIntent:s(base.microIntent),visualTheme:s(base.visualTheme)||QL7_SUPPORT_THEME_BY_PURPOSE[purpose]||'knowledge-blue',severity:s(base.severity||(/violation|restriction|safety/.test(purpose)?'critical':(purpose==='complaint'?'warning':'info'))),
  locale,direction:ql7SupportDirection(locale),title:safeText(base.title,240),summary:safeText(base.summary||base.body||base.prompt,1200),
  status:duplicateStatus?null:statusCandidate,
  badges,sections,metrics:sanitizeQl7EvidenceRows(rows,dictionaryLocale),timeline:clone(base.timeline)||[],media:clone(base.media)||[],actions:clone(base.actions)||[],
  options:clone(base.options)||[],other:clone(base.other)||null,snapshot:localizedSnapshot(base.snapshot,dictionaryLocale),table:normalizedTable,
  emotion:base.emotion&&typeof base.emotion==='object'?{emotion:s(base.emotion.emotion||'neutral'),intensity:s(base.emotion.intensity||'low'),confidence:Math.max(0,Math.min(1,Number(base.emotion.confidence||0))),pulse:s(base.emotion.pulse||'none'),glyph:s(base.emotion.glyph||'◈').slice(0,4)}:null,
  labels:{...labels,...(clone(base.labels)||{})},checkedAt:shouldExposeCheckedAt(base,purpose,statusCode,rows)?s(base.asOf||base.checkedAt):'',generatedAt:s(base.generatedAt)||new Date().toISOString()
 }
 if(!payload.title&&!payload.summary)throw new Error('ql7_support_card_content')
 return payload
}
export function buildQl7SupportPresentationCard(input={}){const body=normalizeQl7SupportPresentationCard(input);return Object.freeze({...body,integrity:{algorithm:'sha256',signature:hash(body),signedAt:new Date().toISOString()}})}
export function validateQl7SupportPresentationCard(card={}){
 if(Number(card?.version)!==4||card?.schema!=='ql7.support.card')return{ok:false,error:'card_version'}
 const sig=s(card?.integrity?.signature);if(!SAFE.test(sig))return{ok:false,error:'card_integrity'}
 const {integrity,...raw}=card
 if(!s(raw.title)&&!s(raw.summary))return{ok:false,error:'card_schema'}
 if(hash(raw)!==sig)return{ok:false,error:'card_integrity'}
 return{ok:true,card:Object.freeze({...raw,integrity:{algorithm:'sha256',signature:sig,signedAt:s(card?.integrity?.signedAt)}})}
}

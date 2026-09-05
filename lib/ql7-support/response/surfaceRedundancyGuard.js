import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {buildQl7SupportSurfaceRedundancyReceipt, normalizeQl7SupportSurfaceSemanticText} from './surfaceRedundancyReceipt.js'
export const QL7_SUPPORT_SURFACE_REDUNDANCY_GUARD_VERSION='6.0.0'
export const QL7_SUPPORT_SURFACE_REDUNDANCY_GUARD_OWNER_ID='ql7-support.surface-redundancy-guard'
const NECESSARY=new Set(['accessibility-self-contained','explicit-comparison','immutable-receipt-fact','legal-required','ambiguity-prevention','different-semantic-dimension'])
function same(a,b){const A=normalizeQl7SupportSurfaceSemanticText(a),B=normalizeQl7SupportSurfaceSemanticText(b);return Boolean(A&&B&&A===B)}
function compactTables(tables=[],title=''){return ql7Arr(tables).map((t)=>Object.freeze({...t,title:same(t?.title,title)?'':ql7Str(t?.title),rows:Object.freeze(ql7Arr(t?.rows).map((r)=>Object.freeze({...r}))) }))}
export function compactQl7SupportSurfaceRedundancy(surface={}, {bodyText=''}={}){
 const title=ql7Str(surface.title);const tables=compactTables(surface.tables,title);const seen=new Set();const badges=ql7Arr(surface.badges).filter((b)=>{const k=normalizeQl7SupportSurfaceSemanticText(`${b?.label||''} ${b?.detail||''}`);if(!k)return false;if(seen.has(k))return false;seen.add(k);return true})
 const sourceTable=surface.table&&typeof surface.table==='object'?surface.table:null;const table=sourceTable?{...sourceTable,title:same(sourceTable.title,title)?'':ql7Str(sourceTable.title),columns:sourceTable.columns||[],rows:sourceTable.rows||[]}:tables[0]?{title:tables[0].title,columns:[],rows:tables[0].rows}:null
 const raw={...surface,tables:Object.freeze(tables),table:table?Object.freeze(table):null,badges:Object.freeze(badges)}
 const integrity={surfaceHash:ql7StableHash(JSON.stringify({title:raw.title,body:ql7Str(bodyText)||raw.summary||'',svg:raw.svgAssetId||raw.primarySvg?.assetId||'',tables:raw.tables,badges:raw.badges,actions:raw.actions||[],snapshot:raw.snapshot||null}))}
 return Object.freeze({...raw,integrityBlock:Object.freeze(integrity)})
}
export function evaluateQl7SupportSurfaceRedundancy(input={}){
 const receipt=buildQl7SupportSurfaceRedundancyReceipt(input),failures=[];const reasons=new Set(receipt.necessaryRepeatReasons.filter(x=>NECESSARY.has(x)))
 if(receipt.duplicateRows.length)failures.push('surface_duplicate_table_row')
 if(receipt.duplicateStatuses.length)failures.push('surface_duplicate_status')
 if(receipt.duplicatePropositionGroups.length&&!reasons.size)failures.push('surface_duplicate_proposition')
 const body=normalizeQl7SupportSurfaceSemanticText(input.text);for(const t of ql7Arr(input.surface?.tables))for(const r of ql7Arr(t?.rows)){const pair=normalizeQl7SupportSurfaceSemanticText(`${r?.label||''} ${r?.value??''}`);if(pair.length>=5&&body.includes(pair)&&!reasons.size){failures.push('surface_body_table_row_repetition');break}}
 // A repeated domain/entity name is an observation unless it crosses distinct visible regions without a necessity reason.
 for(const group of receipt.entityMentionGroups){const proseCount=Number(group.proseMentionCount)||0,proseRegions=Number(group.proseRegionCount)||0;if((proseCount>=3||(proseCount>=2&&proseRegions>=3))&&!reasons.size)failures.push('unnecessary_repeated_entity_label')}
 // Same value can legitimately occur for different dimensions; require explicit dimension reason only when row keys also coincide via duplicateRows above.
 return Object.freeze({schema:'ql7.support.surface-redundancy-decision',schemaVersion:QL7_SUPPORT_SURFACE_REDUNDANCY_GUARD_VERSION,ownerId:QL7_SUPPORT_SURFACE_REDUNDANCY_GUARD_OWNER_ID,ok:failures.length===0,decision:failures.length?'regenerate':'allow',failures:Object.freeze([...new Set(failures)]),observations:Object.freeze({duplicateTableValueGroups:receipt.duplicateTableValues.length,entityMentionGroups:receipt.entityMentionGroups.length,structuralEntityRepeats:receipt.entityMentionGroups.reduce((n,g)=>n+(Number(g.structuralMentionCount)>1?1:0),0),proseEntityOveruseCandidates:receipt.entityMentionGroups.reduce((n,g)=>n+(Number(g.proseMentionCount)>=3?1:0),0)}),receipt})
}

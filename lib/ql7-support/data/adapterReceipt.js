import { ql7Arr, ql7StableHash, ql7Str } from '../internal/text.js'
export const QL7_SUPPORT_RECEIPT_VERSION='14.2.0'
export const QL7_SUPPORT_ADAPTER_RECEIPT_VERSION_V13='13.0.0'
const FAILURE_RE=/(?:unavailable|timeout|failed|error|mongo_unavailable|redis_unavailable|provider_unavailable|source_unavailable)/iu
const META_KEYS=new Set(['status','branch','source','sourcestatus','adapterid','error','errors','raw','query','collections','businesscollectionsread','businesscollectionswritten','unavailablesources','asof','updatedat','checkedat','generatedat','readonly','ok'])
function machineKey(value=''){return ql7Str(value).replace(/([a-z])([A-Z])/g,'$1_$2').replace(/[\s_-]+/g,'').toLowerCase()}
function meaningful(value,key=''){
 if(META_KEYS.has(machineKey(key)))return false
 if(value===0||value===false)return true
 if(value===undefined||value===null||ql7Str(value)==='')return false
 if(Array.isArray(value))return value.some((item)=>meaningful(item,key))
 if(typeof value==='object')return Object.entries(value).some(([childKey,child])=>meaningful(child,childKey))
 return true
}
function resultKind(row={}){const raw=ql7Str(row.resultKind||row.status||row.branch).toLowerCase();if(/unavailable|timeout|failed|error/.test(raw))return'unavailable';if(/inconsistent|mismatch|fraud/.test(raw))return'inconsistent';if(/empty|zero|none/.test(raw))return'verified_empty';if(row.executed===true||row.verified===true)return'verified';return'unavailable'}
export function normalizeQl7SupportAdapterReceipt(row={},index=0){
 const executed=row?.executed===true||row?.verified===true;const writeCount=Math.max(0,Number(row?.writeCount||0));const kind=resultKind({...row,executed});const checkedAt=executed&&writeCount===0?ql7Str(row.checkedAt||row.asOf||row.updatedAt||new Date(0).toISOString()):''
 const result=row?.result??row?.data??null;const source=ql7Str(row.source||row.adapter||`adapter_${index}`)
 return Object.freeze({id:ql7Str(row.id)||`receipt:${ql7StableHash(`${source}:${index}:${JSON.stringify(result)}`)}`,adapter:ql7Str(row.adapter||source),executed,sourceType:ql7Str(row.sourceType||row.type||'synthetic_fixture'),source,actorScope:ql7Str(row.actorScope||row.scope||'self'),resultKind:kind,result,error:ql7Str(row.error),durationMs:Math.max(0,Number(row.durationMs||0)),writeCount,evidenceHash:ql7Str(row.evidenceHash)||ql7StableHash(`${source}:${JSON.stringify(result)}:${kind}`),checkedAt,verified:executed&&writeCount===0&&['verified','verified_empty'].includes(kind)})
}
export function normalizeQl7SupportReceipts(rows=[]){return Object.freeze(ql7Arr(rows).map(normalizeQl7SupportAdapterReceipt))}
export function hasVerifiedQl7SupportReceipt(rows=[]){return normalizeQl7SupportReceipts(rows).some(r=>r.verified)}
export function createQl7SupportAdapterReceiptV13(input={}){
 const executed=input.executed===true;const source=ql7Str(input.source||input.adapter||'none');const scope=ql7Str(input.scope||input.actorScope||'none');const result=executed?(input.result??null):null;const error=ql7Str(input.error);const durationMs=Math.max(0,Number(input.durationMs||0));const writeCount=Math.max(0,Number(input.writeCount||0));const statusText=`${input.status||''} ${input.branch||''} ${error} ${result?.status||''} ${result?.branch||''}`;const verified=executed&&writeCount===0&&!FAILURE_RE.test(statusText)&&(input.verified===true||meaningful(result,'result'));const checkedAt=verified?ql7Str(input.checkedAt||result?.checkedAt||result?.asOf||result?.updatedAt):'';const evidenceHash=ql7Str(input.evidenceHash)||ql7StableHash(JSON.stringify({executed,verified,source,scope,result,error,durationMs,writeCount,checkedAt}))
 return Object.freeze({version:QL7_SUPPORT_ADAPTER_RECEIPT_VERSION_V13,id:ql7Str(input.id)||`receipt-${evidenceHash}`,executed,verified,source,scope,result,error,durationMs,writeCount,evidenceHash,checkedAt,readOnly:writeCount===0})
}
export function normalizeQl7SupportReceiptsV13(receipts=[]){return Object.freeze(ql7Arr(receipts).map((row)=>createQl7SupportAdapterReceiptV13(row)))}
export function hasExecutedQl7SupportReceiptV13(receipts=[],sourcePattern=''){const pattern=ql7Str(sourcePattern).toLowerCase();return normalizeQl7SupportReceiptsV13(receipts).some((row)=>row.executed&&row.writeCount===0&&(!pattern||row.source.toLowerCase().includes(pattern)))}
export function hasVerifiedQl7SupportReceiptV13(receipts=[],sourcePattern=''){const pattern=ql7Str(sourcePattern).toLowerCase();return normalizeQl7SupportReceiptsV13(receipts).some((row)=>row.verified===true&&row.writeCount===0&&(!pattern||row.source.toLowerCase().includes(pattern)))}
export function receiptFromQl7DiagnosticV13(diagnosticResult=null,source='support.diagnostic'){
 const present=Boolean(diagnosticResult&&typeof diagnosticResult==='object')
 return createQl7SupportAdapterReceiptV13({executed:present,verified:present&&!FAILURE_RE.test(`${diagnosticResult?.status||''} ${diagnosticResult?.branch||''} ${diagnosticResult?.failureCode||''} ${diagnosticResult?.error||''}`),source,scope:ql7Str(diagnosticResult?.branch||diagnosticResult?.specializedBranch||'diagnostic'),result:present?diagnosticResult:null,error:ql7Str(diagnosticResult?.error||diagnosticResult?.failureCode),durationMs:Number(diagnosticResult?.durationMs||0),writeCount:0,checkedAt:ql7Str(diagnosticResult?.checkedAt||diagnosticResult?.asOf||diagnosticResult?.updatedAt),status:diagnosticResult?.status,branch:diagnosticResult?.branch})
}

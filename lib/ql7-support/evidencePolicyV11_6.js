
function str(v){return String(v??'').trim()}
const FORBIDDEN_KEY=/(?:raw|token|secret|password|uri|collection|query|adapter|internal|wallet|accountid|correlation|signature|stack|error)/iu
const ENUMS=Object.freeze({
 pending:{ru:'В ожидании',uk:'Очікується',en:'Pending',es:'Pendiente',tr:'Bekliyor',ar:'قيد الانتظار',zh:'等待中',he:'בהמתנה'},
 active:{ru:'Активен',uk:'Активний',en:'Active',es:'Activo',tr:'Aktif',ar:'نشط',zh:'有效',he:'פעיל'},
 expired:{ru:'Истёк',uk:'Завершився',en:'Expired',es:'Vencido',tr:'Süresi doldu',ar:'منتهي',zh:'已过期',he:'פג תוקף'},
 true:{ru:'Да',uk:'Так',en:'Yes',es:'Sí',tr:'Evet',ar:'نعم',zh:'是',he:'כן'},
 false:{ru:'Нет',uk:'Ні',en:'No',es:'No',tr:'Hayır',ar:'لا',zh:'否',he:'לא'},
})
function lang(locale='en'){const k=str(locale).toLowerCase().split(/[-_]/u)[0];return ['ru','uk','en','es','tr','ar','zh','he'].includes(k)?k:'en'}
export function localizeQl7EvidenceValueV11_6(value,locale='en'){
 const key=lang(locale)
 if(typeof value==='boolean')return ENUMS[String(value)][key]
 const raw=str(value)
 if(ENUMS[raw.toLowerCase()])return ENUMS[raw.toLowerCase()][key]
 if(/^0x[a-f0-9]{40}$/iu.test(raw))return `${raw.slice(0,6)}…${raw.slice(-4)}`
 if(/^(?:wallet|telegram|tg|tguid):/iu.test(raw))return '••••••'
 return raw
}
export function sanitizeQl7EvidenceRowsV11_6(rows=[],locale='en'){
 const out=[];const labels=new Set()
 for(const row of Array.isArray(rows)?rows:[]){
  if(!row||typeof row!=='object')continue
  const key=str(row.key),label=str(row.label)
  if(!label||FORBIDDEN_KEY.test(key)||FORBIDDEN_KEY.test(label))continue
  const normalizedLabel=label.toLowerCase()
  if(labels.has(normalizedLabel))continue
  const value=localizeQl7EvidenceValueV11_6(row.value,locale)
  if(!value||/^(?:undefined|null|nan)$/iu.test(value))continue
  labels.add(normalizedLabel);out.push({...row,label,value})
 }
 return Object.freeze(out.slice(0,32))
}
export function decideQl7EvidenceStatusV11_6({claim='',checks=[],facts=[],unknowns=[],anomalies=[]}={}){
 const checked=(Array.isArray(checks)?checks:[]).filter(Boolean).length
 const confirmed=(Array.isArray(facts)?facts:[]).filter(Boolean).length
 const missing=(Array.isArray(unknowns)?unknowns:[]).filter(Boolean).length
 const problems=(Array.isArray(anomalies)?anomalies:[]).filter(Boolean).length
 if(problems>0)return Object.freeze({code:'requires_review',label:'Требуется дополнительная проверка',tone:'warning',semanticIcon:'warning'})
 if(checked>=2&&confirmed>=2&&missing===0)return Object.freeze({code:'confirmed',label:'Подтверждено',tone:'success',semanticIcon:'confirmed'})
 if(confirmed>0)return Object.freeze({code:'partial',label:'Частично подтверждено',tone:'warning',semanticIcon:'partial'})
 return Object.freeze({code:'insufficient',label:'Данных недостаточно',tone:'neutral',semanticIcon:'waiting'})
}
export function assertNoQl7MachineLeakV11_6(value){const text=JSON.stringify(value??'');return !/(?:"details"\s*:|\bpending\b|\btrue\b|\bfalse\b|wallet:0x|mongodb|collectionName|adapterId|rawAccountId)/iu.test(text)}

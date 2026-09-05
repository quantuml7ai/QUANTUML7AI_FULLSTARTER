import crypto from 'node:crypto'
const VERSION='5.2.5-independent'
const norm=(v='')=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]+/gu,' ').replace(/\s+/gu,' ').trim()
const arr=(v)=>Array.isArray(v)?v:[]
export function evaluateSurfaceRedundancyIndependent({text='',surface={}}={}){
 const failures=[],seenRows=new Set(),seenStatus=new Set();for(const table of arr(surface.tables)){const tableIdentity=norm(table?.title)||norm(table?.schema||table?.id);for(const row of arr(table?.rows)){const key=JSON.stringify([tableIdentity,norm(row?.key),norm(row?.label),norm(row?.value),norm(row?.format)]);if(seenRows.has(key))failures.push('duplicate_table_row');seenRows.add(key)}}
 for(const value of [surface.status?.label,...arr(surface.badges).map(b=>b?.label)].map(norm).filter(Boolean)){if(seenStatus.has(value))failures.push('duplicate_status');seenStatus.add(value)}
 const title=norm(surface.title),body=norm(text);for(const table of arr(surface.tables)){if(title&&norm(table?.title)===title)failures.push('duplicate_title_table_title');for(const row of arr(table?.rows)){const pair=norm(`${row?.label||''} ${row?.value??''}`);if(pair.length>=5&&body.includes(pair))failures.push('body_table_row_repetition')}}

 const entity=norm(surface.topic||surface.domainId||'');if(entity){const prose=[norm(text),norm(surface.summary),...arr(surface.badges).map(b=>norm(b?.detail))].filter(Boolean),proseCount=prose.reduce((n,v)=>n+(v.split(entity).length-1),0);if(proseCount>=4)failures.push('unnecessary_repeated_entity_label')}
 const result={oracle:'surface-redundancy-independent',version:VERSION,ok:failures.length===0,failures:[...new Set(failures)]};return Object.freeze({...result,receiptHash:crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex')})
}

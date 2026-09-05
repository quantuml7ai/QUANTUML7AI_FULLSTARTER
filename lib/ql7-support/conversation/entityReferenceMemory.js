import {ql7StableHash, ql7Str} from '../internal/text.js'
export const QL7_SUPPORT_ENTITY_REFERENCE_MEMORY_VERSION='5.1.0'
export function updateQl7SupportEntityReferenceMemory(rows=[],{entities=[],turnId='',locale='en',at=''}={}){const map=new Map((Array.isArray(rows)?rows:[]).map((r)=>[String(r.entityKey||r.entityId||''),r]));
for(const e of Array.isArray(entities)?entities:[]){const type=ql7Str(e.type||e.entityType),value=ql7Str(e.value||e.canonicalValue||e.id);
if(!type||!value)continue;
const key=`${type}:${ql7StableHash(value).slice(0,24)}`;
const prior=map.get(key)||{};
map.set(key,Object.freeze({entityKey:key,entityType:type,valueHash:ql7StableHash(value),safeLabel:ql7Str(e.safeLabel||e.label||type),locale:ql7Str(locale),firstTurnId:prior.firstTurnId||ql7Str(turnId),lastTurnId:ql7Str(turnId),mentions:Math.min(10000,Number(prior.mentions||0)+1),updatedAt:ql7Str(at)}))}return Object.freeze([...map.values()].sort((a,b)=>String(a.entityKey).localeCompare(String(b.entityKey))).slice(-256))}
export function resolveQl7SupportEntityReference(rows=[],{entityType='',safeLabel=''}={}){const list=(Array.isArray(rows)?rows:[]).filter((r)=>!entityType||r.entityType===entityType).filter((r)=>!safeLabel||r.safeLabel===safeLabel);
return list.at(-1)||null}

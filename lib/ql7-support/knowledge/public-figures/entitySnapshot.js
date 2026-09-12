import {ql7StableHash} from '../../internal/text.js'
import {QL7_SUPPORT_PUBLIC_FIGURE_IDENTITIES} from './identityCatalog.js'
import {loadQl7PublicFigureRichProfiles} from './manifest.js'
import {getQl7PublicFigureMaterialProfile} from './materialProfiles.js'

export const QL7_SUPPORT_PUBLIC_ENTITY_SNAPSHOT_VERSION='ql7.public-entity-snapshot.1'
const norm=(v='')=>String(v||'').normalize('NFKC').toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu,' ').trim()
const rich=new Map(loadQl7PublicFigureRichProfiles().map(row=>[String(row.personId||''),row]))
const rows=QL7_SUPPORT_PUBLIC_FIGURE_IDENTITIES.map(identity=>{
  const personId=String(identity.personId||'')
  const material=getQl7PublicFigureMaterialProfile(personId)
  const stable=rich.get(personId)?.stableFacts||[]
  const substantive=(material?.substantiveStableFacts||[]).filter(f=>f?.displayEligible!==false&&Array.isArray(f?.sourceRefs)&&f.sourceRefs.length&&!f.sourceRefs.every(r=>String(r).startsWith('catalog:')))
  const aliases=[identity.canonicalName,...(identity.aliases||[])].map(norm).filter(Boolean)
  return Object.freeze({
    entityId:personId,canonicalName:String(identity.canonicalName||''),aliases:Object.freeze([...new Set(aliases)]),
    categories:Object.freeze([...(identity.categories||[])]),sourceLookupKeys:Object.freeze([identity.sourceLookupKey,...(material?.sourceLookupKeys||[])].filter(Boolean)),
    stableFactCount:stable.length,substantiveFactCount:substantive.length,substantiveSourceStatus:String(material?.substantiveSourceStatus||''),
    sourceLookupRequired:Boolean(material?.sourceLookupRequired||substantive.length<4),publicOnly:true,privateDataForbidden:true,
  })
})
const byId=new Map(rows.map(r=>[r.entityId,r])), byAlias=new Map()
for(const row of rows)for(const alias of row.aliases){const a=byAlias.get(alias)||[];a.push(row.entityId);byAlias.set(alias,a)}
const body={version:QL7_SUPPORT_PUBLIC_ENTITY_SNAPSHOT_VERSION,entityCount:rows.length,entities:rows.map(r=>({entityId:r.entityId,canonicalName:r.canonicalName,aliases:r.aliases,categories:r.categories,substantiveFactCount:r.substantiveFactCount,sourceLookupRequired:r.sourceLookupRequired}))}
export const QL7_SUPPORT_PUBLIC_ENTITY_SNAPSHOT_HASH=ql7StableHash(JSON.stringify(body))
export const QL7_SUPPORT_PUBLIC_ENTITY_COUNT=rows.length
export function getQl7PublicEntity(entityId=''){return byId.get(String(entityId||''))||null}
export function resolveQl7PublicEntityCandidates(text='',{limit=8}={}){const q=norm(text);if(!q)return Object.freeze([]);const exact=byAlias.get(q)||[];let ids=[...exact];if(!ids.length){for(const [alias,values] of byAlias){if(alias.length>=3&&(q.includes(alias)||alias.includes(q)))ids.push(...values);if(ids.length>=limit*4)break}}const out=[...new Set(ids)].map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>a.sourceLookupRequired-b.sourceLookupRequired||b.substantiveFactCount-a.substantiveFactCount||a.canonicalName.localeCompare(b.canonicalName)).slice(0,limit);return Object.freeze(out)}
export function auditQl7PublicEntitySnapshot(){const failures=[];if(rows.length!==1948)failures.push(`entity_count:${rows.length}`);for(const row of rows){if(!row.entityId||!row.canonicalName)failures.push(`identity_missing:${row.entityId||'unknown'}`);if(!row.aliases.length)failures.push(`alias_missing:${row.entityId}`)}return Object.freeze({ok:!failures.length,version:QL7_SUPPORT_PUBLIC_ENTITY_SNAPSHOT_VERSION,entityCount:rows.length,snapshotHash:QL7_SUPPORT_PUBLIC_ENTITY_SNAPSHOT_HASH,substantiveRichCount:rows.filter(r=>r.substantiveFactCount>=4).length,lookupRequiredCount:rows.filter(r=>r.sourceLookupRequired).length,failures:Object.freeze(failures)})}

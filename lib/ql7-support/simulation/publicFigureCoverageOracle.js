import crypto from 'node:crypto'

export const QL7_SUPPORT_PUBLIC_FIGURE_COVERAGE_ORACLE_VERSION='5.2.4'
const hash=(value)=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
const norm=(value)=>String(value??'').trim().toLocaleLowerCase('en-US').normalize('NFKC')

export function evaluatePublicFigureCoverageIndependent(graph={}, {required=1050,requiredLocales=32}={}){
  const entries=Array.isArray(graph?.entries)?graph.entries:[]
  const ids=new Set(),aliasOwners=new Map(),categories=new Set(),sourceBacked=new Set(),failures=[]
  let currentSensitive=0,currentSourceRules=0,readyTextRows=0,privacyRows=0,detailedSourceBoundRows=0
  for(const row of entries){
    const id=String(row?.personId||'').trim()
    if(!id){failures.push('missing_identity');continue}
    if(ids.has(id))failures.push(`duplicate_identity:${id}`);ids.add(id)
    const aliases=[row?.canonicalName,...(Array.isArray(row?.aliases)?row.aliases:[])].map(norm).filter(Boolean)
    if(!aliases.length)failures.push(`alias_missing:${id}`)
    for(const alias of new Set(aliases)){
      const owners=aliasOwners.get(alias)||new Set();owners.add(id);aliasOwners.set(alias,owners)
    }
    for(const category of Array.isArray(row?.categories)?row.categories:[])if(category)categories.add(String(category))
    if(Array.isArray(row?.sourceRefs)&&row.sourceRefs.length)sourceBacked.add(id)
    if(row?.currentSensitive===true||row?.currentRoleRequiresFreshSource===true){currentSensitive+=1;if(row?.currentRoleRequiresFreshSource===true||Array.isArray(row?.currentSensitiveFactIds))currentSourceRules+=1}
    if(row?.readyToSend===true||typeof row?.finalText==='string')readyTextRows+=1
    if(row?.publicOnly===true&&row?.privateDataForbidden===true)privacyRows+=1
    if(row?.detailedPublicFactsRequireSource===true)detailedSourceBoundRows+=1
  }
  const ambiguousAliases=[...aliasOwners.entries()].filter(([,owners])=>owners.size>1).map(([alias,owners])=>({alias,ownerCount:owners.size}))
  const count=ids.size,coverageFloorMet=count>=required
  if(!coverageFloorMet)failures.push(`coverage_floor_not_met:${count}/${required}`)
  if(readyTextRows)failures.push(`ready_text_forbidden:${readyTextRows}`)
  if(privacyRows!==count)failures.push(`privacy_policy_gap:${count-privacyRows}`)
  if(detailedSourceBoundRows!==count)failures.push(`detailed_source_policy_gap:${count-detailedSourceBoundRows}`)
  if(currentSensitive>currentSourceRules)failures.push(`current_source_rule_gap:${currentSensitive-currentSourceRules}`)
  const localeCoverage=Number(graph?.localeCoverage||graph?.locales?.length||0)
  if(localeCoverage&&localeCoverage<requiredLocales)failures.push(`locale_coverage:${localeCoverage}/${requiredLocales}`)
  const hardFailures=failures.filter((code)=>!code.startsWith('coverage_floor_not_met:'))
  return Object.freeze({
    oracle:'public-figure-coverage-independent.2',schemaVersion:QL7_SUPPORT_PUBLIC_FIGURE_COVERAGE_ORACLE_VERSION,
    ok:failures.length===0,architectureOk:hardFailures.length===0,count,required,coverageFloorMet,
    sourceBackedCount:sourceBacked.size,categoryCount:categories.size,currentSensitiveCount:currentSensitive,currentSourceRuleCount:currentSourceRules,
    ambiguousAliasCount:ambiguousAliases.length,ambiguousAliases:Object.freeze(ambiguousAliases.slice(0,100)),readyTextRows,privacyRows,detailedSourceBoundRows,localeCoverage,
    failures:Object.freeze([...new Set(failures)]),reportHash:hash({count,required,sourceBacked:sourceBacked.size,categories:[...categories].sort(),currentSensitive,currentSourceRules,ambiguousAliasCount:ambiguousAliases.length,readyTextRows,failures:[...new Set(failures)]}),
  })
}

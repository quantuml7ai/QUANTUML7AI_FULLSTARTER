import {ql7StableHash, ql7Str} from '../internal/text.js'
import {QL7_SUPPORT_PUBLIC_FIGURES} from './publicFigureRegistry.js'
import {QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM} from './publicFigureCatalog.js'
import {getQl7PublicFigureMaterialProfile, QL7_SUPPORT_PUBLIC_FIGURE_MATERIAL_PROFILES_VERSION} from './public-figures/materialProfiles.js'
export const QL7_SUPPORT_PUBLIC_FIGURE_GRAPH_VERSION='5.2.5-token-boundary'
export const QL7_SUPPORT_PUBLIC_FIGURE_REQUIRED_COVERAGE=QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM
const CURRENT_ROLE_QUERY=/(?:current|currently|now|latest|today|сейчас|текущ|нынешн|зараз|поточн|актуальн|ahora|actual|güncel|şimdi|حالي|الآن|当前|现在|目前|כיום|עכשיו|president|prime\s+minister|ceo|king|queen|monarch|club|team|президент|премьер|прем’єр|директор|генеральн|король|королева|клуб|команд|presidente|rey|reina|cumhurbaşkanı|kral|رئيس|ملك|ملكة|نادي|فريق|总统|国王|女王|俱乐部|球队|נשיא|מלך|מלכה|מועדון|קבוצה)/iu
function norm(value=''){return ql7Str(value).normalize('NFKC').toLowerCase().replace(/[’'`]/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
function ql7Chars(value=''){return [...norm(value).replace(/\s+/gu,'')].length}
function ql7Tokens(value=''){return norm(value).split(/\s+/u).filter(Boolean)}
function tokenPhraseContains(haystack='',needle=''){
 const h=ql7Tokens(haystack),n=ql7Tokens(needle);if(!h.length||!n.length||n.length>h.length)return false
 for(let i=0;i<=h.length-n.length;i+=1){let ok=true;for(let j=0;j<n.length;j+=1)if(h[i+j]!==n[j]){ok=false;break}if(ok)return true}
 return false
}
function compactScriptContains(haystack='',needle=''){
 const h=norm(haystack).replace(/\s+/gu,''),n=norm(needle).replace(/\s+/gu,'');if(!h||!n)return false
 const compact=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(n)
 return compact&&[...n].length>=2&&h.includes(n)
}
function aliasContainedInSource(source='',alias=''){return tokenPhraseContains(source,alias)||compactScriptContains(source,alias)}
function sourceContainedInAlias(alias='',source=''){
 const sourceChars=ql7Chars(source);if(sourceChars<4)return false
 if(tokenPhraseContains(alias,source))return true
 if(compactScriptContains(alias,source)){const aliasChars=Math.max(1,ql7Chars(alias));return sourceChars/aliasChars>=0.6}
 return false
}
function normalizeEntry(row={}){
 const personId=ql7Str(row.personId),canonicalName=ql7Str(row.canonicalName);if(!personId||!canonicalName)return null
 const aliases=[canonicalName,...(row.aliases||[])].map(v=>norm(v)).filter(Boolean)
 const material=getQl7PublicFigureMaterialProfile(personId)
 const substantiveStableFacts=Object.freeze([...(material?.substantiveStableFacts||[])].map((fact)=>Object.freeze({...fact,sourceRefs:Object.freeze([...(fact?.sourceRefs||[])].map(ql7Str).filter(Boolean)),publicOnly:true,currentSensitive:false})))
 const occupations=Object.freeze([...(material?.occupations||row.occupations||[])].map(ql7Str).filter(Boolean))
 const knownFor=Object.freeze([...(material?.knownFor||row.knownFor||[])].map(ql7Str).filter(Boolean))
 const body={schema:'ql7.support.public-figure-graph-entry',schemaVersion:QL7_SUPPORT_PUBLIC_FIGURE_GRAPH_VERSION,materialProfileVersion:QL7_SUPPORT_PUBLIC_FIGURE_MATERIAL_PROFILES_VERSION,personId,canonicalName,
  aliases:Object.freeze([...new Set(aliases)]),categories:Object.freeze([...(row.categories||material?.categories||[])].map(ql7Str).filter(Boolean)),ambiguityGroup:ql7Str(row.ambiguityGroup),
  occupations,knownFor,substantiveStableFacts,substantiveStableFactCount:substantiveStableFacts.length,insufficientPublicStableFacts:material?.insufficient_public_stable_facts===true,sourceLookupRequired:material?.sourceLookupRequired===true||!material,
  currentSensitive:row.currentSensitive===true,currentRoleRequiresFreshSource:row.currentRoleRequiresFreshSource===true||row.currentSensitive===true,
  stableFactIds:Object.freeze([...new Set([...(row.stableFactIds||[]),...substantiveStableFacts.map((fact)=>fact.factId),'canonical_name','broad_category'].map(ql7Str).filter(Boolean))]),
  currentSensitiveFactIds:Object.freeze([...(row.currentSensitiveFactIds||[])].map(ql7Str).filter(Boolean)),sourceRefs:Object.freeze([...new Set([...(row.sourceRefs||[]),...substantiveStableFacts.flatMap((fact)=>fact.sourceRefs||[])].map(ql7Str).filter(Boolean))]),
  sourceLookupKey:ql7Str(row.sourceLookupKey)||canonicalName,catalogRank:Number(row.catalogRank)||0,publicOnly:true,privateDataForbidden:true,detailedPublicFactsRequireSource:true,
  readyToSend:false,finalText:false}
 return Object.freeze({...body,entryHash:ql7StableHash(JSON.stringify(body))})
}
export function buildQl7SupportPublicFigureKnowledgeGraph({approvedEntries=[]}={}){
 const merged=new Map();for(const raw of [...QL7_SUPPORT_PUBLIC_FIGURES,...approvedEntries]){const row=normalizeEntry(raw);if(row)merged.set(row.personId,row)}
 const entries=Object.freeze([...merged.values()].sort((a,b)=>(a.catalogRank||999999)-(b.catalogRank||999999)||a.personId.localeCompare(b.personId)))
 const body={schema:'ql7.support.public-figure-knowledge-graph',schemaVersion:QL7_SUPPORT_PUBLIC_FIGURE_GRAPH_VERSION,requiredCoverage:QL7_SUPPORT_PUBLIC_FIGURE_REQUIRED_COVERAGE,
  count:entries.length,coverageFloorMet:entries.length>=QL7_SUPPORT_PUBLIC_FIGURE_REQUIRED_COVERAGE,entriesHash:ql7StableHash(JSON.stringify(entries.map(r=>r.entryHash))),
  publicOnly:true,privateDataForbidden:true,detailedPublicFactsRequireSource:true,materialProfileVersion:QL7_SUPPORT_PUBLIC_FIGURE_MATERIAL_PROFILES_VERSION,substantiveRichProfiles:entries.filter((row)=>row.substantiveStableFactCount>=4).length,explicitSourceLookupRequired:entries.filter((row)=>row.sourceLookupRequired===true).length,readyToSendRows:0}
 return Object.freeze({...body,entries,graphHash:ql7StableHash(JSON.stringify(body))})
}
export const QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH=buildQl7SupportPublicFigureKnowledgeGraph()
export function resolveQl7SupportPublicFigureFromGraph(query='',{graph=QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH}={}){
 const source=norm(query);if(!source)return null
 const ranked=(graph?.entries||[]).map(row=>{let score=0;for(const alias of row.aliases||[]){const a=norm(alias);if(!a)continue;const aChars=ql7Chars(a),sourceChars=ql7Chars(source);if(source===a)score=Math.max(score,100+aChars);else if(aChars>=2&&aliasContainedInSource(source,a))score=Math.max(score,40+aChars);else if(sourceContainedInAlias(a,source))score=Math.max(score,20+sourceChars)}return{row,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.row.personId.localeCompare(b.row.personId))
 if(ranked.length){const top=ranked[0],second=ranked[1],sameAmbiguity=Boolean(second&&top.row.ambiguityGroup&&top.row.ambiguityGroup===second.row.ambiguityGroup),decisive=!second||top.score-second.score>=8
  if(decisive)return Object.freeze({decision:'selected',selected:top.row,candidates:Object.freeze(ranked.map(x=>x.row)),ambiguity:false,currentSourceRequired:top.row.currentRoleRequiresFreshSource===true||CURRENT_ROLE_QUERY.test(source),graphHash:graph.graphHash})
  if(sameAmbiguity||top.score===second.score)return Object.freeze({decision:'clarify',selected:null,candidates:Object.freeze(ranked.filter(x=>x.score===top.score||x.row.ambiguityGroup===top.row.ambiguityGroup).map(x=>x.row)),ambiguity:true,currentSourceRequired:ranked.some(x=>x.row.currentRoleRequiresFreshSource),graphHash:graph.graphHash})}
 if(CURRENT_ROLE_QUERY.test(source))return Object.freeze({decision:'current_role_query',selected:null,candidates:Object.freeze([]),ambiguity:false,currentSourceRequired:true,roleQuery:true,graphHash:graph?.graphHash||''})
 return null
}
export function auditQl7SupportPublicFigureKnowledgeGraph(graph=QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH){
 const failures=[],ids=new Set();let selfCatalogOnlySubstantiveFacts=0,unaccountedMaterialProfiles=0
 for(const row of graph.entries){
  if(ids.has(row.personId))failures.push(`duplicate:${row.personId}`);ids.add(row.personId)
  if(!row.aliases.length)failures.push(`aliases:${row.personId}`)
  if(row.readyToSend!==false)failures.push(`ready_text:${row.personId}`)
  if(row.publicOnly!==true||row.privateDataForbidden!==true)failures.push(`privacy:${row.personId}`)
  if(row.detailedPublicFactsRequireSource!==true)failures.push(`source_policy:${row.personId}`)
  for(const fact of row.substantiveStableFacts||[])if(!(fact.sourceRefs||[]).length||(fact.sourceRefs||[]).every((ref)=>ql7Str(ref).startsWith('catalog:')))selfCatalogOnlySubstantiveFacts++
  if(Number(row.substantiveStableFactCount||0)<4&&row.sourceLookupRequired!==true&&row.insufficientPublicStableFacts!==true)unaccountedMaterialProfiles++
 }
 if(!graph.coverageFloorMet)failures.push(`coverage_floor:${graph.count}/${QL7_SUPPORT_PUBLIC_FIGURE_REQUIRED_COVERAGE}`)
 if(selfCatalogOnlySubstantiveFacts)failures.push(`self_catalog_substantive:${selfCatalogOnlySubstantiveFacts}`)
 if(unaccountedMaterialProfiles)failures.push(`unaccounted_material_profiles:${unaccountedMaterialProfiles}`)
 return Object.freeze({ok:failures.length===0,releaseOk:failures.length===0&&graph.coverageFloorMet,count:graph.count,requiredCoverage:QL7_SUPPORT_PUBLIC_FIGURE_REQUIRED_COVERAGE,coverageFloorMet:graph.coverageFloorMet,substantiveRichProfiles:Number(graph.substantiveRichProfiles||0),explicitSourceLookupRequired:Number(graph.explicitSourceLookupRequired||0),selfCatalogOnlySubstantiveFacts,publicOnly:true,privateDataForbidden:true,detailedPublicFactsSourceBound:true,materialProfileVersion:graph.materialProfileVersion,failures:Object.freeze(failures)})
}

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const EXT=new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx','.json','.md','.css'])
const CODE=new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx'])
const norm=(p)=>String(p||'').replaceAll('\\','/').replace(/^\.\//u,'')
const sha=(v)=>crypto.createHash('sha256').update(v).digest('hex')
function walk(root){const out=[];function rec(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name),rel=norm(path.relative(root,full));if(['node_modules','.next','.git','report','reports','public','.ql7-patch-backups'].includes(ent.name))continue;if(rel==='report/QL7_SUPPORT_PATCH'||rel.startsWith('report/QL7_SUPPORT_PATCH/'))continue;if(/^QL7_SUPPORT_NATIVE_NEURAL_INTELLIGENCE_MASTER_SPEC_RU_FINAL(?:\(\d+\))?\.md$/u.test(ent.name))continue;if(ent.name.startsWith('.env'))continue;if(ent.isDirectory())rec(full);else if(EXT.has(path.extname(ent.name)))out.push(rel)}}rec(root);return out.sort()}
function resolveImport(root,fromRel,spec){if(!spec||spec.startsWith('node:'))return'';let base='';if(spec.startsWith('@/'))base=path.resolve(root,spec.slice(2));else if(spec.startsWith('.'))base=path.resolve(root,path.dirname(fromRel),spec);else return'';const exts=[...CODE,'.json','.css'],candidates=[base,...exts.map((e)=>`${base}${e}`),...exts.map((e)=>path.join(base,`index${e}`))];for(const c of candidates)if(fs.existsSync(c)&&fs.statSync(c).isFile())return norm(path.relative(root,c));return''}
const IMPORT_RE=/(?:\b(?:import|export)\s*[^'"]*?\bfrom\s*|\bimport\s*|\brequire\s*\()\s*['"]([^'"]+)['"]/gu
const REF_RE=/(?:ql7[-_/ ]support|ql7_support|QL7_SUPPORT|Ql7Support|ql7Support|EconomicDecisionReceipt|ComposerDecisionReceipt|account_quarantined|QUARANTINE_ACCOUNT_3D)/u
const PRODUCTION_DATA_PREFIXES=Object.freeze([
 'lib/ql7-support/knowledge/public-figures/substantiveFacts/','lib/ql7-support/knowledge/public-figures/sourceIndex/','lib/ql7-support/knowledge/public-figures/localeAliases/','lib/ql7-support/knowledge/public-figures/stableFacts/',
 'lib/ql7-support/knowledge/general-human/','lib/ql7-support/knowledge/human-conversation/','lib/ql7-support/knowledge/academy/','lib/ql7-support/language/reviewedMaterial/','lib/ql7-support/language/dialectProfiles/','lib/ql7-support/safety/crisisReviewed/','lib/composer-safety/reviewedMaterial/'
])
const isOwnedProductionData=(rel)=>PRODUCTION_DATA_PREFIXES.some(prefix=>rel.startsWith(prefix))&&rel.endsWith('.json')
const FACADE=new Set()
const TARGET=new Set(['app/api/forum/mutate/route.js','app/api/dm/send/route.js','app/api/battlecoin/chat/messages/route.js','app/api/academy/exam/route.js','app/api/quest/progress/route.js','app/api/referral/hit/route.js','app/api/qcoin/drop/route.js','app/api/qcoin/heartbeat/route.js','app/api/qcoin/topup/webhook/route.js','app/api/pay/webhook/route.js','lib/mongo/qcoin-primary.cjs','lib/mongo/subscriptions-primary.cjs','lib/mongo/metamarket-primary.cjs','lib/mongo/battlecoin-primary.cjs','lib/adsCore.js','lib/subscriptions.js','components/Ql7SupportRuntimeBridge.jsx'])
const PROD_ROOTS=[
 'app/api/composer-safety/preview/route.js','app/api/dm/dialogs/route.js','app/api/dm/send/route.js','app/api/dm/support-broadcast/route.js','app/api/dm/support-card-translate/route.js','app/api/dm/support-entry/route.js','app/api/dm/support-feedback/route.js','app/api/dm/support-learning-consent/route.js','app/api/dm/support-state/route.js','app/api/dm/support-worker/route.js','app/api/dm/thread/route.js',
 'app/forum/ForumRoot.jsx','app/forum/page.js','app/api/forum/mutate/route.js','app/api/forum/report/route.js','app/exchange/battle-chat/BattleChat.jsx','app/exchange/battle-chat/BattleChatComposer.jsx','app/exchange/battle-chat/useBattleChat.js','app/exchange/battle-chat/battleChatClient.js','app/api/battlecoin/chat/messages/route.js','app/api/account-restrictions/status/route.js',
 'lib/ql7-support/server.js','lib/ql7-support/events.js','lib/ql7-support/scheduler.js','lib/ql7-support/broadcast.js','lib/ql7-support/runtime/productionTurn.js','lib/ql7-support/mediaEvidence.js'
]
function reach(graph,roots){const seen=new Set(),q=[...roots];while(q.length){const x=q.shift();if(seen.has(x)||!graph.has(x))continue;seen.add(x);for(const d of graph.get(x)||[])q.push(d)}return seen}
function reverseReach(reverse,seeds){const seen=new Set(),q=[...seeds];while(q.length){const x=q.shift();if(seen.has(x))continue;seen.add(x);for(const d of reverse.get(x)||[])q.push(d)}return seen}
export function buildQl7SupportUniverseInventory({root=process.cwd(),historicalExpectedCount=423}={}){
 const files=walk(root),fileSet=new Set(files),graph=new Map(),reverse=new Map(),directRefs=new Set()
 for(const rel of files){if(!CODE.has(path.extname(rel)))continue;const text=fs.readFileSync(path.join(root,rel),'utf8'),deps=[];IMPORT_RE.lastIndex=0;let m;while((m=IMPORT_RE.exec(text))){const dep=resolveImport(root,rel,m[1]);if(dep)deps.push(dep)}const uniq=[...new Set(deps)].sort();graph.set(rel,uniq);if(REF_RE.test(text))directRefs.add(rel);for(const dep of uniq){const a=reverse.get(dep)||[];a.push(rel);reverse.set(dep,a)}}
 const core=new Set(files.filter((p)=>p.startsWith('lib/ql7-support/'))),prod=reach(graph,PROD_ROOTS),labRoots=files.filter((p)=>(p.startsWith('scripts/ql7-support/')||(p.startsWith('tests/')&&/ql7[-_/ ]support|ql7_support|Ql7Support/u.test(p)))&&CODE.has(path.extname(p))),lab=reach(graph,labRoots),consumers=reverseReach(reverse,core),dependencies=reach(graph,[...core].filter((p)=>prod.has(p)||lab.has(p)))
 const universe=new Set([...core,...directRefs,...consumers,...dependencies,...TARGET,...files.filter(isOwnedProductionData)])
 for(const p of files)if(p.startsWith('scripts/ql7-support/')||(p.startsWith('tests/')&&/ql7[-_/ ]support|ql7_support|Ql7Support/u.test(p))||/QL7_SUPPORT|SUPPORT.*TZ|Сверка Ω|laboratory Comands/u.test(p))universe.add(p)
 const selectedBeforeClosure=new Set(universe),transitiveAdded=new Set(),q=[...universe].filter(p=>CODE.has(path.extname(p)))
 while(q.length){const from=q.shift();for(const dep of graph.get(from)||[]){if(!fileSet.has(dep)||universe.has(dep))continue;universe.add(dep);transitiveAdded.add(dep);if(CODE.has(path.extname(dep)))q.push(dep)}}
 const rows=[],unclassified=[],orphans=[]
 for(const rel of [...universe].filter((p)=>fileSet.has(p)).sort()){
  let classification='',disposition=''
  if(rel.startsWith('tests/')){classification='test';disposition='regression-or-contract'}
  else if(rel.startsWith('scripts/ql7-support/')||rel.startsWith('lib/ql7-support/simulation/')){classification='laboratory';disposition='proof-or-simulation'}
  else if(/\.md$/u.test(rel)||rel.startsWith('PROJECT_')){classification='documentation';disposition='traceability'}
  else if(TARGET.has(rel)){classification='target-integration';disposition='server-authoritative-policy-integration'}
  else if(FACADE.has(rel)){classification='compatibility';disposition='compatibility-query-projection-facade-not-behavior-owner'}
  else if(prod.has(rel)&&rel.startsWith('lib/ql7-support/')){classification='canonical-owner';disposition='active-production'}
  else if(prod.has(rel)){classification='production-dependency';disposition='active-production-dependency'}
  else if(consumers.has(rel)&&!rel.startsWith('lib/ql7-support/')){classification='production-consumer';disposition='support-consumer-protected-or-integrated'}
  else if(lab.has(rel)){classification='laboratory-dependency';disposition='active-laboratory'}
  else if(rel.endsWith('/package.json')){classification='package-metadata';disposition='module-scope-metadata'}
  else if(rel.includes('migrate')||rel.includes('Migration')){classification='migration';disposition='read-old-write-canonical'}
  else if(isOwnedProductionData(rel)){classification='production-data';disposition='versioned-material-production-data'}
  else if(rel.startsWith('lib/ql7-support/')){classification='unclassified';disposition='modern-support-module-without-reachable-owner';orphans.push(rel)}
  else if(directRefs.has(rel)){classification='reference';disposition='direct-support-reference'}
  else if(transitiveAdded.has(rel)){classification='external-shared';disposition='typed-shared-local-dependency'}
  else{classification='unclassified';disposition='no-disposition'}
  if(classification==='unclassified')unclassified.push(rel)
  rows.push({path:rel,classification,disposition,productionReachable:prod.has(rel),laboratoryReachable:lab.has(rel),directSupportReference:directRefs.has(rel),transitiveDependency:transitiveAdded.has(rel),sha256:sha(fs.readFileSync(path.join(root,rel)))})
 }
 let localDependencyEdgeCount=0;const outsideLocalDependencyEdges=[]
 for(const row of rows){if(!CODE.has(path.extname(row.path)))continue;for(const dep of graph.get(row.path)||[]){localDependencyEdgeCount++;if(!universe.has(dep))outsideLocalDependencyEdges.push({from:row.path,to:dep})}}
 const body={schema:'ql7.support.support-universe-inventory',schemaVersion:'5.5.0',excludedEvidenceNamespaces:['.ql7-patch-backups/**','report/QL7_SUPPORT_PATCH/**','reports/**'],historicalExpectedCount:Number(historicalExpectedCount||423),currentCount:rows.length,selectionCountBeforeTransitiveClosure:selectedBeforeClosure.size,transitiveAddedCount:transitiveAdded.size,localDependencyEdgeCount,outsideLocalDependencyCount:outsideLocalDependencyEdges.length,outsideLocalDependencyEdges,historicalFloorSatisfied:rows.length>=Number(historicalExpectedCount||423),unclassifiedCount:unclassified.length,orphanCount:orphans.length,classificationCounts:Object.fromEntries([...new Set(rows.map((r)=>r.classification))].sort().map((k)=>[k,rows.filter((r)=>r.classification===k).length])),rows,unclassified,orphans}
 return Object.freeze({...body,inventoryHash:sha(JSON.stringify(body)),transitiveClosureOk:outsideLocalDependencyEdges.length===0,ok:body.historicalFloorSatisfied&&body.unclassifiedCount===0&&body.orphanCount===0&&outsideLocalDependencyEdges.length===0})
}

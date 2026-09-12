import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import {QL7_SUPPORT_ALL_LOCALES} from '../../config/behaviorManifest.js'
import {ql7Str} from '../../internal/text.js'

export const QL7_SUPPORT_ACADEMY_KNOWLEDGE_ADAPTER_VERSION='1.1.0'

let cache=null
const SOURCE_LOCALES=new Set(['en','ru','uk','es','tr','ar','zh'])
const STOPWORDS=new Set([
  'the','a','an','is','are','what','how','why','who','where','when','does','do','works','work',
  'что','это','как','почему','кто','где','когда','такое','работает','работают','про','расскажи',
  'що','це','як','чому','хто','де','коли','працює',
  'que','qué','es','como','cómo','por','para','una','un','el','la',
  'ne','nedir','nasıl','nasil','bu','bir',
  'ما','هو','هي','كيف','ماذا','ماهو',
  '什么','怎么','如何','是什么',
])
const sha=(value)=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value??null)).digest('hex')
const SNAPSHOT_RELATIVE_PATH=path.join('lib','ql7-support','knowledge','academy','academyKnowledgeSnapshot.json')

function resolveSnapshotSource(){
  const cwdCandidate=path.resolve(process.cwd(),SNAPSHOT_RELATIVE_PATH)
  if(fs.existsSync(cwdCandidate))return cwdCandidate
  const metaUrl=ql7Str(import.meta.url)
  if(metaUrl.startsWith('file:'))return new URL('./academyKnowledgeSnapshot.json',metaUrl)
  throw Object.assign(new Error('ql7_academy_snapshot_path_unavailable'),{code:'QL7_ACADEMY_SNAPSHOT_PATH_UNAVAILABLE',metaScheme:metaUrl.split(':',1)[0]||'unknown'})
}
function localeOf(v='en'){const l=ql7Str(v).toLowerCase().split(/[-_]/u)[0];return QL7_SUPPORT_ALL_LOCALES.includes(l)?l:'en'}
function norm(v=''){return ql7Str(v).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]+/gu,' ').replace(/\s+/gu,' ').trim()}
function tokenArray(v=''){return norm(v).match(/[\p{L}\p{N}]+/gu)||[]}
function tokenSet(v=''){return new Set(tokenArray(v))}
function significantTokenArray(v=''){return tokenArray(v).filter((token)=>token.length>=2&&!STOPWORDS.has(token))}
function jaccard(a,b){if(!a.size||!b.size)return 0;let hit=0;for(const x of a)if(b.has(x))hit++;return hit/Math.max(1,a.size+b.size-hit)}

function buildCache(snapshot){
  const questionLexicon=new Set()
  const indexedRows=snapshot.rows.map((row)=>Object.freeze({
    qaKey:row.qaKey,
    family:row.family,
    blockIds:row.blockIds,
    translations:Object.freeze(Object.fromEntries(Object.entries(row.translations||{}).map(([loc,tr])=>{
      const questionNorm=norm(tr.question)
      const questionTokens=tokenSet(tr.question)
      const combinedTokens=tokenSet(`${tr.question} ${tr.answer}`)
      for(const token of significantTokenArray(tr.question))questionLexicon.add(token)
      return [loc,Object.freeze({question:tr.question,answer:tr.answer,sourceRef:tr.sourceRef,questionNorm,questionTokens,combinedTokens})]
    }))),
  }))
  return Object.freeze({snapshot,indexedRows:Object.freeze(indexedRows),questionLexicon})
}
function load(){
  if(cache)return cache
  const source=resolveSnapshotSource()
  const snapshot=JSON.parse(fs.readFileSync(source,'utf8'))
  if(snapshot.schema!=='ql7.support.academy-knowledge-snapshot'||snapshot.questionCount!==1470)throw Object.assign(new Error('ql7_academy_snapshot_invalid'),{code:'QL7_ACADEMY_SNAPSHOT_INVALID'})
  cache=buildCache(snapshot)
  return cache
}

export function shouldReadQl7SupportAcademyKnowledge({query='',topic='',messageAct=''}={}){
  const cleanTopic=ql7Str(topic).toLowerCase()
  if(cleanTopic==='academy'||cleanTopic==='academy_exam')return true
  const queryTokens=significantTokenArray(query)
  if(!queryTokens.length)return false
  if(/\b(?:nft|web3|defi|dao|staking|tokenomics|blockchain|smart\s*contract|blind\s*signing|social\s*recovery)\b/iu.test(ql7Str(query)))return true
  const {questionLexicon}=load()
  let materialHits=0
  for(const token of queryTokens){
    if(questionLexicon.has(token))materialHits+=1
    if(materialHits>=2)return true
  }
  if(materialHits===1&&['general_knowledge_question','informational_question','how_to_question'].includes(ql7Str(messageAct)))return true
  return false
}

function scoreRow(row,query,targetLocale,queryNorm,queryTokens){
  let best={score:0,sourceLocale:'en',question:'',answer:'',sourceRef:''}
  const order=SOURCE_LOCALES.has(targetLocale)?[targetLocale,...[...SOURCE_LOCALES].filter(x=>x!==targetLocale)]:[...SOURCE_LOCALES]
  for(const loc of order){
    const tr=row.translations?.[loc]
    if(!tr)continue
    let score=0
    if(queryNorm===tr.questionNorm)score=1
    else if(queryNorm&&tr.questionNorm&&(tr.questionNorm.includes(queryNorm)||queryNorm.includes(tr.questionNorm)))score=Math.max(score,.88)
    score=Math.max(score,jaccard(queryTokens,tr.questionTokens)*.86,jaccard(queryTokens,tr.combinedTokens)*.72)
    if(/\bnft\b/iu.test(query)&&row.family==='nft')score=Math.max(score,.78)
    if(score>best.score)best={score,sourceLocale:loc,question:tr.question,answer:tr.answer,sourceRef:tr.sourceRef}
  }
  return best
}

export function readQl7SupportAcademyKnowledge({query='',locale='en',limit=4,checkedAt=''}={}){
  const loaded=load(),snapshot=loaded.snapshot,targetLocale=localeOf(locale),ranked=[]
  const queryNorm=norm(query),queryTokens=tokenSet(query)
  for(const row of loaded.indexedRows){
    const scored=scoreRow(row,query,targetLocale,queryNorm,queryTokens)
    if(scored.score>0)ranked.push({...scored,qaKey:row.qaKey,family:row.family,blockIds:row.blockIds})
  }
  ranked.sort((a,b)=>b.score-a.score||a.qaKey.localeCompare(b.qaKey))
  const candidates=ranked.slice(0,Math.max(2,Math.min(8,Number(limit)||4)))
  const best=candidates[0]||null
  const margin=best?best.score-Number(candidates[1]?.score||0):0
  const verified=Boolean(best&&best.score>=.68)
  const ambiguous=Boolean(verified&&margin<.06&&Number(candidates[1]?.score||0)>=.68)
  const direct=Boolean(verified&&!ambiguous&&best.sourceLocale===targetLocale&&SOURCE_LOCALES.has(targetLocale))
  const result=verified?{qaKey:best.qaKey,family:best.family,blockIds:best.blockIds,question:best.question,answer:best.answer,sourceLocale:best.sourceLocale,targetLocale,sourceRef:best.sourceRef,score:Number(best.score.toFixed(6)),margin:Number(margin.toFixed(6)),requiresClarification:ambiguous,requiresNativeRealization:!direct,readyToSend:direct,candidates:candidates.map(x=>({qaKey:x.qaKey,family:x.family,sourceLocale:x.sourceLocale,score:Number(x.score.toFixed(6))}))}:{targetLocale,score:0,margin:0,requiresClarification:false,requiresNativeRealization:false,readyToSend:false,candidates:[]}
  const body={schema:'ql7.support.adapter-receipt',schemaVersion:QL7_SUPPORT_ACADEMY_KNOWLEDGE_ADAPTER_VERSION,adapter:'academy_knowledge',source:'academy.i18n.qa',executed:true,readOnly:true,writeCount:0,resultKind:verified?'verified':'verified_empty',result,checkedAt:ql7Str(checkedAt)||new Date().toISOString(),sourceSnapshotHash:snapshot.snapshotHash,sourceQuestionCount:snapshot.questionCount,sourceBlockCount:snapshot.blockCount}
  return Object.freeze({...body,id:`adapter:academy:${sha(`${targetLocale}:${queryNorm}:${best?.qaKey||'none'}`).slice(0,32)}`,sourceReceiptId:`academy:${snapshot.snapshotHash}:${best?.qaKey||'none'}`,receiptHash:sha(body)})
}

export function auditQl7AcademyKnowledge(){
  const loaded=load(),s=loaded.snapshot,failures=[]
  if(s.questionCount!==1470)failures.push('question_count')
  if(s.blockCount!==29)failures.push('block_count')
  if(s.sourceLocales.length!==7)failures.push('source_locale_count')
  for(const row of s.rows)for(const l of s.sourceLocales)if(!row.translations?.[l]?.question||!row.translations?.[l]?.answer)failures.push(`missing:${row.qaKey}:${l}`)
  if(!shouldReadQl7SupportAcademyKnowledge({query:'что такое NFT',topic:'open_subject',messageAct:'general_knowledge_question'}))failures.push('nft_eligibility')
  if(shouldReadQl7SupportAcademyKnowledge({query:'Как работает QCoin?',topic:'qcoin',messageAct:'informational_question'}))failures.push('qcoin_false_positive')
  const nft=readQl7SupportAcademyKnowledge({query:'что такое NFT',locale:'ru'})
  if(nft.result?.qaKey!=='qa_nft_501'||nft.result?.readyToSend!==true)failures.push('nft_lookup')
  const de=readQl7SupportAcademyKnowledge({query:'NFT',locale:'de'})
  if(de.resultKind!=='verified'||de.result?.readyToSend!==false||de.result?.requiresNativeRealization!==true)failures.push('non_source_locale_boundary')
  return Object.freeze({ok:failures.length===0,questionCount:s.questionCount,localizedQaRows:s.questionCount*s.sourceLocales.length,blockCount:s.blockCount,sourceLocales:Object.freeze(s.sourceLocales),questionLexiconSize:loaded.questionLexicon.size,failures:Object.freeze(failures),snapshotHash:s.snapshotHash})
}

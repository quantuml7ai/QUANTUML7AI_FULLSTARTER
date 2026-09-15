import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {fingerprintIndependent, compareSemanticDuplicateIndependent} from './semanticDuplicateOracle.js'
import {createQl7IndependentEmbeddingVerifier} from './embeddingSimilarityOracle.js'

export const QL7_SUPPORT_LAB_NOVELTY_INDEX_VERSION='5.1.0-scientific'
const sha=(v)=>crypto.createHash('sha256').update(String(v??'')).digest('hex')
const safe=(v)=>String(v??'').replace(/[\r\n]+/gu,' ').slice(0,12000)
const shard=(hash='')=>String(hash||'00').slice(0,2).padEnd(2,'0')
const u32=(v)=>crypto.createHash('sha256').update(String(v)).digest().readUInt32BE(0)
function atomicJson(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=`${file}.${process.pid}.tmp`;fs.writeFileSync(tmp,`${JSON.stringify(value,null,2)}\n`,'utf8');fs.renameSync(tmp,file)}
function signature(shingles=new Set(),size=32){const values=[...shingles];const out=[];for(let seed=0;seed<size;seed++){let min=0xffffffff;for(const item of values)min=Math.min(min,u32(`${seed}:${item}`));out.push(min)}return out}
function bands(sig=[],bandSize=4){const out=[];for(let i=0;i<sig.length;i+=bandSize){const part=sig.slice(i,i+bandSize);out.push(`${i/bandSize}:${sha(part.join(':')).slice(0,20)}`)}return out}
function pairKey(a,b){return a<b?`${a}\u0000${b}`:`${b}\u0000${a}`}

export class Ql7LabNoveltyIndex {
  constructor({outDir,threshold=.80,embeddingVerifier=null}={}){this.outDir=outDir;this.threshold=Number(threshold)||.80;this.dir=path.join(outDir,'novelty-index');fs.mkdirSync(this.dir,{recursive:true});this.streams=new Map();this.count=0;this.embeddingVerifier=embeddingVerifier||createQl7IndependentEmbeddingVerifier({modelId:'ql7-lab-hashed-semantic'})}
  streamFor(kind,key){const id=`${kind}-${shard(sha(key))}`;if(this.streams.has(id))return this.streams.get(id);const dir=path.join(this.dir,kind);fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${shard(sha(key))}.ndjson`);const stream=fs.createWriteStream(file,{flags:'a'});this.streams.set(id,stream);return stream}
  write({scenarioId='',locale='',branch='',text='',title=''}={}){
    const fp=fingerprintIndependent(text),skeletonHash=sha(fp.skeleton),scope=`${locale}:${branch}`;const row={scenarioId,locale,branch,exactHash:fp.exactHash,normalizedHash:fp.normalizedHash,sentenceMultisetHash:fp.sentenceMultisetHash,clauseMultisetHash:fp.clauseMultisetHash,skeletonHash,text:safe(text),title:safe(title)}
    for(const [kind,field] of [['exact','exactHash'],['normalized','normalizedHash'],['sentence','sentenceMultisetHash'],['clause','clauseMultisetHash'],['skeleton','skeletonHash']])this.streamFor(kind,`${scope}:${row[field]}`).write(`${JSON.stringify({...row,indexKey:`${scope}:${row[field]}`})}\n`)
    const sig=signature(fp.shingles,32);for(const band of bands(sig,4))this.streamFor('lsh',`${scope}:${band}`).write(`${JSON.stringify({...row,bandKey:`${scope}:${band}`})}\n`)
    this.count+=1
  }
  async close(){await Promise.all([...this.streams.values()].map((stream)=>new Promise((resolve,reject)=>{stream.end();stream.once('finish',resolve);stream.once('error',reject)})));this.streams.clear()}
  async finalize(){await this.close();const failures=[];const hist={exact:0,normalized:0,sentence:0,clause:0,skeleton:0,near:0};let compared=0,embeddingCompared=0
    for(const kind of ['exact','normalized','sentence','clause','skeleton']){const dir=path.join(this.dir,kind);if(!fs.existsSync(dir))continue;for(const name of fs.readdirSync(dir).filter((n)=>n.endsWith('.ndjson')).sort()){const seen=new Map();for(const line of fs.readFileSync(path.join(dir,name),'utf8').split(/\n/gu)){if(!line)continue;const row=JSON.parse(line),prior=seen.get(row.indexKey);if(prior&&prior.scenarioId!==row.scenarioId){hist[kind]+=1;if(failures.length<10000)failures.push({code:`${kind}_duplicate`,a:prior.scenarioId,b:row.scenarioId,locale:row.locale,branch:row.branch})}else if(!prior)seen.set(row.indexKey,row)}}}
    const checkedPairs=new Set(),lshDir=path.join(this.dir,'lsh');if(fs.existsSync(lshDir))for(const name of fs.readdirSync(lshDir).filter((n)=>n.endsWith('.ndjson')).sort()){const groups=new Map();for(const line of fs.readFileSync(path.join(lshDir,name),'utf8').split(/\n/gu)){if(!line)continue;const row=JSON.parse(line);if(!groups.has(row.bandKey))groups.set(row.bandKey,[]);groups.get(row.bandKey).push(row)}for(const group of groups.values()){for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){const key=pairKey(group[i].scenarioId,group[j].scenarioId);if(checkedPairs.has(key))continue;checkedPairs.add(key);compared++;const lexical=compareSemanticDuplicateIndependent(group[i].text,group[j].text,this.threshold);let semantic=lexical.similarity;if(lexical.similarity>=Math.max(.45,this.threshold-.25)){const embedding=await this.embeddingVerifier.compare(group[i].text,group[j].text,{threshold:this.threshold});embeddingCompared++;semantic=Math.max(semantic,Number(embedding.similarity||0))}if(semantic>=this.threshold){hist.near+=1;if(failures.length<10000)failures.push({code:'near_semantic_duplicate',a:group[i].scenarioId,b:group[j].scenarioId,similarity:semantic,lexicalSimilarity:lexical.similarity,locale:group[i].locale,branch:group[i].branch})}}}}
    const hardFailureCount=Object.values(hist).reduce((a,b)=>a+b,0);const summary={schema:'ql7.support.lab-novelty-index-summary',schemaVersion:QL7_SUPPORT_LAB_NOVELTY_INDEX_VERSION,count:this.count,total:this.count,threshold:this.threshold,comparedCandidates:compared,embeddingComparedCandidates:embeddingCompared,embeddingModelId:this.embeddingVerifier.modelId,embeddingModelChecksum:this.embeddingVerifier.modelChecksum,histogram:hist,hardFailureCount,failures,ok:hardFailureCount===0};atomicJson(path.join(this.outDir,'novelty-summary.json'),summary);return summary
  }
}

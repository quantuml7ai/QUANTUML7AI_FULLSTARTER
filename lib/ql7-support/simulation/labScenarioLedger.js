import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import readline from 'node:readline'
import {once} from 'node:events'

export const QL7_SUPPORT_LAB_SCENARIO_LEDGER_VERSION='5.1.0'
function ensureDir(dir){fs.mkdirSync(dir,{recursive:true})}
async function writeLine(stream,line){if(!stream.write(line))await once(stream,'drain')}
async function closeStream(stream){stream.end();await once(stream,'finish')}
async function shaFile(file){const h=crypto.createHash('sha256');const input=fs.createReadStream(file);for await(const chunk of input)h.update(chunk);return h.digest('hex')}
function prefix(hash=''){return String(hash||'0').slice(0,1).toLowerCase().replace(/[^0-9a-f]/g,'0')||'0'}

export class Ql7LabScenarioLedger{
 constructor({ledgerPath,indexDir,resume=false,nextIndex=0}={}){this.ledgerPath=path.resolve(ledgerPath);this.indexDir=path.resolve(indexDir);this.resume=Boolean(resume);this.nextIndex=Number(nextIndex||0);this.rows=0;this.lastIndex=-1;this.ledgerStream=null;this.indexStreams=new Map()}
 streamFor(kind,hash){const key=`${kind}-${prefix(hash)}`;if(!this.indexStreams.has(key)){ensureDir(this.indexDir);this.indexStreams.set(key,fs.createWriteStream(path.join(this.indexDir,`${key}.txt`),{flags:'a',encoding:'utf8'}))}return this.indexStreams.get(key)}
 async writeIndexes(row){await writeLine(this.streamFor('id',row.scenarioIdHash),`${row.scenarioIdHash}\n`);await writeLine(this.streamFor('semantic',row.semanticHash),`${row.semanticHash}\n`)}
 async init(){ensureDir(path.dirname(this.ledgerPath));if(!this.resume){try{fs.unlinkSync(this.ledgerPath)}catch{};fs.rmSync(this.indexDir,{recursive:true,force:true})}else if(fs.existsSync(this.ledgerPath)){
   fs.rmSync(this.indexDir,{recursive:true,force:true});ensureDir(this.indexDir)
   const temp=`${this.ledgerPath}.${process.pid}.resume.tmp`;const out=fs.createWriteStream(temp,{flags:'w',encoding:'utf8'});const input=readline.createInterface({input:fs.createReadStream(this.ledgerPath,{encoding:'utf8'}),crlfDelay:Infinity})
   for await(const line of input){if(!line.trim())continue;const row=JSON.parse(line);const idx=Number(row.index);if(!Number.isInteger(idx)||idx<0)throw new Error('lab_scenario_ledger_invalid_index');if(idx>=this.nextIndex)continue;if(idx<=this.lastIndex)throw new Error(`lab_scenario_ledger_non_monotonic:${idx}:${this.lastIndex}`);this.lastIndex=idx;this.rows++;await writeLine(out,`${JSON.stringify(row)}\n`);await this.writeIndexes(row)}
   await closeStream(out);fs.renameSync(temp,this.ledgerPath)
  }
  if(!fs.existsSync(this.ledgerPath))fs.writeFileSync(this.ledgerPath,'','utf8');this.ledgerStream=fs.createWriteStream(this.ledgerPath,{flags:'a',encoding:'utf8'});return this
 }
 async append(row){const idx=Number(row?.index);if(!Number.isInteger(idx)||idx<0)throw new Error('lab_scenario_ledger_append_invalid_index');if(idx<=this.lastIndex)throw new Error(`lab_scenario_ledger_append_non_monotonic:${idx}:${this.lastIndex}`);const clean={index:idx,scenarioId:String(row.scenarioId||''),scenarioIdHash:String(row.scenarioIdHash||''),semanticHash:String(row.semanticHash||''),locale:String(row.locale||''),bucket:String(row.bucket||''),capabilityId:String(row.capabilityId||'')};if(!clean.scenarioId||!/^[0-9a-f]{64}$/u.test(clean.scenarioIdHash)||!/^[0-9a-f]{64}$/u.test(clean.semanticHash))throw new Error('lab_scenario_ledger_append_invalid_hash');await writeLine(this.ledgerStream,`${JSON.stringify(clean)}\n`);await this.writeIndexes(clean);this.lastIndex=idx;this.rows++;return clean}
 async close(){if(this.ledgerStream){await closeStream(this.ledgerStream);this.ledgerStream=null}for(const stream of this.indexStreams.values())await closeStream(stream);this.indexStreams.clear();return{schema:'ql7.support.lab-scenario-ledger',schemaVersion:QL7_SUPPORT_LAB_SCENARIO_LEDGER_VERSION,rows:this.rows,lastIndex:this.lastIndex,sha256:await shaFile(this.ledgerPath),ledgerPath:this.ledgerPath,indexDir:this.indexDir}}
}

export async function auditQl7LabScenarioHashIndex(indexDir){const failures=[];let idRows=0,semanticRows=0,idDuplicates=0,semanticDuplicates=0;const dir=path.resolve(indexDir);if(!fs.existsSync(dir))return{ok:false,failures:['scenario_hash_index_missing'],idRows,semanticRows,idDuplicates,semanticDuplicates}
 for(const fn of fs.readdirSync(dir).filter(x=>/^(?:id|semantic)-[0-9a-f]\.txt$/u.test(x)).sort()){const kind=fn.startsWith('id-')?'id':'semantic';const seen=new Set();const input=readline.createInterface({input:fs.createReadStream(path.join(dir,fn),{encoding:'utf8'}),crlfDelay:Infinity});for await(const line of input){const value=line.trim();if(!value)continue;if(seen.has(value)){if(kind==='id')idDuplicates++;else semanticDuplicates++}seen.add(value);if(kind==='id')idRows++;else semanticRows++}}
 if(idDuplicates)failures.push(`scenario_id_duplicates:${idDuplicates}`);if(semanticDuplicates)failures.push(`semantic_scenario_duplicates:${semanticDuplicates}`);return{ok:failures.length===0,failures,idRows,semanticRows,idDuplicates,semanticDuplicates}
}

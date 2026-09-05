import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
export const QL7_SUPPORT_LAB_CHECKPOINT_VERSION='5.1.0'
const hash=(v)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export function writeQl7LabCheckpoint(file,state={}){const body={schema:'ql7.support.lab-checkpoint',schemaVersion:QL7_SUPPORT_LAB_CHECKPOINT_VERSION,...state};const value={...body,checkpointHash:hash(body)};fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=`${file}.${process.pid}.tmp`;fs.writeFileSync(tmp,`${JSON.stringify(value,null,2)}\n`,'utf8');fs.renameSync(tmp,file);return value}
export function readQl7LabCheckpoint(file){if(!fs.existsSync(file))return null;const value=JSON.parse(fs.readFileSync(file,'utf8'));const copy={...value};delete copy.checkpointHash;if(value.schema!=='ql7.support.lab-checkpoint'||value.schemaVersion!==QL7_SUPPORT_LAB_CHECKPOINT_VERSION||hash(copy)!==value.checkpointHash)throw new Error('ql7_lab_checkpoint_invalid');return value}

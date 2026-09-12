import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

export const QL7_SUPPORT_MATERIAL_DATA_LOADER_VERSION='5.4.0'
const HERE=path.dirname(fileURLToPath(import.meta.url))
const SUPPORT_ROOT=path.resolve(HERE,'..')
const PROJECT_ROOT=path.resolve(SUPPORT_ROOT,'../..')

export function readQl7MaterialJson(relativeFromProject=''){
  const rel=String(relativeFromProject||'').replace(/\\/g,'/').replace(/^\/+/, '')
  if(!rel || rel.includes('..')) throw new Error(`material_data_unsafe_path:${rel}`)
  const file=path.join(PROJECT_ROOT,rel)
  const raw=fs.readFileSync(file,'utf8')
  return JSON.parse(raw)
}
export function listQl7MaterialJson(relativeDir=''){
  const rel=String(relativeDir||'').replace(/\\/g,'/').replace(/^\/+/, '')
  if(!rel || rel.includes('..')) throw new Error(`material_data_unsafe_dir:${rel}`)
  const dir=path.join(PROJECT_ROOT,rel)
  return fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort().map(name=>`${rel}/${name}`)
}
export function loadQl7MaterialRows(relativeDir,key){
  const rows=[]
  for(const rel of listQl7MaterialJson(relativeDir)){
    const doc=readQl7MaterialJson(rel)
    const part=Array.isArray(doc?.[key])?doc[key]:[]
    rows.push(...part)
  }
  return rows
}

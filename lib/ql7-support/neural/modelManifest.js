import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {fileURLToPath} from 'node:url'
export const QL7_NATIVE_MODEL_MANIFEST_SCHEMA='ql7.native-model-release'
export const QL7_NATIVE_PROMOTION_STATUSES=Object.freeze(['BOOTSTRAP_STRUCTURAL','PRODUCTION_PROMOTED'])
function sha256File(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
function projectRoot(){return process.env.QL7_PROJECT_ROOT?path.resolve(process.env.QL7_PROJECT_ROOT):path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..')}
export function getQl7NativeModelManifestPath(){return path.join(projectRoot(),'models','ql7-native','active-manifest.json')}
export function loadQl7NativeModelManifest({verifyArtifacts=true,requirePromoted=false}={}){
  const manifestPath=getQl7NativeModelManifestPath(); if(!fs.existsSync(manifestPath))throw Object.assign(new Error('ql7_native_model_manifest_missing'),{code:'ql7_native_model_manifest_missing'})
  const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'))
  const failures=[]
  if(m.schema!==QL7_NATIVE_MODEL_MANIFEST_SCHEMA)failures.push('schema')
  if(Number(m.schemaVersion)!==1)failures.push('schemaVersion')
  if(m.active!==true)failures.push('active')
  if(!QL7_NATIVE_PROMOTION_STATUSES.includes(String(m.promotionStatus||'')))failures.push('promotionStatus')
  if(requirePromoted&&m.promotionStatus!=='PRODUCTION_PROMOTED')failures.push('not_production_promoted')
  const roles=['tokenizer','normalizer','understanding','generator','critic']
  if(verifyArtifacts)for(const role of roles){const row=m[role]||{};if(!row.artifact||!row.sha256){failures.push(`${role}:descriptor`);continue}const abs=path.join(projectRoot(),String(row.artifact));if(!fs.existsSync(abs)){failures.push(`${role}:missing`);continue}if(sha256File(abs)!==String(row.sha256).toLowerCase())failures.push(`${role}:hash`)}
  if(failures.length){const e=new Error(`ql7_native_model_manifest_invalid:${failures.join(',')}`);e.code='ql7_native_model_manifest_invalid';e.failures=failures;throw e}
  return Object.freeze({...m,manifestPath,manifestHash:sha256File(manifestPath)})
}
export function assertQl7NativeEndpoint(endpoint=''){
  const raw=String(endpoint||'').trim(); if(!raw)return true
  if(raw.startsWith('unix:')||raw.startsWith('pipe:'))return true
  const u=new URL(raw);if(!['127.0.0.1','localhost','::1','[::1]'].includes(u.hostname))throw Object.assign(new Error('external_model_endpoint_forbidden'),{code:'external_model_endpoint_forbidden'});return true
}

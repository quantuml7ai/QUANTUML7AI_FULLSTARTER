import crypto from 'node:crypto'
const sha=(v)=>crypto.createHash('sha256').update(JSON.stringify(v??null)).digest('hex')
const protectedKey=/(?:^|_)(?:id|ids|status|code|amount|currency|duration|timer|date|time|topic|intent|action|receipt|schema|version|url|href|route|case|operation|policy)(?:$|_)/iu
const PARITY_METADATA_KEYS=new Set(['translationStatus','nativeOnly'])
function project(value,key='',parentKey=''){
 if(value==null||typeof value==='number'||typeof value==='boolean')return value
 if(typeof value==='string')return parentKey==='labels'||!protectedKey.test(key)?'<visible-text>':value
 if(Array.isArray(value))return value.map((item)=>project(item,key,parentKey))
 if(typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!PARITY_METADATA_KEYS.has(k)).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,project(v,k,key)]))
 return String(value)
}
function differencePaths(left,right,path='',out=[]){
 if(out.length>=64)return out
 if(Object.is(left,right))return out
 if(Array.isArray(left)||Array.isArray(right)){
  if(!Array.isArray(left)||!Array.isArray(right)){out.push(path||'<root>');return out}
  if(left.length!==right.length)out.push(`${path||'<root>'}.length`)
  const length=Math.min(left.length,right.length)
  for(let index=0;index<length;index+=1)differencePaths(left[index],right[index],`${path}[${index}]`,out)
  return out
 }
 if(left&&right&&typeof left==='object'&&typeof right==='object'){
  const keys=[...new Set([...Object.keys(left),...Object.keys(right)])].sort()
  for(const key of keys){
   const next=path?`${path}.${key}`:key
   if(!(key in left)||!(key in right))out.push(next)
   else differencePaths(left[key],right[key],next,out)
   if(out.length>=64)break
  }
  return out
 }
 out.push(path||'<root>')
 return out
}
export function verifyQl7LocalizationStructuralParity({sourceSurface=null,targetSurface=null,sourcePolicy=null,targetPolicy=null}={}){
 const sourceSurfaceProjection=project(sourceSurface),targetSurfaceProjection=project(targetSurface),sourcePolicyProjection=project(sourcePolicy),targetPolicyProjection=project(targetPolicy)
 const surfaceParity=sha(sourceSurfaceProjection)===sha(targetSurfaceProjection),policyParity=sha(sourcePolicyProjection)===sha(targetPolicyProjection)
 const body={schema:'ql7.support.localization-parity-receipt',schemaVersion:'1.1',surfaceParity,policyParity,factParity:surfaceParity,actionParity:surfaceParity&&policyParity,intentParity:policyParity,surfaceDifferencePaths:Object.freeze(differencePaths(sourceSurfaceProjection,targetSurfaceProjection)),policyDifferencePaths:Object.freeze(differencePaths(sourcePolicyProjection,targetPolicyProjection)),sourceSurfaceHash:sha(sourceSurfaceProjection),targetSurfaceHash:sha(targetSurfaceProjection),sourcePolicyHash:sha(sourcePolicyProjection),targetPolicyHash:sha(targetPolicyProjection)}
 return Object.freeze({...body,verified:body.factParity&&body.actionParity&&body.intentParity,receiptHash:sha(body)})
}

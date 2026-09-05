import {loadQl7NativeModelManifest} from './modelManifest.js'
import {createQl7GenerationRequest,validateQl7GenerationCandidate} from './generationContract.js'
export const QL7_NATIVE_GENERATION_ADAPTER_VERSION='1.0.0'
export function generateQl7NativeCandidates({semanticPlan,evidencePack=null,styleState=null,locale='en',count=3}={}){
 const manifest=loadQl7NativeModelManifest({requirePromoted:false})
 if(manifest.promotionStatus!=='PRODUCTION_PROMOTED')return Object.freeze({available:false,reason:'MODEL_BEHAVIOR_NOT_PROVEN',releaseId:manifest.releaseId,candidates:Object.freeze([])})
 const binding=globalThis.__QL7_NATIVE_GENERATOR_SYNC__
 if(typeof binding!=='function')throw Object.assign(new Error('ql7_native_generator_binding_missing'),{code:'QL7_NATIVE_GENERATOR_BINDING_MISSING'})
 const request=createQl7GenerationRequest({semanticPlan,evidencePack,styleState,locale,count,releaseId:manifest.releaseId})
 const raw=binding(request);if(!Array.isArray(raw))throw new Error('ql7_native_generator_invalid_result')
 const candidates=raw.map((x,i)=>validateQl7GenerationCandidate(x,{request,index:i,manifest}))
 return Object.freeze({available:true,releaseId:manifest.releaseId,candidates:Object.freeze(candidates)})
}

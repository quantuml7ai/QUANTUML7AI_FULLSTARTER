import {loadQl7NativeModelManifest} from './modelManifest.js'
import {createQl7CriticRequest,validateQl7CriticReceipt} from './criticContract.js'
export const QL7_NATIVE_CRITIC_ADAPTER_VERSION='1.0.0'
export function critiqueQl7NativeCandidate({candidate,semanticPlan,evidencePack=null,locale='en'}={}){
 const manifest=loadQl7NativeModelManifest({requirePromoted:false})
 if(manifest.promotionStatus!=='PRODUCTION_PROMOTED')return Object.freeze({available:false,reason:'MODEL_BEHAVIOR_NOT_PROVEN',releaseId:manifest.releaseId})
 const binding=globalThis.__QL7_NATIVE_CRITIC_SYNC__
 if(typeof binding!=='function')throw Object.assign(new Error('ql7_native_critic_binding_missing'),{code:'QL7_NATIVE_CRITIC_BINDING_MISSING'})
 const request=createQl7CriticRequest({candidate,semanticPlan,evidencePack,locale,releaseId:manifest.releaseId});return validateQl7CriticReceipt(binding(request),{request,manifest})
}

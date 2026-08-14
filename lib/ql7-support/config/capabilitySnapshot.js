import { isQl7SupportActive } from './featureFlag.js'
import { QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH, QL7_SUPPORT_RUNTIME_VERSION } from './behaviorManifest.js'
export function resolveSupportCapabilitySnapshot({now=Date.now}={}){
 const current=typeof now==='function'?Number(now()):Number(now||Date.now())
 return Object.freeze({supportActive:isQl7SupportActive(),runtimeVersion:QL7_SUPPORT_RUNTIME_VERSION,behaviorManifestHash:QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH,generatedAt:new Date(current).toISOString()})
}

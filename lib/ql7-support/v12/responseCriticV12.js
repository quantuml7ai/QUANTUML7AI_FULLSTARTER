import { critiqueQl7SupportResponseV13, QL7_SUPPORT_MACHINE_PHRASES_V13 } from '../response/critiqueResponse.js'
export const QL7_SUPPORT_RESPONSE_CRITIC_VERSION_V12='12.0.0-v13-compat'
export const QL7_SUPPORT_FORBIDDEN_RESPONSE_PATTERNS_V12=Object.freeze(QL7_SUPPORT_MACHINE_PHRASES_V13.map((pattern,index)=>[`v13_machine_phrase_${index+1}`,pattern,'critical']))
export function critiqueQl7SupportResponseV12(input={}){return critiqueQl7SupportResponseV13(input)}

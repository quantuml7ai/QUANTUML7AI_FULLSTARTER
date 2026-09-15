export const QL7_SUPPORT_APPROVED_INTERACTIONS_VERSION='5.1.0'
export const QL7_SUPPORT_APPROVED_INTERACTIONS=Object.freeze([
 Object.freeze({interactionId:'entity_x_phrase',families:Object.freeze(['entity_product_alias','lexical_morphological']),weight:.18}),
 Object.freeze({interactionId:'negation_x_safety',families:Object.freeze(['negation_scope','safety_operational_capability']),weight:-.35}),
 Object.freeze({interactionId:'quotation_x_safety',families:Object.freeze(['quotation_reported_speech','safety_operational_capability']),weight:-.45}),
 Object.freeze({interactionId:'memory_x_domain',families:Object.freeze(['conversation_memory_agreement','entity_product_alias']),weight:.12}),
 Object.freeze({interactionId:'locale_x_lexical',families:Object.freeze(['locale_script_codeswitch_agreement','lexical_morphological']),weight:.1}),
 Object.freeze({interactionId:'source_x_action',families:Object.freeze(['source_fact_eligibility','actor_target_action']),weight:.2}),
])
export function listQl7ApprovedInteractions(){return QL7_SUPPORT_APPROVED_INTERACTIONS}

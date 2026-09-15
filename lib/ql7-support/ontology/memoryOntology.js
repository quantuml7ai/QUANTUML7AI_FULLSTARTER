import crypto from 'node:crypto'
export const QL7_SUPPORT_MEMORY_ONTOLOGY_VERSION='5.1.0'
export const QL7_SUPPORT_MEMORY_FRAME_TYPES=Object.freeze(['active_topic','suspended_topic','resolved_topic','abandoned_topic','correction','rejected_hypothesis','entity_reference','user_commitment','system_commitment','exact_return_point','intent_confirmation'])
export const QL7_SUPPORT_MEMORY_RELATIONS=Object.freeze(['returns_to','corrects','rejects_hypothesis','contains','related_to'])
export function auditQl7SupportMemoryOntology(){const failures=[];
if(new Set(QL7_SUPPORT_MEMORY_FRAME_TYPES).size!==QL7_SUPPORT_MEMORY_FRAME_TYPES.length)failures.push('duplicate_frame_type');
if(!QL7_SUPPORT_MEMORY_FRAME_TYPES.includes('exact_return_point'))failures.push('missing_exact_return_point');
const body={version:QL7_SUPPORT_MEMORY_ONTOLOGY_VERSION,frameTypes:QL7_SUPPORT_MEMORY_FRAME_TYPES,relations:QL7_SUPPORT_MEMORY_RELATIONS};
return Object.freeze({ok:!failures.length,...body,manifestHash:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'),failures:Object.freeze(failures)})}

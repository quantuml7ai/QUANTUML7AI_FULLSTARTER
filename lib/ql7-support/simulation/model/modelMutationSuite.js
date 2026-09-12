import crypto from 'node:crypto'
const h=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export const QL7_MODEL_MUTATION_SUITE_VERSION='1.0.0'
export const QL7_MODEL_MUTATIONS=Object.freeze(['NO_HIT_HIGH_CONFIDENCE_CLEAN','DISCONNECT_BATTLE_SHARED_MODEL','ALLOW_FIFTH_ORANGE_PERSIST','ALLOW_RED_PERSIST','REMOVE_SOURCE_RECEIPT','STALE_MEMORY_OVERRIDE','EXTERNAL_PROVIDER_FALLBACK','HOLDOUT_LABEL_LEAK','DUPLICATE_ENTITY_PRESENTATION','POLICY_BYPASS'])
export function buildQl7ModelMutationSuite({seed='ql7',mutations=QL7_MODEL_MUTATIONS}={}){const rows=[...mutations].map((id,i)=>Object.freeze({mutationId:id,seed:`${seed}:${i}`,expectedFailureCode:`mutation_detected:${id.toLowerCase()}`}));const body={schema:'ql7.support.model-mutation-suite',schemaVersion:QL7_MODEL_MUTATION_SUITE_VERSION,rows:Object.freeze(rows)};return Object.freeze({...body,suiteHash:h(body)})}

import crypto from 'node:crypto'
export const QL7_SUPPORT_RELEASE_EVIDENCE_MANIFEST_VERSION='5.1.0'
export function validateQl7ReleaseEvidenceManifest(m={}){const failures=[];
for(const k of ['schemaVersion','manifestHash','gates','runs','sourceLockPath','capabilityRegistryHash'])if(!m?.[k])failures.push(`missing:${k}`);
if(m.release==='PASS'&&m.ok!==true)failures.push('pass_without_ok');
for(const g of ['A','B','C','D','E','F','G','H','I'])if(m.release==='PASS'&&m.gates?.[g]?.ok!==true)failures.push(`gate:${g}`);
return Object.freeze({ok:!failures.length,failures:Object.freeze(failures)})}
export function hashQl7ReleaseEvidenceManifest(m={}){const copy={...m};
delete copy.manifestHash;
return crypto.createHash('sha256').update(JSON.stringify(copy)).digest('hex')}

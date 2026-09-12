import fs from 'node:fs';
import path from 'node:path';
import {validateQl7ReleaseEvidenceManifest,hashQl7ReleaseEvidenceManifest} from '../lib/ql7-support/simulation/releaseEvidenceManifest.js';
const argv=Object.fromEntries(process.argv.slice(2).map((x,i,a)=>x.startsWith('--')?[x.slice(2).split('=')[0],x.includes('=')?x.slice(x.indexOf('=')+1):(a[i+1]&&!a[i+1].startsWith('--')?a[i+1]:true)]:['','']).filter(x=>x[0]));
const mode=String(argv.mode||'development'),file=path.resolve(String(argv.manifest||'reports/ql7-support/release-evidence-manifest.json'));
if(mode!=='production'){console.log(JSON.stringify({ok:true,mode,release:'NON_RELEASE_MODE'},null,2));
process.exit(0)}if(!fs.existsSync(file))throw new Error(`release_evidence_manifest_missing:${file}`);
const m=JSON.parse(fs.readFileSync(file,'utf8')),v=validateQl7ReleaseEvidenceManifest(m),computed=hashQl7ReleaseEvidenceManifest(m),failures=[...v.failures];
if(computed!==m.manifestHash)failures.push('manifest_hash_mismatch');
if(m.ok!==true||m.release!=='PASS')failures.push('release_manifest_not_pass');
const report={ok:!failures.length,mode,manifest:file,manifestHash:m.manifestHash,failures};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1

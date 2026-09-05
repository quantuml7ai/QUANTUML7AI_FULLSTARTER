import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {QL7_SUPPORT_CRISIS_REQUIRED_LOCALES} from './crisisConceptBank.js'
export const QL7_SUPPORT_CRISIS_REVIEWED_CUE_BANK_VERSION='5.4.0'
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..')
const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()
function load(locale){const p=path.join(ROOT,'lib/ql7-support/safety/crisisReviewed',`${locale}.json`);return JSON.parse(fs.readFileSync(p,'utf8')).rows||[]}
export const QL7_SUPPORT_CRISIS_REVIEWED_CUES_BY_LOCALE=Object.freeze(Object.fromEntries(QL7_SUPPORT_CRISIS_REQUIRED_LOCALES.map(locale=>[locale,Object.freeze(load(locale).map(row=>Object.freeze({...row,policyAuthority:false})))])))
export function auditQl7SupportCrisisReviewedCues(){const failures=[],perLocale={};for(const [l,rows] of Object.entries(QL7_SUPPORT_CRISIS_REVIEWED_CUES_BY_LOCALE)){const unique=new Set(rows.map(r=>norm(r.surface)));perLocale[l]={rows:rows.length,normalizedDistinct:unique.size};if(rows.length<64||unique.size<64)failures.push(`cue_floor:${l}:${rows.length}/${unique.size}`);if(rows.some(r=>!r.surface||r.mutationDerived||!r.provenance?.sourceRef))failures.push(`materiality:${l}`)}const total=Object.values(QL7_SUPPORT_CRISIS_REVIEWED_CUES_BY_LOCALE).reduce((n,r)=>n+r.length,0);if(total<2048)failures.push(`total:${total}`);return Object.freeze({ok:!failures.length,localeCount:Object.keys(QL7_SUPPORT_CRISIS_REVIEWED_CUES_BY_LOCALE).length,totalCues:total,normalizedDistinctTotal:Object.values(perLocale).reduce((n,x)=>n+x.normalizedDistinct,0),cuesPerLocale:64,perLocale:Object.freeze(perLocale),nativeHumanReviewStillRequired:true,failures:Object.freeze(failures)})}

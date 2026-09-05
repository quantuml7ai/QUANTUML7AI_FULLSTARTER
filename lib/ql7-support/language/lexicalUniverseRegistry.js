import {QL7_SUPPORT_ALL_LOCALES} from './locales/manifest.js'
import {readQl7MaterialJson} from './materialDataLoader.js'
import {QL7_SUPPORT_NATIVE_SAFETY_LEXICON} from './safetyLexicon.native.js'
import {ql7StableHash,ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_LEXICAL_UNIVERSE_VERSION='16.1.0'
const cache=new Map()
const flat=(v)=>Array.isArray(v)?v.flatMap(x=>Array.isArray(x)?flat(x):[x]):[]
const add=(set,value)=>{const s=ql7Str(value).trim();if(s)set.add(s)}
function build(locale){
 const terms=new Set(),classes={reviewed:0,dialect:0,slang:0,euphemism:0,safety:0,negative:0,positive:0}
 const reviewed=readQl7MaterialJson(`lib/ql7-support/language/reviewedMaterial/${locale}.json`)
 for(const row of reviewed.rows||[]){add(terms,row.surface);classes.reviewed++;for(const x of row.positiveExamples||[]){add(terms,x);classes.positive++}for(const x of row.negativeExamples||[]){add(terms,x);classes.negative++}}
 const dialect=readQl7MaterialJson(`lib/ql7-support/language/dialectProfiles/${locale}.json`)
 for(const row of dialect.rows||dialect.profiles||[]){for(const x of row.lexicalPatterns||[]){add(terms,x);classes.dialect++}for(const x of row.slangAliases||[]){add(terms,x);classes.slang++}for(const x of row.phoneticVoiceLikePatterns||[]){add(terms,x);classes.dialect++}for(const m of row.euphemismMappings||[]){add(terms,m?.from);add(terms,m?.to);classes.euphemism+=2}for(const x of row.codeSwitchPatterns||[]){add(terms,x);classes.dialect++}}
 const safety=QL7_SUPPORT_NATIVE_SAFETY_LEXICON[locale]||QL7_SUPPORT_NATIVE_SAFETY_LEXICON.en
 for(const family of ['insults','targets','denials','product','quotes'])for(const x of safety?.[family]||[]){add(terms,x);classes.safety++}
 const rows=Object.freeze([...terms].map(surface=>Object.freeze({surface,readyToSend:false,use:'understanding-evidence-only'})))
 return Object.freeze({schema:'ql7.support.lexical-universe',schemaVersion:QL7_SUPPORT_LEXICAL_UNIVERSE_VERSION,locale,rows,termCount:rows.length,classes:Object.freeze(classes),openVocabulary:true,productiveMutationRequired:true,neuralGeneralizationRequired:true,hash:ql7StableHash(rows.map(x=>x.surface).sort().join('\n'))})
}
export function getQl7LexicalUniverse(locale='en'){const l=String(locale||'en').toLowerCase().split(/[-_]/u)[0];const key=QL7_SUPPORT_ALL_LOCALES.includes(l)?l:'en';if(!cache.has(key))cache.set(key,build(key));return cache.get(key)}
export function auditQl7LexicalUniverse(){const rows=QL7_SUPPORT_ALL_LOCALES.map(getQl7LexicalUniverse);const failures=[];if(rows.length!==32)failures.push(`locale_count:${rows.length}`);for(const r of rows){if(r.termCount<1500)failures.push(`material_floor:${r.locale}:${r.termCount}`);if(r.openVocabulary!==true||r.neuralGeneralizationRequired!==true)failures.push(`open_vocab_contract:${r.locale}`)}return Object.freeze({ok:!failures.length,localeCount:rows.length,totalMaterialTerms:rows.reduce((n,r)=>n+r.termCount,0),rows:Object.freeze(rows.map(r=>Object.freeze({locale:r.locale,termCount:r.termCount,hash:r.hash,classes:r.classes}))),failures:Object.freeze(failures)})}

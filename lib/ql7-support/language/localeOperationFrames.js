import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {createQl7SupportLinguisticPrimitive} from './linguisticPrimitiveSchema.js'
import {QL7_SUPPORT_PROFILE_LOCALES} from './locales/manifest.js'
import {realizeQl7SupportCompositionalSurface} from './compositionalGrammar.js'

export const QL7_SUPPORT_LOCALE_OPERATION_FRAMES_VERSION = '5.1.1-primitive-adapter'
export const QL7_SUPPORT_REQUIRED_OPERATION_FRAME_KEYS = Object.freeze([
  'greeting','invite','thanks','farewell','wellbeing','noise','clarify','abstain','emotion','socialBoundary','identity','reportedSpeech','targetClarify','denialRepair','boundary','crisis','threat','business','contact','handoff','noNewFact','incident','unavailable','verified','empty','planned','knowledge','howTo','smallTalk','aiQuota','aiDisclaimer','humor','topicRecall',
])
const SLOT_REQUIREMENTS=Object.freeze({ clarify:Object.freeze(['topic','detail']), unavailable:Object.freeze(['topic']), verified:Object.freeze(['topic']), planned:Object.freeze(['topic']), knowledge:Object.freeze(['topic']), howTo:Object.freeze(['topic']), humor:Object.freeze(['topic']), topicRecall:Object.freeze(['topic']) })
function buildFrames(){return Object.freeze(Object.fromEntries(QL7_SUPPORT_PROFILE_LOCALES.map(locale=>[
 locale,Object.freeze(Object.fromEntries(QL7_SUPPORT_REQUIRED_OPERATION_FRAME_KEYS.map(key=>[
  key,Object.freeze([createQl7SupportLinguisticPrimitive({
   entryId:`${locale}.operation-frame.${key}.01`,locale,semanticRole:`operation-frame-ref:${key}`,speechAct:key,
   lexicalChoices:[`operation:${key}`],syntacticFrame:{type:'compositional-operation-ref',slots:SLOT_REQUIREMENTS[key]||[]},
   requiredContext:SLOT_REQUIREMENTS[key]||[],forbiddenContext:['cross-domain-leakage','unsupported-fact','ready-final-prose'],
   pragmaticEffect:key,provenance:{owner:'ql7-support.language.locale-operation-frames',sourceId:`compositional-operation:${key}`,sourceVersion:QL7_SUPPORT_LOCALE_OPERATION_FRAMES_VERSION},
  })]),
 ]))),
]))) }
export const QL7_SUPPORT_LOCALE_OPERATION_FRAMES=buildFrames()
export function realizeQl7SupportLocaleOperationFrame(locale='en',key='',variables={},seed=''){
 const rows=ql7Arr(QL7_SUPPORT_LOCALE_OPERATION_FRAMES[locale]?.[key]);if(!rows.length)throw Object.assign(new Error(`ql7_locale_operation_frame_missing:${locale}:${key}`),{code:'ql7_locale_operation_frame_missing'})
 const entry=rows[0];const missing=entry.requiredContext.filter(slot=>!ql7Str(variables[slot]));if(missing.length)throw Object.assign(new Error(`ql7_locale_operation_frame_context_missing:${locale}:${key}:${missing.join(',')}`),{code:'ql7_locale_operation_frame_context_missing'})
 const realized=realizeQl7SupportCompositionalSurface(locale,key,variables,`${seed}:${entry.contentHash}`)
 return Object.freeze({text:realized.text,entryId:entry.entryId,contentHash:ql7StableHash(`${entry.contentHash}:${realized.contentHash}`),key,locale,semanticPrimitive:true,finalTextOwner:false,realizationReceipt:realized.receipt})
}
export function auditQl7SupportLocaleOperationFrames(){const failures=[];for(const locale of QL7_SUPPORT_PROFILE_LOCALES){const pack=QL7_SUPPORT_LOCALE_OPERATION_FRAMES[locale];if(!pack){failures.push(`missing_locale:${locale}`);continue}for(const key of QL7_SUPPORT_REQUIRED_OPERATION_FRAME_KEYS){const rows=ql7Arr(pack[key]);if(rows.length!==1)failures.push(`frame_count:${locale}:${key}`);for(const entry of rows){if(entry.syntacticFrame.type!=='compositional-operation-ref')failures.push(`not_semantic_primitive:${locale}:${key}`);if(entry.lexicalChoices.some(v=>/[.!?。！？؟]/u.test(v)))failures.push(`ready_sentence:${locale}:${key}`)}}}return Object.freeze({version:QL7_SUPPORT_LOCALE_OPERATION_FRAMES_VERSION,localeCount:Object.keys(QL7_SUPPORT_LOCALE_OPERATION_FRAMES).length,operationCount:QL7_SUPPORT_REQUIRED_OPERATION_FRAME_KEYS.length,entryCount:Object.values(QL7_SUPPORT_LOCALE_OPERATION_FRAMES).reduce((s,p)=>s+Object.values(p).reduce((n,r)=>n+r.length,0),0),readyToSendRows:0,finalSentenceRows:0,semanticProjection:true,semanticPrimitive:true,failures:Object.freeze(failures),ok:failures.length===0})}

import {requestQl7NativeTranslation,getQl7NativeModelConfig} from './neural/nativeModelGateway.js'
import {QL7_SUPPORT_ALL_LOCALES} from './config/behaviorManifest.js'

export const QL7_SUPPORT_NATIVE_TRANSLATION_SERVICE_VERSION='17.0.0'
export const QL7_SUPPORT_TRANSLATION_MIRRORS=Object.freeze([])
const SECRET_INPUT_RE=/(?:seed\s+phrase|mnemonic|private\s+key|bearer\s+[A-Za-z0-9._~+\/=:-]{12,}|ql7ws_[A-Za-z0-9._~+\/=:-]{12,}|session[_ -]?token\s*[:=]\s*\S{8,})/iu
function str(v){return String(v??'').trim()}
function lang(v,f='en'){const x=str(v).split(/[-_]/)[0].toLowerCase(),mapped=x==='ua'?'uk':x==='cn'?'zh':x;return QL7_SUPPORT_ALL_LOCALES.includes(mapped)?mapped:f}
function assertSafe(text){if(SECRET_INPUT_RE.test(String(text||''))){const e=new Error('support_native_translation_secret_input_rejected');e.code='support_native_translation_secret_input_rejected';throw e}}
export async function translateQl7SupportTextNative({text='',sourceLang='auto',targetLang='en',purpose='ql7_support',semanticPlanHash='',immutableFactsHash='',signal=null}={}){
 const clean=str(text);if(!clean)return Object.freeze({text:'',engine:'noop_empty',purpose,attempts:Object.freeze([]),modelReceipts:Object.freeze([]),translationSucceeded:true})
 assertSafe(clean)
 const source=sourceLang==='auto'?'auto':lang(sourceLang,'auto'),target=lang(targetLang,'')
 if(!target){const e=new Error('support_native_translation_target_locale_unsupported');e.code='support_native_translation_target_locale_unsupported';throw e}
 if(source!=='auto'&&source===target)return Object.freeze({text:clean,engine:'noop_same_language',sourceLang:source,targetLang:target,purpose,attempts:Object.freeze([]),modelReceipts:Object.freeze([]),translationSucceeded:true})
 const config=getQl7NativeModelConfig()
 const result=await requestQl7NativeTranslation({text:clean,sourceLang:source,targetLang:target,purpose,semanticPlanHash,immutableFactsHash},{signal})
 if(result?.status==='ok'&&str(result.output?.text))return Object.freeze({text:str(result.output.text),engine:'ql7-native',sourceLang:source,targetLang:target,purpose,attempts:Object.freeze([{engine:'ql7-native',ok:true}]),modelReceipts:Object.freeze([result.receipt].filter(Boolean)),modelReleaseId:config.model,promotionStatus:config.promotionStatus,translationSucceeded:true})
 return Object.freeze({text:clean,engine:'ql7-native-unavailable-original-not-success',warning:str(result?.errorCode||'native_translation_unavailable'),sourceLang:source,targetLang:target,purpose,attempts:Object.freeze([{engine:'ql7-native',ok:false,code:str(result?.errorCode)}]),modelReceipts:Object.freeze([result?.receipt].filter(Boolean)),modelReleaseId:config.model,promotionStatus:config.promotionStatus,translationSucceeded:false})
}

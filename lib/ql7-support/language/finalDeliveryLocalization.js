import {hashQl7SupportDeliveryText} from '../contracts/finalDeliveryReceipt.js'
import {buildQl7SupportCard} from '../cardSchema.js'
import {localizeQl7SupportReply} from '../languageOrchestrator.js'
import {localizeQl7SupportInputPolicyNative,localizeQl7SupportStructuredNative} from './nativeStructuredLocalization.js'
import {translateQl7SupportTextNative} from '../nativeTranslationService.js'
import {verifyQl7LocalizationStructuralParity} from './localizationParity.js'
import {isQl7SupportLocaleSupported} from './locales.js'

export const QL7_SUPPORT_FINAL_DELIVERY_LOCALIZATION_VERSION='17.0.0'
export const QL7_SUPPORT_FINAL_DELIVERY_LOCALIZATION_OWNER_ID='ql7-support.final-delivery-localization'
export async function localizeQl7SupportFinalDelivery({text,surface,composerPolicy,sourceLocale,targetLocale,runtime,translate=translateQl7SupportTextNative}={}){
 if(!isQl7SupportLocaleSupported(targetLocale)){const e=new Error('support_locale_unsupported_no_external_fallback');e.code='support_locale_unsupported_no_external_fallback';e.status=503;throw e}
 if(typeof translate!=='function'){const e=new Error('support_native_translation_engine_unavailable');e.code='support_native_translation_engine_unavailable';e.status=503;throw e}
 const localizedText=await localizeQl7SupportReply({text,sourceLanguage:sourceLocale,targetLanguage:targetLocale,translate})
 if(!['native_translated','same_language','native'].includes(localizedText.translationStatus)){const e=new Error('support_native_translation_unavailable');e.code='support_native_translation_unavailable';e.status=503;throw e}
 const localizedSurface=await localizeQl7SupportStructuredNative({value:surface,targetLanguage:targetLocale,sourceLanguage:sourceLocale,translate,maxStrings:192})
 const localizedPolicy=await localizeQl7SupportInputPolicyNative({policy:composerPolicy,targetLanguage:targetLocale,sourceLanguage:sourceLocale,translate})
 if(!['native_translated','same_language','no_translatable_fields'].includes(localizedSurface.status)){const e=new Error('support_native_translation_unavailable');e.code='support_native_translation_unavailable';e.status=503;throw e}
 const translatedCardValue=localizedSurface.value&&typeof localizedSurface.value==='object'?localizedSurface.value:surface
 const {integrity:_discard,...unsigned}=translatedCardValue||{}
 const finalSurface=buildQl7SupportCard({...unsigned,locale:targetLocale,signedAt:runtime?.now})
 const finalText=localizedText.text
 const parity=verifyQl7LocalizationStructuralParity({sourceSurface:surface,targetSurface:finalSurface,sourcePolicy:composerPolicy,targetPolicy:localizedPolicy})
 if(!parity.verified){const e=new Error('support_native_localization_semantic_parity_unverified');e.code='support_native_localization_semantic_parity_unverified';e.status=503;e.parityReceipt=parity;throw e}
 return Object.freeze({text:finalText,surface:finalSurface,composerPolicy:localizedPolicy,locale:targetLocale,receipt:Object.freeze({schema:'ql7.support.native-localization-receipt',schemaVersion:QL7_SUPPORT_FINAL_DELIVERY_LOCALIZATION_VERSION,ownerId:QL7_SUPPORT_FINAL_DELIVERY_LOCALIZATION_OWNER_ID,status:sourceLocale===targetLocale?'same_language':'native_translated',sourceLocale,targetLocale,sourceTextHash:hashQl7SupportDeliveryText(text),targetTextHash:hashQl7SupportDeliveryText(finalText),engine:localizedText.translationEngine||'ql7-native',engineEvidenceHash:localizedText.translationEvidenceHash,translatedSurfaceStrings:Number(localizedSurface.translatedStrings||0),intentParity:parity.intentParity,factParity:parity.factParity,actionParity:parity.actionParity,parityReceiptHash:parity.receiptHash,nativeOnly:true,externalTranslationAllowed:false})})
}

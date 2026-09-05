import {QL7_SUPPORT_ALL_LOCALES} from '../config/behaviorManifest.js'
import {resolveQl7SupportLocale} from './locales.js'

export const QL7_SUPPORT_RESPONSE_LOCALE_POLICY_VERSION='native32.2'

function firstNonEmpty(values=[]){
 for(const value of values){if(String(value??'').trim())return value}
 return'en'
}

export function resolveQl7SupportResponseLocale(input={}){
 const source=firstNonEmpty([input.selectedLocale,input.detectedLocale,input.locale,'en'])
 const resolved=resolveQl7SupportLocale(source)
 const requested=resolved.requested
 const supported=resolved.supported&&QL7_SUPPORT_ALL_LOCALES.includes(resolved.locale)
 const reason=supported?'native_locale_confirmed':'unsupported_locale_no_external_fallback'
 return Object.freeze({
  schema:'ql7.support.response-locale-policy',
  schemaVersion:QL7_SUPPORT_RESPONSE_LOCALE_POLICY_VERSION,
  requested,
  locale:resolved.locale,
  supported,
  kind:supported?'native':'unsupported',
  nativeSupported:supported,
  providerRequired:false,
  providerSupported:false,
  direction:resolved.direction,
  scriptFamily:resolved.scriptFamily,
  reason,
  externalTranslationAllowed:false,
  fallbackCountsAsSuccess:false,
 })
}

export function assertQl7NativeResponseLocale(input={}){
 const result=resolveQl7SupportResponseLocale(input)
 if(!result.supported)throw Object.assign(new Error('ql7_support_native_locale_unavailable'),{code:'ql7_support_native_locale_unavailable',requested:result.requested})
 return result
}

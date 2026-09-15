import {QL7_SUPPORT_ALL_LOCALES} from '../config/behaviorManifest.js'

export {QL7_SUPPORT_ALL_LOCALES}
export const QL7_SUPPORT_NATIVE_LOCALES=QL7_SUPPORT_ALL_LOCALES
export const QL7_SUPPORT_LOCALE_CONTRACT_VERSION='native32.2'

const ALIASES=Object.freeze({ua:'uk',cn:'zh',zh_cn:'zh',zh_hans:'zh',iw:'he',in:'id'})
const RTL=new Set(['ar','he'])
const CJK=new Set(['zh','ja','ko'])
const CYRILLIC=new Set(['ru','uk','bg','sr','kk'])
const LATIN=new Set(['en','es','tr','de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','hr','sl','az'])

function baseTag(value='en'){
 const raw=String(value||'en').trim().toLowerCase().replaceAll('_','-')
 const alias=ALIASES[raw.replaceAll('-','_')]
 return alias||ALIASES[raw]||raw.split('-')[0]||'en'
}

export function normalizeQl7SupportLocale(value='en'){
 const locale=baseTag(value)
 return QL7_SUPPORT_ALL_LOCALES.includes(locale)?locale:'en'
}

export function resolveQl7SupportLocale(value='en'){
 const requested=baseTag(value)
 const supported=QL7_SUPPORT_ALL_LOCALES.includes(requested)
 const locale=supported?requested:'en'
 const scriptFamily=RTL.has(locale)?'rtl-semitic':CJK.has(locale)?'cjk':CYRILLIC.has(locale)?'cyrillic':LATIN.has(locale)?'latin':'other'
 return Object.freeze({
  schema:'ql7.support.locale-resolution',schemaVersion:QL7_SUPPORT_LOCALE_CONTRACT_VERSION,
  requested,locale,supported,native:supported,providerRequired:false,
  direction:RTL.has(locale)?'rtl':'ltr',scriptFamily,
 })
}

export function assertQl7SupportLocale(value=''){
 const resolved=resolveQl7SupportLocale(value)
 if(!resolved.supported)throw Object.assign(new Error('ql7_support_locale_unsupported'),{code:'ql7_support_locale_unsupported',requested:resolved.requested})
 return resolved.locale
}

export function isQl7SupportNativeLocale(value=''){return resolveQl7SupportLocale(value).supported}
export function isQl7SupportProviderLocale(){return false}
export function isQl7SupportLocaleSupported(value=''){return resolveQl7SupportLocale(value).supported}
export function ql7SupportLocaleDirection(value=''){return resolveQl7SupportLocale(value).direction}

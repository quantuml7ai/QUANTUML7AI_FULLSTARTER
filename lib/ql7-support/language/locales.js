import { QL7_SUPPORT_ALL_LOCALES, QL7_SUPPORT_NATIVE_LOCALES, QL7_SUPPORT_PROVIDER_LOCALES } from '../config/behaviorManifest.js'
import { ql7Locale } from '../internal/text.js'
export { QL7_SUPPORT_ALL_LOCALES, QL7_SUPPORT_NATIVE_LOCALES, QL7_SUPPORT_PROVIDER_LOCALES }
export function normalizeQl7SupportLocale(value='en'){const locale=ql7Locale(value);return QL7_SUPPORT_ALL_LOCALES.includes(locale)?locale:'en'}
export function isQl7SupportNativeLocale(value=''){return QL7_SUPPORT_NATIVE_LOCALES.includes(normalizeQl7SupportLocale(value))}
export function isQl7SupportProviderLocale(value=''){return QL7_SUPPORT_PROVIDER_LOCALES.includes(normalizeQl7SupportLocale(value))}
export function isQl7SupportRtlLocale(value=''){return ['ar','he'].includes(normalizeQl7SupportLocale(value))}

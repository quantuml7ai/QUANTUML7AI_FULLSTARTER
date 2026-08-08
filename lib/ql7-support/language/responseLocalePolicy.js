import { ql7Locale } from '../internal/text.js'
import { QL7_SUPPORT_ALL_LOCALES, QL7_SUPPORT_NATIVE_LOCALES, QL7_SUPPORT_PROVIDER_LOCALES } from '../config/behaviorManifest.js'
export const QL7_SUPPORT_RESPONSE_LOCALE_POLICY_VERSION='15.0.0'
export function resolveQl7SupportResponseLocale(input={}){const requested=ql7Locale(input.selectedLocale||input.locale||input.detectedLocale||'en');const supported=QL7_SUPPORT_ALL_LOCALES.includes(requested);const locale=supported?requested:'en';return Object.freeze({version:QL7_SUPPORT_RESPONSE_LOCALE_POLICY_VERSION,requested,locale,kind:QL7_SUPPORT_NATIVE_LOCALES.includes(locale)?'native':QL7_SUPPORT_PROVIDER_LOCALES.includes(locale)?'provider':'fallback',supported,providerRequired:QL7_SUPPORT_PROVIDER_LOCALES.includes(locale)})}

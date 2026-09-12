import en from './en.js'
import ru from './ru.js'
import uk from './uk.js'
import es from './es.js'
import tr from './tr.js'
import ar from './ar.js'
import zh from './zh.js'
import he from './he.js'
import de from './de.js'
import fr from './fr.js'
import it from './it.js'
import pt from './pt.js'
import pl from './pl.js'
import nl from './nl.js'
import sv from './sv.js'
import no from './no.js'
import da from './da.js'
import fi from './fi.js'
import cs from './cs.js'
import sk from './sk.js'
import hu from './hu.js'
import ro from './ro.js'
import bg from './bg.js'
import sr from './sr.js'
import hr from './hr.js'
import sl from './sl.js'
import el from './el.js'
import ka from './ka.js'
import az from './az.js'
import kk from './kk.js'
import ja from './ja.js'
import ko from './ko.js'
import {
  QL7_SUPPORT_LOCALE_BANK_FAMILIES,
  QL7_SUPPORT_LOCALE_PROFILE_SCHEMA_VERSION,
  validateQl7SupportLocaleProfile,
} from './profileFactory.js'

export const QL7_SUPPORT_LOCALE_PROFILE_MANIFEST_VERSION = '5.1.0'

export const QL7_SUPPORT_LOCALE_PROFILES = Object.freeze({
  en, ru, uk, es, tr, ar, zh, he,
  de, fr, it, pt, pl, nl, sv, no, da, fi, cs, sk,
  hu, ro, bg, sr, hr, sl, el, ka, az, kk, ja, ko,
})

export const QL7_SUPPORT_PROFILE_LOCALES = Object.freeze(Object.keys(QL7_SUPPORT_LOCALE_PROFILES))

export function getQl7SupportLocaleProfile(locale = 'en') {
  const key = String(locale || 'en').trim().toLowerCase().split(/[-_]/u)[0]
  return QL7_SUPPORT_LOCALE_PROFILES[key] || QL7_SUPPORT_LOCALE_PROFILES.en
}

export function auditQl7SupportLocaleProfiles() {
  const rows = QL7_SUPPORT_PROFILE_LOCALES.map((locale) => {
    const profile = QL7_SUPPORT_LOCALE_PROFILES[locale]
    const validation = validateQl7SupportLocaleProfile(profile)
    const bankCounts = Object.freeze(Object.fromEntries(
      QL7_SUPPORT_LOCALE_BANK_FAMILIES.map((family) => [family, profile.banks[family].length]),
    ))
    return Object.freeze({
      locale,
      schemaVersion: profile.schemaVersion,
      direction: profile.direction,
      script: profile.script,
      reviewStatus: profile.review.status,
      bankCounts,
      failures: validation.failures,
      ok: validation.ok,
    })
  })
  return Object.freeze({
    version: QL7_SUPPORT_LOCALE_PROFILE_MANIFEST_VERSION,
    schemaVersion: QL7_SUPPORT_LOCALE_PROFILE_SCHEMA_VERSION,
    localeCount: rows.length,
    bankFamilyCount: QL7_SUPPORT_LOCALE_BANK_FAMILIES.length,
    reviewedLocaleCount: rows.filter((row) => row.reviewStatus === 'reviewed').length,
    pendingHumanReviewLocaleCount: rows.filter((row) => row.reviewStatus === 'pending-human-review').length,
    rows: Object.freeze(rows),
    ok: rows.length === 32 && rows.every((row) => row.ok),
  })
}

export const QL7_SUPPORT_NATIVE_MODEL_REQUIRED=true
export const QL7_SUPPORT_ALL_LOCALES=Object.freeze(QL7_SUPPORT_PROFILE_LOCALES.filter((x)=>['en','ru','uk','es','tr','ar','zh','he','de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','bg','sr','hr','sl','el','ka','az','kk','ja','ko'].includes(x)))
export function getQl7NativeLocaleReadiness(locale='en'){const p=getQl7SupportLocaleProfile(locale);return Object.freeze({locale:p.locale,nativeModelRequired:true,externalTranslationAllowed:false,semanticParityRequired:true,tokenizerCoverageRequired:true,blindNativeReviewRequired:true,profileVersion:QL7_SUPPORT_LOCALE_PROFILE_MANIFEST_VERSION})}

import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_ALL_LOCALES } from '../../../lib/ql7-support/config/behaviorManifest.js'
import {
  auditQl7SupportLocaleProfiles,
  getQl7SupportLocaleProfile,
  QL7_SUPPORT_PROFILE_LOCALES,
} from '../../../lib/ql7-support/language/locales/manifest.js'
import { normalizeQl7SupportLocale } from '../../../lib/ql7-support/language/locales.js'
import { evaluateQl7SupportLanguagePurity } from '../../../lib/ql7-support/response/languagePurityGuard.js'

describe('QL7 Support locale profiles canonical', () => {
  it('has one complete validated profile and 19 bank families for every canonical locale', () => {
    const audit = auditQl7SupportLocaleProfiles()
    expect(QL7_SUPPORT_PROFILE_LOCALES).toEqual(QL7_SUPPORT_ALL_LOCALES)
    expect(audit.ok).toBe(true)
    expect(audit.localeCount).toBe(32)
    expect(audit.bankFamilyCount).toBe(19)
    expect(audit.rows.every((row) => row.ok && Object.values(row.bankCounts).every((count) => count > 0))).toBe(true)
  })

  it('reports human review truthfully instead of manufacturing acceptance evidence', () => {
    const audit = auditQl7SupportLocaleProfiles()
    expect(audit.reviewedLocaleCount).toBe(0)
    expect(audit.pendingHumanReviewLocaleCount).toBe(32)
  })

  it('uses the profile manifest in production locale normalization', () => {
    for (const locale of QL7_SUPPORT_ALL_LOCALES) expect(normalizeQl7SupportLocale(locale)).toBe(locale)
    expect(normalizeQl7SupportLocale('xx')).toBe('en')
  })

  it('binds profile version, script, bank and RTL facts into the final locale receipt', () => {
    const arabic = evaluateQl7SupportLanguagePurity({ text: 'تم التحقق من الحالة.', locale: 'ar' })
    const georgian = evaluateQl7SupportLanguagePurity({ text: 'მდგომარეობა დადასტურებულია.', locale: 'ka' })
    expect(arabic.nativeCriticDecision).toBe('allow')
    expect(arabic.rtlCorrect).toBe(true)
    expect(arabic.localeProfileVersion).toBe('5.1.0')
    expect(arabic.localeProfileReviewStatus).toBe('pending-human-review')
    expect(arabic.morphologyChecks.find((row) => row.check === 'locale-profile-bank-families')?.passed).toBe(true)
    expect(georgian.nativeCriticDecision).toBe('allow')
    expect(getQl7SupportLocaleProfile('ka').script).toBe('Georgian')
  })

  it('records locale-specific denial and quotation controls, including the Swedish negative control', () => {
    const swedish = getQl7SupportLocaleProfile('sv')
    expect(swedish.negationAndDenial.denialMarkers).toContain('inte till dig')
    expect(swedish.quotationAndReportedSpeech.reportedMarkers).toContain('sade')
    expect(swedish.safetyCollisionControls.negativeContexts).toContain('explicit-denial')
  })
})

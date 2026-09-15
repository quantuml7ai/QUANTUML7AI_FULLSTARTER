import en from '../../components/i18n-dicts/en.js'
import ru from '../../components/i18n-dicts/ru.js'
import uk from '../../components/i18n-dicts/uk.js'
import es from '../../components/i18n-dicts/es.js'
import tr from '../../components/i18n-dicts/tr.js'
import ar from '../../components/i18n-dicts/ar.js'
import zh from '../../components/i18n-dicts/zh.js'
import {
  TRUST_IDENTITY_CONTENT_VERSION,
  TRUST_IDENTITY_DEFAULT_LANG,
  TRUST_IDENTITY_LANGS,
  TRUST_IDENTITY_LAST_REVIEWED,
  normalizeTrustIdentityLang,
} from './trustIdentityRoutes.js'

export { TRUST_IDENTITY_CONTENT_VERSION, TRUST_IDENTITY_DEFAULT_LANG, TRUST_IDENTITY_LANGS, TRUST_IDENTITY_LAST_REVIEWED }

export const TRUST_IDENTITY_SECTION_IDS = Object.freeze([
  'official-identity',
  'independence',
  'what-we-build',
  'what-we-are-not',
  'financial-integrity',
  'human-values',
  'ai-privacy-security',
  'roadmap-maturity',
  'official-channels',
  'verification',
  'impersonation',
  'user-choice',
  'final-declaration',
])

export const TRUST_IDENTITY_FAQ_IDS = Object.freeze([
  'same-as-quantum-ai',
  'guaranteed-profit',
  'paid-features',
  'seed-private-key',
  'official-account',
  'modules-live',
  'money-request',
  'why-page',
])

export const TRUST_IDENTITY_CHANNEL_IDS = Object.freeze([
  'website',
  'x',
  'instagram',
  'tiktok',
  'youtube',
  'telegram-channel',
  'telegram-bot',
])

const TRUST_IDENTITY_DICTS = Object.freeze({ en, ru, uk, es, tr, ar, zh })

function text(value) {
  return String(value ?? '').trim()
}

function assertText(value, code) {
  if (!text(value)) throw new Error(`trust_identity_content_invalid:${code}`)
}

function validateTrustIdentityContent(lang, content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error(`trust_identity_content_missing:${lang}`)
  }
  assertText(content.meta?.title, `${lang}:meta.title`)
  assertText(content.meta?.description, `${lang}:meta.description`)
  assertText(content.navigation?.label, `${lang}:navigation.label`)
  assertText(content.navigation?.footerLabel, `${lang}:navigation.footerLabel`)
  assertText(content.navigation?.switcherLabel, `${lang}:navigation.switcherLabel`)
  assertText(content.presentation?.trustBadge, `${lang}:presentation.trustBadge`)
  assertText(content.presentation?.officialBadge, `${lang}:presentation.officialBadge`)
  assertText(content.presentation?.verifiedBadge, `${lang}:presentation.verifiedBadge`)
  assertText(content.presentation?.supportTextOnlyBadge, `${lang}:presentation.supportTextOnlyBadge`)
  assertText(content.presentation?.machineBadge, `${lang}:presentation.machineBadge`)
  assertText(content.presentation?.depthBadge, `${lang}:presentation.depthBadge`)
  assertText(content.presentation?.faqBadge, `${lang}:presentation.faqBadge`)
  assertText(content.aboutTeaser?.title, `${lang}:aboutTeaser.title`)
  assertText(content.aboutTeaser?.body, `${lang}:aboutTeaser.body`)
  assertText(content.aboutTeaser?.cta, `${lang}:aboutTeaser.cta`)
  assertText(content.hero?.kicker, `${lang}:hero.kicker`)
  assertText(content.hero?.title, `${lang}:hero.title`)
  assertText(content.hero?.lead, `${lang}:hero.lead`)
  if (!Array.isArray(content.hero?.highlights) || content.hero.highlights.length !== 4) throw new Error(`trust_identity_hero_highlights_invalid:${lang}`)
  content.hero.highlights.forEach((entry, index) => assertText(entry, `${lang}:hero.highlight:${index}`))
  assertText(content.machineIdentity?.title, `${lang}:machine.title`)
  assertText(content.machineIdentity?.intro, `${lang}:machine.intro`)
  assertText(content.machineIdentity?.notice, `${lang}:machine.notice`)
  for (const key of ['manifest','llms','sitemap','robots']) assertText(content.machineIdentity?.[key], `${lang}:machine.${key}`)
  if (!Array.isArray(content.machineIdentity?.principles) || content.machineIdentity.principles.length !== 5) throw new Error(`trust_identity_machine_principles_invalid:${lang}`)
  content.machineIdentity.principles.forEach((entry, index) => assertText(entry, `${lang}:machine.principle:${index}`))

  const sectionIds = Array.isArray(content.sections) ? content.sections.map((entry) => text(entry?.id)) : []
  if (JSON.stringify(sectionIds) !== JSON.stringify(TRUST_IDENTITY_SECTION_IDS)) {
    throw new Error(`trust_identity_section_ids_invalid:${lang}`)
  }
  for (const section of content.sections) {
    assertText(section.title, `${lang}:section:${section.id}:title`)
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length < 1) {
      throw new Error(`trust_identity_section_paragraphs_invalid:${lang}:${section.id}`)
    }
    section.paragraphs.forEach((paragraph, index) => assertText(paragraph, `${lang}:section:${section.id}:p${index}`))
    if (!Array.isArray(section.bullets)) throw new Error(`trust_identity_section_bullets_invalid:${lang}:${section.id}`)
    if (!Array.isArray(section.depth) || section.depth.length !== 5) throw new Error(`trust_identity_section_depth_invalid:${lang}:${section.id}`)
    section.depth.forEach((item, index) => { assertText(item?.label, `${lang}:section:${section.id}:depth:${index}:label`); assertText(item?.body, `${lang}:section:${section.id}:depth:${index}:body`) })
  }

  if (!Array.isArray(content.safetyChecklist) || content.safetyChecklist.length !== 8) {
    throw new Error(`trust_identity_checklist_invalid:${lang}`)
  }
  assertText(content.safetyChecklistTitle, `${lang}:safetyChecklistTitle`)
  content.safetyChecklist.forEach((entry, index) => assertText(entry, `${lang}:checklist:${index}`))

  const faqIds = Array.isArray(content.faq) ? content.faq.map((entry) => text(entry?.id)) : []
  if (JSON.stringify(faqIds) !== JSON.stringify(TRUST_IDENTITY_FAQ_IDS)) {
    throw new Error(`trust_identity_faq_ids_invalid:${lang}`)
  }
  assertText(content.faqTitle, `${lang}:faqTitle`)
  for (const entry of content.faq) {
    assertText(entry.question, `${lang}:faq:${entry.id}:question`)
    assertText(entry.answer, `${lang}:faq:${entry.id}:answer`)
  }

  assertText(content.channels?.heading, `${lang}:channels.heading`)
  assertText(content.channels?.intro, `${lang}:channels.intro`)
  assertText(content.channels?.unlistedNotice, `${lang}:channels.unlistedNotice`)
  const channelLabelIds = content.channels?.labels ? Object.keys(content.channels.labels) : []
  if (JSON.stringify(channelLabelIds) !== JSON.stringify(TRUST_IDENTITY_CHANNEL_IDS)) {
    throw new Error(`trust_identity_channel_labels_invalid:${lang}`)
  }
  for (const channelId of TRUST_IDENTITY_CHANNEL_IDS) {
    assertText(content.channels.labels[channelId], `${lang}:channels.labels:${channelId}`)
  }
  assertText(content.reportImpersonation?.label, `${lang}:report.label`)
  assertText(content.reportImpersonation?.description, `${lang}:report.description`)
  assertText(content.reportImpersonation?.cta, `${lang}:report.cta`)
  if (!Array.isArray(content.reportImpersonation?.evidence) || content.reportImpersonation.evidence.length !== 4) {
    throw new Error(`trust_identity_report_evidence_invalid:${lang}`)
  }
  content.reportImpersonation.evidence.forEach((entry, index) => assertText(entry, `${lang}:report.evidence:${index}`))

  if (text(content.version?.value) !== TRUST_IDENTITY_CONTENT_VERSION) {
    throw new Error(`trust_identity_version_invalid:${lang}`)
  }
  if (text(content.version?.reviewedAt) !== TRUST_IDENTITY_LAST_REVIEWED) {
    throw new Error(`trust_identity_reviewed_invalid:${lang}`)
  }
  assertText(content.version?.label, `${lang}:version.label`)
  assertText(content.version?.reviewedLabel, `${lang}:version.reviewedLabel`)
  assertText(content.version?.updateNotice, `${lang}:version.updateNotice`)

  const serialized = JSON.stringify(content)
  if (/https?:\/\//i.test(serialized)) {
    throw new Error(`trust_identity_translated_content_contains_url:${lang}`)
  }
  if (/\b(?:TODO|lorem ipsum|placeholder)\b/i.test(serialized)) {
    throw new Error(`trust_identity_placeholder_detected:${lang}`)
  }
  return content
}

for (const lang of TRUST_IDENTITY_LANGS) {
  validateTrustIdentityContent(lang, TRUST_IDENTITY_DICTS[lang]?.trust_identity)
}

export function getTrustIdentityContent(rawLang = TRUST_IDENTITY_DEFAULT_LANG) {
  const lang = normalizeTrustIdentityLang(rawLang)
  if (!lang) return null
  return TRUST_IDENTITY_DICTS[lang].trust_identity
}

export function auditTrustIdentityContent() {
  const rows = TRUST_IDENTITY_LANGS.map((lang) => {
    const content = validateTrustIdentityContent(lang, TRUST_IDENTITY_DICTS[lang]?.trust_identity)
    return Object.freeze({
      lang,
      title: content.meta.title,
      sections: content.sections.length,
      faq: content.faq.length,
      checklist: content.safetyChecklist.length,
      version: content.version.value,
      reviewedAt: content.version.reviewedAt,
    })
  })
  return Object.freeze({ ok: true, languages: Object.freeze(rows) })
}

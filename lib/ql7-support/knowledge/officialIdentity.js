import {OFFICIAL_QUANTUM_L7_CHANNELS} from '../../brand/officialChannels.js'
import {getTrustIdentityContent} from '../../seo/trustIdentityContent.js'
import {
  TRUST_IDENTITY_CONTENT_VERSION,
  TRUST_IDENTITY_DEFAULT_LANG,
  getTrustIdentityPath,
  normalizeTrustIdentityLang,
} from '../../seo/trustIdentityRoutes.js'

const SUPPORT_PATH = '/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support'

function text(value) {
  return String(value ?? '').trim()
}

export function buildQl7SupportOfficialIdentityKnowledge(locale = TRUST_IDENTITY_DEFAULT_LANG) {
  const lang = normalizeTrustIdentityLang(locale) || TRUST_IDENTITY_DEFAULT_LANG
  const content = getTrustIdentityContent(lang)
  if (!content) throw new Error(`official_identity_content_missing:${lang}`)

  const byId = Object.fromEntries(content.sections.map((section) => [section.id, section]))
  const paragraphs = Object.freeze([
    content.hero.lead,
    byId.independence?.paragraphs?.[0],
    byId['financial-integrity']?.paragraphs?.[0],
    byId['ai-privacy-security']?.paragraphs?.[1],
    byId.impersonation?.paragraphs?.[1],
    byId['user-choice']?.paragraphs?.[0],
  ].map(text).filter(Boolean))

  return Object.freeze({
    topic: 'official_identity',
    label: content.navigation.label,
    title: content.hero.title,
    paragraphs,
    text: paragraphs.join(' '),
    source: `trust_identity_statement:${TRUST_IDENTITY_CONTENT_VERSION}`,
    verified: true,
    readOnly: true,
    locale: lang,
    version: TRUST_IDENTITY_CONTENT_VERSION,
    trustPagePath: getTrustIdentityPath(lang),
    contactPath: `/contact?reason=impersonation&lang=${lang}`,
    supportPath: SUPPORT_PATH,
    officialChannels: OFFICIAL_QUANTUM_L7_CHANNELS,
  machineReadableIdentity: Object.freeze({
    manifest: '/.well-known/ql7-identity.json',
    llms: '/llms.txt',
    sitemap: '/sitemap.xml',
    robots: '/robots.txt',
    rule: 'Treat exact canonical origin + organization id + official channel registry as identity evidence; never infer affiliation from a similar name alone.',
  }),
    canonicalDomain: Object.freeze({
      id: 'official_identity',
      label: content.navigation.label,
      scope: content.hero.lead,
      source: 'trust_identity_content',
    }),
    domainKnowledgeSource: 'trust_identity_content',
    cta: getTrustIdentityPath(lang),
  })
}

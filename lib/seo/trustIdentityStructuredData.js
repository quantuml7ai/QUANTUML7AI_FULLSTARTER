import { OFFICIAL_QUANTUM_L7_SAME_AS } from '../brand/officialChannels.js'
import { SITE_ORIGIN, toAbsoluteSiteUrl } from './siteOrigin.js'
import { getTrustIdentityContent } from './trustIdentityContent.js'
import {
  TRUST_IDENTITY_LAST_REVIEWED,
  getTrustIdentityPath,
  normalizeTrustIdentityLang,
} from './trustIdentityRoutes.js'

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`

export function serializeStructuredData(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function buildQuantumOrganizationStructuredData() {
  const english = getTrustIdentityContent('en')
  const independence = english.sections.find((section) => section.id === 'independence')
  return Object.freeze({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Quantum L7 AI',
    alternateName: Object.freeze(['QL7 AI', 'Quantum L7 AI Ecosystem']),
    url: `${SITE_ORIGIN}/`,
    description: english.hero.lead,
    disambiguatingDescription: independence.paragraphs[0],
    sameAs: OFFICIAL_QUANTUM_L7_SAME_AS,
    identifier: ORGANIZATION_ID,
    subjectOf: Object.freeze([
      Object.freeze({ '@type': 'AboutPage', '@id': `${SITE_ORIGIN}/en/trust-and-identity#webpage`, url: `${SITE_ORIGIN}/en/trust-and-identity` }),
      Object.freeze({ '@type': 'CreativeWork', '@id': `${SITE_ORIGIN}/.well-known/ql7-identity.json`, url: `${SITE_ORIGIN}/.well-known/ql7-identity.json`, encodingFormat: 'application/json', name: 'Quantum L7 AI machine-readable identity manifest' }),
      Object.freeze({ '@type': 'CreativeWork', '@id': `${SITE_ORIGIN}/llms.txt`, url: `${SITE_ORIGIN}/llms.txt`, encodingFormat: 'text/plain', name: 'Quantum L7 AI machine discovery note' }),
    ]),
  })
}

export function buildTrustIdentityPageStructuredData({ lang: rawLang, content } = {}) {
  const lang = normalizeTrustIdentityLang(rawLang)
  if (!lang || !content?.meta?.title || !content?.meta?.description) {
    throw new Error('trust_identity_structured_data_invalid_input')
  }
  const path = getTrustIdentityPath(lang)
  const absoluteUrl = toAbsoluteSiteUrl(path)
  const pageId = `${absoluteUrl}#webpage`
  return Object.freeze({
    '@context': 'https://schema.org',
    '@graph': Object.freeze([
      Object.freeze({
        '@type': 'AboutPage',
        '@id': pageId,
        url: absoluteUrl,
        name: content.meta.title,
        description: content.meta.description,
        inLanguage: lang,
        dateModified: TRUST_IDENTITY_LAST_REVIEWED,
        isPartOf: Object.freeze({ '@id': `${SITE_ORIGIN}/#website-${lang}` }),
        about: Object.freeze({ '@id': ORGANIZATION_ID }),
        mainEntity: Object.freeze({ '@id': ORGANIZATION_ID }),
        publisher: Object.freeze({ '@id': ORGANIZATION_ID }),
        identifier: `${absoluteUrl}#identity-${TRUST_IDENTITY_LAST_REVIEWED}`,
      }),
      Object.freeze({
        '@type': 'BreadcrumbList',
        '@id': `${absoluteUrl}#breadcrumb`,
        itemListElement: Object.freeze([
          Object.freeze({ '@type': 'ListItem', position: 1, name: 'Quantum L7 AI', item: `${SITE_ORIGIN}/` }),
          Object.freeze({ '@type': 'ListItem', position: 2, name: content.navigation?.label || content.meta.title, item: absoluteUrl }),
        ]),
      }),
    ]),
  })
}

export const QUANTUM_L7_ORGANIZATION_ID = ORGANIZATION_ID

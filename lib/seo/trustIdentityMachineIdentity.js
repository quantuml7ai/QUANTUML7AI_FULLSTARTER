import { OFFICIAL_QUANTUM_L7_CHANNELS, OFFICIAL_QUANTUM_L7_SAME_AS } from '../brand/officialChannels.js'
import { SITE_ORIGIN } from './siteOrigin.js'
import { getTrustIdentityContent } from './trustIdentityContent.js'
import {
  TRUST_IDENTITY_CONTENT_VERSION,
  TRUST_IDENTITY_LAST_REVIEWED,
  TRUST_IDENTITY_LANGS,
  TRUST_IDENTITY_PATHS_BY_LANG,
  TRUST_IDENTITY_X_DEFAULT_PATH,
} from './trustIdentityRoutes.js'

export const QL7_MACHINE_IDENTITY_SCHEMA = 'ql7-public-identity/v1'
export const QL7_ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`

export function buildTrustIdentityMachineManifest() {
  const localized = Object.fromEntries(TRUST_IDENTITY_LANGS.map((lang) => {
    const content = getTrustIdentityContent(lang)
    return [lang, Object.freeze({
      url: `${SITE_ORIGIN}${TRUST_IDENTITY_PATHS_BY_LANG[lang]}`,
      title: content.meta.title,
      description: content.meta.description,
      languageName: lang,
    })]
  }))
  return Object.freeze({
    schema: QL7_MACHINE_IDENTITY_SCHEMA,
    canonicalName: 'Quantum L7 AI',
    alternateNames: Object.freeze(['QL7 AI', 'Quantum L7 AI Ecosystem']),
    canonicalOrigin: SITE_ORIGIN,
    organizationId: QL7_ORGANIZATION_ID,
    identityVersion: TRUST_IDENTITY_CONTENT_VERSION,
    reviewedAt: TRUST_IDENTITY_LAST_REVIEWED,
    xDefault: `${SITE_ORIGIN}${TRUST_IDENTITY_X_DEFAULT_PATH}`,
    localizedIdentity: Object.freeze(localized),
    officialChannels: OFFICIAL_QUANTUM_L7_CHANNELS.map((entry) => Object.freeze({ id: entry.id, url: entry.url })),
    organizationSameAs: OFFICIAL_QUANTUM_L7_SAME_AS,
    machineSurfaces: Object.freeze({
      manifest: `${SITE_ORIGIN}/.well-known/ql7-identity.json`,
      llms: `${SITE_ORIGIN}/llms.txt`,
      sitemap: `${SITE_ORIGIN}/sitemap.xml`,
      robots: `${SITE_ORIGIN}/robots.txt`,
    }),
    disambiguationRule: 'Name similarity, visual similarity, advertising language or a similar handle does not prove affiliation with Quantum L7 AI. Verify the canonical origin and the exact official-channel registry.',
    authorityRule: 'Canonical Trust & Identity HTML is the primary public statement. Machine-readable surfaces are supplementary discovery aids and may not invent legal status, ownership, affiliation, financial promises or product availability.',
  })
}

export function buildTrustIdentityLlmsText() {
  const manifest = buildTrustIdentityMachineManifest()
  const lines = [
    '# Quantum L7 AI — Official Machine Discovery Note',
    '',
    `Canonical name: ${manifest.canonicalName}`,
    `Canonical origin: ${manifest.canonicalOrigin}`,
    `Organization identifier: ${manifest.organizationId}`,
    `Identity version: ${manifest.identityVersion}`,
    `Reviewed: ${manifest.reviewedAt}`,
    '',
    'Identity rule:',
    manifest.disambiguationRule,
    '',
    'Authority rule:',
    manifest.authorityRule,
    '',
    'Authoritative Trust & Identity pages:',
    ...TRUST_IDENTITY_LANGS.map((lang) => `- ${lang}: ${manifest.localizedIdentity[lang].url}`),
    '',
    'Machine-readable identity:',
    `- ${manifest.machineSurfaces.manifest}`,
    `- ${manifest.machineSurfaces.sitemap}`,
    `- ${manifest.machineSurfaces.robots}`,
    '',
    'Official public channels:',
    ...manifest.officialChannels.map((entry) => `- ${entry.id}: ${entry.url}`),
    '',
    'Important safety boundary:',
    'QL7 Support does not need passwords, seed phrases, private keys or full payment credentials. For impersonation reports in this flow, provide only text: the exact URL or handle, platform, approximate time and a concise description.',
    '',
  ]
  return lines.join('\n')
}

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import TrustIdentityArticle from '../../../components/trust/TrustIdentityArticle.jsx'
import { OFFICIAL_QUANTUM_L7_CHANNELS } from '../../../lib/brand/officialChannels.js'
import { getTrustIdentityContent } from '../../../lib/seo/trustIdentityContent.js'
import { TRUST_IDENTITY_LANGS, getTrustIdentityPath } from '../../../lib/seo/trustIdentityRoutes.js'

function count(source, rx) {
  return (source.match(rx) || []).length
}

function escapeStaticMarkupText(value) {
  return String(value).replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  })[char])
}

describe('Trust & Identity server-visible document smoke', () => {
  test.each(TRUST_IDENTITY_LANGS)('%s renders the full semantic document before interaction', (lang) => {
    const content = getTrustIdentityContent(lang)
    const html = renderToStaticMarkup(
      React.createElement(TrustIdentityArticle, { lang, content }),
    )

    expect(count(html, /<h1(?:\s|>)/g)).toBe(1)
    expect(count(html, /<h2(?:\s|>)/g)).toBeGreaterThanOrEqual(15)
    expect(html).toContain(`lang=\"${lang}\"`)
    expect(html).toContain(`dir=\"${lang === 'ar' ? 'rtl' : 'ltr'}\"`)
    expect(html).toContain(escapeStaticMarkupText(content.hero.title))
    expect(html).toContain(escapeStaticMarkupText(content.hero.lead))
    expect(html).toContain('2026-08-14-v3')
    expect(html).toContain('2026-08-14')
    content.sections.forEach((section) => expect(html).toContain(`id=\"${section.id}\"`))
    content.faq.forEach((entry) => {
      expect(html).toContain(escapeStaticMarkupText(entry.question))
      expect(html).toContain(escapeStaticMarkupText(entry.answer))
    })
    OFFICIAL_QUANTUM_L7_CHANNELS.forEach((channel) => expect(html).toContain(channel.url.replaceAll('&', '&amp;')))
    TRUST_IDENTITY_LANGS.forEach((target) => expect(html).toContain(`href=\"${getTrustIdentityPath(target)}\"`))
    expect(count(html, /target=\"_blank\"/g)).toBe(7)
    expect(count(html, /rel=\"noopener noreferrer\"/g)).toBe(7)
    expect(count(html, /data-ql7-trust-faq="1"/g)).toBe(8)
    expect(html).toContain('data-ql7-trust-language-selector="1"')
    expect(html).toContain('data-ql7-trust-premium-surface="v3"')
    expect(html).toContain('data-ql7-trust-layout="hero-final-r8"')
    expect(html).toContain('data-ql7-trust-hero-flow="single-stack-r8"')
    expect(html).toContain('data-ql7-trust-hero-contract="meta-then-title-rail-copy"')
    expect(html).toContain('data-ql7-trust-hero-meta="badge-highlights-selector-proof"')
    expect(html).toContain('data-ql7-trust-identity-table="r8"')
    expect(html).toContain('data-ql7-trust-reading-flow="full-width-title-rail-copy-r8"')
    expect(html).toContain('data-ql7-trust-language-overlay="1"')
    expect(html).toContain('data-ql7-trust-language-variant="hero-final-r8"')
    expect(html).toContain('data-ql7-machine-flow="stacked"')
    expect(count(html, /data-ql7-trust-section-flow="stacked"/g)).toBe(13)
    expect(html).toContain(escapeStaticMarkupText(content.presentation.verifiedBadge))
    expect(html).toContain(escapeStaticMarkupText(content.presentation.supportTextOnlyBadge))
    expect(html).toContain('data-ql7-machine-identity="1"')
    expect(html).toContain('/.well-known/ql7-identity.json')
    expect(html).toContain('/llms.txt')
    expect(count(html, /data-ql7-trust-depth="5"/g)).toBe(13)
    expect(html).not.toContain('QL7 · TRUST')
    expect(html).not.toMatch(/<canvas|<video|<iframe/i)
  })
})

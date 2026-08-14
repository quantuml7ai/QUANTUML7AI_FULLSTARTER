# Quantum L7 AI Trust & Identity Governance

## Status and scope

This document governs the production **Official Identity, Trust & Safety** surface.
It is a public identity and safety declaration, not an FAQ-only page, legal
certification, financial product, or crawler-only document.

Canonical content version: `2026-08-14-v3`  
Last reviewed: `2026-08-14`  


## Source baseline for the premium company-voice release

The combat installer for this release is anchored to the exact source archive `СЕО 111.zip` with SHA-256 `906CA331A89CA5094D8B13414F96D2268BFB8840A7DDD5C32C836A4082085469`. The installer must reject a mixed or unknown owned-file state before writing, preserve carrier guards, and restore the exact initial PRE state if any post-write verification gate fails.

Canonical origin: `https://www.quantuml7ai.com`

The production route family is:

```text
/en/trust-and-identity
/ru/trust-and-identity
/uk/trust-and-identity
/es/trust-and-identity
/tr/trust-and-identity
/ar/trust-and-identity
/zh/trust-and-identity
```

`/trust-and-identity` is a 308 convenience redirect to the English x-default
page. It is not a sitemap document and has no independent canonical identity.

## Sources of truth

The contour deliberately separates responsibilities so that one file cannot
silently redefine brand identity, public URLs, translated copy and machine
metadata at the same time.

- `components/i18n.source.js` is the only authoring source for the seven full
  localized `trust_identity` objects.
- `tools/split-i18n-dicts.mjs` generates the seven runtime dictionaries and
  `components/i18n-dicts/manifest.js`.
- `lib/brand/officialChannels.js` is the only approved public channel registry.
- `lib/seo/trustIdentityRoutes.js` owns locale/path/version constants.
- `lib/seo/trustIdentityContent.js` performs strict server-safe content
  resolution and structural validation.
- `lib/seo/trustIdentityMetadata.js` owns locale metadata construction.
- `lib/seo/trustIdentityStructuredData.js` owns Organization/AboutPage JSON-LD.
- `lib/seo/siteIndex.js` owns indexing classification.
- `app/sitemap.js` owns discoverability and reciprocal language alternates.
- `app/robots.js` remains crawl policy only.

A release changing an official channel, identity claim, safety boundary,
locale, canonical route, or content version must update all affected sources
in one tested change. URLs must never be copied into translated dictionary
content.

## Language and server-rendering contract

The semantic document is rendered by a Server Component. Initial HTML must
already contain the selected locale's H1, lead, thirteen sections, official
channel registry, safety checklist, eight FAQ answers, reporting guidance and
content version. The document cannot depend on `localStorage`, a browser
language guess, an API fetch, MongoDB, Redis, IntersectionObserver or animation
before its meaning becomes visible.

Only `TrustIdentityLanguageSwitcher.jsx` is a client component. Its primary
behavior is real URL navigation. The production control is one premium native-like
selector surface backed by seven crawlable links; the page must not render seven
competing language buttons. Writing `ql7_lang` is a secondary convenience, never a
prerequisite for navigation or indexing.

Arabic uses `dir="rtl"` only on the Trust content rail. The application root
remains LTR and keeps its global `notranslate` protection for the rest of the
client-localized product.

Unsupported route locales must produce `notFound()` rather than an English 200
response under a false locale URL.

## Official channel registry

The registry contains exactly:

```text
https://www.quantuml7ai.com/
https://x.com/QL7Company
https://www.instagram.com/quantuml7ai/
https://www.tiktok.com/@ql7ai
https://www.youtube.com/channel/UCXby6llW_TokAUGoOebFXhg
https://t.me/l7universe
https://t.me/l7ai_bot
```

The website is `Organization.url`. The X, Instagram, TikTok, YouTube and
Telegram channel entries are `Organization.sameAs`. The Telegram bot is an
official service channel shown to users but is not presented as an
organization social profile.

`components/TopBar.js` and global social rows consume this registry and must not
own a parallel hardcoded list.

## Identity and structured-data safety

The site publishes one stable Organization node:

```text
https://www.quantuml7ai.com/#organization
```

Allowed alternate names are `QL7 AI` and `Quantum L7 AI Ecosystem`.
**`Quantum AI` must never be an `alternateName`.** It can appear only in visible
non-affiliation/disambiguation copy and FAQ context.

Do not add unverified `legalName`, address, tax/VAT identifiers, LEI,
headcount, founding date or certification claims. Do not add `BankOrCreditUnion`,
`InvestmentFund`, `FinancialProduct`, `ClaimReview`, `Review`, `FAQPage` or
`QAPage` types to this declaration.

Organization description and disambiguation copy are sourced from the visible
English Trust statement. Per-locale pages publish `AboutPage` plus
`BreadcrumbList` and reference the one Organization ID. JSON-LD must be
serialized server-side with `<` escaped as `\\u003c`.

No logo is emitted until a stable public logo path is explicitly verified in
the production repository. A missing optional logo is preferable to inventing
an asset URL.

## Product-maturity and financial-language contract

Every identity release preserves the boundary between:

```text
works now
in development
strategic roadmap direction
```

Market analytics, AI scenarios, CryptoRadar, exchange-related interfaces,
BattleCoin and Academy material are informational/educational and do not
promise profit. Optional VIP, Ads, MetaMarket, subscriptions, payments or other
commercial operations may exist and must disclose purpose, price and
confirmation in their own product flow.

The Trust statement must not claim that Quantum L7 AI is risk-free, that all
similarly named third parties are criminal, that Google certifies the project
as safe, or that every roadmap module is already live.

No legitimate support or identity-verification flow requires a seed phrase,
private key, password, one-time code, full payment credential, remote-control
installation or private transfer prompted by a guaranteed-return claim.

## About, Contact, footer and QL7 Support

`/about` remains the ecosystem narrative. It has one visible H1 and a compact
localized Trust teaser after the hero; the thirteen-section declaration is not
duplicated there.

`/contact` remains non-indexed. With no bounded impersonation reason it keeps
the existing redirect to the authenticated QL7 Support DM flow. The
`reason=impersonation` view is a server-rendered safety handoff showing only
safe evidence guidance and links back to the official Trust page and Support.
It creates no public write API.

The impersonation handoff is text-only because the current QL7 Support composer in
this flow accepts text messages. Trust copy must never instruct a user to upload or
send screenshots, files or attachments to QL7 Support. Users may preserve evidence
privately for platform reporting, while Support receives the exact URL/handle and a
concise textual description with secrets removed.

Global social rows keep the existing five social icons and the locale-aware Trust
& Identity link by default. `/about` intentionally suppresses the footer Trust link
because its premium Trust teaser already provides the declaration CTA; duplicate
Trust CTAs on the same About page are prohibited.

QL7 Support exposes a versioned read-only `official_identity` knowledge topic.
It uses the same localized Trust content and channel registry, does not mutate
user data, does not accuse arbitrary external services, and does not promise
recovery of funds.

## SEO contract

Each locale has unique title/description, self canonical, reciprocal language
alternates for `en`, `ru`, `uk`, `es`, `tr`, `ar`, `zh`, and x-default English.
OpenGraph/Twitter metadata is localized. All seven canonical pages are in
`PUBLIC_INDEX_ROUTES` and sitemap; the redirect is not.

Sitemap alternates are absolute HTTPS URLs. Robots remains:

```text
allow: /
disallow: /api/
sitemap: https://www.quantuml7ai.com/sitemap.xml
host: https://www.quantuml7ai.com
```

Do not place identity declarations, social links, accusations or marketing
keywords in robots.txt. Do not synthesize changing `lastModified` values on
every request.

## Local installer artifact hygiene

The project-doc generators explicitly ignore root-level `QL7_TRUST_IDENTITY_MULTILINGUAL_SEO_FINAL_BASELINE_V*` installer/bundle/checksum files and `final_baseline_trust_identity_v*_*.json` local evidence files. This keeps generated architecture docs deterministic when the combat PS1 is executed from the project root. The exclusion is narrow and does not hide production source files.

## Verification and release procedure

A Trust release is incomplete until all of these classes of evidence pass:

1. exact official-channel registry tests;
2. source -> split dictionaries -> manifest hash parity;
3. seven-locale deep content parity and script-quality guards;
4. SEO route/canonical/hreflang/sitemap/robots contracts;
5. Organization/AboutPage JSON-LD contracts;
6. server-visible render smoke for all seven locales;
7. About/Contact/footer/Support integration contracts;
8. repository documentation regeneration;
9. canonical `pnpm test:codex` verification and production build coverage.

Required structural commands after applying source changes:

```bash
node tools/split-i18n-dicts.mjs
pnpm project:docs:full
pnpm test:codex
```

The combat installer must be bound to exact preimage SHA-256 values, write only
an explicit allowlist, use exact postimage payloads, create a byte-preserving
backup before apply, and restore the complete source preimage automatically on
any new verification failure. This task performs no MongoDB, Redis or user-data
writes, so no database rollback is part of this contour.

## Independent source and built-output proof

Release verification is two-sided. Source-level contracts are necessary but do
not by themselves prove what the production compiler emitted.

`tools/ql7-trust-identity-source-integrity-final-baseline-v3.mjs` verifies the
Trust authoring/runtime surface as strict UTF-8, rejects BOM, NUL, replacement
characters and bare carriage returns, locks the complete seven-locale Trust
payload to a canonical SHA-256 fingerprint, and rechecks Arabic/Han script
depth plus placeholder/fallback/translated-URL prohibitions.

After every successful production build in the combat Full contour,
`tools/ql7-trust-identity-verify-built-html-final-baseline-v3.mjs` independently
reads `.next/prerender-manifest.json` and the emitted static HTML for all seven
locale URLs. It proves concrete prerendered routes, one H1, article lang/dir,
version markers, the complete section-ID set, seven official URLs, eight FAQ
`details`, self canonical, reciprocal eight-value hreflang set, Organization
JSON-LD, localized `AboutPage` with the exact `#webpage` identifier, and the
absence of forbidden financial/FAQ structured-data types. The report includes
a SHA-256 for every emitted locale HTML document.

A green source checker without this built-output proof is not sufficient for a
Final Full acceptance.

## Premium presentation and responsive acceptance

The Trust family uses one visual system across the declaration, About teaser and bounded impersonation handoff. Headings must remain horizontally readable at every supported width; no badge, version rail, URL rail or language control may force the H1 into narrow vertical columns. Desktop uses a content/proof composition, tablet collapses to one main column, and mobile uses full-width controls with normal word breaking. Primary actions, channel cards, FAQ controls, badges and the language selector share the same focus-visible, hover and reduced-motion behavior. Visual polish never changes the server-visible semantic document or its SEO contracts.


## Premium UI localization and company voice

Premium labels are content-driven from `trust_identity.presentation` in every supported locale. Trust badges, verified-state labels and the QL7 Support text-only mode must not be hard-coded in English inside the declaration, About teaser or impersonation handoff. Core identity headings and explanatory copy speak in our company voice (`we / our` and native-language equivalents) while preserving factual, non-promotional safety boundaries.

The declaration uses one premium language selector backed by seven real crawlable links. The selector may enhance presentation client-side, but all semantic declaration copy, section headings, official-channel registry, FAQ content, version evidence and safety wording remain server-visible.

QL7 Support impersonation evidence is text-only in this release. The Trust contour must not instruct users to upload or send screenshots, attachments or files. It asks for the exact URL/handle, platform and time context, and a concise textual description without secrets or full payment credentials.


## V5 premium identity and machine-disambiguation contract

- The declaration hero is one ordered grid: official statement rail, one language selector, one H1, one lead, one proof card. Decorative standalone `QL7`, `QL7 · TRUST`, and a second `Quantum L7 AI` eyebrow are forbidden.
- Every semantic section carries exactly five localized verification layers: public boundary, evidence/provenance, architecture/enforcement, user meaning, and search/AI interpretation. This is the required five-layer expansion; duplicated filler text is not acceptable.
- The language control is one premium selector. Seven permanently exposed language buttons are forbidden. On narrow screens the menu participates in normal flow and may not overlap the H1, lead, proof card, or page chrome.
- Footer social rows contain official social icons only. A Trust/Identity pill or button is forbidden on every page; the About page keeps its single intentional premium declaration CTA.
- `/.well-known/ql7-identity.json` and `/llms.txt` are supplementary machine-discovery surfaces generated from canonical source data. They do not supersede canonical HTML and cannot create affiliation, legal status, ownership, product availability, or financial claims.
- Organization structured data, AboutPage structured data, canonical/hreflang, sitemap, robots, official channels, machine manifest, and llms.txt must describe one consistent identity graph anchored to `https://www.quantuml7ai.com/#organization`.
- Name similarity is never an affiliation proof. The system must prefer the exact official origin and exact registry over fuzzy brand-name matching.

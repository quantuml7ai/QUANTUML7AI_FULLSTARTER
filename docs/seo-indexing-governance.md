# SEO Indexing Governance

## Purpose

The Quantum L7 AI indexing contour keeps search-engine discovery explicit,
canonical, synchronized with the real Next.js route surface, and fail-closed
when new public routes are introduced.

The contour is built from:

- `lib/seo/siteIndex.js` as the canonical route-policy registry;
- `lib/seo/siteOrigin.js` as the filesystem-free canonical-origin module;
- `NEXT_PUBLIC_SITE_URL` as the canonical production origin;
- `app/robots.js` as the technical crawl-policy route;
- `app/sitemap.js` as the canonical public sitemap;
- per-page static or generated metadata owners;
- `tests/contracts/project/seo-indexing-contracts.test.js` as the global gate;
- `tests/contracts/project/trust-identity-seo-contracts.test.js` as the
  multilingual Trust-family gate.

## Mandatory update rule

Every important indexing change must update this contour in the same task.
This includes adding/deleting/moving/renaming a page, changing public/private
visibility, canonical URLs, locale routes, crawler exclusions, metadata
ownership, or dynamic public indexing policy.

`NEXT_PUBLIC_SITE_URL` is the canonical domain source. Production must be:

```text
https://www.quantuml7ai.com
```

The URL must use HTTPS and contain no path, query, fragment or credentials.
Legacy origin variables are compatibility fallbacks only.

`robots.js` and `sitemap.js` import filesystem-free origin helpers from
`lib/seo/siteOrigin.js`, never `lib/metadataCache.js`.

Every physical `app/**/page.*` owner must be represented by the route policy.
Static pages normally map one file to one route. A proven dynamic public family
may map one page owner to multiple concrete canonical URLs; the registry must
still enumerate every real public URL explicitly. Currently the seven-locale
Trust & Identity family is that deliberate dynamic case.

- public pages belong in `PUBLIC_INDEX_ROUTES`;
- intentionally non-indexed pages belong in `NON_INDEXED_PAGE_ROUTES` with a
  documented reason.

`/contact` remains non-indexed. The default route redirects to the authenticated
QL7 Support DM flow; `?reason=impersonation&lang=<core-locale>` is a bounded
server-rendered safety handoff and is intentionally not a search landing page.

Never use robots.txt as access control. API authorization and private-data
protection remain server responsibilities.

## Sitemap policy

The sitemap contains stable canonical public documents only. API routes,
technical callbacks, private states, application-only routes, redirects and
`noindex` pages do not belong there.

Do not publish artificial `lastModified`, `priority` or `changeFrequency`
values. Add such signals only when backed by reliable source data.

The Trust & Identity family is different from ordinary client-localized pages:
it consists of seven real server-rendered documents. Every Trust sitemap item
has the same reciprocal language-alternate map:

```text
en, ru, uk, es, tr, ar, zh, x-default
```

x-default points to `/en/trust-and-identity`. `/trust-and-identity` is a 308
convenience redirect and is never a sitemap item.

## Robots policy

Crawler exclusions are maintained in `ROBOTS_DISALLOW_PATHS`. Public assets
required to render pages stay crawlable. Trust pages are public and must not be
blocked. Robots remains a technical file; it must not contain brand
declarations, translated safety copy, social URLs, marketing terms or
accusations.

## Language and canonical policy

Language alternates may be published only when their target URLs really exist
as crawlable server-rendered documents. UI dictionary support alone never
justifies hreflang.

The application keeps the root `translate="no"`, `notranslate` class and Google
notranslate directive because most product routes still use a client dictionary
runtime. Browser automatic translation is not an SEO localization mechanism.

The Trust & Identity route family is the explicit exception: it provides real
server-rendered locale URLs:

```text
/en/trust-and-identity
/ru/trust-and-identity
/uk/trust-and-identity
/es/trust-and-identity
/tr/trust-and-identity
/ar/trust-and-identity
/zh/trust-and-identity
```

Each has a self-canonical and reciprocal hreflang map. `uk` is the Ukrainian
locale code; no fictional `ua` canonical route is created. Unsupported dynamic
locale values return not-found rather than a silent English 200 response.

The existing multilingual `WebSite` JSON-LD graph remains synchronized with
`components/i18n-dicts/manifest.js`. Trust pages additionally reference one
stable Organization node at `https://www.quantuml7ai.com/#organization`.

All ordinary indexed pages keep their registered metadata ownership. Generated
metadata is allowed only when the route registry declares that mode and the
contract can prove its canonical builder.

Google Search Console ownership remains protected by the root metadata
verification token in `app/layout.js`.

## Trust & Identity authority

Detailed governance for identity copy, official channels, JSON-LD safety,
non-affiliation language and seven-locale content is in:

```text
docs/trust-identity-governance.md
```

The official public channel registry is `lib/brand/officialChannels.js`.
`Quantum AI` is never an Organization alternate name. No unverified legal name,
address, tax identifier, LEI or certification claim is emitted.

## Verification

`pnpm test:codex` runs the global SEO contract through `test:contracts`. The
environment stage also rejects duplicate, non-HTTPS, localhost, non-www or
path-bearing canonical origin values when `.env.local` is present.

Contracts fail when, among other things:

- a physical page owner is not classified;
- a canonical public URL is duplicated;
- a registered page/metadata owner is missing;
- sitemap and route registry diverge;
- a route points into a blocked technical zone;
- metadata canonical ownership is missing or mismatched;
- fabricated language routes are advertised;
- Trust reciprocal hreflang or x-default diverges;
- multilingual structured data diverges from dictionary languages;
- official identity governance or required documentation is removed.

After structural route changes run:

```bash
pnpm project:docs:full
pnpm test:codex
```

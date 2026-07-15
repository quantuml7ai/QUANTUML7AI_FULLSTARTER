# SEO Indexing Governance

## Purpose

The Quantum L7 AI indexing contour keeps search-engine discovery explicit,
canonical, and synchronized with the real Next.js route surface.

The contour is built from:

- `lib/seo/siteIndex.js` as the single route-policy registry;
- `lib/seo/siteOrigin.js` as the filesystem-free canonical-origin module used
  by lightweight metadata routes;
- `NEXT_PUBLIC_SITE_URL` as the canonical production origin;
- `app/robots.js` as the generated `/robots.txt` metadata route;
- `app/sitemap.js` as the generated `/sitemap.xml` metadata route;
- page or route layouts containing unique metadata and canonical URLs;
- `tests/contracts/project/seo-indexing-contracts.test.js` as the mandatory
  regression gate.

## Mandatory Update Rule

Every important indexing change must update this contour in the same task.
This includes:

- adding, deleting, moving, or renaming a page route;
- changing whether a page is public or private;
- changing a canonical URL or the canonical production host;
- adding a language-specific route;
- changing a route that must be excluded from crawler access;
- changing dynamic public-content indexing policy;
- changing metadata ownership for an indexed page.

`NEXT_PUBLIC_SITE_URL` is the canonical domain source for every environment.
For production it must be:

```text
https://www.quantuml7ai.com
```

The URL must use HTTPS and must not contain a path, query string, fragment, or
credentials. Legacy origin variables remain compatibility fallbacks only;
new configuration must use `NEXT_PUBLIC_SITE_URL`.

`robots.js` and `sitemap.js` must import origin helpers only from
`lib/seo/siteOrigin.js`. They must never import `lib/metadataCache.js`, because
that module intentionally uses filesystem access for asset versioning and
would make Vercel trace the public asset tree into metadata-route functions.

Every real `app/**/page.js`, `page.jsx`, `page.ts`, or `page.tsx` route must be
classified explicitly:

- public pages belong in `PUBLIC_INDEX_ROUTES`;
- intentionally non-indexed pages belong in `NON_INDEXED_PAGE_ROUTES` with a
  documented reason.

All current page routes are already classified. No registry entry or Vercel
variable needs to be added for the existing site. The registry is changed only
in the same task that adds a new page, removes a page, changes a route path, or
changes whether a page should appear in search results.

For a new public page, add its route, page owner, and metadata owner to
`PUBLIC_INDEX_ROUTES`. For a technical, private, or application-only page, add
it to `NON_INDEXED_PAGE_ROUTES`, provide a clear reason, and give the page
`noindex` metadata. The contract test deliberately fails until this decision is
made, preventing new pages from silently disappearing from search or being
indexed accidentally.

Never use `robots.txt` as an access-control mechanism. API authorization and
private-data protection remain server responsibilities.

## Sitemap Policy

The sitemap contains only stable, canonical, public pages. API routes,
technical callbacks, private states, application-only routes, and routes
marked `noindex` must not be included.

Do not publish artificial `lastModified`, `priority`, or `changeFrequency`
values. Add such signals only when they are backed by reliable source data.

## Robots Policy

Crawler exclusions are maintained in `ROBOTS_DISALLOW_PATHS`. Public assets
required to render pages must remain crawlable. Dynamic pages that use an
`X-Robots-Tag` must remain accessible to crawlers so the directive can be
observed.

## Language And Canonical Policy

Language alternates may be published only when their target URLs really exist
as crawlable routes. UI dictionary support alone does not justify an
`hreflang` URL.

Until dedicated locale routes exist, multilingual discovery is supported by:

- publishing a truthful multilingual `WebSite` JSON-LD graph generated from
  `SEO_SUPPORTED_LANGS`;
- keeping the SEO language registry synchronized with the application
  dictionary manifest.

The application intentionally keeps `translate="no"`, the `notranslate` class,
and Google's `notranslate` meta directive. Quantum L7 AI already owns a
seven-language dictionary runtime, and browser-level automatic translation can
translate an already translated interface again and corrupt interactive UI.
Browser translation is therefore not used as an SEO localization mechanism.

The multilingual JSON-LD graph gives crawlers truthful descriptions in every
currently supported language without inventing false locale URLs. Full
language-specific page indexing requires real server-rendered locale routes.
When those routes are introduced, they must be added to the public route
registry, sitemap alternates, canonicals, and `hreflang` metadata in the same
task.

All indexed pages require:

- a unique English description;
- a canonical URL matching their registered route;
- a metadata owner declared in `PUBLIC_INDEX_ROUTES`.

Google Search Console ownership is protected by the root metadata verification
token in `app/layout.js`. Keep the token in place after successful verification
so ownership remains recoverable if another verification method changes.

## Verification

`pnpm test:codex` runs the SEO indexing contract through `test:contracts`.
Its environment stage also rejects duplicate, non-HTTPS, localhost, non-www,
or path-bearing `NEXT_PUBLIC_SITE_URL` values when `.env.local` is present.
The contract fails when:

- a page route is not classified;
- a registered route or metadata owner is missing;
- a sitemap route points into a blocked technical zone;
- `robots` or `sitemap` stops using the canonical registry;
- canonical metadata is missing or mismatched;
- nonexistent language routes are advertised;
- multilingual structured data diverges from the dictionary manifest;
- required SEO governance documentation is removed.

The route registries are an engineering guard, not a manual deployment step.
All existing routes are already classified. When a developer adds a new
`app/**/page.*`, the global test intentionally fails until that developer
states whether the page is public and canonical or intentionally non-indexed.

After structural route changes, run:

```bash
pnpm project:docs:full
pnpm test:codex
```

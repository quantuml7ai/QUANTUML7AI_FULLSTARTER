# AGENTS.md

## Mandatory Local Rules For This Repository

1. The canonical verification command after any project change is `pnpm test:codex`.
2. `pnpm verify` may exist as an alias, but it is not the canonical name for reporting or workflow docs.
3. `pnpm test:codex` includes environment checks, documentation contracts, static audits, project contracts, test layers, and production build verification.
4. A task is not considered complete until `pnpm test:codex` has been run, or the exact failing stage and blocker have been documented explicitly.
5. Every final task report must state:
   - whether `pnpm test:codex` was run;
   - whether it passed fully;
   - if it failed, which stage failed and why.

## Structural Change Rules

1. After any structural repository change, the project documentation package must be regenerated.
2. Structural changes include:
   - adding new files or directories;
   - deleting files or directories;
   - renaming;
   - moving files between folders;
   - changing route structure;
   - changing ownership zones;
   - materially changing inter-module dependencies.
3. The mandatory command after structural changes is `pnpm project:docs:full`.
4. This command must refresh:
   - `PROJECT_TREE.md`
   - `PROJECT_ROUTES.md`
   - `PROJECT_OWNERSHIP.md`
   - `PROJECT_DEPENDENCIES.md`
   - `PROJECT_RISKS.md`
   - audit artifacts in `audit/`
5. After `pnpm project:docs:full`, run `pnpm test:codex` again before closing the task.
6. The verify flow also expects `verify:audits` and `test:contracts` to remain wired into the canonical command.
7. If documentation generation fails, the work is not complete until:
   - the issue is fixed; or
   - the exact reason is documented clearly in the response and working context.

## Codex Workflow Rule

Codex must use `pnpm test:codex` as the default verify step after any code, config, API, UI, runtime, or contract change in this repository.

## SEO Indexing Governance Rules

1. `lib/seo/siteIndex.js` is the canonical indexing-policy registry.
2. `NEXT_PUBLIC_SITE_URL` is the canonical production-origin variable used by metadata, robots, sitemap, and structured data.
3. Every added, removed, renamed, moved, or visibility-changed `app/**/page.js`, `page.jsx`, `page.ts`, or `page.tsx` route must update the SEO indexing contour in the same task.
4. Every page route must be classified in exactly one registry:
   - `PUBLIC_INDEX_ROUTES` for canonical public pages;
   - `NON_INDEXED_PAGE_ROUTES` for intentionally non-indexed pages with a documented reason.
5. Changes to canonical URLs, production host, language routes, crawler exclusions, metadata ownership, or dynamic indexing policy must update:
   - `lib/seo/siteIndex.js`;
   - `app/robots.js` when crawler policy changes;
   - `app/sitemap.js` when sitemap behavior changes;
   - the relevant page metadata;
   - `docs/seo-indexing-governance.md`.
6. Language alternates may be published only for real crawlable routes.
7. Supported SEO languages and multilingual structured descriptions must remain synchronized with `components/i18n-dicts/manifest.js`.
8. The root `notranslate` protection must remain enabled until real server-rendered locale routes replace client-only dictionary switching; browser auto-translation must not be used as an SEO localization substitute.
9. `robots.txt` is never treated as access control.
10. SEO indexing contracts are mandatory global tests and must remain wired into `pnpm test:codex` through `test:contracts`.
11. Existing routes are already classified. Update `PUBLIC_INDEX_ROUTES` or `NON_INDEXED_PAGE_ROUTES` only when the same task adds, removes, renames, moves, or changes the search visibility of a page.
12. `NEXT_PUBLIC_SITE_URL` must be declared at most once per environment file and must equal the canonical HTTPS origin `https://www.quantuml7ai.com`; localhost and non-www values are not valid canonical origins.
13. `app/robots.js` and `app/sitemap.js` must use the filesystem-free `lib/seo/siteOrigin.js` module and must never import `lib/metadataCache.js`.

# QL7 Support Planetary AI V5

## Status

This document describes the post-V13 QL7 Support architecture and the mandatory closeout workflow for structural changes.

The original archive used by the implemented patch chain is `СУПОРТ 222(2).zip` with SHA-256 `6e0be5e142376a0a3af7a3dba75fe7b3427e5b62714f83528f158cd5fc909ae1`.

The residual TZ copy still mentions `СУПОРТ 222(1).zip`. That value is historical and must not replace the guards of the actually supplied `(2)` archive.

## Security and ownership boundaries

- The system actor remains `ql7-support`.
- Public Support writes accept text only.
- `supportCard`, `supportEventType`, `systemRole`, and sender identity are server-owned.
- Wallet session or Telegram Mini App proof is required before personal reads.
- MongoDB is the durable source for messages, cases, diagnostics, state, learning candidates, and email outbox records.
- Redis is restricted to ephemeral session/realtime/dedupe/runtime roles.
- Diagnostics are bounded and read-only. They must not change balances, orders, subscriptions, ads, posts, or moderation decisions.
- Reporter identity, secrets, connection strings, and stack traces are excluded from the user projection.

## Main modules

| Area | Files |
|---|---|
| Request orchestration | `lib/ql7-support/server.js`, `app/api/dm/send/route.js` |
| Verified actor | `lib/ql7-support/identityResolver.js` |
| Language pipeline | `lib/deepTranslateService.js`, `lib/ql7-support/languageOrchestrator.js` |
| Semantic routing and memory | `lib/ql7-support/semanticRouter.js`, `lib/ql7-support/dialogueMemory.js` |
| Planning and NLG | `lib/ql7-support/responsePlan.js`, `lib/ql7-support/speechEngine.js` |
| Sources and diagnostics | `lib/ql7-support/sourceRegistry.js`, `lib/ql7-support/diagnosticRegistry.js` |
| Cards and moderation evidence | `lib/ql7-support/cards.js`, `lib/ql7-support/events.js` |
| Runtime operator state | `lib/ql7-support/runtimeStateMachine.js`, `app/api/dm/support-state/route.js` |
| Controlled learning | `lib/ql7-support/learningPipeline.js` |
| Acceptance evidence | `scripts/ql7-support/acceptance-audit.mjs`, `scripts/ql7-support/synthetic-scenario-matrix.mjs` |

## Domain coverage

The catalog exposes 43 ecosystem topics. Every topic has an 18-act structured scenario contract. Specialized diagnostics currently exist for QCoin and Ads; other data-backed topics use the bounded generic adapter, while topics without a confirmed source return an explicit not-applicable/unavailable result instead of inventing data.

A catalog declaration alone is not a production acceptance proof. Final evidence requires the executable matrix, global tests, live HTTP evidence where credentials are available, and synthetic read-only/cleanup proof.

## Canonical verification workflow

After any structural Support change:

1. Capture canonical global verification on the current preimage:
   - `pnpm test:codex`
   - a failing structural-doc baseline is recorded, not hidden; `-RequireCleanBaseline` can make it fatal
2. Apply the exact guarded patch.
3. Set a deterministic documentation timestamp and regenerate the package:
   - `$env:QL7_PROJECT_DOCS_GENERATED_AT = <fixed UTC timestamp>`
   - `pnpm project:docs:full`
4. Run canonical global verification again:
   - `pnpm test:codex`
5. Run the deep global governance contour:
   - `pnpm test:codex -- --deep`
6. Produce Support acceptance evidence:
   - `node scripts/ql7-support/acceptance-audit.mjs --report-dir <reportDir>`
7. For final live acceptance, run authenticated live smoke with fake SMTP and the guarded synthetic matrix with exact cleanup.

The task is not fully closed when only targeted Quick tests pass.

## Generated evidence

The acceptance audit produces structured JSON for:

- environment;
- 43 × 18 × locale conversation intelligence matrix;
- reply diversity;
- old-message echo trace;
- question repetition;
- toxicity language matrix;
- knowledge and source coverage;
- diagnostic adapter classification;
- moderation/media policy;
- operator runtime states;
- learning lifecycle;
- security redaction;
- performance budgets;
- acceptance summary.

The PS1 wrapper additionally owns pre/post manifests, payload inventory, backups, encoding proof, command logs, immutable proof, read-only proof, cleanup proof, rollback evidence, and final summary.

## Final acceptance boundary

A green static/global run does not substitute for live evidence. Final acceptance requires:

- canonical `pnpm test:codex` before and after documentation generation;
- deterministic generated documentation committed as part of the allowlist;
- deep global gates;
- authenticated live Support HTTP flow with `QL7_SUPPORT_EMAIL_FAKE=1`;
- guarded synthetic apply and exact cleanup in a non-production database;
- no business collection changes;
- final `summary.json` with `ok=true`, `acceptanceComplete=true`, and `criticalSkipped=[]`.

## V18 runtime-completion architecture

V18 is bound to the exact `СУПОРТ 333.zip` preimage, SHA-256 `8BDA88830A4A29513B2C8CBFA48FBD988BD05583196C6F3E6C0A8F45ABF09F0B`. `СУПОРТ 111(1).zip`, SHA-256 `0D1659B4D84D3FB2AD978E1315FEC35FE62714645B33B2F70056C3CC21ACFC5E`, is a functional oracle only and is never an apply target.

### Isolation boundary

QL7 Support is a read-only observer and case operator above the ecosystem. It does not own or replace global authentication, ordinary DM, media, business routes, balances, payments, orders, subscriptions, ads, posts, moderation decisions, or the global translation endpoint.

The translation architecture has two isolated facades over equivalent bounded multi-provider mechanics:

- `lib/deepTranslateService.js` and `/api/deep-translate` preserve the global contract used by Crypto News, Forum translation, Battle Chat and any existing consumer.
- `lib/ql7-support/supportDeepTranslateService.js` is server-only, receives redacted text, validates critical identifiers, owns a bounded redacted cache, and is used only by Support orchestration.
- The global route never imports `lib/ql7-support/**`; Support never imports the global route or mutates global translation state.

### Support authentication and delivery

Every Support thread/state/send request waits for a valid wallet-session or Telegram Mini App proof. Identity headers remain hints. Support loads are single-flight, stale requests are abortable, one verified-session event may recover one request that raced server-side session persistence, and the same rejected proof is circuit-broken so it cannot create a repeated `401` loop.

After a successful Support send, the client performs one canonical authenticated thread reload. The durable user message, server reply, triggering message ID, client mutation ID and correlation ID are merged by identity rather than by text. Ordinary Messenger dialogs retain their existing retry and realtime behavior.

### Domain diagnostics

All 43 topics have a unique adapter and analyzer contract, exact route evidence, allowlisted collections, bounded identity/entity filters, owner-aware privacy projection, source-unavailable versus no-data semantics, family-specific evidence fields and recommendation policy. QCoin and Ads retain their specialized branches; the remaining domains use their declared domain/family analyzer rather than a source-hit-only result.

Every diagnostic captures before/after collection fingerprints and persists a write-spy result. Business mutation methods are not exposed to adapters.

### Controlled learning and email operations

The learning lifecycle is feedback → redacted candidate → poisoning/privacy/quality review → offline evaluation → shadow → bounded canary → promotion or atomic rollback. Shadow never changes the delivered reply. Synthetic deployments use run-scoped state IDs and deletion cleanup removes user-owned Support learning data without touching production deployment state.

Material email events are queued durably. User replies never wait for SMTP. The worker uses lease, retry, exponential backoff, sent, failed and dead-letter states and is protected by `QL7_SUPPORT_WORKER_TOKEN` or `CRON_SECRET`.

### Runtime evidence

Complete acceptance requires one run that supplies all of the following:

- global `pnpm test:codex` before and after deterministic documentation;
- `pnpm test:codex -- --deep`;
- authenticated live HTTP with a real current wallet session and a real non-fallback translation provider;
- browser smoke at 360px with zero authenticated Support-thread `401`, maximum one concurrent Support thread request, visible translated reply, screenshot, HAR and heap snapshot;
- guarded synthetic apply and exact cleanup with before/after business fingerprints;
- live learning shadow/canary/rollback evidence;
- live safe profile/geo/timeline admin-context evidence;
- PS1 apply/reapply/rollback proof;
- final acceptance with `criticalSkipped=[]`.

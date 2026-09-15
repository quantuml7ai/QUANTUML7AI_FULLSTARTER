# QL7 Support Planetary AI V5 — Compliance Audit

## Scope and source of truth

This audit compares the V13 postimage with the residual QL7 Support V5 technical assignment and the repository governance rules.

The implementation chain was built and applied from the actually supplied `СУПОРТ 222(2).zip`, SHA-256 `6e0be5e142376a0a3af7a3dba75fe7b3427e5b62714f83528f158cd5fc909ae1`. The residual assignment header still names `(1)` with another hash; that stale header is not a valid replacement for the applied preimage guard.

## Proven in the V13 Quick run

The V13 Quick report proves exact payload/manifest guards, UTF-8 and syntax checks, targeted ESLint, unit, contracts, component, integration, smoke, internal diff, immutable-file protection, atomic apply and final postimage validation.

The targeted support layers are green:

- unit: 13/13;
- project contracts: 24/24;
- component: 3/3;
- integration: 24/24;
- smoke: 3/3;
- static audit: 77/77;
- standalone self-test: 11/11.

These results are necessary but do not by themselves satisfy repository closeout governance.

## Mandatory governance work added by V15

V15 adds and enforces:

- canonical `pnpm test:codex` baseline on the V13 preimage before any V15 write, with the exact failure retained and optional strict baseline enforcement;
- deterministic `pnpm project:docs:full` with generated documents retained in the source tree;
- canonical `pnpm test:codex` after documentation regeneration;
- deep `pnpm test:codex -- --deep` governance gates;
- a 43 × 18 × 8 structured acceptance matrix;
- persistent acceptance, source, security, media, operator, learning and performance evidence;
- exact lifecycle simulation for apply, idempotent reapply and rollback;
- a final summary that separates `ok` from `acceptanceComplete` and lists every critical skipped gate.

## Implemented and structurally covered

- verified actor boundary and forged identity rejection;
- text-only public Support writes and server-only cards;
- durable case memory with claims, facts, corrections and bounded history;
- current-message identity and old-message echo regression tests;
- seven interface languages plus shared unknown-language translation path;
- redaction before provider, memory and email persistence;
- structured response planning and anti-repetition guards;
- bounded read-only source contracts and diagnostic proof schema;
- moderation snapshot and reporter-private user projection;
- viewport-only muted 0–5 second video preview and manual audio;
- persisted operator runtime states;
- material-event email dedupe and fake transport;
- controlled candidate/review/evaluation/deploy/rollback learning skeleton;
- account-deletion cleanup coverage for Support-owned personal collections.

## Partial or not yet proven to final acceptance

The following items must not be represented as fully closed merely because V13 Quick is green:

1. **Domain specialization.** QCoin and Ads have specialized diagnostic branches. Other data-backed domains currently use a bounded generic adapter or explicit not-applicable result. This is safer than invented data, but it is not the same as 43 fully specialized adapters.
2. **Source registry completeness.** The registry is bounded and allowlisted, but every declared collection/route/index has not yet been proven by a dedicated executable repository contract.
3. **Toxicity depth.** Seven-language profanity/frustration coverage exists, but the full quote/harassment/hate/joke/spam/obfuscation taxonomy is not proven by a comprehensive adversarial matrix.
4. **Email worker operations.** Durable outbox records and dedupe exist, but a separate lease/retry/backoff/dead-letter worker lifecycle is not proven end-to-end.
5. **Learning operations.** Candidate/review/evaluation/deployment/rollback is implemented as a controlled skeleton. Live shadow/canary thresholds, poisoning review and rollback telemetry remain runtime evidence requirements.
6. **Live and database evidence.** Authenticated HTTP smoke, synthetic apply, exact cleanup and before/after business collection fingerprints were not run in V13 Quick.
7. **Browser and performance evidence.** Real 320–360px, RTL, media viewport, operator animation, long-task/FPS and screenshot evidence is not contained in the V13 Quick report.
8. **Global repository proof.** V13 Quick did not execute the canonical global command or regenerate and retain project documentation.

## Acceptance interpretation

- `summary.ok=true` means every command requested for that run passed.
- `acceptanceComplete=true` is allowed only when canonical global tests, deterministic docs, deep gates, authenticated live smoke, guarded synthetic apply/cleanup, lifecycle proof and required browser/runtime evidence are all present.
- Any partial or runtime-required item must be listed in `criticalSkipped`; it must never be silently converted into a pass.

## V18 completion delta on `СУПОРТ 333`

The V18 production preimage is `СУПОРТ 333.zip`, SHA-256 `8BDA88830A4A29513B2C8CBFA48FBD988BD05583196C6F3E6C0A8F45ABF09F0B`. The reference `СУПОРТ 111(1).zip` is used only to preserve the proven global Deep Translate and ordinary DM behavior.

The V18 delta closes the previously documented architecture gaps instead of converting them to report-only passes:

1. **Global translation regression:** the old 3-second aggregate budget and Support-coupled route are replaced by a global multi-provider service with caller cancellation and the reference request/response contract. Support receives an isolated server-only translator with redaction, critical-token validation and a bounded cache.
2. **Support 401 storm:** every Support thread/send/state load now carries verified session proof, uses single-flight loading, one-event recovery and a rejected-proof circuit breaker. A successful send triggers one canonical authenticated reload.
3. **Domain specialization:** all 43 domains have unique adapter/analyzer IDs, route evidence, owner-aware projection, evidence fields, branch policy and read-only fingerprint proof. Family analyzers produce domain evidence rather than generic source-hit output.
4. **Toxicity:** frustration, support insult, user insult, harassment, hate, threat, sexual harassment, quote, joke/self-reference and spam are distinguished across the seven interface languages with obfuscation handling.
5. **Email:** SMTP is outside the reply critical path. The durable worker proves lease/retry/backoff/dead-letter and protected invocation.
6. **Learning:** candidate redaction, poisoning rejection, review, offline evaluation, shadow non-mutation, canary thresholds, promotion, rollback and deletion cleanup are executable and have a guarded live-evidence script.
7. **Admin context:** profile, safe geo and bounded case/runtime timeline are built from projected read-only sources and exclude reporter identity, raw secrets, IP addresses, connection URIs and stack traces.
8. **Browser/performance:** the browser smoke captures a 360px screenshot, network HAR, performance metrics and a heap snapshot while enforcing zero Support 401 loops, single-flight thread reads and no horizontal overflow.

### Acceptance rule

A static matrix or dry run cannot close runtime acceptance. `acceptanceComplete=true` is permitted only when the wrapper supplies green live HTTP, browser/HAR/heap, synthetic apply/cleanup, learning, admin context, docs, Codex and lifecycle evidence to the final acceptance audit. Missing credentials or external provider availability remain explicit failures when complete acceptance is required.

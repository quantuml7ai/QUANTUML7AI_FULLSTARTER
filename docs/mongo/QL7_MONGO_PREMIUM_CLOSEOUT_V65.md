# QL7 Mongo Premium Closeout V65

Status: Mongo primary closeout for permanent storage domains.

Date: 2026-06-24

## Result

MongoDB is the primary read/write store for heavy permanent domains:

- DM
- Forum
- Profile
- Ads
- QCoin
- Battlecoin
- MetaMarket
- Quest
- Academy
- Referral
- Payments/VIP/Subscriptions
- MetaStudio

Redis remains allowed only for runtime/cache/realtime/TTL/locks/sessions/rate-limit/dedupe and push runtime state.

## Active Code Policy

Canonical policy file: `lib/mongo/permanent-policy.cjs`

Expected policy markers:

- `version: ql7-mongo-permanent-code-policy-v17`
- `mongoPrimaryWrites: true`
- `parallelPermanentWrites: false`
- `redisFallbackEnabled: false`
- `redisCleanupAllowed: false`
- `verifyParityReads: false`
- `runtimeComparisonReads: false`

## Closeout Proof

Implemented proof layers:

- production routes use domain Mongo repositories instead of migration shadow/mirror helpers;
- old production shadow/mirror/default-disabled scaffolds were removed from `lib/mongo`;
- payment invoices and webhook snapshots moved from Redis `invoice:*` to Mongo `payment_*` collections;
- MetaStudio registrations moved from Redis `metastudio:*` to Mongo;
- `scripts/redis-mongo-closeout-cleanup-gate.mjs` provides a fail-closed allowlist, Mongo baseline, typed Redis backup and restore path before cleanup;
- `scripts/redis-mongo-closeout-backfill-missing-domains.mjs` performs idempotent Redis-to-Mongo backfill without Redis mutation;
- unit coverage includes payments/metastudio repositories and QCoin runtime snapshot storage;
- `pnpm run test:unit` passed: 21 files, 62 tests.

Remaining required operational proof:

- `pnpm project:docs:full`;
- `pnpm test:codex`;
- Redis Monitor smoke proving forbidden permanent Redis keys are absent after real scenarios;
- DM route comparison against the supplied archive was completed; the archive-only mailbox fallback for dialog delete was restored and unit-tested;
- cleanup remains blocked until every candidate domain, including primary `metastudio_registrations`, passes the Mongo baseline;

## Redis Allowed

- Forum Pub/Sub and TTL dedupe/locks.
- QCoin heartbeat alive TTL and topup lock.
- Quest claim lock.
- MetaMarket locks and idempotency TTL.
- Wallet session TTL.
- Telegram link nonce TTL.
- Push/WebPush/native push runtime.
- AI quota/rate-limit windows.

## Redis Forbidden

- DM permanent message/receipt/index state.
- Forum permanent topic/post/snapshot/user/subscription state.
- Profile permanent aliases/profile fields.
- Ads permanent state.
- QCoin permanent balance/ledger/topup state.
- MetaMarket permanent ownership/token/item state.
- Quest/Academy permanent progress/exam state.
- Referral permanent attribution/reward state.
- Payments/VIP permanent invoice/entitlement state.
- MetaStudio permanent registration state.

# Verification Pipeline

## Canonical Command

The official verification entrypoint for this repository is:

```bash
pnpm test:codex
```

`pnpm verify` is only a convenience alias. Documentation, final reports, and Codex workflow must always refer to `pnpm test:codex`.

## Goals

The pipeline is designed to validate any change in one predictable command:

- new features
- small UI fixes
- API updates
- runtime/config changes
- forum/media/profile/feed work
- documentation changes tied to project contracts

The pipeline is intentionally non-interactive, CI-friendly, deterministic, and strict about exit codes.

## Pipeline Stages

`pnpm test:codex` runs these scripts in order:

1. `pnpm run verify:env`
2. `pnpm run verify:docs`
3. `pnpm run verify:audits`
4. `pnpm run lint`
5. `pnpm run typecheck`
6. `pnpm run test:contracts`
7. `pnpm run test:unit`
8. `pnpm run test:component`
9. `pnpm run test:integration`
10. `pnpm run test:smoke`
11. `pnpm run build`

If any stage fails, the pipeline stops immediately and returns a non-zero exit code.

## Internal Scripts

- `pnpm run verify:env`
  Checks Node/pnpm expectations, lockfile presence, local install state, Vitest config presence, and required script wiring.
- `pnpm run verify:docs`
  Ensures the verification workflow is documented in `README.md`, `AGENTS.md`, and this file.
- `pnpm run verify:audits`
  Runs repo-wide static audit scripts and verifies that their reports are regenerated successfully.
- `pnpm run test:contracts`
  Runs broad source-surface contract checks for API routes, app entry files, and forum hook modules.
- `pnpm run lint`
  Runs repository-wide ESLint in strict mode.
- `pnpm run typecheck`
  Runs TypeScript in `--noEmit` mode across application code, tests, and tooling.
- `pnpm run test:unit`
  Runs unit tests for pure logic.
- `pnpm run test:component`
  Runs React component rendering and callback tests.
- `pnpm run test:integration`
  Runs hook and route contract tests.
- `pnpm run test:smoke`
  Runs high-level smoke checks for critical forum flow composition.
- `pnpm run test:coverage`
  Optional coverage run for deeper inspection.
- `pnpm run test:quick`
  Reduced local loop for fast iteration. Useful during development, but not a substitute for `pnpm test:codex`.

## Test Layout Standard

All new tests should follow the centralized structure below:

- `tests/contracts`
- `tests/unit`
- `tests/component`
- `tests/integration`
- `tests/smoke`
- `tests/fixtures`
- `tests/support`
- `tests/mocks`

This is the official layout for future coverage expansion.

## Current Starter Coverage

The initial verification foundation covers:

- every `app/api/**/route.js` contract at the project surface level
- every app page/layout/loading/error/not-found entry contract
- the forum hook surface under `app/forum/**/hooks/use*.js(x)`
- repo-wide static audits for runtime hotspots, effect cleanup risks, auth bus usage, and forum dependency topology
- forum media ownership mapping and churn-oriented media audit artifacts
- runtime config parsing
- compact count formatting
- recommendation rail interleave logic
- recommendation route contract behavior
- recommendation hook prefetch/reconciliation behavior
- recommendation card rendering and callback behavior
- recommendation rail rendering states
- video feed slot smoke rendering with item/ad/recommendation coexistence

## Forum Diagnostics Flags

Forum diagnostics are controlled by a master public flag:

```bash
NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED=0
```

When this master flag is `0`, production-safe behavior is enforced:

- `forum-early-diag` is not rendered into forum HTML;
- `/forum` does not auto-enable diagnostics;
- query params cannot force diagnostics on;
- diagnostics hooks and the debug route stay inert.

Secondary flags only matter when the master switch is enabled:

```bash
NEXT_PUBLIC_FORUM_DIAG=0
NEXT_PUBLIC_FORUM_PERF_TRACE=0
```

## Forum Media Debug Flags

Media trace and audit helpers are dev/test only and should stay off in production:

```bash
NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED=0
NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED=0
NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY=0
```

Recommended local debug values:

```bash
NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED=1
NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED=1
NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY=0
```

## Mandatory Usage Rule

After any repository change:

1. run `pnpm test:codex`
2. resolve failures, or document the exact failed stage and blocker
3. include the verification result in the final task report

After structural repository changes:

1. run `pnpm project:docs:full`
2. run `pnpm test:codex`

## Final Report Standard

Each final implementation report should include:

- architectural summary
- key created or changed files
- scripts added or updated
- tests added or updated
- documents updated
- whether `pnpm test:codex` passed fully
- if not, the failed stage and reason

## Future Expansion

The pipeline is designed to grow without changing the canonical entrypoint. Add future regression coverage under the same test tree and keep `pnpm test:codex` as the single official verification command.

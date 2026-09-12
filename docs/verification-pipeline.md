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
3. `pnpm run verify:audits:fast`
4. `pnpm run lint`
5. `pnpm run typecheck`
6. `pnpm run test:contracts`
7. `pnpm run test:unit`
8. `pnpm run test:component`
9. `pnpm run verify:forum:runtime` when changed files hit runtime-critical zones
10. `pnpm run verify:auth:fanout` when changed files hit runtime-critical zones
11. `pnpm run verify:route:budgets` when changed files hit runtime-critical zones
12. `pnpm run verify:startup:budgets` when changed files hit runtime-critical zones
13. `pnpm run verify:ads:runtime` when changed files hit runtime-critical zones
14. `pnpm run test:integration`
15. `pnpm run test:smoke`
16. `pnpm run build`

If any stage fails, the pipeline stops immediately and returns a non-zero exit code.

Optional deep release-grade verification is available through:

```bash
pnpm test:codex --deep
```

This enables the L2 deep diagnostic gate:

- `pnpm run verify:audits:deep`
- `pnpm run verify:media:har`
- `pnpm run verify:media:heap`
- `pnpm run verify:mobile:matrix`
- `pnpm run verify:exchange:widgets`

## Internal Scripts

- `pnpm run verify:env`
  Checks Node/pnpm expectations, lockfile presence, local install state, Vitest config presence, and required script wiring.
- `pnpm run verify:docs`
  Ensures the verification workflow is documented in `README.md`, `AGENTS.md`, and this file.
- `pnpm run verify:audits`
  Runs repo-wide static audit scripts and verifies that their reports are regenerated successfully.
- `pnpm run verify:audits:fast`
  Runs the L0 stage 0 audit contour: runtime hotspots, effects, auth bus, provider baseline, route budgets, player ownership, runtime passports, prod-lite discipline, diagnostics boundaries, and adaptive core.
  The fast contour also emits `runtime-mode-resolution.report.json`, `adaptive-actions.report.json`, `pressure-ladder.report.json`, and `mode-contract.validation.report.json`.
- `pnpm run verify:audits:deep`
  Runs the full stage 0 audit pack including forum/media heavy audits, route teardown, console noise, layout stability, preload waste, auth cascade, same-src churn, feature flag safety, and forensic bounds.
- `pnpm run verify:media:har`
  Ingests a supplied HAR capture and emits `forum-media-har.report.json` with same-src windows, repeat-window tags, and fail signals.
- `pnpm run verify:media:heap`
  Ingests a supplied heap snapshot and emits `heapsnapshot-analysis.report.json` plus `media-heap.verify.report.json` with grouped runtime signals and heap discipline ratios.
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

## Stage 0 Runtime Governance Layers

Stage 0 formalizes three verification layers:

1. `L0 Fast Gate`
   `lint`, `typecheck`, contracts, unit/component tests, and `verify:audits:fast`
2. `L1 Runtime-Critical Gate`
   `verify:forum:runtime`, `verify:auth:fanout`, `verify:route:budgets`, `verify:startup:budgets`, `verify:ads:runtime`
3. `L2 Deep Diagnostic Gate`
   `verify:audits:deep`, `verify:media:har`, `verify:media:heap`, `verify:mobile:matrix`, `verify:exchange:widgets`

The final stage 0 gate protocol is represented by eight required outputs:

1. static fast
2. diagnostics integrity
3. mode integrity
4. production-lite integrity
5. baseline diff integrity
6. mobile matrix
7. route return
8. release note

Stage 0 also adds scenario telemetry entrypoints:

- `verify:scenario:forum-mobile`
- `verify:scenario:forum-desktop`
- `verify:scenario:forum-route-return`
- `verify:scenario:auth-cascade`
- `verify:scenario:startup-shell`
- `verify:scenario:exchange-route`
- `verify:scenario:decorative-media`
- `verify:scenario:forum-long-scroll`
- `verify:scenario:forum-background-restore`
- `verify:scenario:forum-wallet-untouched`
- `verify:scenario:qcast-mixed`
- `verify:scenario:provider-baseline`
- `verify:scenario:route-teardown`
- `verify:scenario:preload-waste`
- `verify:scenario:console-noise`
- `verify:scenario:adaptive-pressure`
- `verify:scenario:forensic-mode`

Baseline comparison is done via:

```bash
pnpm run verify:diff:last-baseline
```

This consumes:

- `baseline-before.stage0.json`
- `baseline-after.stage0.json`
- `diff.stage0.json`

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

## Runtime Mode Env Contract

Stage 0 now requires one shared mode resolver instead of ad-hoc runtime detection.

Server-side contract:

```bash
APP_RUNTIME_MODE=production-adaptive
APP_DIAGNOSTICS_MODE=off
APP_FORENSIC_MODE=off
APP_TELEMETRY_LEVEL=T0
APP_ADAPTIVE_CORE_MODE=enforced
```

Client-safe mirror:

```bash
NEXT_PUBLIC_RUNTIME_MODE=production-adaptive
NEXT_PUBLIC_DIAGNOSTICS_MODE=off
NEXT_PUBLIC_ADAPTIVE_CORE=enforced
NEXT_PUBLIC_FORENSIC_ALLOWED=0
NEXT_PUBLIC_ROUTE_BUDGET_DEBUG=0
NEXT_PUBLIC_CONSOLE_NOISE_CLASSIFIER=1
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

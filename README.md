# Quantum L7 AI Full Starter

Next.js forum application with media feed, profile flows, forum runtime orchestration, recommendation rails, audit tooling, and generated project architecture docs.

## Local Setup

1. Create `.env.local` from your local template or existing environment values.
2. Install dependencies with `pnpm install`.
3. Start the app with `pnpm dev`.

## Forum Diagnostics

Early forum diagnostics are now controlled by one master public flag:

```bash
NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED=0
```

When the master flag is `0`:

- the `forum-early-diag` bootstrap script is not rendered into `/forum` HTML;
- `/forum` path alone cannot auto-enable diagnostics;
- query flags cannot turn diagnostics back on;
- client hook diagnostics stay inert;
- the debug route stays in skipped/disabled mode.

Secondary flags only work when the master flag is enabled:

```bash
NEXT_PUBLIC_FORUM_DIAG=0
NEXT_PUBLIC_FORUM_PERF_TRACE=0
```

Production-safe values:

```bash
NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED=0
NEXT_PUBLIC_FORUM_DIAG=0
NEXT_PUBLIC_FORUM_PERF_TRACE=0
```

Intentional local diagnostics examples:

```bash
NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED=1
NEXT_PUBLIC_FORUM_DIAG=1
NEXT_PUBLIC_FORUM_PERF_TRACE=0
```

or

```bash
NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED=1
NEXT_PUBLIC_FORUM_DIAG=0
NEXT_PUBLIC_FORUM_PERF_TRACE=1
```

## Forum Media Debug Flags

Media tracing and audit helpers are dev/test only and should stay disabled in production:

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

## Official Verification Standard

The canonical verification command for every project change is:

```bash
pnpm test:codex
```

This is the official non-interactive verify pipeline for:

- UI changes
- API changes
- logic changes
- runtime/config updates
- forum/media/profile/feed changes
- documentation changes that affect project contracts
- any small patch that should be considered complete

`pnpm verify` is available as a convenience alias, but the official name used in documentation, reporting, and Codex workflow is `pnpm test:codex`.

## What `pnpm test:codex` Runs

`pnpm test:codex` executes the full pipeline in a fixed order:

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

The command exits with code `0` only when every stage succeeds. Any failed stage stops the pipeline and returns a non-zero exit code.

## Fast Local Mode

For quick local iteration there is a reduced helper:

```bash
pnpm test:quick
```

This does not replace `pnpm test:codex` and is not accepted as the final verification step for a completed task.

## Test Structure

The repository uses one central test tree:

- `tests/contracts` for project-wide entrypoint and hook surface contracts
- `tests/unit` for pure logic and utilities
- `tests/component` for React component rendering and callbacks
- `tests/integration` for hooks, route contracts, and cross-module behavior
- `tests/smoke` for high-level forum flow sanity checks
- `tests/fixtures` for reusable data builders
- `tests/support` for DOM setup and shared test environment wiring
- `tests/mocks` for persistent mock placeholders

The verification pipeline also runs static repo-wide audits through `pnpm run verify:audits` so architecture and runtime-risk reports are regenerated during the canonical verify flow.

## Mandatory Workflow

After any change:

1. Run `pnpm test:codex`
2. Fix failures or explicitly document the failing stage and reason
3. Include the verification result in the final task report

After any structural repository change:

1. Run `pnpm project:docs:full`
2. Re-run `pnpm test:codex`

Structural changes include new files, deleted files, moved files, renamed files, route map changes, ownership changes, and major dependency topology changes.

## Verification Reporting

Every final report should include:

- what changed
- which files were created or updated
- that `pnpm test:codex` was run
- whether it passed fully
- if it failed, the exact failed stage and why

## Additional Reference

Detailed pipeline rules and script descriptions live in [docs/verification-pipeline.md](docs/verification-pipeline.md).

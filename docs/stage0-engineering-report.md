# Stage 0 Engineering Report

## Purpose

Stage 0 turns the project into a self-observable and regression-disciplined runtime system before deeper optimization work starts.

The contour is intentionally split into two modes:

- `Deep Awareness Layer` for `dev`, `qa`, `stage`, and bounded forensic sessions
- `Production Adaptive Core` for lightweight runtime control in production

This separation is the main engineering invariant of stage 0: production must stay cheap and protective, while non-production modes stay explanatory and deep.

## What Stage 0 Adds

### Runtime awareness

- runtime identity registry for heavy runtime entities
- unified runtime state vocabulary for media and non-media lifecycles
- runtime inspector and debug store
- runtime passport generation and serialization

### Budget governance

- route capability profiles and resolver
- owner arbitration rules
- promotion journal and budget violation reporting
- route-local teardown and blocked-promotion accounting

### Production adaptation

- unified runtime mode resolver and env contract
- server/client mode boundary helpers
- runtime mode guards
- device profile resolver
- effect degradation ladder
- runtime priority arbiter
- production adaptive core
- bounded forensic mode controller

### Regression intelligence

- baseline capture tooling
- diff engine and formatter
- extended audit pack
- scenario telemetry packs
- HAR and heap normalization protocols
- HAR and heap calibration artifacts with fail-signal summaries

## Runtime Modes

The repository now distinguishes these runtime modes:

1. `development-research`
2. `qa-calibration`
3. `stage-pre-release`
4. `production-adaptive`
5. `emergency-forensics`

The most important rule is that `production-adaptive` is not allowed to carry heavy explainability overhead. It may enforce budgets and degradations, but deep tracing belongs to the research and forensic contours.

The mode contract is now resolved through one shared env-driven layer rather than scattered `NODE_ENV` checks:

```bash
APP_RUNTIME_MODE
APP_DIAGNOSTICS_MODE
APP_FORENSIC_MODE
APP_TELEMETRY_LEVEL
APP_ADAPTIVE_CORE_MODE
NEXT_PUBLIC_RUNTIME_MODE
NEXT_PUBLIC_DIAGNOSTICS_MODE
NEXT_PUBLIC_ADAPTIVE_CORE
NEXT_PUBLIC_FORENSIC_ALLOWED
NEXT_PUBLIC_ROUTE_BUDGET_DEBUG
NEXT_PUBLIC_CONSOLE_NOISE_CLASSIFIER
```

If the resolver cannot safely confirm a non-production mode, it falls back to prod-lite discipline instead of enabling deep diagnostics by accident.

## Mandatory Stage 0 Outputs

Key artifacts produced by the contour include:

- `runtime-passport.snapshot.json`
- `runtime-passports.report.json`
- `route-budget.report.json`
- `startup-budget.report.json`
- `player-budget.report.json`
- `auth-cascade.report.json`
- `route-teardown.report.json`
- `console-noise-classification.report.json`
- `layout-stability.report.json`
- `adaptive-core.report.json`
- `prod-lite-discipline.report.json`
- `diagnostics-boundaries.report.json`
- `feature-flag-safety.report.json`
- `forensic-bounds.report.json`
- `runtime-mode-resolution.report.json`
- `adaptive-actions.report.json`
- `pressure-ladder.report.json`
- `mode-contract.validation.report.json`
- `forum-media-har.report.json`
- `media-heap.verify.report.json`
- `baseline-before.stage0.json`
- `baseline-after.stage0.json`
- `diff.stage0.json`

Scenario telemetry packs are emitted as `scenario.*.report.json`.

## Verify Pipeline

The canonical verify entrypoint remains:

```bash
pnpm test:codex
```

Stage 0 extends the pipeline with:

- `L0 Fast Gate`
- `L1 Runtime-Critical Gate`
- `L2 Deep Diagnostic Gate`

Deep release-grade verification can be requested with:

```bash
pnpm test:codex --deep
```

## What Was a Blind Spot Before Stage 0

Before stage 0 the project had no formal shared language for:

- active runtime ownership
- route capability and budget profiles
- blocked promotions and teardown debt
- prod-lite versus deep-diagnostics boundaries
- adaptive degradation behavior
- baseline-before versus baseline-after comparison

That made runtime changes easy to discuss informally but hard to prove.

## What Is Now Standardized

Stage 0 standardizes:

- 70 scenario entries in the telemetry matrix
- route profiles for forum, exchange, auth, wallet, decorative, ads, widget-heavy, and qcast-heavy routes
- audit coverage for ownership, route budgets, adaptive core, diagnostics boundaries, prod-lite discipline, and forensic limits
- contract, unit, component, integration, and smoke coverage for runtime governance

## Blocking Metrics

Stage 0 treats the following classes as blocking or near-blocking signals depending on gate:

- ownership overlap
- route teardown leakage
- repeated same-src churn
- forced reflow storm
- long message storm
- startup over-budget behavior
- wallet-before-intent behavior
- auth fanout growth
- diagnostics leaking into prod-lite paths

## HAR / Heap Lab Calibration

The HAR and heap laboratory is no longer just a readiness hook. When real captures are provided, stage 0 now emits:

- `forum-media-har.report.json` with same-src windows, partial-then-cancel traces, repeat-window tagging, and churn fail signals
- `heapsnapshot-analysis.report.json` with structural heap anatomy
- `media-heap.verify.report.json` with grouped runtime signals, ratios, and elevated-presence flags

That makes the lab data part of the formal contour instead of an ad-hoc debugging side path.

## Merge Discipline After Stage 0

After stage 0, no heavy runtime feature should be accepted without:

- route profile
- ownership contract
- budget policy
- mode contract compatibility
- regression coverage
- artifact generation through the verify contour

## Manual Calibration Data Still Needed

The code contour is in place, but real-device calibration still benefits from fresh captures for:

- iPhone Safari forum cold start and long scroll
- Android Chrome forum restore and same-src revisit
- Telegram WebView background/foreground return
- exchange widget failure route leave cleanup
- low-memory mobile startup capture

Those captures should ideally include HAR, heap, runtime passport before/after, and short reproduction notes.

## Next Allowed Stage

With stage 0 in place, the next approved workstream is stage 1:

- root shell separation
- startup budget discipline
- provider baseline reduction

That work must continue to use the same stage 0 contour for before/after proof.

# QL7 Support: deterministic production / local calibration

## Production contour

The production Support runtime is server-only deterministic JavaScript. The canonical path remains
`server.js -> runtime/productionTurn.js -> runtime/executeTurn.js`. Understanding, routing,
response realization, safety and quality gates use reviewed language banks, ontology, semantic
features, calibrated mathematics and explicit rules. Production does not load Python, PyTorch,
model weights, model endpoints, paid AI APIs or external translation services.

The active calibration is a compact immutable artifact. Its manifest binds the exact SHA-256,
Ed25519 signature, version, lineage, approval receipt and rollback version. Production verifies the
artifact before every process starts using it and fails closed with status 503 if the artifact is
corrupted, unsigned, unapproved or incompatible.

## Local laboratory contour

Python 3.12, PyTorch, `.venv-ql7`, `services/ql7-model-runtime`, `ml/ql7-native`, simulation scripts,
reports, checkpoints and raw datasets are local-only. They may evaluate and calibrate the same
canonical JS executor, but they are not production authorities and are excluded from Vercel.

The promotion flow is:

1. Run the local lab and produce redacted candidate metrics.
2. Pass anti-poisoning review and a frozen holdout validation.
3. Bind a human Ed25519 approval to the exact candidate SHA-256.
4. Export a compact artifact with `pnpm ql7:support:calibration:export -- --candidate ... --approval ... --output ...`.
5. Review and sign the active source artifact; keep its rollback version. Production never promotes
   an export automatically and never learns from live conversations.

## Mongo memory contour

Mongo stores a bounded semantic projection rather than a transcript or model state. It includes
hashed actor/conversation identity, locale, active topic/intent/goal, a short redacted summary, fact
and unresolved-slot IDs, rejected-hypothesis IDs, commitments, safety state, 24 recent turn hashes,
up to 16 topic frames, calibration version/hash, CAS memory version/hash and expiry time.

Every projection is privacy-audited and capped at 32 KiB. The store preserves optimistic CAS,
creates a native TTL index on `expiresAt`, reads memory once for a turn and writes the projection only
after committed delivery. Existing DM/Forum messages remain the canonical transcript; Support does
not duplicate them in memory.

## Deployment proof

`.vercelignore` and Next output tracing exclude the local lab, reports, checkpoints, raw datasets and
model formats. `pnpm ql7:support:production-boundary` walks the canonical Support production import
graph and fails if it reaches neural, simulation, learning, Python, local model service or model
artifact paths. Language banks and calibration verification remain server-side.

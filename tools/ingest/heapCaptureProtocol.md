# Heap Capture Protocol

## Goal

Capture comparable heapsnapshots for stage-by-stage memory validation.

## Capture points

- cold start baseline
- steady-state 60s
- steady-state 180s
- route leave cleanup
- background to foreground restore

## Naming

Use `heap.<stage>.<scenario>.<point>.heapsnapshot`.

## Required notes

- browser and version
- device profile
- route
- scenario id
- signed-in state
- whether wallet/auth prompt was opened

## Capture discipline

1. Start from a fresh tab.
2. Reproduce one scenario only.
3. Capture the baseline snapshot.
4. Continue the scenario to the requested checkpoint.
5. Capture the follow-up snapshot.
6. Run `verify:media:heap` against the saved snapshot.

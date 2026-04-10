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

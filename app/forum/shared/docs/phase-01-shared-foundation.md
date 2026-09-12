# Forum Shared Foundation (Phase 01)

This folder contains low-level primitives extracted from `app/forum/Forum.jsx`.

Current modules:

- `hooks/useEvent.js`: stable callback hook for effects/listeners.
- `utils/browser.js`: browser runtime guard.
- `utils/classnames.js`: tiny className combiner.
- `utils/time.js`: basic time helper.
- `constants/media.js`: media limits shared by upload/record/trim flows.
- `config/runtime.js`: normalized client runtime config from `window.__FORUM_CONF__`.
- `storage/localStorage.js`: safe localStorage wrappers.
- `api/http.js`: minimal shared JSON request helper.
- `telemetry/diag.js`: telemetry payload base helper.

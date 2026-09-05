# Feed Domain (Phase 03)

Extracted from `Forum.jsx` in this phase:

- `utils/signatures.js`
  - `sigTopic(topic)`
  - `sigPost(post)`
- `services/rateLimiter.js`
  - `createFeedRateLimiter({ minIntervalMs, reactsPerMinute })`

These modules now own feed dedupe signatures and action throttling primitives.

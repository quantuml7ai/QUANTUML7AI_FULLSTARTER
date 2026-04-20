const DEFAULT_TTL_MS = 30000;
const DEFAULT_MAX_EVENTS = 64;

export function createRingBuffer(limit = DEFAULT_MAX_EVENTS) {
  const max = Math.max(8, Number(limit || DEFAULT_MAX_EVENTS));
  const items = [];

  return {
    push(value) {
      items.push(value);
      while (items.length > max) items.shift();
      return items.length;
    },
    snapshot() {
      return [...items];
    },
    clear() {
      items.length = 0;
    },
    size() {
      return items.length;
    },
  };
}

export function createForensicController({
  ttlMs = DEFAULT_TTL_MS,
  maxEvents = DEFAULT_MAX_EVENTS,
  now = () => Date.now(),
} = {}) {
  const buffer = createRingBuffer(maxEvents);
  const state = {
    active: false,
    activatedAt: 0,
    expiresAt: 0,
    trigger: 'disabled',
  };

  function deactivate(reason = 'manual') {
    state.active = false;
    state.expiresAt = 0;
    state.trigger = reason;
    buffer.clear();
  }

  return {
    activate({ trigger = 'manual', allow = false } = {}) {
      if (!allow) return false;
      state.active = true;
      state.activatedAt = now();
      state.expiresAt = state.activatedAt + Math.max(5000, Number(ttlMs || DEFAULT_TTL_MS));
      state.trigger = trigger;
      return true;
    },
    capture(event) {
      if (!state.active) return false;
      if (now() >= state.expiresAt) {
        deactivate('ttl-expired');
        return false;
      }
      buffer.push({
        at: now(),
        event,
      });
      return true;
    },
    deactivate,
    snapshot() {
      return {
        active: state.active,
        activatedAt: state.activatedAt,
        expiresAt: state.expiresAt,
        trigger: state.trigger,
        events: buffer.snapshot(),
      };
    },
  };
}

function getGlobalStore() {
  if (typeof window === 'undefined') return null;
  if (!window.__ql7RuntimeDebugStore) {
    window.__ql7RuntimeDebugStore = {
      journal: [],
      passports: [],
      maxEntries: 200,
    };
  }
  return window.__ql7RuntimeDebugStore;
}

export function createRuntimeDebugStore() {
  const localStore = {
    journal: [],
    passports: [],
    maxEntries: 200,
  };
  const target = getGlobalStore() || localStore;

  const pushBounded = (bucket, payload) => {
    bucket.push(payload);
    while (bucket.length > target.maxEntries) bucket.shift();
  };

  return {
    recordEvent(event, payload = {}) {
      pushBounded(target.journal, {
        ts: Date.now(),
        event: String(event || 'unknown'),
        payload,
      });
      return target.journal.slice();
    },
    recordPassport(passport) {
      pushBounded(target.passports, {
        ts: Date.now(),
        passport,
      });
      return target.passports.slice();
    },
    snapshot() {
      return {
        journal: target.journal.slice(),
        passports: target.passports.slice(),
      };
    },
    clear() {
      target.journal = [];
      target.passports = [];
      return target;
    },
  };
}

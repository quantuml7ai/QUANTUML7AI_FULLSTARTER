export function createBudgetViolationReporter() {
  const violations = [];
  return {
    report(input) {
      const row = {
        ts: Date.now(),
        runtimeId: String(input?.runtimeId || ''),
        route: String(input?.route || ''),
        profileId: String(input?.profileId || ''),
        owner: String(input?.owner || ''),
        violation: String(input?.violation || 'unknown'),
        exceeded: String(input?.exceeded || ''),
        expectedAction: String(input?.expectedAction || ''),
        actualAction: String(input?.actualAction || ''),
        meta: input?.meta && typeof input.meta === 'object' ? { ...input.meta } : {},
      };
      violations.push(row);
      while (violations.length > 400) violations.shift();
      return row;
    },
    list() {
      return violations.slice();
    },
    summarize() {
      return violations.reduce((acc, violation) => {
        acc.total += 1;
        acc.byViolation[violation.violation] = (acc.byViolation[violation.violation] || 0) + 1;
        return acc;
      }, {
        total: 0,
        byViolation: {},
      });
    },
  };
}

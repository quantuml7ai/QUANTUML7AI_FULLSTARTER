export function formatDiffReport(diff) {
  return Object.entries(diff)
    .map(([key, value]) => {
      if (typeof value !== 'object' || value == null) return `${key}: ${String(value)}`;
      if (Object.prototype.hasOwnProperty.call(value, 'delta')) {
        return `${key}: before=${value.before} after=${value.after} delta=${value.delta}`;
      }
      return `${key}: before=${value.before} after=${value.after}`;
    })
    .join('\n');
}

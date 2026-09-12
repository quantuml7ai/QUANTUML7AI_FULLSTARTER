export function buildDiagEvent(event, payload = {}, options = {}) {
  return {
    event: String(event || ''),
    payload: payload && typeof payload === 'object' ? payload : { value: payload },
    options: options && typeof options === 'object' ? options : {},
    ts: Date.now(),
  }
}

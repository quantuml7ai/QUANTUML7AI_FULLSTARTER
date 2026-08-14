export const shortId = (id) => (id ? `${String(id).slice(0, 6)}…${String(id).slice(-4)}` : '—')

export const human = (ts) => new Date(ts || Date.now()).toLocaleString()

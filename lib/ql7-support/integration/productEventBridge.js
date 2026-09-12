// Canonical integration boundary for product-domain -> QL7 Support events.
// Dynamic import intentionally breaks initialization cycles: product domains do not
// statically depend on the Support server/runtime graph. There is no alternate
// delivery implementation here; every call delegates to the single events owner.
async function eventsOwner(){ return import('../events.js') }
export async function notifyQl7AdsActivated(payload={}){ const m=await eventsOwner(); return m.notifyQl7AdsActivated(payload) }
export async function notifyQl7VipActivated(payload={}){ const m=await eventsOwner(); return m.notifyQl7VipActivated(payload) }

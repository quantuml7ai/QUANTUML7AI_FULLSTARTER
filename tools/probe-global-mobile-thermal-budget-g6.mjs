class FakeElement {
  constructor() {
    this.dataset = { ql7VisualScope: 'card', ql7RenderManaged: '1' }
    this.isConnected = true
    this.parentElement = null
  }
  closest() { return null }
  removeAttribute(name) {
    if (name === 'data-ql7-motion-mode') delete this.dataset.ql7MotionMode
  }
}

globalThis.Element = FakeElement

class FakeIntersectionObserver {
  static instances = []
  constructor(callback, options) {
    this.callback = callback
    this.options = options
    this.targets = new Set()
    FakeIntersectionObserver.instances.push(this)
  }
  observe(node) { this.targets.add(node) }
  unobserve(node) { this.targets.delete(node) }
  disconnect() { this.targets.clear() }
  emit(node, isIntersecting) {
    this.callback([{ target: node, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }])
  }
}

globalThis.IntersectionObserver = FakeIntersectionObserver
globalThis.document = {
  visibilityState: 'visible',
  documentElement: { removeAttribute() {}, toggleAttribute() {} },
}
globalThis.window = {
  setInterval() { return 1 },
  clearInterval() {},
  matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} } },
}

const runtime = await import('../lib/visual-runtime/visualActivityRegistry.js')
const node = new FakeElement()
const dispose = runtime.registerVisualScope(node, {
  kind: 'card', marginProfile: 'near100', renderManaged: true, publishState: false, initialNear: true,
})

if (FakeIntersectionObserver.instances.length !== 1) throw new Error(`expected 1 managed observer, got ${FakeIntersectionObserver.instances.length}`)
const motion = FakeIntersectionObserver.instances[0]
if (motion.options.rootMargin !== '160px 96px 160px 96px') throw new Error(`unexpected managed motion margin ${motion.options.rootMargin}`)
if (node.dataset.ql7RenderMode !== undefined) throw new Error('legacy render mode was published')
if (node.dataset.ql7MotionMode !== 'paused') throw new Error('managed scope must start fail-closed')
motion.emit(node, true)
if (node.dataset.ql7MotionMode !== 'hot') throw new Error('near managed scope did not become hot')
motion.emit(node, false)
await new Promise((resolve) => setTimeout(resolve, 100))
if (node.dataset.ql7MotionMode !== 'paused') throw new Error('offscreen managed scope did not pause')
const snapshot = runtime.getVisualActivitySnapshot()
if (snapshot.scopes.motionModes.paused !== 1) throw new Error('PAUSED snapshot mismatch')
if (snapshot.runtimeCostGuards.motionModeWrites < 3) throw new Error('motion writes missing')
dispose()
runtime.teardownVisualActivityRegistry()
console.log(JSON.stringify({ ok: true, motionMargin: motion.options.rootMargin, motionModeWrites: snapshot.runtimeCostGuards.motionModeWrites, observerPools: snapshot.observers.pools, observerTargets: snapshot.observers.targets }, null, 2))

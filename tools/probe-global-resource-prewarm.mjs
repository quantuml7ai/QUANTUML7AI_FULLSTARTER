const observers = []
let mutationObserverInstance = null

class FakeElement {
  constructor() {
    this.attrs = new Map()
    this.isConnected = true
    this.listeners = new Map()
  }
  getAttribute(name) { return this.attrs.get(name) || '' }
  setAttribute(name, value) { this.attrs.set(name, String(value)) }
  matches(selector) {
    if (selector === 'img,video[poster]') return this instanceof FakeImage || (this instanceof FakeVideo && !!this.getAttribute('poster'))
    return false
  }
  querySelectorAll() { return [] }
  addEventListener(name, fn) { this.listeners.set(name, fn) }
}

class FakeImage extends FakeElement {
  constructor() {
    super()
    this.loading = 'lazy'
    this.fetchPriority = ''
    this.crossOrigin = ''
    this.referrerPolicy = ''
    this.complete = false
    this.naturalWidth = 0
    this.srcset = ''
    this.sizes = ''
    this.decoding = ''
    this.onload = null
    this.onerror = null
    this.decodeCalls = 0
    this._src = ''
  }
  set src(value) {
    this._src = String(value || '')
    this.attrs.set('src', this._src)
    if (this.__target) return
    queueMicrotask(() => {
      this.complete = true
      this.naturalWidth = 640
      this.onload?.()
    })
  }
  get src() { return this._src }
  decode() { this.decodeCalls += 1; return Promise.resolve() }
}

class FakeVideo extends FakeElement {
  constructor(poster) {
    super()
    this.crossOrigin = ''
    this.referrerPolicy = 'no-referrer'
    this.setAttribute('poster', poster)
  }
}

class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
    this.nodes = new Set()
    observers.push(this)
  }
  observe(node) { this.nodes.add(node) }
  unobserve(node) { this.nodes.delete(node) }
  disconnect() { this.nodes.clear() }
  trigger(node, isIntersecting = true) {
    this.callback([{ target: node, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }])
  }
}

class FakeMutationObserver {
  constructor(callback) { this.callback = callback; mutationObserverInstance = this }
  observe() {}
  disconnect() {}
}

const target = new FakeImage()
target.__target = true
target.src = 'https://cdn.example.test/post.webp'
target.loading = 'lazy'
const video = new FakeVideo('https://cdn.example.test/poster.jpg')

const docListeners = new Map()
globalThis.Element = FakeElement
globalThis.HTMLImageElement = FakeImage
globalThis.HTMLVideoElement = FakeVideo
globalThis.Image = FakeImage
globalThis.IntersectionObserver = FakeIntersectionObserver
globalThis.MutationObserver = FakeMutationObserver
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { connection: { effectiveType: '4g', saveData: false }, deviceMemory: 6 } })
globalThis.document = {
  baseURI: 'https://quantuml7ai.test/',
  visibilityState: 'visible',
  documentElement: new FakeElement(),
  querySelectorAll(selector) { return selector === 'img,video[poster]' ? [target, video] : [] },
  addEventListener(name, fn) { docListeners.set(name, fn) },
  removeEventListener(name) { docListeners.delete(name) },
}
globalThis.window = {
  innerWidth: 390,
  innerHeight: 844,
  location: { href: 'https://quantuml7ai.test/forum' },
  matchMedia: () => ({ matches: true }),
  addEventListener() {},
  removeEventListener() {},
}

const mod = await import('../lib/resource-prewarm/resourcePrewarmRuntime.js')
const uninstall = mod.installGlobalResourcePrewarmRuntime()
if (observers.length !== 2) throw new Error(`expected 2 observers, got ${observers.length}`)
const [prewarm, near] = observers
if (!String(prewarm.options.rootMargin).includes('1730px')) throw new Error(`unexpected prewarm margin ${prewarm.options.rootMargin}`)
if (!String(prewarm.options.rootMargin).includes('858px')) throw new Error(`horizontal runway missing ${prewarm.options.rootMargin}`)

prewarm.trigger(target, true)
prewarm.trigger(video, true)
await new Promise((resolve) => setTimeout(resolve, 0))
let snap = mod.getResourcePrewarmSnapshot()
if (snap.counters.started !== 2 || snap.counters.loaded !== 2) throw new Error(`prewarm did not load both resources: ${JSON.stringify(snap)}`)
if (target.loading !== 'lazy') throw new Error('far prewarm mutated target loading before near boundary')

// Simulate the browser having the compressed resource cached by the far preloader.
target.complete = true
target.naturalWidth = 640
near.trigger(target, true)
await new Promise((resolve) => setTimeout(resolve, 0))
const targetState = mod.getResourcePrewarmFor(target)
if (target.loading !== 'eager') throw new Error('near boundary did not promote native lazy image')
if (!targetState?.decoded || target.decodeCalls < 1) throw new Error(`near decode did not complete: ${JSON.stringify(targetState)}`)

snap = mod.getResourcePrewarmSnapshot()
const beforeNoopRefresh = {
  queueAccepted: snap.counters.queueAccepted,
  decoded: snap.counters.decoded,
  decodeCalls: target.decodeCalls,
}
if (!mutationObserverInstance) throw new Error('mutation observer did not install')
const sameSrcMutation = [{ type: 'attributes', target, addedNodes: [], removedNodes: [] }]
mutationObserverInstance.callback(sameSrcMutation)
mutationObserverInstance.callback(sameSrcMutation)
mutationObserverInstance.callback(sameSrcMutation)
await new Promise((resolve) => setTimeout(resolve, 0))
snap = mod.getResourcePrewarmSnapshot()
if (snap.counters.noopRefreshSkips < 1) throw new Error(`same-source mutation was not skipped: ${JSON.stringify(snap)}`)
if (snap.counters.mutationCoalescedBatches < 2) throw new Error(`mutation batches were not coalesced: ${JSON.stringify(snap)}`)
if (snap.counters.queueAccepted !== beforeNoopRefresh.queueAccepted) throw new Error('same-source mutation requeued network prewarm')
if (target.decodeCalls !== beforeNoopRefresh.decodeCalls) throw new Error('same-source mutation repeated image decode')

const result = {
  ok: true,
  policy: snap.policy,
  counters: snap.counters,
  target: targetState,
  prewarmMargin: prewarm.options.rootMargin,
  nearMargin: near.options.rootMargin,
}
console.log(JSON.stringify(result, null, 2))
uninstall()

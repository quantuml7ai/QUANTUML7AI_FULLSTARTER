// app/api/forum/_bus.js
// Процессная шина для API-роутов (работает на сервере, без window)
class Bus {
  constructor() { this.listeners = new Set() }
  on(fn) { this.listeners.add(fn); return () => this.off(fn) }
  off(fn) { this.listeners.delete(fn) }
  once(fn) {
    const wrap = (evt) => { this.off(wrap); try { fn(evt) } catch {} }
    return this.on(wrap)
  }
  emit(evt) {
    for (const fn of Array.from(this.listeners)) { try { fn(evt) } catch {} }
  }
  // неблокирующая публикация — отправим в микротаску (не держит критический путь API)
  emitAsync(evt) { queueMicrotask(() => this.emit(evt)) }
  get size() { return this.listeners.size }
  clear() { this.listeners.clear() }
}
// Один экземпляр на процесс (через globalThis)
const __KEY__ = '__forumApiBus__'
export const bus = (globalThis[__KEY__] ??= new Bus())
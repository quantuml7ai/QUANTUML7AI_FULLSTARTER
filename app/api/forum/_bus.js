// app/api/forum/_bus.js
// Процессная шина для API-роутов (работает на сервере, без window)
class Bus {
  constructor() { this.listeners = new Set() }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  emit(evt) { for (const fn of Array.from(this.listeners)) { try { fn(evt) } catch {} } }
}
// Один экземпляр на процесс (через globalThis)
export const bus = (globalThis.__forumApiBus__ ||= new Bus())

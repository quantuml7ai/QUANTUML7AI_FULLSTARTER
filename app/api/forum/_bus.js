// app/api/forum/_bus.js
// Процессная шина для API-роутов (работает на сервере, без window)

class Bus {
  constructor() {
    /** @type {Set<Function>} */
    this.listeners = new Set()
  }

  /**
   * Подписка на событие.
   * @param {(evt:any)=>void} fn
   * @returns {() => void} функция отписки
   */
  on(fn) {
    if (typeof fn !== 'function') return () => {}
    this.listeners.add(fn)
    return () => this.off(fn)
  }

  /**
   * Одноразовая подписка.
   * @param {(evt:any)=>void} fn
   */
  once(fn) {
    if (typeof fn !== 'function') return () => {}
    const off = this.on((evt) => {
      try { fn(evt) } finally { off() }
    })
    return off
  }

  /**
   * Отписка.
   * @param {(evt:any)=>void} fn
   */
  off(fn) {
    try { this.listeners.delete(fn) } catch {}
  }

  /**
   * Рассылка события всем подписчикам.
   * @param {any} evt
   */
  emit(evt) {
    // копия множества на момент рассылки — безопасно при модификациях в обработчиках
    for (const fn of Array.from(this.listeners)) {
      try { fn(evt) } catch { /* no-op */ }
    }
  }

  /** Очистить всех слушателей (на всякий случай для тестов/перезапусков) */
  clear() {
    this.listeners.clear()
  }

  /** Текущее число подписчиков */
  get size() {
    return this.listeners.size
  }
}

// Один экземпляр на процесс/инстанс (Edge/Node) через глобал
const KEY = '__forumApiBus__'
export const bus = (globalThis.__forumApiBus__ ||= new Bus())
// Стабильный идентификатор процесса/инстанса — нужен для дедупликации событий из Redis
export const instanceId =
  (globalThis.__forumInstanceId__ ||= `${process.pid || 0}-${Math.random().toString(36).slice(2)}`)
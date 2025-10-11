// app/forum/events/bus.js
// Лёгкая клиентская «шина» событий для форума.
// Безопасна к вызову из любого места: если обработчиков нет — ошибок не будет.
// Согласована с серверным SSE-хабом: ожидает объекты формата { type, ... }.

// Единое имя пользовательского события в браузере
const EVT_NAME = 'forum-broadcast'

// Получить (или создать) единый EventTarget на окне
function getTarget() {
  if (typeof window === 'undefined') return null
  const w = window
  // храним один экземпляр EventTarget на странице
  w.__forumLocalBus__ ||= new EventTarget()
  return w.__forumLocalBus__
}

/**
 * Отправить событие по локальной шине (в пределах вкладки)
 * @param {any} evt
 */
export function broadcast(evt) {
  try {
    const t = getTarget()
    if (!t) return
    t.dispatchEvent(new CustomEvent(EVT_NAME, { detail: evt }))
  } catch {
    /* no-op */
  }
}

/**
 * Подписаться на события шины.
 * @param {(evt:any)=>void} handler
 * @returns {() => void} функция отписки
 */
export function on(handler) {
  try {
    const t = getTarget()
    if (!t || typeof handler !== 'function') return () => {}
    const wrapped = (e) => {
      try { handler(e?.detail) } catch { /* no-op */ }
    }
    t.addEventListener(EVT_NAME, wrapped)
    return () => {
      try { t.removeEventListener(EVT_NAME, wrapped) } catch { /* no-op */ }
    }
  } catch {
    return () => {}
  }
}

/**
 * Одноразовая подписка (после первого события автоматически отпишется).
 * @param {(evt:any)=>void} handler
 * @returns {() => void} функция «ручной» отписки (если нужно)
 */
export function once(handler) {
  try {
    const t = getTarget()
    if (!t || typeof handler !== 'function') return () => {}
    const wrapped = (e) => {
      try { handler(e?.detail) } finally {
        try { t.removeEventListener(EVT_NAME, wrapped) } catch { /* no-op */ }
      }
    }
    t.addEventListener(EVT_NAME, wrapped)
    return () => {
      try { t.removeEventListener(EVT_NAME, wrapped) } catch { /* no-op */ }
    }
  } catch {
    return () => {}
  }
}

/**
 * Совместимый алиас: forumBroadcast({...})
 * (чтобы старые места кода не падали)
 */
export const forumBroadcast = broadcast

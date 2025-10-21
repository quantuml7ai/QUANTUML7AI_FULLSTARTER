// app/forum/events/bus.js
// Клиентская шина событий форума: локально (EventTarget) + межвкладочно (BroadcastChannel).
// Единый формат события: { type, rev?, ts?, ...payload }
// Экспортируем безопасные утилиты: broadcast, onBroadcast, offBroadcast, onceBroadcast.

const EVT = 'forum-broadcast';

// --- локальная цель (на окно) ---
function getLocalTarget() {
  if (typeof window === 'undefined') return null;
  const w = window;
  if (!w.__forumLocalBus__) w.__forumLocalBus__ = new EventTarget();
  return w.__forumLocalBus__;
}

// --- кросс-вкладочный канал ---
function getChannel() {
  if (typeof window === 'undefined') return null;
  const w = window;
  if (w.__forumBC__ !== undefined) return w.__forumBC__;
  try {
    w.__forumBC__ = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('forum-bus')
      : null;
  } catch {
    w.__forumBC__ = null;
  }
  return w.__forumBC__;
}

// Один раз «мостим» канал в локальную цель, чтобы все вкладки получали событие одинаково
function ensureChannelBridge() {
  if (typeof window === 'undefined') return;
  const w = window;
  if (w.__forumBCBridgeReady__) return;
  const ch = getChannel();
  const tgt = getLocalTarget();
  if (ch && tgt) {
    try {
      ch.addEventListener('message', (e) => {
        try {
          const msg = e?.data;
          // Дублируем в локальный EventTarget тем же именем события
          tgt.dispatchEvent(new CustomEvent(EVT, { detail: msg }));
        } catch { /* no-op */ }
      });
      w.__forumBCBridgeReady__ = true;
    } catch { /* no-op */ }
  } else {
    w.__forumBCBridgeReady__ = true; // помечаем, чтобы не пытаться повторять
  }
}

// Публикация события: локально и в канал (если есть)
export function broadcast(evt) {
  try {
    if (typeof window === 'undefined') return;
    const tgt = getLocalTarget();
    ensureChannelBridge();
    // Нормализуем полезную нагрузку
    const e = (evt && typeof evt === 'object') ? evt : { message: String(evt || '') };
    if (e.ts == null) e.ts = Date.now();
    // Локальная доставка
    if (tgt) {
      try { tgt.dispatchEvent(new CustomEvent(EVT, { detail: e })); } catch { /* no-op */ }
    }
    // Межвкладочная доставка
    const ch = getChannel();
    if (ch) {
      try { ch.postMessage(e); } catch { /* no-op */ }
    }
  } catch { /* no-op */ }
}

// Подписка на события. Возвращает функцию отписки.
export function onBroadcast(handler) {
  if (typeof window === 'undefined') return () => {};
  const tgt = getLocalTarget();
  ensureChannelBridge();
  const fn = (evt) => {
    try { handler(evt?.detail); } catch { /* no-op */ }
  };
  try { tgt.addEventListener(EVT, fn); } catch { /* no-op */ }
  return () => {
    try { tgt.removeEventListener(EVT, fn); } catch { /* no-op */ }
  };
}

// Явная отписка (если нужен контроль над ссылкой на обработчик)
export function offBroadcast(handler) {
  if (typeof window === 'undefined') return;
  const tgt = getLocalTarget();
  // В DOM EventTarget нельзя снять по исходному колбэку без обёртки;
  // оставляем no-op для совместимости (используйте onBroadcast() → disposer()).
  // Сохраняем функцию для API-симметрии.
  void handler;
}

// Одноразовая подписка
export function onceBroadcast(handler) {
  if (typeof window === 'undefined') return () => {};
  const tgt = getLocalTarget();
  ensureChannelBridge();
  const fn = (evt) => {
    try { handler(evt?.detail); } catch { /* no-op */ }
    try { tgt.removeEventListener(EVT, fn); } catch { /* no-op */ }
  };
  try { tgt.addEventListener(EVT, fn, { once: true }); } catch { /* no-op */ }
  return () => {
    try { tgt.removeEventListener(EVT, fn); } catch { /* no-op */ }
  };
}

// Неблокирующая публикация (в микротаске)
export function broadcastAsync(evt) {
  try { queueMicrotask(() => broadcast(evt)); } catch { broadcast(evt); }
}

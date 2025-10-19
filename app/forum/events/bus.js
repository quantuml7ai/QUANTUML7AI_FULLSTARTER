// app/forum/events/bus.js
// Лёгкая «шина» для безопасного вызова broadcast на клиенте.
// Если где-то в коде вызовут forumBroadcast({...}) — ошибок не будет,
// даже если обработчиков нет.

export function broadcast(evt) {
  try {
    if (typeof window !== 'undefined') {
      const w = window;
      w.__forumLocalBus__ = w.__forumLocalBus__ || new EventTarget();
      w.__forumLocalBus__.dispatchEvent(
        new CustomEvent('forum-broadcast', { detail: evt })
      );
    }
  } catch {
    /* no-op */
  }
}

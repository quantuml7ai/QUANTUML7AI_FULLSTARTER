'use client'

/* =========================================================
   API (клиент)
========================================================= */

// === Auth helpers (cookie-only) ===
export function getForumUserId() {
  if (typeof window === 'undefined') return 'srv';
  const KEY = 'forum_user_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'web_' + (crypto?.randomUUID?.() || Date.now().toString(36));
    localStorage.setItem(KEY, id);
  }
  return id;
}

// --- Админ: cookie-only ---
export async function adminLogin(password) {
  try {
    const r = await fetch('/api/forum/admin/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: String(password || '') }),
    });
    const j = await r.json().catch(() => ({}));
    return j; // { ok: true } при успехе; cookie HttpOnly ставится сервером
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function adminLogout() {
  try {
    const r = await fetch('/api/forum/admin/verify', { method: 'DELETE' });
    const j = await r.json().catch(() => ({}));
    return j; // { ok: true }
  } catch {
    return { ok: false, error: 'network' };
  }
}

/** @deprecated Токены не используются. Оставлено как шина совместимости. */
function setAdminToken(token) {
  // если где-то старый код зовёт setAdminToken('пароль') — прокинем в cookie-логин
  try {
    const t = String(token || '').trim();
    if (t) adminLogin(t);
  } catch {}
}

/** @deprecated Токены не используются (cookie-only). */
function getAdminToken() {
  return '';
}

// Чтобы IDE не подсвечивала как «неиспользуемые» и было удобно дергать из консоли:
if (typeof window !== 'undefined') {
  // namespaced, чтобы не конфликтовать
  window.__forumAdmin = Object.freeze({
    login:  adminLogin,
    logout: adminLogout,
    setAdminToken,   // совместимость
    getAdminToken,   // всегда вернёт ''
  });
}


// ==== API (клиент) ====
export const api = {

  // Снимок базы: full или инкрементальный (since)
  async snapshot(q = {}) {
    try {
      const params = new URLSearchParams();
      if (q.b)     params.set('b',     String(q.b));
      if (q.rev)   params.set('rev',   String(q.rev));
      if (q.since) params.set('since', String(q.since));
      if (q.full)  params.set('full',  '1');
      const url = '/api/forum/snapshot' + (params.toString() ? `?${params}` : '');
      const r   = await fetch(url, { cache: 'no-store' });

      const raw = await r.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      const topics = Array.isArray(data?.topics) ? data.topics : [];
      const posts  = Array.isArray(data?.posts)  ? data.posts  : [];
      const events = Array.isArray(data?.events) ? data.events : [];      
      // server -> 'banned'; поддерживаем обратную совместимость с 'bans'
      const bans   = Array.isArray(data?.banned) ? data.banned
                    : Array.isArray(data?.bans)  ? data.bans : [];
      const rev    = Number.isFinite(+data?.rev) ? +data.rev   : 0;
      const cursor = data?.cursor ?? null;
      const full = !!data?.full

      const __reset = !!q.full;
      return { ok: r.ok, status: r.status, topics, posts, bans, rev, cursor, events, full, __reset };
    } catch {
      return { ok:false, error:'network', topics:[], posts:[], bans:[], rev:0, cursor:null, events:[], full:false, __reset:false };
    }
  },

  // Батч-мутации
  async mutate(batch, userId) {
    try {
      const actorId =
        userId ??
        batch?.userId ??
        batch?.accountId ??
        batch?.asherId ??
        (typeof getForumUserId === 'function' ? getForumUserId() : '');

      const headers = {
        'Content-Type': 'application/json',
        'x-forum-user-id': String(actorId || ''), // сервер читает через requireUserId
      };

      // (cookie-only) — НЕ прикладываем x-admin-token
      // оставлено намеренно пустым для совместимости

      const payload = {
        ops: Array.isArray(batch?.ops) ? batch.ops : [],
        userId: String(actorId || ''),
      };
      if (!payload.ops.length) return { ok: false, error: 'empty_ops' };

      const url = '/api/forum/mutate';
      const body = JSON.stringify(payload);
      const r = await fetch(url, { method: 'POST', headers, body });

      const text = await r.text().catch(() => '');
      let json = null; try { json = text ? JSON.parse(text) : null; } catch {}

      try {
        window.__lastMutate = () => ({
          url,
          req:{ headers, body },
          res:{ status:r.status, ok:r.ok, body: json ?? text }
        });
      } catch {}

      if (!r.ok) console.warn('mutate non-2xx', r.status, text, payload);
      return json ?? { ok: r.ok, status: r.status };
    } catch (e) {
      console.error('mutate error', e);
      return { ok: false, error: 'network' };
    }
  },

  // Удалить тему (со всем деревом)
  async adminDeleteTopic(id) {
    try {
      const r = await fetch('/api/forum/admin/deleteTopic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // cookie-only: не отправляем x-admin-token
        },
        body: JSON.stringify({ topicId: id }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  // Удалить пост (ветка удалится каскадно на сервере)
  async adminDeletePost(id) {
    try {
      const r = await fetch('/api/forum/admin/deletePost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // cookie-only: не отправляем x-admin-token
        },
        body: JSON.stringify({ postId: id }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  // Бан пользователя
  async adminBanUser(accountId) {
    try {
      const r = await fetch('/api/forum/admin/banUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // cookie-only: не отправляем x-admin-token
        },
        body: JSON.stringify({ accountId }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  // Снять бан
  async adminUnbanUser(accountId) {
    try {
      const r = await fetch('/api/forum/admin/unbanUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // cookie-only: не отправляем x-admin-token
        },
        body: JSON.stringify({ accountId }),
      });
      const data = await r.json().catch(() => ({}));
      return data;
    } catch {
      return { ok: false, error: 'network' };
    } 
 },
  // ===== OWNER API (владелец темы/поста) =====
  async ownerDeleteTopic(id, userId) {
    try {
      const r = await fetch('/api/forum/own', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forum-user-id': String(userId || '') },
        body: JSON.stringify({ action: 'delete_topic', topicId: String(id) }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },
  async ownerDeletePost(id, userId) {
    try {
      const r = await fetch('/api/forum/own', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forum-user-id': String(userId || '') },
        body: JSON.stringify({ action: 'delete_post', postId: String(id) }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },
  async ownerEditPost(id, text, userId) {
    try {
      const r = await fetch('/api/forum/own', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forum-user-id': String(userId || '') },
        body: JSON.stringify({ action: 'edit_post', postId: String(id), text: String(text || '') }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  // ===== SUBSCRIPTIONS (author subscribe) =====
  async subsList(viewerId) {
    try {
      const r = await fetch('/api/forum/subs/list', {
        method: 'GET',
        headers: { 'x-forum-user-id': String(viewerId || '') },
        cache: 'no-store',
      })
      return await r.json().catch(() => ({ ok: false, authors: [] }))
    } catch {
      return { ok: false, error: 'network', authors: [] }
    }
  },

  async subsToggle(viewerId, authorId) {
    try {
      const r = await fetch('/api/forum/subs/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forum-user-id': String(viewerId || ''),
        },
        cache: 'no-store',
        body: JSON.stringify({ authorId: String(authorId || '') }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  async subsMyCount(viewerId) {
    try {
      const r = await fetch('/api/forum/subs/my-count', {
        method: 'GET',
        headers: { 'x-forum-user-id': String(viewerId || '') },
        cache: 'no-store',
      })
      return await r.json().catch(() => ({ ok: false, count: 0 }))
    } catch {
      return { ok: false, error: 'network', count: 0 }
    }
  },

  async subsCount(authorId) {
    try {
      const params = new URLSearchParams({ authorId: String(authorId || '') })
      const r = await fetch('/api/forum/subs/count?' + params.toString(), { cache: 'no-store' })
      return await r.json().catch(() => ({ ok: false, count: 0 }))
    } catch {
      return { ok: false, error: 'network', count: 0 }
    }
  },

  // ===== VIP (batch) =====
  async vipBatch(ids) {
    try {
      const arr = Array.isArray(ids) ? ids : []
      const r = await fetch('/api/forum/vip/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ ids: arr }),
      })
      return await r.json().catch(() => ({ ok: false, map: {} }))
    } catch {
      return { ok: false, error: 'network', map: {} }
    }
  },  
  async profileBatch(ids) {
    try {
      const arr = Array.isArray(ids) ? ids : []
      const r = await fetch('/api/profile/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ ids: arr }),
      })
      return await r.json().catch(() => ({ ok: false, map: {}, aliases: {} }))
    } catch {
      return { ok: false, error: 'network', map: {}, aliases: {} }
    }
  },

  async reportPost({ postId, reason, userId }) {
    try {
      const r = await fetch('/api/forum/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forum-user-id': String(userId || ''),
        },
        cache: 'no-store',
        body: JSON.stringify({ postId: String(postId || ''), reason: String(reason || '') }),
      })
      const data = await r.json().catch(() => ({}))
      return data || { ok: r.ok, status: r.status }
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  async mediaLock({ userId }) {
    try {
      const r = await fetch('/api/forum/mediaLock', {
        method: 'GET',
        headers: { 'x-forum-user-id': String(userId || '') },
        cache: 'no-store',
      })
      return await r.json().catch(() => ({ ok: false, locked: false, untilMs: 0 }))
    } catch {
      return { ok: false, error: 'network', locked: false, untilMs: 0 }
    }
  },
};

export default api

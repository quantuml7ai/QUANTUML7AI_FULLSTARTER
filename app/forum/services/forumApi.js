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

// QL7_GEO888_STAGE1A_EXPLICIT_RANDOM_I18N_SORT_FIX_V14A
const QL7_FORUM_FEED_SORT_VALUES = new Set(['random', 'new', 'top', 'likes', 'reactions', 'views', 'replies'])
const QL7_FORUM_FEED_SORT_EXPLICIT_KEY = 'ql7_forum_feed_sort_explicit_v14a'
const QL7_FORUM_GEO_MODE_STORAGE_KEYS = ['ql7_forum_geo_mode', 'ql7_forum_geo_feed_mode']
const QL7_FORUM_SORT_STORAGE_KEYS = ['ql7_forum_feed_sort', QL7_FORUM_FEED_SORT_EXPLICIT_KEY]
let ql7ForumRuntimePreferencesBootstrapped = false
let ql7ForumRuntimeFeedSeed = ''

function bootstrapForumFeedRuntimeDefaults() {
  if (typeof window === 'undefined') return
  if (ql7ForumRuntimePreferencesBootstrapped) return
  ql7ForumRuntimePreferencesBootstrapped = true
  try {
    const mode = String(window.__ql7ForumGeoFeedMode || '').trim().toLowerCase()
    window.__ql7ForumGeoFeedMode = mode === 'world' ? 'world' : 'geo'
  } catch {}
  try {
    const rawSort = String(window.__ql7ForumFeedSort || '').trim().toLowerCase()
    const explicit = String(window.__ql7ForumFeedSortExplicit || '').trim() === '1'
    window.__ql7ForumFeedSort = explicit && QL7_FORUM_FEED_SORT_VALUES.has(rawSort) ? rawSort : 'random'
    window.__ql7ForumFeedSortExplicit = explicit && QL7_FORUM_FEED_SORT_VALUES.has(rawSort) ? '1' : ''
  } catch {}
  try {
    const stores = [window.localStorage, window.sessionStorage].filter(Boolean)
    stores.forEach((store) => {
      ;[...QL7_FORUM_GEO_MODE_STORAGE_KEYS, ...QL7_FORUM_SORT_STORAGE_KEYS].forEach((key) => {
        try { store.removeItem(key) } catch {}
      })
    })
  } catch {}
}

function readStoredForumValue(keys = []) {
  if (typeof window === 'undefined') return ''
  bootstrapForumFeedRuntimeDefaults()
  for (const key of keys) {
    try {
      const value = key === '__ql7ForumGeoFeedMode' || key === '__ql7ForumFeedSort'
        ? window[key]
        : ''
      const text = String(value || '').trim()
      if (text) return text
    } catch {}
  }
  return ''
}

function readForumGeoFeedModePreference() {
  try {
    const raw = readStoredForumValue([
      '__ql7ForumGeoFeedMode',
      'ql7_forum_geo_mode',
      'ql7_forum_geo_feed_mode',
    ]).toLowerCase()
    return raw === 'world' ? 'world' : 'geo'
  } catch {
    return 'geo'
  }
}

function hasExplicitForumFeedSortPreference() {
  if (typeof window === 'undefined') return false
  bootstrapForumFeedRuntimeDefaults()
  try {
    return String(window.__ql7ForumFeedSortExplicit || '').trim() === '1'
  } catch { return false }
}

function migrateLegacyForumFeedSortPreference() {
  if (typeof window === 'undefined') return 'random'
  bootstrapForumFeedRuntimeDefaults()
  try {
    const explicit = hasExplicitForumFeedSortPreference()
    const raw = String(window.__ql7ForumFeedSort || '').trim().toLowerCase()
    if (!explicit && raw && raw !== 'random') {
      window.__ql7ForumFeedSort = 'random'
      return 'random'
    }
    if (!raw) {
      window.__ql7ForumFeedSort = 'random'
      return 'random'
    }
    return QL7_FORUM_FEED_SORT_VALUES.has(raw) ? raw : 'random'
  } catch { return 'random' }
}

function readForumFeedSortPreference(fallback = 'random') {
  try {
    const raw = readStoredForumValue([
      '__ql7ForumFeedSort',
      'ql7_forum_feed_sort',
    ]).toLowerCase()
    if (hasExplicitForumFeedSortPreference() && QL7_FORUM_FEED_SORT_VALUES.has(raw)) return raw
    const migrated = migrateLegacyForumFeedSortPreference()
    if (QL7_FORUM_FEED_SORT_VALUES.has(migrated)) return migrated
  } catch {}
  const next = String(fallback || 'random').trim().toLowerCase()
  return QL7_FORUM_FEED_SORT_VALUES.has(next) ? next : 'random'
}

function normalizeForumUserBranchSort(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'reactions') return 'likes'
  return raw && raw !== 'random' && QL7_FORUM_FEED_SORT_VALUES.has(raw) ? raw : 'new'
}

export function readForumActorId() {
  if (typeof window === 'undefined') return ''
  try {
    return String(
      window.__ASHER_ID__ ||
      window.__AUTH_ACCOUNT__ ||
      window.localStorage?.getItem('asherId') ||
      window.localStorage?.getItem('ql7_uid') ||
      window.localStorage?.getItem('account') ||
      window.localStorage?.getItem('wallet') ||
      '',
    ).trim()
  } catch {
    return ''
  }
}

function withForumActor(body = {}) {
  const actorId = readForumActorId()
  if (!actorId) return { body, headers: {} }
  return {
    body: {
      accountId: actorId,
      canonicalAccountId: actorId,
      ...body,
    },
    headers: {
      'x-forum-user-id': actorId,
      'x-auth-account-id': actorId,
    },
  }
}

async function serverForumGet(path, q = {}) {
  try {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(q && typeof q === 'object' ? q : {})) {
      if (value == null || value === '') continue
      params.set(key, String(value))
    }
    const url = path + (params.toString() ? `?${params}` : '')
    const r = await fetch(url, { cache: 'no-store' })
    const json = await r.json().catch(() => ({}))
    return { ok: !!json?.ok && r.ok, status: r.status, ...json }
  } catch {
    return { ok: false, error: 'network', status: 0 }
  }
}

async function serverForumPagePost(path, body = {}, headers = {}) {
  try {
    const r = await fetch(path, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body && typeof body === 'object' ? body : {}),
    })
    const json = await r.json().catch(() => ({}))
    return { ok: !!json?.ok && r.ok, status: r.status, ...json }
  } catch {
    return { ok: false, error: 'network', status: 0 }
  }
}


function sessionForumFeedSeed() {
  if (typeof window === 'undefined') return ''
  try {
    if (!ql7ForumRuntimeFeedSeed) ql7ForumRuntimeFeedSeed = String(Date.now()) + '-' + Math.random().toString(36).slice(2)
    return ql7ForumRuntimeFeedSeed
  } catch { return '' }
}

export function resetForumFeedSeed() {
  if (typeof window === 'undefined') return ''
  try {
    ql7ForumRuntimeFeedSeed = String(Date.now()) + '-' + Math.random().toString(36).slice(2)
    window.__ql7ForumFeedSort = 'random'
    window.__ql7ForumFeedSortExplicit = ''
    window.dispatchEvent(new CustomEvent('forum:server-feed-sort-change', {
      detail: { sort: 'random', explicit: false, reason: 'home_feed_refresh' },
    }))
    return ql7ForumRuntimeFeedSeed
  } catch {
    ql7ForumRuntimeFeedSeed = ''
    return ''
  }
}

export const api = {

  // Дешевая проверка текущей ревизии форума: один Redis GET forum:rev на сервере.
  async rev() {
    try {
      const r = await fetch('/api/forum/rev', { cache: 'no-store' })
      const json = await r.json().catch(() => ({}))
      return {
        ok: !!json?.ok && r.ok,
        rev: Number(json?.rev || 0) || 0,
      }
    } catch {
      return { ok: false, rev: 0, error: 'network' }
    }
  },

  // Снимок базы: full или инкрементальный (since)

  async feedPage(q = {}) {
    const body = q && typeof q === 'object' ? q : {}
    const actor = withForumActor({
      mode: readForumGeoFeedModePreference(),
      sort: readForumFeedSortPreference(body.sort || 'random'),
      randomSeed: body.randomSeed || body.seed || sessionForumFeedSeed(),
      ...body,
    })
    return serverForumPagePost('/api/forum/feed/page', actor.body, actor.headers)
  },

  async mediaFeedPage(q = {}) {
    const body = q && typeof q === 'object' ? q : {}
    const actor = withForumActor({
      mode: readForumGeoFeedModePreference(),
      sort: readForumFeedSortPreference(body.sort || 'random'),
      randomSeed: body.randomSeed || body.seed || sessionForumFeedSeed(),
      ...body,
    })
    return serverForumPagePost('/api/forum/media-feed/page', actor.body, actor.headers)
  },

  async topicsPage(q = {}) {
    return serverForumPagePost('/api/forum/topics/page', q)
  },

  async searchPage(q = {}) {
    return serverForumPagePost('/api/forum/search/page', q)
  },

  async threadLocate(q = {}) {
    return serverForumPagePost('/api/forum/thread/locate', q)
  },

  async threadPage(q = {}) {
    return serverForumPagePost('/api/forum/thread/page', q)
  },

  async inboxRepliesPage(q = {}) {
    const userId = String(q?.userId || q?.accountId || getForumUserId()).trim()
    return serverForumPagePost('/api/forum/inbox/replies/page', { ...q, userId }, { 'x-forum-user-id': userId })
  },

  async userPostsPage(q = {}) {
    const body = q && typeof q === 'object' ? q : {}
    return serverForumPagePost('/api/forum/user-posts/page', {
      ...body,
      sort: normalizeForumUserBranchSort(body.sort),
    })
  },

  async userTopicsPage(q = {}) {
    const body = q && typeof q === 'object' ? q : {}
    return serverForumPagePost('/api/forum/user-topics/page', {
      ...body,
      sort: normalizeForumUserBranchSort(body.sort),
    })
  },


  async postById(q = {}) {
    return serverForumGet('/api/forum/post-by-id', q)
  },

  async postChain(q = {}) {
    return serverForumGet('/api/forum/post-chain', q)
  },

  async postMeta(q = {}) {
    return serverForumGet('/api/forum/post-meta', q)
  },

  async postLocate(q = {}) {
    return serverForumGet('/api/forum/post-locate', q)
  },

  async snapshot(q = {}) {
    try {
      const params = new URLSearchParams();
      if (q.b)     params.set('b',     String(q.b));
      if (q.rev)   params.set('rev',   String(q.rev));
      if (q.since) params.set('since', String(q.since));
      if (q.full)  params.set('full',  '1');
      params.set('mode', String(q.mode || readForumGeoFeedModePreference()));
      if (q.sort) params.set('sort', String(q.sort));
      if (q.randomBucket != null) params.set('randomBucket', String(q.randomBucket));
      if (q.lang) params.set('lang', String(q.lang));
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
      const params = new URLSearchParams()
      if (viewerId) params.set('viewerId', String(viewerId || ''))
      const url = '/api/forum/subs/list' + (params.toString() ? '?' + params.toString() : '')
      const r = await fetch(url, {
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
        body: JSON.stringify({ viewerId: String(viewerId || ''), authorId: String(authorId || '') }),
      })
      return await r.json().catch(() => ({ ok: false }))
    } catch {
      return { ok: false, error: 'network' }
    }
  },
  async subsMyCount(viewerId) {
    try {
      const params = new URLSearchParams()
      if (viewerId) params.set('userId', String(viewerId || ''))
      const url = '/api/forum/subs/my-count' + (params.toString() ? '?' + params.toString() : '')
      const r = await fetch(url, {
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

  async subsPeople({ userId, mode = 'followers', q = '', limit = 50, cursor = '', signal } = {}) {
    const empty = {
      ok: false,
      error: 'network',
      users: [],
      counts: { followers: 0, following: 0 },
      totalCount: 0,
      hasMore: false,
      nextCursor: null,
    }
    try {
      const params = new URLSearchParams()
      params.set('userId', String(userId || ''))
      params.set('mode', mode === 'following' ? 'following' : 'followers')
      params.set('limit', String(limit || 50))
      if (q) params.set('q', String(q || ''))
      if (cursor) params.set('cursor', String(cursor || ''))
      const r = await fetch('/api/forum/subs/people?' + params.toString(), {
        method: 'GET',
        cache: 'no-store',
        signal,
      })
      return await r.json().catch(() => empty)
    } catch (err) {
      if (err?.name === 'AbortError') throw err
      return empty
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

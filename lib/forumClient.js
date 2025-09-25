// ###########################################################################
// lib/forumClient.js — prod-ready client for /api/forum/* и /api/news
// Совместим с Edge-роутами, строгая авторизация, credentials:'include'
// ###########################################################################

const DEF_TIMEOUT = 15000

function timeout(ms = DEF_TIMEOUT) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
}

async function fetchJSON(url, options = {}, ms = DEF_TIMEOUT) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  try {
    const res = await Promise.race([
      fetch(url, {
        ...options,
        headers,
        signal: ctrl.signal,
        credentials: 'include',
        cache: 'no-store',
      }),
      timeout(ms),
    ])

    const contentType = res?.headers?.get?.('content-type') || ''
    const isJSON = contentType.includes('application/json')

    if (!res || !res.ok) {
      let msg = `HTTP ${res?.status || 0}`
      let payload = null
      try { payload = isJSON ? await res.json() : null } catch {}
      const err = new Error(payload?.error || msg)
      err.status = res?.status || 0
      err.payload = payload || null
      throw err
    }

    return isJSON ? await res.json() : null
  } finally {
    clearTimeout(id)
  }
}

// ==========================
// Helpers
// ==========================
function q(params = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

// Централизованный классификатор ошибок для UI-тостов
export function classifyError(e) {
  const status = e?.status || 0
  const code = (e?.payload?.error || e?.message || '').toLowerCase()
  if (status === 401 || code.includes('auth_required')) return { kind: 'auth', messageKey: 'forum_err_auth' }
  if (status === 403) return { kind: 'forbidden', messageKey: 'forum_err_forbidden' }
  if (status === 429 || code.includes('slow_down')) return { kind: 'rate', messageKey: 'forum_err_rate' }
  if (status === 404) return { kind: 'notfound', messageKey: 'forum_err_notfound' }
  return { kind: 'generic', messageKey: 'forum_err_generic' }
}

// ==========================
// Forum API
// ==========================
export const ForumAPI = {
  // ---- auth/status
  async me() {
    return fetchJSON('/api/forum/me', { method: 'GET' })
  },

  // ---- topics
  async listTopics({ page = 1, limit = 25, sort = 'new', q: query } = {}) {
    return fetchJSON(`/api/forum/listTopics${q({ page, limit, sort, q: query })}`, { method: 'GET' })
  },

  async createTopic({ title, category = '', tags = [], text = '', allowLinks = false, user } = {}) {
    if (!title) throw new Error('title required')
    const body = { title, category, tags, text, allowLinks }
    if (user?.name) body.userName = String(user.name)
    return fetchJSON('/api/forum/createTopic', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  // ---- posts
  async listPosts({ topicId, page = 1, limit = 50, sort = 'new', q: search = '' } = {}) {
    if (!topicId) throw new Error('topicId required')
    return fetchJSON(`/api/forum/listPosts${q({ topicId, page, limit, sort, q: search })}`, { method: 'GET' })
  },

  // legacy alias (совместимость): наш /api/forum/posts ждёт topicId
  async listPostsLegacy({ topicId, page = 1, limit = 50, sort = 'new', q: search = '' } = {}) {
    if (!topicId) throw new Error('topicId required')
    return fetchJSON(`/api/forum/posts${q({ topicId, page, limit, sort, q: search })}`, { method: 'GET' })
  },

  async createPost({ topicId, text, parentId, user } = {}) {
    if (!topicId || !text) throw new Error('topicId & text required')
    const body = { topicId, text, ...(parentId ? { parentId } : {}) }
    if (user?.name) body.userName = String(user.name)
    return fetchJSON('/api/forum/createPost', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  // ---- reactions / report / view
  async react({ postId, emoji, remove = false } = {}) {
    if (!postId || !emoji) throw new Error('postId & emoji required')
    return fetchJSON('/api/forum/react', {
      method: 'POST',
      body: JSON.stringify({ target: 'post', id: postId, reaction: emoji, remove }),
    })
  },

  async report({ postId, reason } = {}) {
    if (!postId) throw new Error('postId required')
    return fetchJSON('/api/forum/report', {
      method: 'POST',
      body: JSON.stringify({ target: 'post', id: postId, reason }),
    })
  },

  // ВНИМАНИЕ: view по нашему контракту принимает только { topicId }
  async view({ topicId } = {}) {
    if (!topicId) throw new Error('topicId required')
    return fetchJSON('/api/forum/view', {
      method: 'POST',
      body: JSON.stringify({ topicId }),
    })
  },
}

// ==========================
// News API (как было)
// ==========================
export const NewsAPI = {
  async list({ page = 1, pageSize, source = 'all', sort = 'time' } = {}) {
    const size = Number(pageSize) || Number(process.env.NEXT_PUBLIC_NEWS_PAGE_SIZE || 50) || 50
    return fetchJSON(`/api/news${q({ page, pageSize: size, source, sort })}`, { method: 'GET' })
  },
}

// ==========================
// UI utils
// ==========================
export function fmtDate(ts) {
  try {
    const d = new Date(Number(ts))
    if (!Number.isFinite(d.getTime())) return ''
    return d.toLocaleString()
  } catch { return '' }
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

export function plural(n, one, few, many) {
  // RU/UK pluralization
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

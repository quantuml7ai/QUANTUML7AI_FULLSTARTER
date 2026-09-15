import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import forumIndexMaintenanceModule from '../../../lib/forum/forum-index-maintenance.cjs'

const forumIndexMaintenance = forumIndexMaintenanceModule?.default || forumIndexMaintenanceModule

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}
function getByPath(doc, path) {
  return String(path).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}
function setByPath(doc, path, value) {
  const parts = String(path).split('.')
  let cursor = doc
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) cursor[part] = {}
    cursor = cursor[part]
  }
  cursor[parts[parts.length - 1]] = value
}
function matches(doc, filter = {}) {
  return Object.entries(filter || {}).every(([key, expected]) => String(getByPath(doc, key)) === String(expected))
}
function createCollection(seed = []) {
  const rows = seed.map((row) => clone(row))
  return {
    rows,
    async findOne(filter = {}) { return rows.find((row) => matches(row, filter)) || null },
    async updateMany(filter = {}, update = {}) {
      let modifiedCount = 0
      for (const row of rows) {
        if (!matches(row, filter)) continue
        for (const [path, value] of Object.entries(update.$set || {})) setByPath(row, path, clone(value))
        modifiedCount += 1
      }
      return { matchedCount: modifiedCount, modifiedCount }
    },
    async deleteMany(filter = {}) {
      let deletedCount = 0
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (!matches(rows[index], filter)) continue
        rows.splice(index, 1)
        deletedCount += 1
      }
      return { deletedCount }
    },
  }
}
function createMemoryDb() {
  const collections = new Map()
  return {
    seed(name, rows) { collections.set(name, createCollection(rows)) },
    collection(name) {
      if (!collections.has(name)) collections.set(name, createCollection())
      return collections.get(name)
    },
  }
}

describe('forum post edit projection maintenance', () => {
  let memoryDb
  beforeEach(() => {
    memoryDb = createMemoryDb()
    forumIndexMaintenance.__setTestDb(memoryDb)
  })
  afterEach(() => { forumIndexMaintenance.__setTestDb(null) })

  test('propagates authoritative edited text into all materialized post projections without touching unrelated fields', async () => {
    const postId = '42'
    const oldText = 'old text'
    const newText = 'new edited text for every projection'
    const postShape = {
      id: postId,
      postId,
      topicId: '7',
      text: oldText,
      textSnippet: oldText,
      videoUrl: 'https://media.example.test/post.mp4',
      likes: 3,
      views: 9,
    }
    memoryDb.seed('forum_core_posts', [{ _id: `post:${postId}`, ...postShape, text: newText }])
    for (const name of [
      'forum_thread_index',
      'forum_user_post_index',
      'forum_search_index',
      'forum_geo_feed_index',
      'forum_media_feed_index',
      'forum_reply_inbox_index',
    ]) {
      memoryDb.seed(name, [{
        _id: `${name}:${postId}`,
        postId,
        topicId: '7',
        textSnippet: oldText,
        text: name === 'forum_search_index' ? { snippet: oldText, tokens: ['old'], qHash: 'oldhash' } : undefined,
        post: clone(postShape),
        counters: { likes: 3, views: 9 },
      }])
    }

    await expect(forumIndexMaintenance.maintainForumIndexesForPostEdited({ postId, text: newText }))
      .resolves.toMatchObject({ ok: true, postId })

    for (const name of [
      'forum_thread_index',
      'forum_user_post_index',
      'forum_search_index',
      'forum_geo_feed_index',
      'forum_media_feed_index',
      'forum_reply_inbox_index',
    ]) {
      const row = memoryDb.collection(name).rows[0]
      expect(row.post.text).toBe(newText)
      expect(row.post.textSnippet).toBe(newText)
      expect(row.textSnippet).toBe(newText)
      expect(row.counters).toEqual({ likes: 3, views: 9 })
      expect(row.topicId).toBe('7')
    }
    const searchRow = memoryDb.collection('forum_search_index').rows[0]
    expect(searchRow.text.snippet).toBe(newText)
    expect(searchRow.text.tokens).toEqual(expect.arrayContaining(['new', 'edited', 'text']))
    expect(searchRow.text.qHash).toMatch(/^[a-f0-9]{24}$/)
  })
})

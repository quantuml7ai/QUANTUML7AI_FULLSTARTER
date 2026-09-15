import { describe, expect, it } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

describe('forum post edit/delete convergence contracts', () => {
  it('keeps edit persistence in every materialized post projection', () => {
    const maintenance = readRepoFile('lib/forum/forum-index-maintenance.cjs')
    for (const required of [
      "'post.text': cleanText",
      "'post.textSnippet': cleanSnippet",
      "forum_thread_index').updateMany",
      "forum_user_post_index').updateMany",
      "forum_search_index').updateMany",
      "forum_geo_feed_index').updateMany",
      "forum_media_feed_index').updateMany",
      "forum_reply_inbox_index').updateMany",
    ]) expect(maintenance).toContain(required)
  })

  it('uses the Mongo change journal and existing rev endpoint instead of requiring forum SSE', () => {
    const primary = readRepoFile('lib/mongo/forum-primary.cjs')
    const revRoute = readRepoFile('app/api/forum/rev/route.js')
    const api = readRepoFile('app/forum/services/forumApi.js')
    const sync = readRepoFile('app/forum/features/feed/hooks/useForumSyncLoop.js')
    const sse = readRepoFile('app/forum/features/feed/hooks/useForumSseBridge.js')

    expect(primary).toContain('readPublicPostMutationChangesSince')
    expect(primary).toContain("kind: { $in: ['post_edit', 'post_deleted'] }")
    expect(revRoute).toContain('forumPrimary.readPublicPostMutationChangesSince({ sinceRev: since, limit })')
    expect(api).toContain("params.set('since', String(since))")
    expect(sync).toContain('const response = await api.rev({ since: cursor, limit: 128 })')
    expect(sync).toContain('applyAuthoritativeMutationEvents(response.events)')
    expect(sync).toContain('NEXT_PUBLIC_FORUM_MUTATION_DELTA_TICK_MS || 60_000')
    expect(sync).toContain('const mutationDeltaId = setInterval')
    expect(sync).toContain('if ((at - lastVisibleDeltaAt) < 5_000) return')
    expect(sync).toContain('try { runMutationDeltaTick() } catch {}')
    expect(sync).toContain("window.dispatchEvent(new CustomEvent('forum:authoritative-post-deleted'")
    expect(sse).toContain("String(process.env.NEXT_PUBLIC_FORUM_SSE_ENABLED || '').trim() === '1'")
    expect(sync).not.toContain("new EventSource('/api/forum/events/stream')")
  })

  it('never uses wall-clock milliseconds as the forum revision watermark', () => {
    const runtime = readRepoFile('app/forum/features/feed/hooks/useForumDataRuntime.js')
    const sync = readRepoFile('app/forum/features/feed/hooks/useForumSyncLoop.js')
    expect(runtime).toContain('const changeRevRef = React.useRef(0)')
    expect(runtime).not.toContain('Number(detail.rev || 0)')
    expect(runtime).not.toContain('Number(detail.rev || 0) || Date.now()')
    expect(sync).toContain('authoritativeRev: liveRev')
    expect(sync).toContain('rev: projectionRev > 0 ? projectionRev')
    expect(sync).toContain('contaminatedWatermark = sinceNow > 0 && liveRev > 0 && sinceNow > liveRev')
    expect(sync).toContain('const healed = await api.snapshot({ full: true })')
    expect(sync).toContain('applyFullSnapshotRef.current(')
    expect(sync).toContain('changeRevRef.current = healedRev')
    expect(sync).not.toContain('Number(sseHintRef.current || 0) || 0,\n        Date.now(),')
  })
it('atomically reconciles a newly created topic from optimistic cid to authoritative id', () => {
  const root = readRepoFile('app/forum/ForumRoot.jsx')
  const runtime = readRepoFile(
    'app/forum/features/feed/hooks/useForumDataRuntime.js',
  )
  const queue = readRepoFile(
    'app/forum/features/feed/hooks/useForumMutationQueue.js',
  )
  const createPost = readRepoFile(
    'app/forum/features/feed/hooks/useForumCreatePostAction.js',
  )
  const mutate = readRepoFile('app/api/forum/mutate/route.js')

  expect(root).toContain(
    'const topicReconcileRef = useRef(null)',
  )

  expect(root).toContain(
    'topicReconcileRef.current = ({ cid, topicId, topic }) => {',
  )

  expect(root).toContain(
    "if (String(prev?.id || '').trim() !== optimisticId) return prev",
  )

  expect(root).toContain(
    'lastTopicOpenDefaultSortIdRef.current = authoritativeId',
  )

  expect(runtime).toContain(
    'topicReconcileRef,',
  )

  expect(queue).toContain(
    'const topicAckByCid = new Map()',
  )

  expect(queue).toContain(
    'topicAckByCid.get(rawTopicId)',
  )

  expect(queue).toContain(
    'topicReconcileRef?.current?.({',
  )

  expect(queue).toContain(
    'return topicAck',
  )

  expect(createPost).toContain(
    "const selectedTopicCid = selectedTopicId.startsWith('tmp_t_')",
  )

  expect(createPost).toContain(
    '...(selectedTopicCid ? { topicCid: selectedTopicCid } : {}),',
  )

  expect(mutate).toContain(
    'topicCidMap.set(cidVal, mappedTopicId)',
  )

  expect(mutate).toContain(
    'await redisDirect.set(topicCidKey(cidVal), mappedTopicId, { ex: 86400 })',
  )

  expect(mutate).toContain(
    "if ((!topicId || topicId.startsWith('tmp_t_')) && topicCid)",
  )
})

  it('tombstones exact deleted ids and closes only a deleted open thread root', () => {
    const sync = readRepoFile('app/forum/features/feed/hooks/useForumSyncLoop.js')
    const threadOpen = readRepoFile('app/forum/features/feed/hooks/useThreadOpenNavigation.js')
    expect(sync).toContain('...Object.fromEntries(deletedIds.map((id) => [id, deletedAt]))')
    expect(threadOpen).toContain("window.addEventListener('forum:authoritative-post-deleted', onAuthoritativePostDeleted)")
    expect(threadOpen).toContain('if (!currentRootId || !deletedIds.has(currentRootId)) return')
    expect(threadOpen).toContain('threadOpenSeqRef.current += 1')
    expect(threadOpen).toContain('pendingThreadRootIdRef.current = null')
    expect(threadOpen).toContain('pendingThreadRootSeedRef.current = null')
    expect(threadOpen).toContain('pendingScrollToPostIdRef.current = null')
    expect(threadOpen).toContain('setThreadRoot(null)')
  })
})

import { describe, expect, it } from 'vitest'
import {
  dedupeDmDialogs,
  dialogMatchesUser,
  filterDmDialogsBySupportAvailability,
  loadDmDialogs,
  isRetryableDmThreadLoadResult,
  loadDmThread,
  resolveDmDialogPeerId,
  shouldAdoptDmThreadHistoryFrontier,
} from '../../../../../../app/forum/features/dm/utils/dmLoaders.js'

describe('dmLoaders dialog identity helpers', () => {
  it('deduplicates the same peer across raw and canonical dialog variants', () => {
    const dialogs = [
      {
        userId: 'raw-peer',
        lastMessage: {
          id: 'm-1',
          ts: 100,
          from: 'raw-peer',
          fromCanonical: 'canon-peer',
          to: 'me',
          toCanonical: 'me',
        },
      },
      {
        userId: 'canon-peer',
        lastMessage: {
          id: 'm-2',
          ts: 200,
          from: 'me',
          fromCanonical: 'me',
          to: 'canon-peer',
          toCanonical: 'canon-peer',
        },
      },
      {
        userId: 'other-peer',
        lastMessage: {
          id: 'm-3',
          ts: 150,
          from: 'other-peer',
          fromCanonical: 'other-peer',
          to: 'me',
          toCanonical: 'me',
        },
      },
    ]

    const result = dedupeDmDialogs(dialogs, 'me')

    expect(result).toHaveLength(2)
    expect(result[0].userId).toBe('canon-peer')
    expect(result[0].lastMessage.id).toBe('m-2')
    expect(result[1].userId).toBe('other-peer')
  })

  it('matches dialogs to the same peer through canonical message fields', () => {
    const dialog = {
      userId: 'raw-peer',
      lastMessage: {
        id: 'm-1',
        ts: 100,
        from: 'raw-peer',
        fromCanonical: 'canon-peer',
        to: 'me',
        toCanonical: 'me',
      },
    }

    expect(resolveDmDialogPeerId(dialog, 'me')).toBe('canon-peer')
    expect(dialogMatchesUser(dialog, 'canon-peer', 'me')).toBe(true)
    expect(dialogMatchesUser(dialog, 'other-peer', 'me')).toBe(false)
  })

  it('loads the dialog list without depending on thread-owner state', async () => {
    let dialogs = []
    let loaded = false
    const loadingRef = { current: false }

    await loadDmDialogs(null, {}, {
      meId: 'me',
      dmDialogsHasMore: true,
      dmDialogsLoadingRef: loadingRef,
      dmDialogsLastFetchRef: { current: {} },
      DM_BG_THROTTLE_MS: 0,
      DM_ACTIVE_THROTTLE_MS: 0,
      DM_PAGE_SIZE: 40,
      setDmDialogsLoading: () => {},
      dmFetchCachedFn: async () => ({
        ok: true,
        items: [{ userId: 'peer', lastMessage: { id: 'm-1', from: 'peer', to: 'me', ts: 100 } }],
        deletedDialogs: {},
        nextCursor: null,
        hasMore: false,
      }),
      dmDialogsCacheRef: { current: new Map() },
      dmDialogsInFlightRef: { current: new Map() },
      setDmDialogs: (updater) => { dialogs = updater(dialogs) },
      setDmDialogsCursor: () => {},
      setDmDialogsHasMore: () => {},
      setDmDialogsLoaded: (value) => { loaded = value },
      dmDeletedKey: '',
      setDmDeletedMap: () => {},
    })

    expect(dialogs).toHaveLength(1)
    expect(dialogs[0].userId).toBe('peer')
    expect(loaded).toBe(true)
    expect(loadingRef.current).toBe(false)
  })

  it('keeps an existing Support conversation in the DM list while Support is active', () => {
    const dialogs = [
      { userId: 'peer' },
      { userId: 'ql7-support', lastMessage: { id: 'support-reply', ts: 200 } },
    ]

    expect(filterDmDialogsBySupportAvailability(dialogs, true)).toEqual(dialogs)
    expect(filterDmDialogsBySupportAvailability(dialogs, false)).toEqual([{ userId: 'peer' }])
  })

  it('bypasses refresh throttling only when the open lifecycle explicitly requests it', async () => {
    const lastFetchRef = { current: new Map([['refresh:peer', Date.now()]]) }
    let fetches = 0
    const context = {
      meId: 'me',
      dmThreadLoadingRef: { current: false },
      dmThreadHasMoreRef: { current: true },
      dmThreadLastFetchRef: lastFetchRef,
      DM_ACTIVE_THROTTLE_MS: 30_000,
      DM_PAGE_SIZE: 40,
      setDmThreadLoading: () => {},
      dmFetchCachedFn: async () => {
        fetches += 1
        return { ok: true, items: [], nextCursor: null, hasMore: false, peerSeenTs: 0 }
      },
      dmThreadCacheRef: { current: new Map() },
      dmThreadInFlightRef: { current: new Map() },
      dmDeletedMsgMap: {},
      dmDeletedKey: '',
      setDmDeletedMap: () => {},
      setDmDialogs: () => {},
      setDmWithUserId: () => {},
      setDmThreadItems: () => {},
      setDmThreadCursor: () => {},
      setDmThreadHasMore: () => {},
      setDmThreadSeenTs: () => {},
      captureThreadOwner: () => ({ uid: 'peer' }),
      isThreadOwnerCurrent: () => true,
    }

    await loadDmThread('peer', null, { force: true, refresh: true }, context)
    expect(fetches).toBe(0)

    await loadDmThread('peer', null, {
      force: true,
      refresh: true,
      bypassThrottle: true,
    }, context)
    expect(fetches).toBe(1)
  })
})

describe('DM thread history frontier ownership', () => {
  it('classifies only recoverable thread failures for sentinel rearm', () => {
    expect(isRetryableDmThreadLoadResult({ ok: false, error: 'network' })).toBe(true)
    expect(isRetryableDmThreadLoadResult({ ok: false, error: 'timeout' })).toBe(true)
    expect(isRetryableDmThreadLoadResult({ ok: false, retryable: true })).toBe(true)
    expect(isRetryableDmThreadLoadResult({ ok: false, error: 'forbidden' })).toBe(false)
  })

  it('seeds a fresh peer session but keeps ordinary newest refresh away from the older-history frontier', () => {
    expect(shouldAdoptDmThreadHistoryFrontier({ resetHistory: true, refresh: true })).toBe(true)
    expect(shouldAdoptDmThreadHistoryFrontier({ refresh: true })).toBe(false)
    expect(shouldAdoptDmThreadHistoryFrontier({ requestCursor: 'older:cursor', refresh: false })).toBe(true)
  })

  it('marks older-page pagination as real UI loading while keeping ordinary newest refresh quiet', async () => {
    const loadingStates = []
    const loadingRef = { current: false }
    const makeContext = () => ({
      meId: 'me',
      dmThreadLoadingRef: loadingRef,
      dmThreadHasMoreRef: { current: true },
      dmThreadLastFetchRef: { current: new Map() },
      DM_ACTIVE_THROTTLE_MS: 0,
      DM_PAGE_SIZE: 40,
      setDmThreadLoading: (value) => loadingStates.push(value),
      dmFetchCachedFn: async () => ({ ok: true, items: [], nextCursor: null, hasMore: false, peerSeenTs: 0 }),
      dmThreadCacheRef: { current: new Map() },
      dmThreadInFlightRef: { current: new Map() },
      dmDeletedMsgMap: {},
      dmDeletedKey: '',
      setDmDeletedMap: () => {},
      setDmDialogs: () => {},
      setDmWithUserId: () => {},
      setDmThreadItems: () => {},
      setDmThreadCursor: () => {},
      setDmThreadHasMore: () => {},
      setDmThreadSeenTs: () => {},
      captureThreadOwner: () => ({ generation: 1, ownershipMatchesAtCapture: true }),
      isThreadOwnerCurrent: () => true,
    })

    await loadDmThread('peer', 'cursor-1', { force: true }, makeContext())
    expect(loadingStates).toEqual([true, false])

    loadingStates.length = 0
    await loadDmThread('peer', null, { force: true, refresh: true, bypassThrottle: true }, makeContext())
    expect(loadingStates).toEqual([])
  })

  it('lets explicit older-page pagination proceed when only a quiet newest refresh owns the generation lock', async () => {
    const loadingRef = { current: { ownerKey: `peer\u001f1`, kind: 'refresh' } }
    const loadingStates = []
    const cursorWrites = []
    const result = await loadDmThread('peer', 'cursor-1', { force: true }, {
      meId: 'me',
      dmThreadLoadingRef: loadingRef,
      dmThreadHasMoreRef: { current: true },
      dmThreadLastFetchRef: { current: new Map() },
      DM_ACTIVE_THROTTLE_MS: 0,
      DM_PAGE_SIZE: 40,
      setDmThreadLoading: (value) => loadingStates.push(value),
      dmFetchCachedFn: async () => ({ ok: true, items: [], nextCursor: null, hasMore: false, peerSeenTs: 0 }),
      dmThreadCacheRef: { current: new Map() },
      dmThreadInFlightRef: { current: new Map() },
      dmDeletedMsgMap: {},
      dmDeletedKey: '',
      setDmDeletedMap: () => {},
      setDmDialogs: () => {},
      setDmWithUserId: () => {},
      setDmThreadItems: () => {},
      setDmThreadCursor: (value) => cursorWrites.push(value),
      setDmThreadHasMore: () => {},
      setDmThreadSeenTs: () => {},
      captureThreadOwner: () => ({ generation: 1, ownershipMatchesAtCapture: true }),
      isThreadOwnerCurrent: () => true,
    })

    expect(result?.ok).toBe(true)
    expect(result?.frontierAdopted).toBe(true)
    expect(cursorWrites).toEqual([null])
    expect(loadingStates).toEqual([true, false])
    expect(loadingRef.current).toBe(false)
  })

  it('returns a retryable result instead of rejecting on a transient thread transport failure', async () => {
    const result = await loadDmThread('peer', 'cursor-1', { force: true }, {
      meId: 'me',
      dmThreadLoadingRef: { current: false },
      dmThreadHasMoreRef: { current: true },
      dmThreadLastFetchRef: { current: new Map() },
      DM_ACTIVE_THROTTLE_MS: 0,
      DM_PAGE_SIZE: 40,
      setDmThreadLoading: () => {},
      dmFetchCachedFn: async () => { throw new Error('socket closed') },
      dmThreadCacheRef: { current: new Map() },
      dmThreadInFlightRef: { current: new Map() },
      dmDeletedMsgMap: {},
      dmDeletedKey: '',
      setDmDeletedMap: () => {},
      setDmDialogs: () => {},
      setDmWithUserId: () => {},
      setDmThreadItems: () => {},
      setDmThreadCursor: () => {},
      setDmThreadHasMore: () => {},
      setDmThreadSeenTs: () => {},
      captureThreadOwner: () => ({ generation: 1, ownershipMatchesAtCapture: true }),
      isThreadOwnerCurrent: () => true,
    })

    expect(result).toEqual({ ok: false, error: 'network', retryable: true })
  })

  it('drops a late response from an old peer generation without unlocking the newer request', async () => {
    let currentGeneration = 1
    const loadingRef = { current: false }
    const writes = []
    const result = await loadDmThread('peer', null, { force: true, refresh: true, bypassThrottle: true, resetHistory: true }, {
      meId: 'me',
      dmThreadLoadingRef: loadingRef,
      dmThreadHasMoreRef: { current: true },
      dmThreadLastFetchRef: { current: new Map() },
      DM_ACTIVE_THROTTLE_MS: 0,
      DM_PAGE_SIZE: 40,
      setDmThreadLoading: (value) => writes.push(['loading', value]),
      dmFetchCachedFn: async () => {
        currentGeneration = 2
        loadingRef.current = `peer\u001f2`
        return { ok: true, items: [{ id: 'stale-message' }], nextCursor: 'stale-cursor', hasMore: true }
      },
      dmThreadCacheRef: { current: new Map() },
      dmThreadInFlightRef: { current: new Map() },
      dmDeletedMsgMap: {},
      dmDeletedKey: '',
      setDmDeletedMap: () => writes.push(['deleted']),
      setDmDialogs: () => writes.push(['dialogs']),
      setDmWithUserId: () => writes.push(['peer']),
      setDmThreadItems: () => writes.push(['items']),
      setDmThreadCursor: () => writes.push(['cursor']),
      setDmThreadHasMore: () => writes.push(['hasMore']),
      setDmThreadSeenTs: () => writes.push(['seen']),
      captureThreadOwner: () => ({ generation: 1, ownershipMatchesAtCapture: true }),
      isThreadOwnerCurrent: (token) => Number(token?.generation) === currentGeneration,
    })

    expect(result).toEqual({ ok: false, stale: true, error: 'dm_thread_owner_changed' })
    expect(loadingRef.current).toBe(`peer\u001f2`)
    expect(writes).toEqual([])
  })
})

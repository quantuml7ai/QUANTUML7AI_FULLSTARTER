import { describe, expect, it } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

describe('Forum inbox replies autoload contract', () => {
  it('attempts the automatic server load at most once per active user/sort key', () => {
    const runtime = readRepoFile('app/forum/features/dm/hooks/useForumDmRuntime.js')
    const effectStart = runtime.indexOf("const key = `${meId}:${postSort || 'new'}`")
    const effectEnd = runtime.indexOf('const activeRepliesSurface =', effectStart)

    expect(effectStart).toBeGreaterThan(-1)
    expect(effectEnd).toBeGreaterThan(effectStart)

    const effect = runtime.slice(effectStart, effectEnd)
    const guard = 'serverRepliesAutoAttemptKeyRef.current !== key'
    const guardedAttempt = 'serverRepliesAutoAttemptKeyRef.current = key'
    const missingLoad = "loadInboxRepliesPage({ reset: true, reason: 'open_missing' })"

    expect(runtime).toContain("const serverRepliesAutoAttemptKeyRef = useRef('')")
    expect(effect).toContain(guard)
    expect(effect).toContain(guardedAttempt)
    expect(effect).toContain(missingLoad)
    expect(effect.indexOf(guard)).toBeLessThan(effect.lastIndexOf(guardedAttempt))
    expect(effect.lastIndexOf(guardedAttempt)).toBeLessThan(effect.indexOf(missingLoad))
    expect(runtime).toContain("serverRepliesAutoAttemptKeyRef.current = ''")
  })

  it('keeps failed automatic loads unconfirmed so local replies remain the fallback', () => {
    const runtime = readRepoFile('app/forum/features/dm/hooks/useForumDmRuntime.js')
    const loaderStart = runtime.indexOf('const loadInboxRepliesPage = useCallback')
    const loaderEnd = runtime.indexOf('useEffect(() => {', loaderStart)

    expect(loaderStart).toBeGreaterThan(-1)
    expect(loaderEnd).toBeGreaterThan(loaderStart)

    const loader = runtime.slice(loaderStart, loaderEnd)

    expect(loader).toContain("if (!response?.ok) return response || { ok: false, error: 'inbox_replies_page_failed' }")
    expect(loader).toContain('setServerRepliesLoaded(true)')
    expect(loader).not.toContain('setServerRepliesLoaded(false)')
    expect(runtime).toContain('const repliesToMe = serverRepliesLoaded ? serverSortedRepliesToMe : localRepliesToMe')
    expect(runtime).toContain('const sortedRepliesToMe = serverRepliesLoaded ? serverSortedRepliesToMe : localSortedRepliesToMe')
  })
})

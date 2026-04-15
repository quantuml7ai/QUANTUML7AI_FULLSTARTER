import { describe, expect, it } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

describe('Forum media contracts', () => {
  it('keeps runtime mute persistence centralized and free from startup reset side effects', () => {
    const source = readRepoFile('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    const debugSource = readRepoFile('app/forum/features/media/utils/mediaDebugRuntime.js')

    expect(source).toContain('__writeMediaMutedPref')
    expect(source).toContain('__appendForumMediaTrace')
    expect(debugSource).toContain('NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED')
    expect(source).not.toContain("localStorage.setItem(MEDIA_MUTED_KEY, '1')")
    expect(source).not.toContain("localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, '1')")
  })

  it('avoids immediate restore load thrash and keeps recent post-video restores out of hard-unload churn', () => {
    const source = readRepoFile('app/forum/features/media/utils/mediaLifecycleRuntime.js')

    expect(source).toContain('restoredRecently || kickedRecently')
    expect(source).not.toContain("if (!isLoading && canRestoreLoad()) el.load?.()")
    expect(source).toContain('el.dataset.__loadPendingSince')
    expect(source).toContain('html_media_restore_load_kick')
  })

  it('keeps forum ads autoplay fallback local-only and reserves global mute persistence for explicit toggles', () => {
    const source = readRepoFile('app/forum/ForumAds.js')

    expect(source).not.toContain('forum-ads-autoplay-fallback')
    expect(source).toContain("source: 'forum-ads-toggle'")
    expect(source).toContain('emitMutedPref(next, playerIdRef.current, \'forum-ads-toggle\', true)')
  })

  it('keeps qcast mute broadcasts marked as user actions', () => {
    const source = readRepoFile('app/forum/features/media/components/QCastPlayer.jsx')

    expect(source).toContain("source: 'qcast_toggle'")
    expect(source).toContain('userAction: true')
  })

  it('keeps coordinator as the only default lifecycle owner and does not let query flags re-enable legacy warm sweep', () => {
    const source = readRepoFile('app/forum/features/media/hooks/useForumMediaCoordinator.js')

    expect(source).toContain('flags.auditEnabled')
    expect(source).not.toContain("qs.get('legacyWarmSweep')")
  })

  it('defers detached media cleanup and coordinates scroll settling before recovery work', () => {
    const source = readRepoFile('app/forum/features/media/hooks/useForumMediaCoordinator.js')

    expect(source).toContain('DETACHED_CLEANUP_GRACE_MS')
    expect(source).toContain('markOwnerDetached(owner)')
    expect(source).not.toContain("cleanupObservedMediaNode(n, 'mutation_removed')")
    expect(source).toContain("enterSettling('scroll_activity'")
    expect(source).toContain("recoverVisibleHtmlMedia('scroll_settle')")
    expect(source).toContain('markMediaLoadPending')
    expect(source).toContain('clearMediaLoadPending')
    expect(source).toContain('media.dataset.__loadPendingSince')
  })
})

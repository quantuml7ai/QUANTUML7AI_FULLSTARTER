import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const DEBUG_MODULE_PATH = '../../../../../../app/forum/features/media/utils/mediaDebugRuntime.js'
const MUTE_MODULE_PATH = '../../../../../../app/forum/features/media/utils/mediaMutePrefs.js'

describe('mediaLifecycleRuntime integration', () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED: process.env.NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED,
    NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED: process.env.NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED,
    NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY: process.env.NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY,
  }

  beforeEach(() => {
    vi.resetModules()
    window.localStorage.clear()
    delete window.__forumMediaTrace
    delete window.__forumMediaDebugFlags
    delete window.dumpForumMediaTrace
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV
    process.env.NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED = originalEnv.NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED
    process.env.NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED = originalEnv.NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED
    process.env.NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY = originalEnv.NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY
  })

  it('does not force-reset persisted mute on module import', async () => {
    window.localStorage.setItem('forum:mediaMuted', '0')
    window.localStorage.setItem('forum:videoMuted', '0')

    await import(MUTE_MODULE_PATH)

    expect(window.localStorage.getItem('forum:mediaMuted')).toBe('0')
    expect(window.localStorage.getItem('forum:videoMuted')).toBe('0')
  })

  it('records dev-only media trace events behind the explicit env flag', async () => {
    process.env.NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED = '1'
    process.env.NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED = '0'
    process.env.NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY = '0'

    const runtime = await import(DEBUG_MODULE_PATH)
    runtime.__appendForumMediaTrace('candidate_activate', { id: 'video-1' })

    expect(Array.isArray(window.__forumMediaTrace)).toBe(true)
    expect(window.__forumMediaTrace.at(-1)).toMatchObject({
      event: 'candidate_activate',
      id: 'video-1',
    })
    expect(typeof window.dumpForumMediaTrace).toBe('function')
  })

  it('writes mute preference only when explicitly asked and tags the trace entry', async () => {
    process.env.NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED = '1'
    process.env.NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED = '0'
    process.env.NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY = '0'

    const runtime = await import(MUTE_MODULE_PATH)
    runtime.__writeMediaMutedPref(false, {
      source: 'integration_test',
      userAction: true,
    })

    expect(window.localStorage.getItem('forum:mediaMuted')).toBe('0')
    expect(window.localStorage.getItem('forum:videoMuted')).toBe('0')
    expect(window.__forumMediaTrace.at(-1)).toMatchObject({
      event: 'mute_persist_write',
      muted: false,
      source: 'integration_test',
      userAction: true,
    })
  })
})

import { describe, expect, it } from 'vitest'
import {
  MEDIA_LIFECYCLE_STATES,
  resolveMediaLifecycleState,
  shouldDeferHardUnload,
} from '../../../../../../app/forum/features/media/utils/mediaLifecycleStateMachine.js'

describe('mediaLifecycleStateMachine', () => {
  it('classifies active playing media as active_playing', () => {
    expect(resolveMediaLifecycleState({
      active: true,
      playing: true,
      hasAttachedSource: true,
      inViewport: true,
    })).toBe(MEDIA_LIFECYCLE_STATES.ACTIVE_PLAYING)
  })

  it('classifies restoring media before it can play', () => {
    expect(resolveMediaLifecycleState({
      restoring: true,
      loadPending: true,
      hasAttachedSource: true,
    })).toBe(MEDIA_LIFECYCLE_STATES.RESTORING)
  })

  it('keeps near resident media out of hard-unloaded state', () => {
    expect(resolveMediaLifecycleState({
      resident: true,
      nearViewport: true,
      hasAttachedSource: true,
    })).toBe(MEDIA_LIFECYCLE_STATES.INACTIVE_PAUSED_RESIDENT)
  })

  it('marks far detached media as hard_unloaded', () => {
    expect(resolveMediaLifecycleState({
      farAway: true,
      hasAttachedSource: false,
      loadPending: false,
    })).toBe(MEDIA_LIFECYCLE_STATES.HARD_UNLOADED)
  })

  it('defers hard unload while runtime is settling', () => {
    expect(shouldDeferHardUnload({
      state: MEDIA_LIFECYCLE_STATES.FAR_EVICTION_PENDING,
      isSettling: true,
    })).toBe(true)
  })

  it('does not defer hard unload for far eviction when runtime is stable', () => {
    expect(shouldDeferHardUnload({
      state: MEDIA_LIFECYCLE_STATES.FAR_EVICTION_PENDING,
      isSettling: false,
      hasManualLease: false,
    })).toBe(false)
  })
})

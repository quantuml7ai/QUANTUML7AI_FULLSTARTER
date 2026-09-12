import { describe, expect, it } from 'vitest'
import { executeQl7SupportTurnRuntime } from '../../lib/ql7-support/runtime/executeTurn.js'
import {
  QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH,
  QL7_SUPPORT_RUNTIME_VERSION,
} from '../../lib/ql7-support/config/behaviorManifest.js'

describe('QL7 Support V14 runtime smoke', () => {
  it('returns a committed premium result from the canonical executor', () => {
    const result = executeQl7SupportTurnRuntime({
      mode: 'test',
      requestId: 'smoke:thanks',
      conversationId: 'smoke:thanks',
      userTurnId: 'smoke:user:thanks',
      selectedLocale: 'ru',
      text: 'спасибо',
      now: '2026-07-31T00:00:00.000Z',
    })
    expect(result.runtimeVersion).toBe(QL7_SUPPORT_RUNTIME_VERSION)
    expect(result.behaviorManifestHash).toBe(QL7_SUPPORT_BEHAVIOR_MANIFEST_HASH)
    expect(result.internalProvenance.resolvedExecutorPath).toBe('lib/ql7-support/runtime/executeTurn.js')
    expect(result.surface.primarySvg.assetId).toBeTruthy()
    expect(result.critic.ok).toBe(true)
  })
})

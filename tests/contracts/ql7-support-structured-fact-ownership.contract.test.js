import { describe, expect, it } from 'vitest'

import {
  QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
  resolveQl7SupportExactFactVisibilityOwner,
} from '../../lib/ql7-support/response/morphosyntacticRealizer.js'
import { QL7_SUPPORT_SURFACE_REDUNDANCY_GUARD_VERSION } from '../../lib/ql7-support/response/surfaceRedundancyGuard.js'

describe('canonical structured exact-fact ownership contract', () => {
  it('requires one exact visible owner without disabling the surface-redundancy hard gate', () => {
    expect(QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION).toBe('5.4.0')
    expect(QL7_SUPPORT_SURFACE_REDUNDANCY_GUARD_VERSION).toBe('6.0.0')

    expect(resolveQl7SupportExactFactVisibilityOwner({
      topic: 'qcoin',
      surfaceKind: 'structured',
      resultKind: 'verified',
      factProjection: { verified: true, facts: { balance: 125.5 } },
    })).toMatchObject({
      mode: 'prose_immutable_fragment',
      structuredTableOwnerPresent: false,
      exactProseSuppressed: false,
    })

    expect(resolveQl7SupportExactFactVisibilityOwner({
      topic: 'qcoin',
      surfaceKind: 'structured',
      resultKind: 'verified',
      receipt: { resultKind: 'verified', result: { balance: 125.5 } },
      factProjection: { verified: true, facts: { balance: 125.5 } },
    })).toMatchObject({
      mode: 'structured_table',
      structuredTableOwnerPresent: true,
      exactProseSuppressed: true,
    })
  })
})

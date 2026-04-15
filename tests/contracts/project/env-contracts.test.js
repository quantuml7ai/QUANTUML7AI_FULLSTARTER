import { describe, expect, it } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

describe('Environment contracts', () => {
  it('documents production-safe diagnostics and media debug env flags', () => {
    const source = readRepoFile('.env.local.example')

    expect(source).toContain('NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED=0')
    expect(source).toContain('NEXT_PUBLIC_FORUM_DIAG=0')
    expect(source).toContain('NEXT_PUBLIC_FORUM_PERF_TRACE=0')
    expect(source).toContain('NEXT_PUBLIC_FORUM_MEDIA_TRACE_ENABLED=0')
    expect(source).toContain('NEXT_PUBLIC_FORUM_MEDIA_AUDIT_ENABLED=0')
    expect(source).toContain('NEXT_PUBLIC_FORUM_MEDIA_DEBUG_OVERLAY=0')
  })
})

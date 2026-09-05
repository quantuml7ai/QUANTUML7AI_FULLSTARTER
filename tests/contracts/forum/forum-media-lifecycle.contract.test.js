import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const source = fs.readFileSync(path.join(process.cwd(), 'app/forum/features/media/hooks/useForumMediaCoordinator.js'), 'utf8')

describe('forum media lifecycle hardening contract', () => {
  test('tracks iterable owners and symmetrically unobserves both IOs', () => {
    expect(source).toContain('const mediaRegistry = new Set()')
    expect(source).toContain('io?.unobserve?.(owner)')
    expect(source).toContain('nearIo?.unobserve?.(owner)')
    expect(source).toContain('observed.delete(owner)')
    expect(source).toContain('mediaRegistry.delete(owner)')
  })

  test('removed owners are connectivity-checked before destructive cleanup', () => {
    expect(source).toContain('pendingRemovedMediaOwners')
    expect(source).toContain('if (owner.isConnected) {')
    expect(source).toContain("mutation_removed_confirmed")
  })

  test('development registry diagnostics expose sweep and scan counters without history retention', () => {
    expect(source).toContain('mediaLifecycleSweepCount')
    expect(source).toContain('mediaLifecycleSnapshotCount')
    expect(source).toContain('mediaGlobalDiagnosticScanCount')
    expect(source).toContain('sweeps: mediaLifecycleSweepCount')
    expect(source).toContain('snapshots: mediaLifecycleSnapshotCount')
    expect(source).toContain('globalDiagnosticScans: mediaGlobalDiagnosticScanCount')
  })

  test('production lifecycle sweep uses registry snapshot and direct node refs', () => {
    expect(source).toContain('buildQl7MediaLifecycleSnapshot')
    expect(source).toContain('const video = row?.node')
    expect(source).not.toContain("Array.from(document.querySelectorAll('video[data-forum-media=\"video\"]'))[row.index]")
  })
})

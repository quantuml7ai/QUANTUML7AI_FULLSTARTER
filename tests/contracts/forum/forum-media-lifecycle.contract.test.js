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

  test('periodic lifecycle arbitration skips layout reads when src budget is already safe', () => {
    expect(source).toContain('const attachedRows = rows.filter((row) => row.hasSrc)')
    expect(source).toContain('const needsDuplicateArbitration =')
    expect(source).toContain('const needsBudgetArbitration = attachedRows.length > budget')
    expect(source).toContain('if (!needsDuplicateArbitration && !needsBudgetArbitration) {')
    expect(source).toContain('mediaLifecycleFastPathCount += 1')
    expect(source).toContain('attachedRows.forEach((row) => measureQl7MediaLifecycleRow(row, viewportH))')
    expect(source).toContain('geometryReads: mediaLifecycleGeometryReadCount')
    expect(source).toContain('fastPathSweeps: mediaLifecycleFastPathCount')
    expect(source.match(/\binstallQl7MediaDiagnostics\(\);/g) || []).toHaveLength(1)
  })

  test('periodic lifecycle snapshot is metadata-first and does not measure no-src poster rows', () => {
    const snapshotStart = source.indexOf("const buildQl7MediaLifecycleSnapshot = (reason = 'periodic')")
    const measureStart = source.indexOf('const measureQl7MediaLifecycleRow = (row, viewportH)')
    expect(snapshotStart).toBeGreaterThanOrEqual(0)
    expect(measureStart).toBeGreaterThan(snapshotStart)
    const snapshotBody = source.slice(snapshotStart, measureStart)
    expect(snapshotBody).not.toContain('getBoundingClientRect')
    expect(source).toContain("if (!row?.hasSrc || !(row?.owner instanceof Element) || !(viewportH > 0)) return row")
  })

  test('confirmed removal fully releases QCast audio and direct audio owners from shared media retention', () => {
    const cleanupStart = source.indexOf('const cleanupObservedMediaNode =')
    const cleanupEnd = source.indexOf('const sweepDetachedMediaState =', cleanupStart)
    expect(cleanupStart).toBeGreaterThanOrEqual(0)
    expect(cleanupEnd).toBeGreaterThan(cleanupStart)

    const cleanup = source.slice(cleanupStart, cleanupEnd)
    const qcastStart = cleanup.indexOf("if (kind === 'qcast')")
    const directOwnerStart = cleanup.indexOf('if (owner instanceof HTMLVideoElement || owner instanceof HTMLAudioElement)', qcastStart)
    expect(qcastStart).toBeGreaterThanOrEqual(0)
    expect(directOwnerStart).toBeGreaterThan(qcastStart)

    const qcastCleanup = cleanup.slice(qcastStart, directOwnerStart)
    expect(qcastCleanup).toContain('__dropActiveVideoEl(audio)')
    expect(qcastCleanup).toContain("audio.dataset.__forceHardUnload = '1'")
    expect(qcastCleanup).toContain("audio.dataset.__pendingHardUnload = '1'")
    expect(qcastCleanup).toContain('withSystemPause(audio, () => {')
    expect(qcastCleanup).toContain('__unloadVideoEl(audio)')
    expect(qcastCleanup).toContain('delete audio.dataset.__pendingHardUnload')
    expect(qcastCleanup).toContain('delete audio.dataset.__forceHardUnload')

    const directOwnerCleanup = cleanup.slice(directOwnerStart)
    expect(directOwnerCleanup).toMatch(
      /if \(owner instanceof HTMLVideoElement \|\| owner instanceof HTMLAudioElement\)[\s\S]{0,420}__dropActiveVideoEl\(owner\)/,
    )
  })

  test('R27 drops disconnected media from app-owned strong registries before secondary cleanup', () => {
    const runtime = fs.readFileSync(
      path.join(process.cwd(), 'app/forum/features/media/utils/mediaLifecycleRuntime.js'),
      'utf8',
    )

    const touchStart = runtime.indexOf('export function __touchActiveVideoEl(el)')
    const touchEnd = runtime.indexOf('export function __dropActiveVideoEl(el)', touchStart)
    expect(touchStart).toBeGreaterThanOrEqual(0)
    expect(touchEnd).toBeGreaterThan(touchStart)
    const touch = runtime.slice(touchStart, touchEnd)
    expect(touch).toContain('if (!el?.isConnected)')
    expect(touch.indexOf('if (!el?.isConnected)')).toBeLessThan(touch.indexOf('__activeVideoEls.add(el)'))

    const capStart = runtime.indexOf('export function __enforceActiveVideoCap(exceptEl)')
    const capEnd = runtime.indexOf('export function __readMediaMutedPref', capStart)
    expect(capStart).toBeGreaterThanOrEqual(0)
    expect(capEnd).toBeGreaterThan(capStart)
    const cap = runtime.slice(capStart, capEnd)
    expect(cap).toContain('QL7_FORUM_MEDIA_DETACHED_APP_GUARDS_R27_FINAL')
    expect(cap.indexOf('__activeVideoLRU.length - 1')).toBeLessThan(cap.indexOf('__isVideoNearViewport(victim'))

    const healStart = source.indexOf('const selfHealDisconnectedMediaRegistry =')
    const healEnd = source.indexOf('const sweepDetachedMediaState =', healStart)
    expect(healStart).toBeGreaterThanOrEqual(0)
    expect(healEnd).toBeGreaterThan(healStart)
    const heal = source.slice(healStart, healEnd)
    const rootDrop = heal.indexOf('mediaRegistry.delete(owner);', heal.indexOf('if (owner.isConnected) continue;'))
    const secondaryCleanup = heal.indexOf('cleanupObservedMediaNode(owner')
    expect(rootDrop).toBeGreaterThanOrEqual(0)
    expect(secondaryCleanup).toBeGreaterThan(rootDrop)
    expect(heal).toContain('_fallback_release')

    const observeStart = source.indexOf('const observeOne = (el) =>')
    const observeEnd = source.indexOf('const publishMediaRegistryState =', observeStart)
    const observe = source.slice(observeStart, observeEnd)
    expect(observe).toContain('if (!el.isConnected) {')
    expect(observe.indexOf('if (!el.isConnected) {')).toBeLessThan(observe.indexOf('observed.add(el)'))
    expect(source).toContain('if (!(n instanceof Element) || !n.isConnected) continue;')
  })

})

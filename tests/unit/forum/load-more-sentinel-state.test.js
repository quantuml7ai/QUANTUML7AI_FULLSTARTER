import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  buildLoadMoreSentinelToken,
  canTriggerLoadMoreSentinel,
} from '../../../app/forum/features/feed/components/LoadMoreSentinel'

describe('LoadMoreSentinel progress gate', () => {
  test('fires once per stable progress token', () => {
    const token = buildLoadMoreSentinelToken('cursor:A', '')
    expect(canTriggerLoadMoreSentinel({ disabled: false, pending: false, hasMore: true, token, requestedToken: '' })).toBe(true)
    expect(canTriggerLoadMoreSentinel({ disabled: false, pending: false, hasMore: true, token, requestedToken: token })).toBe(false)
    const next = buildLoadMoreSentinelToken('cursor:B', '')
    expect(canTriggerLoadMoreSentinel({ disabled: false, pending: false, hasMore: true, token: next, requestedToken: token })).toBe(true)
  })

  test('pending, disabled and complete states block the trigger', () => {
    const token = buildLoadMoreSentinelToken('x')
    expect(canTriggerLoadMoreSentinel({ disabled: true, pending: false, hasMore: true, token, requestedToken: '' })).toBe(false)
    expect(canTriggerLoadMoreSentinel({ disabled: false, pending: true, hasMore: true, token, requestedToken: '' })).toBe(false)
    expect(canTriggerLoadMoreSentinel({ disabled: false, pending: false, hasMore: false, token, requestedToken: '' })).toBe(false)
  })
})

test('development diagnostics expose progress transitions without changing trigger semantics', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'app/forum/features/feed/components/LoadMoreSentinel.jsx'),
    'utf8',
  )
  expect(source).toContain('progressCount')
  expect(source).toContain('progressTransitions')
  expect(source).toContain('progressTokenRef')
  expect(source).toContain('sentinelDiag.progressTransitions += 1')
  expect(source).toContain('replayBlocks')
  expect(source).not.toMatch(/setInterval\s*\(/)
})

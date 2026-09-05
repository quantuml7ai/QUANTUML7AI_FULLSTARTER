import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const source = () => readFileSync(resolve(root, 'app/forum/features/dm/services/sendDmComposerMessage.js'), 'utf8')
const runtimeSource = () => readFileSync(resolve(root, 'app/forum/features/dm/hooks/useForumDmRuntime.js'), 'utf8')

describe('DM send scroll stability', () => {
  test('focuses only the optimistic message and guards retry focus after user scroll', () => {
    const text = source()
    expect(text).toContain("focusMessage(tmpId, 'dm-send-optimistic')")
    expect(text).not.toContain('dm-send-confirmed')
    expect(text).toContain('shouldCancelFocusRetry')
    expect(text).toContain('__forumUserScrollTs')
    expect(text).toContain('__forumProgrammaticScrollTs')
  })

  test('keeps support realtime refresh from pulling the thread after server replies arrive', () => {
    const text = runtimeSource()
    expect(text).toContain('const restoreSupportViewport = supportRequest ? restoreDmThreadViewportAfterSupportMerge() : null')
    expect(text).toContain('if (!supportRequest && !/support|realtime|thread|send-final/i.test(String(reason || \'\'))) {')
    expect(text).toContain('root.scrollTop = Math.max(0, beforeTop)')
    expect(text).toContain('supportThreadInFlight')
  })
})

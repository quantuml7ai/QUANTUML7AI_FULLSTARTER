import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (rel) => readFileSync(resolve(root, rel), 'utf8')

describe('Forum inbox reply reaction overlay contract', () => {
  it('keeps server-loaded inbox replies subscribed to the shared optimistic reaction event', () => {
    const runtime = read('app/forum/features/dm/hooks/useForumDmRuntime.js')
    const pane = read('app/forum/features/dm/components/InboxRepliesPane.jsx')

    expect(runtime).toContain("import { patchInboxReplyReactionOverlay } from '../utils/inboxReplyReactionOverlay.js'")
    expect(runtime).toContain("window.addEventListener('forum:post-reaction-overlay', onReactionOverlay)")
    expect(runtime).toContain("window.removeEventListener('forum:post-reaction-overlay', onReactionOverlay)")
    expect(runtime).toContain('setServerRepliesToMe((prev) => patchInboxReplyReactionOverlay(prev, detail))')
    expect(pane).toContain('onReact={reactMut}')
  })
})

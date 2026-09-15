import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('global speculative resource prewarm retirement contract', () => {
  it('keeps the global prewarm runtime out of the production root layout', () => {
    const layout = read('app/layout.js')
    expect(layout).not.toContain("import GlobalResourcePrewarmRuntime")
    expect(layout).not.toContain('<GlobalResourcePrewarmRuntime />')
    expect(layout).toContain('<GlobalVisualActivityRuntime />')
    expect(layout).toContain('<ScreenWakeLockRuntime />')
  })

  it('keeps virtualized forum feeds free of pre-mount image/poster decode hints', () => {
    const consumers = [
      'app/forum/features/feed/components/PublishedPostsPane.jsx',
      'app/forum/features/feed/components/UserPostsPane.jsx',
      'app/forum/features/feed/components/ThreadRepliesPane.jsx',
      'app/forum/features/media/components/VideoFeedPane.jsx',
    ]
    for (const file of consumers) {
      const source = read(file)
      expect(source, file).not.toContain('prewarmResourceHints')
      expect(source, file).not.toContain('preMountResourceHints')
      expect(source, file).not.toContain('extractPostPrewarmHints')
      expect(source, file).not.toContain('resource-prewarm/resourcePrewarmRuntime')
    }
  })

  it('keeps the retired implementation dormant rather than production-owned', () => {
    const host = read('components/resource-prewarm/GlobalResourcePrewarmRuntime.jsx')
    const runtime = read('lib/resource-prewarm/resourcePrewarmRuntime.js')
    expect(host).toContain('installGlobalResourcePrewarmRuntime')
    expect(runtime).toContain('export function installGlobalResourcePrewarmRuntime')
    expect(read('app/layout.js')).not.toContain('resource-prewarm/GlobalResourcePrewarmRuntime')
  })
})

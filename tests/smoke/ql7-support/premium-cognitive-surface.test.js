import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('QL7 Support V8 smoke', () => {
  it('has no raw status rendering path in V8 card', () => {
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    expect(card).toContain('status?.label')
    expect(card).not.toContain('humanValue(snapshot')
  })

  it('preserves one physical ordinary-DM and Support media stack', () => {
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    const row = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
    const media = read('app/forum/features/dm/components/DmMediaRenderer.jsx')

    expect(card).toContain('DmMediaRenderer')
    expect(card).toMatch(/source:\s*'support-complaint'/u)
    expect(row).toContain('DmMediaRenderer')
    expect(row).toContain('source="ordinary-dm"')
    expect(row).toContain('VideoPlayer={NativeSafeVideoPlayer}')
    expect(row).toContain('VoicePlayer={DmVoicePlayer}')
    expect(media).toContain('data-dm-media-renderer')
    expect(card).not.toMatch(/ViewportFiveSecondVideo|data-ql7-support-video-loop/u)
  })
})

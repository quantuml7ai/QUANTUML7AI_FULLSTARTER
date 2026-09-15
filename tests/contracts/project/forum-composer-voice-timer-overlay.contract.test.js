import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('forum composer voice timer overlay contract', () => {
  test('renders the recording timer as a rail overlay sibling, not inside the button clipping box', () => {
    const rail = read('app/forum/features/ui/components/ComposerActionRail.jsx')
    const micButton = rail.indexOf("className={cls('iconBtn ghost micBtn lockable'")
    const buttonClose = rail.indexOf('</button>', micButton)
    const timer = rail.indexOf('<span className="micTimer"', micButton)

    expect(rail).toContain('<div className="railItem voiceRailItem">')
    expect(micButton).toBeGreaterThan(-1)
    expect(buttonClose).toBeGreaterThan(micButton)
    expect(timer).toBeGreaterThan(buttonClose)
  })

  test('keeps the timer above the rail while preserving horizontal composer containment', () => {
    const styles = read('app/forum/styles/ForumStyles.jsx')
    const supportStyles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')

    expect(styles).toMatch(/\.voiceRailItem\{[\s\S]*?position:relative;[\s\S]*?overflow:visible;[\s\S]*?z-index:3;/u)
    expect(styles).toMatch(/\.voiceRailItem > \.micTimer\{[\s\S]*?top:-30px;[\s\S]*?z-index:4;/u)
    expect(supportStyles).toContain('overflow-x:clip;overflow-y:visible;')
    expect(supportStyles).not.toContain('overflow-x:hidden;')
  })
  test('releases the recording-only clipping chain on mobile WebKit without moving the timer', () => {
    const composerCore = read('app/forum/features/ui/components/ComposerCore.jsx')
    const supportStyles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')

    expect(composerCore).toContain('data-voice-recording={recState === \'rec\' ? \'1\' : undefined}')
    expect(supportStyles).toContain('@supports (-webkit-touch-callout:none)')
    expect(supportStyles).toContain('@media(max-width:820px)')
    expect(supportStyles).toContain('.forum_root .forumComposer[data-voice-recording="1"]')
    expect(supportStyles).toContain('.forum_root .forumComposer[data-voice-recording="1"] .taWrap')
    expect(supportStyles).toContain('.forum_root .forumComposer[data-voice-recording="1"] .topRail .railInner')
    expect(supportStyles).toContain('overflow:visible!important;')
    expect(supportStyles).toContain('position:relative;z-index:8;')
    expect(supportStyles).toContain('.forum_root .forumComposer[data-voice-recording="1"] .voiceRailItem>.micTimer{z-index:9;}')
  })

})

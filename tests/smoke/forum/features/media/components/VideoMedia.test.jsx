import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const VIDEO_MEDIA_PATH = path.resolve(
  process.cwd(),
  'app/forum/features/media/components/VideoMedia.jsx',
)

describe('VideoMedia smoke integrity contract', () => {
  it('keeps the post-video shell and HUD contract in place for the coordinator runtime', () => {
    const source = fs.readFileSync(VIDEO_MEDIA_PATH, 'utf8')

    expect(source).toContain('className="ql7VideoSurface"')
    expect(source).toContain("className={`ql7VideoHud ${hudVisible ? 'isVisible' : ''}`}")
    expect(source).toContain("className={`ql7VideoRail ${hudVisible ? 'isVisible' : ''}`}")
    expect(source).toContain('const videoNode = (')
    expect(source).toContain('if (!isPostVideo) return videoNode')
  })

  it('keeps post-video error recovery local-only and does not hard-unload the shell on error', () => {
    const source = fs.readFileSync(VIDEO_MEDIA_PATH, 'utf8')

    expect(source).toContain("if (String(dataForumVideo || '') === 'post')")
    expect(source).toContain('onErrorProp?.(e)')
    expect(source).not.toContain("dataForumVideo === 'post') {\r\n          __unloadVideoEl")
  })
})

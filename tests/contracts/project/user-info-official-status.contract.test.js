import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const ROOT = process.cwd()
const readRepoFile = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
const readCssBlock = (source, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`${escaped}\\{([\\s\\S]*?)\\n\\s*\\}`))?.[1] || ''
}

describe('shared UserInfoPopover Official status contract', () => {
  test('keeps Official server-authorized, canonical-aware, right-contour-anchored, shiny, and independent from translate geometry', () => {
    const helper = readRepoFile('app/api/profile/_officialStatus.js')
    const route = readRepoFile('app/api/profile/user-popover/route.js')
    const popover = readRepoFile('app/forum/features/profile/components/UserInfoPopover.jsx')
    const overlayStack = readRepoFile('app/forum/features/ui/components/ForumOverlayStack.jsx')
    const metamarket = readRepoFile('components/MetaMarket.jsx')
    const forumStyles = readRepoFile('app/forum/styles/ForumStyles.jsx')
    const profileStyles = readRepoFile('app/forum/styles/modules/profileStyles.js')
    const globalStyles = readRepoFile('app/globals.css')
    const envExample = readRepoFile('.env.local.example')

    expect(helper).toContain("OFFICIAL_STATUS_ENV_KEY = 'QL7_OFFICIAL_STATUS_IDS'")
    expect(helper).toContain('process.env[OFFICIAL_STATUS_ENV_KEY]')
    expect(helper).toContain("typeof resolveConfiguredIds !== 'function'")
    expect(helper).not.toContain('NEXT_PUBLIC_QL7_OFFICIAL_STATUS_IDS')
    expect(envExample).toContain('QL7_OFFICIAL_STATUS_IDS=')
    expect(envExample).not.toContain('NEXT_PUBLIC_QL7_OFFICIAL_STATUS_IDS')

    expect(route).toContain('resolveCanonicalAccountId, resolveCanonicalAccountIds')
    expect(route).toContain("import { isOfficialProfile } from '../_officialStatus.js'")
    expect(route).toContain('const officialStatusPromise = isOfficialProfile({')
    expect(route).toContain('resolveConfiguredIds: resolveCanonicalAccountIds')
    expect(route).toContain('officialStatusPromise,')
    expect(route).toContain('officialStatus: officialStatus === true')

    expect((overlayStack.match(/<UserInfoPopover/g) || [])).toHaveLength(1)
    expect(metamarket).toContain("dynamic(() => import('../app/forum/features/profile/components/UserInfoPopover')")
    expect(popover).toContain('officialStatus: json?.officialStatus === true')
    expect(popover).toContain('data?.officialStatus === true')
    expect(popover).toContain('/* eslint-disable @next/next/no-img-element */')
    expect(popover).toContain('className="userInfoOfficialStatus"')
    expect(popover).toContain('className="userInfoOfficialShine"')
    expect(popover).toContain('src="/status/official.png"')
    expect(popover).toContain('className="userInfoTranslateSlot"')

    const officialMarkupIndex = popover.indexOf('className="userInfoOfficialStatus"')
    const bioRowIndex = popover.indexOf('<div className="userInfoBioRow">')
    const translateSlotIndex = popover.indexOf('<div className="userInfoTranslateSlot">')
    expect(officialMarkupIndex).toBeGreaterThan(-1)
    expect(officialMarkupIndex).toBeLessThan(bioRowIndex)
    expect(officialMarkupIndex).toBeLessThan(translateSlotIndex)

    expect(globalStyles).toContain('.topbar .brand-logo-shine::before{')
    expect(globalStyles).toContain('@keyframes ql7LogoSunGlint{')

    for (const stylesSource of [forumStyles, profileStyles]) {
      const officialBlock = readCssBlock(stylesSource, '.userInfoOfficialStatus')
      expect(officialBlock).toContain('position:absolute;')
      expect(officialBlock).toContain('left:auto;')
      expect(officialBlock).toContain('right:12px;')
      expect(officialBlock).toContain('top:0;')
      expect(officialBlock).toContain('width:86px;')
      expect(officialBlock).toContain('height:26px;')
      expect(officialBlock).toContain('transform:translateY(-50%);')
      expect(officialBlock).not.toContain('left:50%;')
      expect(officialBlock).not.toContain('inset-inline:0')
      expect(officialBlock).not.toContain('bottom:calc(100% + 8px)')


      expect(stylesSource).toContain('.userInfoOfficialShine{')
      expect(stylesSource).toContain('-webkit-mask-image:url("/status/official.png")')
      expect(stylesSource).toContain('mask-image:url("/status/official.png")')
      expect(stylesSource).toContain('.userInfoOfficialShine::before{')
      expect(stylesSource).toContain('animation:ql7LogoSunGlint 3s ease-in-out infinite;')
    }

  })
})

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const ROOT = process.cwd()
const readRepoFile = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8').replace(/\r\n/g, '\n')

const readCssBlock = (source, selector, fromIndex = 0) => {
  const selectorIndex = source.indexOf(`${selector}{`, fromIndex)
  if (selectorIndex < 0) return ''

  const openIndex = source.indexOf('{', selectorIndex)
  if (openIndex < 0) return ''

  let depth = 0
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(openIndex + 1, index)
    }
  }
  return ''
}

const expectSharedDesktopLayout = (stylesSource) => {
  const bioRow = readCssBlock(stylesSource, '.userInfoBioRow')
  expect(bioRow).toContain('display:grid;')
  expect(bioRow).toContain('grid-template-columns:minmax(0, 1fr);')
  expect(bioRow).toContain('align-items:start;')
  expect(bioRow).toContain('gap:9px;')

  const bioHeader = readCssBlock(stylesSource, '.userInfoBioHeader')
  expect(bioHeader).toContain('padding-right:104px;')

  const bioLabelWrap = readCssBlock(stylesSource, '.userInfoBioLabelWrap')
  expect(bioLabelWrap).toContain('width:max-content;')
  expect(bioLabelWrap).toContain('max-width:100%;')

  const bioLabelRail = readCssBlock(stylesSource, '.userInfoBioLabelRail')
  expect(bioLabelRail).toContain('width:100%;')
  expect(bioLabelRail).toContain('height:1px;')
  expect(bioLabelRail).toContain('overflow:hidden;')

  const actionsRow = readCssBlock(stylesSource, '.userInfoBioActionsRow')
  expect(actionsRow).toContain('display:grid;')
  expect(actionsRow).toContain('grid-template-columns:minmax(0, 1fr) auto;')
  expect(actionsRow).toContain('align-items:center;')
  expect(actionsRow).toContain('column-gap:40px;')
  expect(actionsRow).toContain('min-width:0;')

  const actionGroup = readCssBlock(stylesSource, '.userInfoActionGroup')
  expect(actionGroup).toContain('display:inline-flex;')
  expect(actionGroup).toContain('align-items:center;')
  expect(actionGroup).toContain('justify-content:center;')
  expect(actionGroup).toContain('justify-self:end;')
  expect(actionGroup).toContain('gap:25px;')
  expect(actionGroup).toContain('flex:0 0 auto;')

  const translateSlot = readCssBlock(stylesSource, '.userInfoTranslateSlot')
  expect(translateSlot).toContain('display:inline-flex;')
  expect(translateSlot).toContain('flex:0 0 auto;')
}

describe('shared UserInfoPopover bio/action layout contract', () => {
  test('keeps bio title above the actions and preserves the tuned desktop spacing', () => {
    const popover = readRepoFile('app/forum/features/profile/components/UserInfoPopover.jsx')
    const forumStyles = readRepoFile('app/forum/styles/ForumStyles.jsx')
    const profileStyles = readRepoFile('app/forum/styles/modules/profileStyles.js')

    expect(popover).toContain('className="userInfoBioHeader"')
    expect(popover).toContain('className="userInfoBioLabelWrap"')
    expect(popover).toContain(`className="userInfoBioLabel">{t?.('forum_user_popover_bio')}:`)
    expect(popover).toContain('className="userInfoBioLabelRail"')
    expect(popover).toContain('className="userInfoBioActionsRow"')
    expect(popover).toContain('className="userInfoActionGroup"')
    expect(popover).toContain('className="userInfoTranslateSlot"')

    const headerIndex = popover.indexOf('className="userInfoBioHeader"')
    const actionsIndex = popover.indexOf('className="userInfoBioActionsRow"')
    const dmIndex = popover.indexOf('userInfoCircleActionBtn--dm')
    const giftIndex = popover.indexOf('userInfoCircleActionBtn--gift')
    const translateIndex = popover.indexOf('className="userInfoTranslateSlot"')

    expect(headerIndex).toBeGreaterThan(-1)
    expect(actionsIndex).toBeGreaterThan(headerIndex)
    expect(dmIndex).toBeGreaterThan(actionsIndex)
    expect(giftIndex).toBeGreaterThan(dmIndex)
    expect(translateIndex).toBeGreaterThan(giftIndex)

    for (const stylesSource of [forumStyles, profileStyles]) {
      expectSharedDesktopLayout(stylesSource)
      expect(stylesSource).toContain('.userInfoBioLabelRail::after{')
      expect(stylesSource).toContain('@keyframes userInfoBioLabelRailPulse{')
    }
  })

  test('keeps the tuned desktop button and icon geometry on the rendered forum surface', () => {
    const forumStyles = readRepoFile('app/forum/styles/ForumStyles.jsx')

    const circleButton = readCssBlock(forumStyles, '.userInfoCircleActionBtn')
    expect(circleButton).toContain('width:46px;')
    expect(circleButton).toContain('height:46px;')
    expect(circleButton).toContain('min-width:46px;')
    expect(circleButton).toContain('min-height:46px;')

    const dmButton = readCssBlock(forumStyles, '.userInfoDmBtn')
    expect(dmButton).toContain('width:46px; height:46px;')

    const dmIcon = readCssBlock(forumStyles, '.userInfoDmBtn svg')
    expect(dmIcon).toContain('width:30px; height:30px;')

    const giftIcon = readCssBlock(forumStyles, '.userInfoGiftBtn svg')
    expect(giftIcon).toContain('width:36px;')
    expect(giftIcon).toContain('height:36px;')

    expect(forumStyles).toContain('@media (hover:hover) and (pointer:fine){')
    expect(forumStyles).toContain('.userInfoCircleActionBtn:hover{')
    expect(forumStyles).toContain('translate:0 -2px;')
    expect(forumStyles).toContain('scale:1.035;')
    expect(forumStyles).toContain('.userInfoCircleActionBtn:active{')
    expect(forumStyles).toContain('.userInfoCircleActionBtn:focus-visible{')
    expect(forumStyles).toContain('.userInfoDmBtn:hover{')
    expect(forumStyles).toContain('.userInfoGiftBtn:hover{')
  })

  test('keeps the compact mobile overrides independent from the tuned desktop geometry', () => {
    const forumStyles = readRepoFile('app/forum/styles/ForumStyles.jsx')
    const srOnlyIndex = forumStyles.indexOf('.srOnly{')
    const mobileStart = forumStyles.lastIndexOf('@media (max-width: 420px){', srOnlyIndex)

    expect(mobileStart).toBeGreaterThan(-1)

    const mobileBioRow = readCssBlock(forumStyles, '.userInfoBioRow', mobileStart)
    expect(mobileBioRow).toContain('gap:7px;')

    const mobileBioHeader = readCssBlock(forumStyles, '.userInfoBioHeader', mobileStart)
    expect(mobileBioHeader).toContain('padding-right:96px;')

    const mobileActionsRow = readCssBlock(forumStyles, '.userInfoBioActionsRow', mobileStart)
    expect(mobileActionsRow).toContain('gap:35px;')

    const mobileActionGroup = readCssBlock(forumStyles, '.userInfoActionGroup', mobileStart)
    expect(mobileActionGroup).toContain('gap:22px;')

    const mobileCircleButtons = readCssBlock(forumStyles, '.userInfoCircleActionBtn,\n      .userInfoDmBtn', mobileStart)
    expect(mobileCircleButtons).toContain('width:42px;')
    expect(mobileCircleButtons).toContain('height:42px;')
    expect(mobileCircleButtons).toContain('min-width:42px;')
    expect(mobileCircleButtons).toContain('min-height:42px;')

    const mobileTranslate = readCssBlock(forumStyles, '.userInfoTranslateToggle', mobileStart)
    expect(mobileTranslate).toContain('padding-inline:9px;')
    expect(mobileTranslate).toContain('min-width:0;')
  })
})

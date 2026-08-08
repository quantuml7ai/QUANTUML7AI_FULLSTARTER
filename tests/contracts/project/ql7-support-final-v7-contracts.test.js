import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))

describe('QL7 Support 777 final runtime V7 contracts', () => {
  test('ships permanent architecture, executable matrices and runtime modules', () => {
    for (const file of [
      'QL7_SUPPORT_ARCHITECTURE_RU.md',
      'lib/ql7-support/inputPolicy.js',
      'lib/ql7-support/conversationStateV7.js',
      'lib/ql7-support/scenarioContractsV7.js',
      'lib/ql7-support/ecosystemRating.js',
      'lib/ql7-support/eventNotificationCatalog.js',
      'app/forum/features/dm/components/DmMediaRenderer.jsx',
      'scripts/ql7-support-final-v7-synthetic-matrix.mjs',
      'scripts/ql7-support-final-v7-multi-turn-matrix.mjs',
      'scripts/ql7-support-final-v7-input-policy-matrix.mjs',
      'scripts/ql7-support-final-v7-event-matrix.mjs',
    ]) expect(exists(file), file).toBe(true)
  })

  test('enforces reload-proof server-authoritative send policy and typed route failure', () => {
    const route = read('app/api/dm/send/route.js')
    const runtimeState = read('lib/ql7-support/runtimeStateMachine.js')
    const policy = read('lib/ql7-support/inputPolicy.js')
    const server = read('lib/ql7-support/server.js')
    const forumRoot = read('app/forum/ForumRoot.jsx')
    expect(route).toMatch(/evaluateQl7SupportInputAttempt/u)
    expect(route).toMatch(/ql7_support_input_paused/u)
    expect(route).toMatch(/ql7_support_temporarily_unavailable/u)
    expect(route).toMatch(/inputPolicy/u)
    expect(runtimeState).toContain("const SAFETY_RESTRICTION_REASON = 'safety_review'")
    expect(runtimeState).toContain('blockedUntilMs(policy) + QL7_SUPPORT_RESTRICTION_TTL_GRACE_MS')
    expect(runtimeState).toContain("preserveSafetyRestriction ? 'cooldown' : requestedState")
    expect(policy).toContain("normalized.reasonCode !== 'safety_review'")
    expect(policy).toContain('expiredBoundedLock')
    expect(server).toContain("restrictionSource: 'ql7_support_cases'")
    expect(forumRoot).toContain('fetchQl7SupportRuntimeState({})')
  })

  test('keeps the auth warning bounded and mobile support identity/operator readable', () => {
    const bridge = read('components/Ql7SupportRuntimeBridge.jsx')
    const inboxHeader = read('app/forum/features/dm/components/InboxTabsHeader.jsx')
    const dmStyles = read('app/forum/styles/modules/dmStyles.js')
    const styles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')
    const pane = read('app/forum/features/dm/components/DmMessagesPane.jsx')
    const header = read('app/forum/features/dm/components/DmThreadHeader.jsx')
    const operator = read('app/forum/features/dm/components/Ql7SupportOperator.jsx')
    expect(bridge).toContain('createPortal(authPopover, document.body)')
    expect(bridge).toContain('max-inline-size:350px!important;max-width:350px!important')
    expect(bridge).toContain('data-ql7-support-auth-panel="bounded-350"')
    expect(bridge).not.toContain('<section className="ql7SupportAuthPopover"')
    expect(inboxHeader).toContain('data-ql7-quantum-messenger-sticky-owner="title-tabs"')
    expect(inboxHeader).toContain('new ResizeObserver(publishStickyStackHeight)')
    expect(dmStyles).toContain('--ql7-quantum-messenger-sticky-height:92px')
    expect(dmStyles).toContain('position:sticky; top:var(--ql7-quantum-messenger-sticky-top); z-index:48')
    expect(styles).toContain('--ql7-support-operator-slot-w:clamp(89.6px,32vw,142.4px)')
    expect(styles).toContain('--ql7-support-operator-slot-w:clamp(83.2px,30.4vw,118.4px)')
    expect(styles).toContain('--ql7-support-operator-sticky-top:calc(var(--ql7-quantum-messenger-sticky-top,0px) + var(--ql7-quantum-messenger-sticky-height,92px) + var(--ql7-support-operator-sticky-gap,6px))')
    expect(styles).toContain('width:max-content;max-width:none;overflow:visible;text-overflow:clip')
    expect(pane).toContain('data-ql7-operator-sticky-slot="media-only"')
    expect(pane).toContain('data-ql7-operator-sticky-target="static-video-only"')
    expect(header).not.toContain('<Ql7SupportOperator')
    expect(pane).toContain('<Ql7SupportOperator')
    expect(operator).toContain('translated !== key')
  })

  test('finishes operator media on committed reply and auto-releases canonical cooldown without reload', () => {
    const operator = read('app/forum/features/dm/components/Ql7SupportOperator.jsx')
    const send = read('app/forum/features/dm/services/sendDmComposerMessage.js')
    const runtime = read('app/forum/features/dm/hooks/useForumDmRuntime.js')
    const stateMachine = read('lib/ql7-support/runtimeStateMachine.js')
    expect(operator).toContain('user-send-until-answer-commit')
    const activeStatesBlock = operator.slice(operator.indexOf('const ACTIVE_STATES'), operator.indexOf('const TERMINAL_STATES'))
    expect(activeStatesBlock).not.toContain("'waiting_admin'")
    expect(send).toContain("? 'answer_committed' : 'sending'")
    expect(send).toContain('preserveSupportDraft = true')
    expect(runtime).toContain('window.setTimeout(release')
    expect(stateMachine).toContain('mergeRuntimeHistory')
    expect(stateMachine).toContain("detailCode: 'runtime_event_expired_ready'")
  })

  test('redacts short bearer credentials before email bridge serialization', () => {
    const caseEngine = read('lib/ql7-support/caseEngine.js')
    const server = read('lib/ql7-support/server.js')
    expect(caseEngine).toMatch(/\b\(bearer\)\\s\+\[\^\\s,;\]\{3,\}/u)
    expect(server).toMatch(/sanitizeQl7SupportEmailBridgeValue/u)
    expect(server).toMatch(/return sanitizeQl7SupportEmailBridgeValue\(payload\)/u)
  })

  test('uses one physical media renderer with the exact ordinary DM player stack', () => {
    const row = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    const media = read('app/forum/features/dm/components/DmMediaRenderer.jsx')
    const parsing = read('app/forum/features/dm/utils/mediaParsing.js')
    expect(row).toMatch(/import DmMediaRenderer/u)
    expect(row).toMatch(/import \{ NativeSafeVideoPlayer \} from ['"]\.\.\/\.\.\/media\/utils\/mediaLifecycleRuntime['"]/u)
    expect(row).toMatch(/import DmVoicePlayer from ['"]\.\/DmVoicePlayer['"]/u)
    expect(row).toMatch(/VideoPlayer=\{NativeSafeVideoPlayer\}/u)
    expect(row).toMatch(/VoicePlayer=\{DmVoicePlayer\}/u)
    expect(row).toMatch(/const dmTextBase = stripDmPlayableUrlsFromText\(cleanedText\)/u)
    expect(row).toMatch(/const kind = getDmMediaKind\(url, it\.type\)/u)
    expect(row).toMatch(/<DmMediaRenderer/u)
    expect(card).toMatch(/import DmMediaRenderer/u)
    expect(card).not.toMatch(/NativeSafeVideoPlayer|DmVoicePlayer|ViewportFiveSecondVideo/u)
    expect(card).toMatch(/VideoPlayer, VoicePlayer/u)
    expect(media).not.toMatch(/mediaLifecycleRuntime|import DmVoicePlayer/u)
    expect(media).toMatch(/VideoPlayer\s*=\s*NativeVideoFallback/u)
    expect(media).toMatch(/VoicePlayer\s*=\s*NativeAudioFallback/u)
    expect(media).toMatch(/minHeight:\s*350/u)
    expect(media).toMatch(/maxHeight:\s*['"]min\(72vh, 650px\)['"]/u)
    expect(parsing).toContain('const DM_VIDEO_RE = /\\.(?:mp4|mov|m4v|ogv)')
    expect(parsing).toMatch(/stripDmPlayableUrlsFromText/u)
  })

  test('removes duplicate Support branding from rich cards', () => {
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    expect(card).not.toMatch(/QL7SupportCardEyebrow|QL7 SUPPORT/u)
    expect(card).toMatch(/ql7SupportCardTitleBlock/u)
  })

  test('keeps immutable package metadata unchanged', () => {
    expect(read('package.json')).not.toMatch(/"type"\s*:\s*"module"/u)
    expect(exists('pnpm-lock.yaml')).toBe(true)
    expect(exists('AGENTS.md')).toBe(true)
  })
})

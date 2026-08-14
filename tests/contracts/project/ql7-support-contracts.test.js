import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import {
  QL7_SUPPORT_ACTOR,
  QL7_SUPPORT_AVATAR_URL,
  QL7_SUPPORT_ID,
  assertNotQl7SupportSender,
  isQl7SupportId,
} from '../../../lib/ql7-support/systemActor.js'
import {
  QL7_SUPPORT_LANGS,
  buildQl7SupportAutoReply,
  buildQl7SupportDedupeKey,
  buildQl7SupportMessage,
  classifyQl7SupportRequest,
} from '../../../lib/ql7-support/templates.js'
import {
  QL7_SUPPORT_CASE_COLLECTION,
  QL7_SUPPORT_CASE_STATUSES,
  QL7_SUPPORT_REPLY_ROLES,
  analyzeQl7SupportRequest,
  buildQl7SupportPlannedReply,
  redactQl7SupportSecrets,
} from '../../../lib/ql7-support/caseEngine.js'
import {
  QL7_SUPPORT_ADS_DIAGNOSTIC_BRANCHES,
  QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION,
  QL7_SUPPORT_ECOSYSTEM_DIAGNOSTIC_TOPICS,
  QL7_SUPPORT_GENERIC_DIAGNOSTIC_BRANCHES,
  QL7_SUPPORT_QCOIN_DIAGNOSTIC_BRANCHES,
} from '../../../lib/ql7-support/diagnostics.js'
import {
  QL7_SUPPORT_DOMAIN_SCENARIO_ACTS_V4,
  QL7_SUPPORT_ECOSYSTEM_TOPICS,
  QL7_SUPPORT_OPERATOR_STATE_ALIASES_V4,
  QL7_SUPPORT_OPERATOR_STATIC_STATES_V5,
  QL7_SUPPORT_OPERATOR_STATES_V4,
  QL7_SUPPORT_OPERATOR_VIDEO_STATES_V5,
  QL7_SUPPORT_PIPELINE_OPERATOR_STATES_V4,
  QL7_SUPPORT_PUBLIC_OPERATOR_STATES_V5,
  buildQl7SupportDomainPlan,
  classifyQl7SupportCatalogTopic,
  getQl7SupportDiagnosticBranches,
  getQl7SupportReadCollections,
  normalizeQl7SupportOperatorState,
  normalizeQl7SupportTopic,
} from '../../../lib/ql7-support/ecosystemCatalog.js'
import {
  buildQl7SupportCardV4,
  validateQl7SupportCardAnyVersion,
} from '../../../lib/ql7-support/cards.js'
import { realizeQl7SemanticSurfaceV9 } from '../../../lib/ql7-support/semanticSurfaceV9.js'

const root = process.cwd()
const read = (file) => readFileSync(resolve(root, file), 'utf8')

describe('QL7 Support DM system contour contracts', () => {
  test('declares a single immutable system actor and public avatar asset', () => {
    expect(QL7_SUPPORT_ID).toBe('ql7-support')
    expect(QL7_SUPPORT_AVATAR_URL).toBe('/ql7/ql7support.png')
    expect(existsSync(resolve(root, 'public/ql7/ql7support.png'))).toBe(true)
    expect(QL7_SUPPORT_ACTOR).toMatchObject({
      id: 'ql7-support',
      isSystem: true,
      systemRole: 'support',
      verified: true,
      immutable: true,
      followable: false,
      blockable: false,
      reportable: false,
      searchableAsUser: false,
      hasUserProfile: false,
      hasWallet: false,
      hasPosts: false,
      hasTopics: false,
    })
    expect(isQl7SupportId('QL7-SUPPORT')).toBe(true)
    expect(() => assertNotQl7SupportSender('ql7-support')).toThrow('ql7_support_sender_forbidden')
  })

  test('keeps support messages on existing DM route with server-only incoming support sender', () => {
    const sendRoute = read('app/api/dm/send/route.js')
    const supportServer = read('lib/ql7-support/server.js')
    const dmUtils = read('app/api/dm/_utils.js')
    const supportEmailTransport = read('lib/supportEmailTransport.js')
    const contactRoute = read('app/api/contact/route.js')

    expect(sendRoute).toContain('assertNotQl7SupportSender(from)')
    expect(sendRoute).toContain('isQl7SupportId(to)')
    expect(sendRoute).toContain('ql7_support_text_only')
    expect(sendRoute).toContain('createQl7SupportUserMessage')
    expect(sendRoute).toContain('supportBridgeOk')
    expect(supportServer).toContain('from: QL7_SUPPORT_ID')
    expect(supportServer).toContain('sendBackgroundPush')
    expect(supportServer).toContain("source: 'messenger_messages'")
    expect(supportServer).toContain('ql7_support_message_dedupe')
    expect(supportServer).toContain('ql7_support_user_requests')
    expect(supportServer).toContain('sendSupportEmail')
    expect(supportServer).toContain("source: 'ql7_support_dm'")
    expect(supportServer).toContain('classifyQl7SupportRequest')
    expect(supportServer).toContain("import { executeQl7SupportProductionTurn, finalizeQl7SupportProductionDelivery } from './runtime/productionTurn.js'")
    expect(supportServer).toContain('executeQl7SupportProductionTurn({')
    expect(supportServer).toContain('finalizeQl7SupportProductionDelivery({')
    expect(supportServer).not.toContain("from './runtime/executeTurn.js'")
    expect(supportServer).not.toContain('executeQl7SupportTurnRuntime({')
    expect(supportServer).not.toContain('executeQl7SupportTurnRuntimeV13')
    expect(supportServer).not.toContain("from './responsePlan.js'")
    expect(supportServer).toContain('analyzeQl7SupportRequest')
    expect(supportServer).toContain('runQl7SupportPremiumDiagnostic')
    expect(supportServer).toContain('QL7_SUPPORT_CASE_COLLECTION')
    expect(supportServer).toContain('caseId')
    expect(supportServer).toContain('caseStatus')
    expect(supportServer).toContain("restrictionSource: 'ql7_support_cases'")
    expect(sendRoute).toContain('getQl7SupportRuntimeStateForUser({ userId: from })')
    expect(sendRoute).toContain("error: 'ql7_support_input_paused'")
    expect(supportServer).toContain("eventType: 'support_reply'")
    expect(contactRoute).toContain('sendSupportEmail')
    expect(contactRoute).not.toContain('nodemailer')
    expect(supportEmailTransport).toContain('nodemailer.createTransport')
    expect(dmUtils).toContain('if (isQl7SupportId(id)) return QL7_SUPPORT_ID')
  })

  test('routes every public support entry through auth bridge into the QL7 Support DM thread', () => {
    const bridge = read('components/Ql7SupportRuntimeBridge.jsx')
    const layout = read('app/layout.js')
    const forumRoot = read('app/forum/ForumRoot.jsx')
    const contactPage = read('app/contact/page.js')
    const appShell = read('app/api/app-shell/config/route.js')
    const siteIndex = read('lib/seo/siteIndex.js')
    const actionRegistry = read('lib/ql7-support/topicActionRegistryV9.js')

    expect(layout).toContain('Ql7SupportRuntimeBridge')
    expect(bridge).toContain('runAuthorizedClientAction')
    expect(bridge).toContain("actionKey: 'ql7-support-global-entry'")
    expect(bridge).toContain('ql7SupportOpen=1')
    expect(bridge).toContain('ql7-support:open-thread')
    expect(bridge).toContain('ql7SupportAuthPopoverLayer')
    expect(bridge).toContain("import { createPortal } from 'react-dom'")
    expect(bridge).toContain('createPortal(authPopover, document.body)')
    expect(bridge).toContain('data-ql7-support-auth-portal="body"')
    expect(bridge).toContain('inline-size:calc(100vw - 28px)!important')
    expect(bridge).toContain('max-inline-size:350px!important;max-width:350px!important')
    expect(bridge).toContain('data-ql7-support-auth-panel="bounded-350"')
    expect(bridge).not.toContain('<section className="ql7SupportAuthPopover"')
    expect(bridge).not.toContain('width:min(430px')
    expect(bridge).toContain("new CustomEvent('inbox:open-dm'")
    expect(bridge).toContain("document.body.style.overflow = 'hidden'")
    expect(forumRoot).toContain('ql7-support:open-thread')
    expect(forumRoot).toContain("params.get('ql7SupportOpen') === '1'")
    expect(forumRoot).toContain('fetchQl7SupportRuntimeState')
    expect(forumRoot).toContain('setVideoFeedOpenBridge(false)')
    expect(forumRoot).toContain("for (const key of ['ql7SupportOpen', 'dmUser', 'inbox'])")
    expect(contactPage).toContain("redirect('/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support')")
    expect(appShell).toContain('ql7SupportOpen=1')
    expect(actionRegistry).toContain('ql7SupportOpen=1')
    expect(siteIndex).toContain("path: '/contact'")
    expect(siteIndex).toContain('Legacy contact page is disabled')
  })

  test('blocks ordinary profile/block actions from treating support as a user', () => {
    expect(read('app/api/dm/block/route.js')).toContain('ql7_support_cannot_block')
    expect(read('app/api/dm/unblock/route.js')).toContain('supportThread: true')
    expect(read('app/api/profile/save-nick/route.js')).toContain('reserved_nick')
    expect(read('app/api/profile/check-nick/route.js')).toContain('reserved: true')
    expect(read('app/forum/features/profile/utils/profileCache.js')).toContain('isQl7SupportId(userId)')
    expect(read('app/forum/features/profile/components/AvatarEmoji.jsx')).toContain('QL7_SUPPORT_AVATAR_URL')
  })

  test('renders official support popover instead of regular user profile and keeps composer text-only', () => {
    expect(existsSync(resolve(root, 'app/forum/features/dm/components/Ql7SupportPopover.jsx'))).toBe(true)
    for (const file of [
      'app/forum/features/dm/components/DmDialogRow.jsx',
      'app/forum/features/dm/components/DmThreadHeader.jsx',
      'app/forum/features/dm/components/DmThreadMessageRow.jsx',
    ]) {
      const source = read(file)
      expect(source).toContain('Ql7SupportPopover')
      expect(source).toContain('isQl7SupportId')
    }

    expect(read('app/forum/ForumRoot.jsx')).toContain('const dmSupportMode = supportActive && !!dmMode && isQl7SupportId(dmWithUserId)')
    expect(read('app/forum/ForumRoot.jsx')).toContain('const openQl7SupportThread = useCallback')
    expect(read('app/forum/ForumRoot.jsx')).toContain('QL7_SUPPORT_ID')
    expect(read('app/forum/features/dm/components/DmDialogsPane.jsx')).toContain('dmSupportLauncherBtn')
    expect(read('app/forum/features/dm/components/DmDialogsPane.jsx')).toContain('ql7_support_open_cta')
    const dmStyles = read('app/forum/styles/modules/dmStyles.js')
    const popover = read('app/forum/features/dm/components/Ql7SupportPopover.jsx')
    expect(dmStyles).toContain('dmSupportLauncherRail')
    expect(dmStyles).toContain('.ql7SupportPopoverLayer')
    expect(dmStyles).toContain('.ql7SupportPopoverShield')
    expect(popover).toContain('data-ql7-support-popover-layer="true"')
    expect(popover).toContain('ql7SupportPopoverShield')
    expect(popover).toContain('stopPropagation')
    expect(popover).not.toContain("document.addEventListener('pointerdown'")
    expect(read('app/forum/features/ui/components/ComposerActionRail.jsx')).toContain('if (dmSupportMode)')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('dmSupportMode = false')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('!dmSupportMode && pendingSticker?.src')
    expect(popover).not.toContain('Verified support')
  })

  test('renders one localized static/video support operator instead of duplicated support badges', () => {
    expect(existsSync(resolve(root, 'app/forum/features/dm/components/Ql7SupportOperator.jsx'))).toBe(true)
    const operator = read('app/forum/features/dm/components/Ql7SupportOperator.jsx')
    const inboxHeader = read('app/forum/features/dm/components/InboxTabsHeader.jsx')
    const pane = read('app/forum/features/dm/components/DmMessagesPane.jsx')
    const header = read('app/forum/features/dm/components/DmThreadHeader.jsx')
    const dmStyles = read('app/forum/styles/modules/dmStyles.js')
    const supportGlobalStyles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')

    expect(QL7_SUPPORT_OPERATOR_STATES_V4).toHaveLength(10)
    expect(QL7_SUPPORT_OPERATOR_STATES_V4).toEqual([
      'idle',
      'greeting',
      'understanding',
      'checking',
      'analyzing',
      'preparing_response',
      'answer_ready',
      'needs_clarification',
      'attention_required',
      'temporarily_unavailable',
    ])
    expect(QL7_SUPPORT_PUBLIC_OPERATOR_STATES_V5).toEqual(QL7_SUPPORT_OPERATOR_STATES_V4)
    expect(QL7_SUPPORT_OPERATOR_VIDEO_STATES_V5).toEqual(['understanding', 'checking', 'analyzing', 'preparing_response'])
    expect(QL7_SUPPORT_OPERATOR_STATIC_STATES_V5).toEqual([
      'idle',
      'greeting',
      'answer_ready',
      'needs_clarification',
      'attention_required',
      'temporarily_unavailable',
    ])
    expect(operator).toContain('QL7_SUPPORT_OPERATOR_STATES')
    expect(operator).toContain('ql7_support_operator_')
    expect(operator).toContain('translated !== key')
    expect(operator).toContain("'data-ql7-support-operator': '1'")
    expect(operator).toContain("'/ql7/static.png'")
    expect(operator).toContain("'/ql7/video.mp4'")
    expect(operator).toContain('defaultMuted')
    expect(operator).toContain('playsInline')
    expect(operator).toContain('data-ql7-operator-media-fallback')
    expect(operator).toContain('data-ql7-operator-label-fit')
    expect(operator).toContain('data-ql7-operator-mobile-fit')
    expect(operator).toContain('data-ql7-operator-video-states')
    expect(operator).toContain('data-ql7-operator-static-states')
    expect(operator).toContain('data-ql7-operator-video-session-id')
    expect(operator).toContain('data-ql7-operator-stop-after-current-loop')
    expect(operator).toContain('one-operation-one-session-graceful-stop-after-current-loop')
    expect(operator).not.toContain('currentTime = 0')
    expect(operator).toContain('ql7SupportOperatorLabelText')
    expect(operator).toContain('ql7SupportOperatorCursor')
    expect(operator).not.toContain('<svg')
    expect(operator).not.toContain('ql7SupportOperatorSvg')
    expect(header).toContain('data-support-thread={isSupportThread ?')
    expect(header).toContain("data-ql7-support-identity-sticky={isSupportThread ? '0' : undefined}")
    expect(header).not.toContain('<Ql7SupportOperator')
    expect(header).not.toContain('seed={`${threadUid}:${supportCaseId ||')
    expect(header).not.toContain('dmThreadPresenceBadge system')
    expect(pane).toContain('className="dmSupportThreadStage"')
    expect(pane).toContain('className="ql7SupportOperatorStickySlot"')
    expect(pane).toContain('data-ql7-operator-sticky-slot="media-only"')
    expect(pane).toContain('data-ql7-operator-sticky-target="static-video-only"')
    expect(pane).toContain('data-ql7-operator-native-slot="identity-plate-right"')
    expect(pane).toContain('<Ql7SupportOperator')
    expect(inboxHeader).toContain('data-ql7-quantum-messenger-sticky-owner="title-tabs"')
    expect(inboxHeader).toContain('data-ql7-quantum-messenger-sticky-measure="resize-observer-height"')
    expect(inboxHeader).toContain('new ResizeObserver(publishStickyStackHeight)')
    expect(inboxHeader).toContain('--ql7-quantum-messenger-sticky-height')
    expect(inboxHeader).not.toMatch(/addEventListener\(['"]scroll|requestAnimationFrame/u)
    expect(dmStyles).toContain('--ql7-quantum-messenger-sticky-top')
    expect(dmStyles).toContain('--ql7-quantum-messenger-sticky-height:92px')
    expect(dmStyles).toContain('--ql7-support-operator-sticky-gap:6px')
    expect(dmStyles).toContain('position:sticky; top:var(--ql7-quantum-messenger-sticky-top); z-index:48')
    expect(dmStyles).toContain('.inboxTabs{')
    expect(dmStyles).toContain('position:relative; top:auto')
    expect(dmStyles).toContain('@media (prefers-reduced-motion: reduce)')
    expect(dmStyles).not.toContain('ql7SupportOperatorSvg')
    expect(dmStyles).not.toContain('ql7SupportPlaneSend')
    expect(supportGlobalStyles).toContain('.ql7SupportOperator')
    expect(supportGlobalStyles).toContain('ql7SupportOperatorMediaFrame')
    expect(supportGlobalStyles).toContain('aspect-ratio:16/9')
    expect(supportGlobalStyles).toContain('--ql7-operator-h:clamp(100px,12vw,126.6667px)')
    expect(supportGlobalStyles).toContain('--ql7-operator-w:clamp(113.6px,33.6vw,192px)')
    expect(supportGlobalStyles).toContain('--ql7-operator-w:clamp(86.4px,31.2vw,131.2px)')
    expect(supportGlobalStyles).toContain('.dmSupportThreadStage')
    expect(supportGlobalStyles).toContain('.ql7SupportOperatorStickySlot')
    expect(supportGlobalStyles).toContain('position:sticky')
    expect(supportGlobalStyles).toContain('top:var(--ql7-support-operator-sticky-top)')
    expect(supportGlobalStyles).toContain('--ql7-support-operator-sticky-top:calc(var(--ql7-quantum-messenger-sticky-top,0px) + var(--ql7-quantum-messenger-sticky-height,92px) + var(--ql7-support-operator-sticky-gap,6px))')
    expect(supportGlobalStyles).toContain('.dmSupportThreadStage>.dmThreadHeader[data-ql7-support-identity-sticky="0"]')
    expect(supportGlobalStyles).toContain('position:relative!important;top:auto!important')
    expect(supportGlobalStyles).toContain('--ql7-support-operator-slot-w:clamp(89.6px,32vw,142.4px)')
    expect(supportGlobalStyles).toContain('--ql7-support-operator-slot-w:clamp(83.2px,30.4vw,118.4px)')
    expect(supportGlobalStyles).toContain('width:max-content;max-width:none;overflow:visible;text-overflow:clip')
    expect(supportGlobalStyles).toContain('object-fit:contain')
    expect(supportGlobalStyles).toContain('data-ql7-operator-overlay')
    expect(supportGlobalStyles).toContain('data-support-thread="1"')
    expect(supportGlobalStyles).toContain('ql7SupportOperatorLabelText')
    expect(supportGlobalStyles).toContain('ql7SupportOperatorCursor')
    expect(supportGlobalStyles).not.toContain('ql7SupportOperatorSvg')
    expect(supportGlobalStyles).not.toContain('ql7opAura')
    expect(supportGlobalStyles).toContain('border-radius:18px')
    expect(supportGlobalStyles).toContain('letter-spacing:0')
  })

  test('streams actual server transitions, releases expired pauses without reload and commits video on reply arrival', () => {
    const runtimeState = read('lib/ql7-support/runtimeStateMachine.js')
    const supportStateRoute = read('app/api/dm/support-state/route.js')
    const send = read('app/forum/features/dm/services/sendDmComposerMessage.js')
    const runtime = read('app/forum/features/dm/hooks/useForumDmRuntime.js')
    const policy = read('lib/ql7-support/inputPolicy.js')
    const actionRail = read('app/forum/features/ui/components/ComposerActionRail.jsx')
    expect(runtimeState).toContain('mergeRuntimeHistory')
    expect(runtimeState).toContain('history,')
    expect(runtimeState).toContain("state: 'input_ready'")
    expect(runtimeState).toContain("detailCode: 'runtime_event_expired_ready'")
    expect(supportStateRoute).toContain('history: Array.isArray(state.history)')
    expect(send).toContain('supportSeenEvents')
    expect(send).toContain('window.setInterval(() => { void pollSupportState() }, 180)')
    expect(send).toContain("normalizeQl7SupportOperatorState(supportUiState || incomingInputPolicy?.runtimeStage || 'idle')")
    expect(send).toContain("const committedState = (String(j?.replyMessageId || '').trim() || supportCommittedSeen) ? 'answer_ready' : 'preparing_response'")
    expect(send).toContain('stopSupportReplay()')
    expect(send).toContain('preserveSupportDraft = true')
    expect(runtime).toContain("supportUiState: 'answer_ready'")
    expect(runtime).toContain('window.setTimeout(release')
    expect(policy).toContain('expiredBoundedLock')
    expect(policy).toContain("runtimeStage = expiredBoundedLock")
    expect(actionRail).toContain('normalizeQl7SupportInputPolicy(rawSupportPolicy')
  })

  test('ships localized labels for every canonical operator runtime state without raw-key rendering', () => {
    const operator = read('app/forum/features/dm/components/Ql7SupportOperator.jsx')
    const runtimeKeys = QL7_SUPPORT_OPERATOR_STATES_V4.map((state) => `ql7_support_operator_${state}`)
    const removedRuntimeKeys = [
      'ql7_support_operator_accepted',
      'ql7_support_operator_receiving',
      'ql7_support_operator_validating',
      'ql7_support_operator_verifying_actor',
      'ql7_support_operator_resolving_identity',
      'ql7_support_operator_redacting',
      'ql7_support_operator_translating_in',
      'ql7_support_operator_classifying',
      'ql7_support_operator_planning',
      'ql7_support_operator_retrieving',
      'ql7_support_operator_reading_data',
      'ql7_support_operator_merging_memory',
      'ql7_support_operator_checking_evidence',
      'ql7_support_operator_clarifying',
      'ql7_support_operator_diagnosing',
      'ql7_support_operator_rendering_user',
      'ql7_support_operator_preparing_admin_report',
      'ql7_support_operator_composing',
      'ql7_support_operator_translation',
      'ql7_support_operator_translating_out',
      'ql7_support_operator_policy_guard',
      'ql7_support_operator_committing',
      'ql7_support_operator_sending',
      'ql7_support_operator_operator_pending',
      'ql7_support_operator_answer_committed',
      'ql7_support_operator_input_ready',
      'ql7_support_operator_cooldown',
      'ql7_support_operator_waiting_choice',
      'ql7_support_operator_delivered',
      'ql7_support_operator_waiting_user',
      'ql7_support_operator_waiting_admin',
      'ql7_support_operator_error',
      'ql7_support_operator_offline',
    ]
    expect(operator).toContain('translated !== key')
    for (const lang of ['en', 'ru', 'uk', 'es', 'zh', 'ar', 'tr']) {
      const dictSource = read(`components/i18n-dicts/${lang}.js`)
      for (const key of runtimeKeys) expect(dictSource, `${lang}:${key}`).toContain(`"${key}"`)
      for (const key of removedRuntimeKeys) expect(dictSource, `${lang}:${key}`).not.toContain(`"${key}"`)
    }
  })

  test('keeps support cards title-clean and exposes random simulation samples', () => {
    const fallbackSurface = read('app/forum/features/dm/components/Ql7SupportMessageSurface.jsx')
    const cardRenderer = read('app/forum/features/dm/components/Ql7SupportCard.js')
    const presentationRegistry = read('lib/ql7-support/presentation/registry.js')
    const reportRunner = read('scripts/ql7-support/v14-report.mjs')
    const simRunner = read('scripts/ql7-support/v14-sim.mjs')

    expect(fallbackSurface).toContain("ru:'Рад помочь'")
    expect(fallbackSurface).not.toContain("const TITLE={en:'QL7 Support'")
    expect(cardRenderer).toContain('displayCardTitle')
    expect(cardRenderer).toContain('SUPPORT_TITLE_FALLBACK')
    expect(presentationRegistry).toContain("greeting:'Рад помочь'")
    expect(presentationRegistry).not.toContain("greeting:'QL7 Support'")
    expect(reportRunner).toContain("action === 'random-sample'")
    expect(reportRunner).toContain('ql7.support.v14.report.random-sample')
    expect(simRunner).toContain('randomSample50')
  })

  test('declares canonical V4 pipeline stages and maps them to stable visual operator states', () => {
    expect(QL7_SUPPORT_PIPELINE_OPERATOR_STATES_V4).toEqual([
      'idle',
      'accepted',
      'receiving',
      'auth_verifying',
      'identity_resolving',
      'language_detecting',
      'translating_in',
      'context_loading',
      'intent_mapping',
      'entity_resolving',
      'data_collecting',
      'diagnosing',
      'synthesizing',
      'fact_checking',
      'clarifying',
      'composing',
      'sending',
      'delivered',
      'waiting_user',
      'waiting_admin',
      'error',
      'offline',
    ])
    expect(QL7_SUPPORT_OPERATOR_STATE_ALIASES_V4).toMatchObject({
      auth_verifying: 'checking',
      identity_resolving: 'checking',
      language_detecting: 'understanding',
      context_loading: 'understanding',
      intent_mapping: 'analyzing',
      entity_resolving: 'analyzing',
      data_collecting: 'checking',
      reading_data: 'checking',
      translation: 'preparing_response',
      operator_pending: 'attention_required',
      synthesizing: 'preparing_response',
      fact_checking: 'checking',
    })
    expect(QL7_SUPPORT_OPERATOR_STATES_V4).toEqual(QL7_SUPPORT_PUBLIC_OPERATOR_STATES_V5)
    expect(normalizeQl7SupportOperatorState('answer_committed')).toBe('answer_ready')
    expect(normalizeQl7SupportOperatorState('input_ready')).toBe('answer_ready')
    expect(normalizeQl7SupportOperatorState('cooldown')).toBe('attention_required')
    expect(normalizeQl7SupportOperatorState('waiting_choice')).toBe('needs_clarification')
    for (const stage of QL7_SUPPORT_PIPELINE_OPERATOR_STATES_V4) {
      expect(QL7_SUPPORT_OPERATOR_STATES_V4).toContain(normalizeQl7SupportOperatorState(stage))
    }
    expect(normalizeQl7SupportOperatorState('unknown-stage')).toBe('idle')
  })

  test('covers seven support languages and deterministic event messages', () => {
    expect(QL7_SUPPORT_LANGS).toEqual(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh'])
    for (const lang of QL7_SUPPORT_LANGS) {
      const text = buildQl7SupportMessage({
        eventType: 'qcoin_credit',
        locale: lang,
        payload: { amount: '777' },
      })
      expect(text).toContain('777')
      expect(text.length).toBeGreaterThan(10)
      const openText = buildQl7SupportMessage({
        eventType: 'support_thread_open',
        locale: lang,
        payload: {},
      })
      expect(openText.length).toBeGreaterThan(60)
    }

    expect(buildQl7SupportDedupeKey({
      userId: 'UserA',
      eventType: 'vip_activated',
      subjectId: 'invoice-1',
      timestamp: '2026-07-19',
    })).toBe('usera:vip_activated:invoice-1:2026-07-19')
  })

  test('classifies user support replies and builds localized adaptive acknowledgements', () => {
    expect(classifyQl7SupportRequest('VIP x2 subscription renewal')).toBe('vip')
    expect(classifyQl7SupportRequest('QCoin wallet invoice payment')).toBe('qcoin')
    expect(classifyQl7SupportRequest('video upload bug is broken')).toBe('media')
    expect(classifyQl7SupportRequest('seed phrase security warning')).toBe('security')
    expect(classifyQl7SupportRequest('hello team')).toBe('greeting')

    const firstReply = buildQl7SupportAutoReply({
      locale: 'ru',
      topic: 'vip',
      mode: 'new',
      seed: 'user-a:1',
    })
    const followupReply = buildQl7SupportAutoReply({
      locale: 'uk',
      topic: 'technical',
      mode: 'followup',
      seed: 'user-a:2',
    })
    const greetingReply = buildQl7SupportAutoReply({
      locale: 'ru',
      topic: 'greeting',
      mode: 'new',
      seed: 'user-a:hello',
    })
    expect(firstReply).toContain('VIP')
    expect(firstReply.length).toBeGreaterThan(80)
    expect(followupReply).toContain('технічна')
    expect(followupReply.length).toBeGreaterThan(70)
    expect(greetingReply).toMatch(/Здравствуйте|Приветствую|Добрый день/)
  })

  test('declares the premium case engine as Mongo primary memory with explicit roles, topics, and secret redaction', () => {
    expect(QL7_SUPPORT_CASE_COLLECTION).toBe('ql7_support_cases')
    expect(QL7_SUPPORT_CASE_STATUSES).toEqual(expect.arrayContaining([
      'opened',
      'collecting_context',
      'ready_for_diagnostic',
      'awaiting_admin',
      'partial',
      'resolved',
      'superseded',
    ]))
    expect(QL7_SUPPORT_REPLY_ROLES).toEqual(expect.arrayContaining([
      'greeting',
      'informational_question',
      'problem_description',
      'answer_to_question',
      'status_request',
      'new_unrelated_issue',
    ]))

    const radar = analyzeQl7SupportRequest({
      text: 'Что такое CryptoRadar и как им пользоваться?',
      locale: 'ru',
    })
    expect(radar).toMatchObject({
      topic: 'crypto_radar',
      selectedLocale: 'ru',
      translationStatus: 'native',
    })
    expect(['informational_question', 'how_to_question']).toContain(radar.role)
    const radarReply = buildQl7SupportPlannedReply({ analysis: radar, locale: 'ru', seed: 'contract:radar' })
    expect(radarReply.text).toContain('CryptoRadar')
    expect(radarReply.text).not.toMatch(/I see this is about|request is registered/i)

    const adsUk = analyzeQl7SupportRequest({
      text: 'Проблеми з рекламою',
      locale: 'uk',
    })
    const adsUkReply = buildQl7SupportPlannedReply({ analysis: adsUk, locale: 'uk', seed: 'contract:ads-uk' })
    expect(adsUkReply.text).toContain('що зараз видно')
    expect(adsUkReply.text).toContain('приблизний час')
    expect(adsUkReply.text).not.toMatch(/\b(?:screen|action|time)\b|екран/i)

    const battle = analyzeQl7SupportRequest({
      text: 'BattleCoin order failed with error 500 on LONG',
      locale: 'en',
    })
    expect(battle).toMatchObject({
      topic: 'battlecoin',
      caseStatus: 'ready_for_diagnostic',
      diagnosticStatus: 'ready',
    })
    expect(battle.entities).toMatchObject({ errorCode: '500', orderSide: 'long' })

    const secret = redactQl7SupportSecrets('private key: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    expect(secret).toContain('[secret-redacted]')
    expect(secret).not.toContain('aaaaaaaaaaaaaaaa')
  })

  test('keeps the conversational brain out of monolithic prepared answer slabs', () => {
    const caseEngine = read('lib/ql7-support/caseEngine.js')
    const speechEngine = read('lib/ql7-support/speechEngine.js')
    const catalog = read('lib/ql7-support/ecosystemCatalog.js')

    expect(caseEngine).not.toContain('const KNOWLEDGE')
    expect(caseEngine).not.toContain('const QUESTION_BANK')
    expect(caseEngine).not.toContain('const UI_TEXT')
    expect(caseEngine).toContain('QUESTION_TARGETS')
    expect(caseEngine).toContain('composeQl7SupportSemanticReply')
    expect(caseEngine).toContain('composeQl7SupportControlReply')
    expect(speechEngine).toContain('composeQl7SupportSemanticReply')
    expect(speechEngine).toContain('composeQl7SupportControlReply')
    expect(catalog).toContain('QL7_SUPPORT_ECOSYSTEM_TOPICS')
  })

  test('wires support events only through server-side domain confirmations', () => {
    const events = read('lib/ql7-support/events.js')
    const scheduler = read('lib/ql7-support/scheduler.js')
    const broadcast = read('lib/ql7-support/broadcast.js')

    for (const name of [
      'notifyQl7Welcome',
      'notifyQl7QcoinCredited',
      'notifyQl7VipActivated',
      'notifyQl7VipExpiring',
      'notifyQl7VipExpired',
      'notifyQl7AdsActivated',
      'notifyQl7AdsMetricsWeekly',
      'notifyQl7AdsExpiring',
      'notifyQl7AdsFinalSummary',
      'notifyQl7ReportReceived',
      'notifyQl7ReportThreshold',
      'notifyQl7PostRemoved',
      'notifyQl7MediaLock',
      'notifyQl7RulesWarning',
      'notifyQl7Broadcast',
      'notifyQl7Security',
    ]) {
      expect(events).toContain(`export async function ${name}`)
    }

    const threadRoute = read('app/api/dm/thread/route.js')
    const supportEntryRoute = read('app/api/dm/support-entry/route.js')
    expect(read('app/api/wallet-session/route.js')).toContain('notifyQl7Welcome')
    expect(threadRoute).not.toContain('support_thread_open')
    expect(threadRoute).not.toContain('deliverQl7SupportEvent')
    expect(threadRoute).toContain('strictSupportThread: isSupportThread')
    expect(supportEntryRoute).toContain('createQl7SupportEntryGreetingV8')
    expect(read('app/api/qcoin/topup/webhook/route.js')).toContain('notifyQl7QcoinCredited')
    expect(read('lib/subscriptions.js')).toContain('notifyQl7VipActivated')
    expect(read('lib/adsCore.js')).toContain('notifyQl7AdsActivated')
    expect(read('app/api/forum/report/route.js')).toContain('notifyQl7ReportReceived')
    expect(read('app/api/forum/report/route.js')).toContain('notifyQl7MediaLock')
    expect(read('app/api/forum/report/route.js')).toContain('notifyQl7RulesWarning')

    expect(scheduler).toContain('runQl7SupportVipScheduler')
    expect(scheduler).toContain('runQl7SupportAdsScheduler')
    expect(scheduler).toContain('dryRun = true')
    expect(scheduler).toContain("storagePrimary: 'mongo'")
    expect(scheduler).toContain('notifyQl7VipExpiring')
    expect(scheduler).toContain('notifyQl7AdsMetricsWeekly')
    expect(scheduler).toContain('notifyQl7AdsFinalSummary')

    expect(broadcast).toContain('runQl7SupportBroadcast')
    expect(broadcast).toContain('dryRun = true')
    expect(broadcast).toContain('Math.min(25')
    expect(broadcast).toContain('QL7_SUPPORT_DM_BROADCAST_ENABLED')
    expect(broadcast).toContain('QL7_SUPPORT_DM_BROADCAST_TOKEN')
    expect(broadcast).toContain('QL7_SUPPORT_BROADCAST_ADMIN_IDS')
    expect(broadcast).toContain('parseQl7SupportBroadcastCommand')
    expect(broadcast).toContain("configuredPrefix || 'Admin'")
    expect(broadcast).toContain('maybeRunQl7SupportDmBroadcastCommand')
    expect(broadcast).toContain('resolveQl7SupportBroadcastRecipients')
    expect(broadcast).toContain('runQl7SupportBroadcastToEcosystem')
    const sendRoute = read('app/api/dm/send/route.js')
    const broadcastGateIndex = sendRoute.indexOf('maybeRunQl7SupportDmBroadcastCommand')
    const supportUrlBlockIndex = sendRoute.indexOf('ql7SupportContainsUserUrlV9(text)')
    expect(sendRoute).toContain('maybeRunQl7SupportDmBroadcastCommand')
    expect(broadcastGateIndex).toBeGreaterThan(-1)
    expect(supportUrlBlockIndex).toBeGreaterThan(-1)
    expect(broadcastGateIndex).toBeLessThan(supportUrlBlockIndex)
    expect(broadcast).toContain('message: cleanMessage')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('dmSupportBroadcastCommandMode')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('/^\\s*Admin\\b/iu')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('ql7_support_broadcast_sent')
    expect(existsSync(resolve(root, 'app/api/ql7-support'))).toBe(false)
  })

  test('declares planetary support diagnostics as read-only Mongo evidence, not business mutation logic', () => {
    expect(QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION).toBe('ql7_support_diagnostic_runs')
    expect(QL7_SUPPORT_ECOSYSTEM_TOPICS).toEqual([
      'platform',
      'homepage',
      'news',
      'exchange',
      'exchange_ai',
      'battlecoin',
      'battle_chat',
      'futures',
      'academy',
      'academy_exam',
      'gameverse',
      'metastudio',
      'metaverse',
      'forum_feed',
      'forum_threads',
      'search',
      'geodetect',
      'media',
      'moderation',
      'metamarket',
      'quantum_family',
      'profile',
      'auth',
      'wallet',
      'telegram',
      'qcoin',
      'payments',
      'vip',
      'ads_packages',
      'ads_campaigns',
      'push',
      'messenger',
      'quests',
      'contact',
      'privacy',
      'security',
      'account_deletion',
      'navigation',
      'roadmap',
      'system_status',
      'localization',
      'accessibility',
      'support_system',
    ])
    expect(QL7_SUPPORT_ECOSYSTEM_DIAGNOSTIC_TOPICS).toEqual(QL7_SUPPORT_ECOSYSTEM_TOPICS)
    expect(QL7_SUPPORT_GENERIC_DIAGNOSTIC_BRANCHES).toEqual([
      'no_source',
      'source_present',
      'healthy',
      'inconsistent',
      'foreign_account',
      'mongo_unavailable',
      'timeout',
    ])
    for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
      expect(getQl7SupportReadCollections(topic).length).toBeGreaterThan(0)
      expect(getQl7SupportDiagnosticBranches(topic).length).toBeGreaterThan(0)
    }
    expect(QL7_SUPPORT_QCOIN_DIAGNOSTIC_BRANCHES).toEqual([
      'qcoin_balance_ok',
      'qcoin_security_evidence',
      'invoice_missing',
      'pending',
      'paid_without_webhook',
      'webhook_without_ledger',
      'ledger_balance_ok',
      'credit_failed',
      'underpaid',
      'invalid',
      'multiple_invoices',
      'foreign_account',
      'mongo_unavailable',
      'timeout',
    ])
    expect(QL7_SUPPORT_ADS_DIAGNOSTIC_BRANCHES).toEqual([
      'ads_package_missing',
      'ads_package_active',
      'ads_package_expired',
      'ads_campaign_active',
      'ads_campaign_finished',
      'ads_metrics_ok',
      'ads_zero_metrics',
      'ads_multiple_packages',
      'foreign_account',
      'mongo_unavailable',
      'timeout',
    ])

    const diagnostics = read('lib/ql7-support/diagnostics.js')
    const adsAdapter = read('lib/ql7-support/adsSupportReadAdapterV9.js')
    const server = read('lib/ql7-support/server.js')
    expect(diagnostics).toContain("businessCollectionsWritten: []")
    expect(diagnostics).toContain('qcoin_topup_invoices')
    expect(diagnostics).toContain('qcoin_topup_events')
    expect(diagnostics).toContain('qcoin_ledger')
    expect(diagnostics).toContain('qcoin_accounts')
    expect(diagnostics).toContain('ads_kv')
    expect(diagnostics).toContain('ads_sets')
    expect(diagnostics).toContain('adsSupportReadAdapterV9')
    expect(diagnostics).toContain('QL7_SUPPORT_ADS_READ_COLLECTIONS_V9')
    expect(adsAdapter).toContain("'ads_analytics'")
    expect(adsAdapter).toContain('getAnalyticsForCampaign')
    expect(diagnostics).not.toContain("collection('ads_metrics')")
    expect(diagnostics).toContain('runQl7SupportGenericDomainDiagnostic')
    expect(diagnostics).toContain('QL7_SUPPORT_ECOSYSTEM_DIAGNOSTIC_TOPICS')
    expect(diagnostics).not.toContain('unsupported_topic')
    expect(diagnostics).not.toContain(".collection('qcoin_topup_invoices').update")
    expect(diagnostics).not.toContain(".collection('qcoin_accounts').update")
    expect(diagnostics).not.toContain(".collection('qcoin_ledger').insert")
    expect(diagnostics).not.toContain(".collection('ads_kv').update")
    expect(diagnostics).not.toContain(".collection('ads_sets').insert")
    expect(server).toContain('runQl7SupportPremiumDiagnostic')
    expect(server).toContain('isQl7SupportDiagnosticTopic(requestContext?.topic)')
    expect(server).toContain('tone.safetyEscalation !== true')
    expect(server).toContain('requestContext?.conversationDecision?.shouldDiagnose === true')
    expect(server).toContain('lastDiagnosticBranch')
    const secretEmailIndex = server.indexOf("if (analysis?.entities?.hasSecret) return 'security_secret_redacted'")
    const explicitSuppressionIndex = server.indexOf("if (decision?.emailMaterial === false && !diagnosticResult?.branch) return ''")
    const ordinarySuppressionIndex = server.indexOf("if (nonMaterialActs.has(role)) return ''")
    expect(secretEmailIndex).toBeGreaterThan(-1)
    expect(secretEmailIndex).toBeLessThan(explicitSuppressionIndex)
    expect(secretEmailIndex).toBeLessThan(ordinarySuppressionIndex)
    expect(server).toContain('const inputHadSecret = Boolean(')
    expect(server).toContain("String(languageInput?.originalText ?? '') !== String(languageInput?.redactedText ?? '')")
    expect(server).toContain('hasSecret: inputHadSecret || analyzedRequest?.entities?.hasSecret === true')
  })

  test('supports signed Card V4 with V9 metric whitelist and safe actions', () => {
    const card = buildQl7SupportCardV4({
      kind: 'data_table',
      locale: 'ru',
      title: 'Баланс QCoin',
      summary: 'Проверено по текущей сессии.',
      metrics: [
        { key: 'account_balance', value: 42 },
        { key: 'raw_secret_metric', value: 'must not render' },
      ],
      actions: [
        { id: 'open-wallet', routeId: 'wallet', label: 'Подробнее' },
        { id: 'bad', href: 'https://evil.example', label: 'Bad' },
      ],
    })
    expect(card).toMatchObject({
      version: 4,
      schema: 'ql7.support.card.v4',
      metrics: [expect.objectContaining({
        key: 'balance',
        label: 'Баланс',
        value: '42',
        format: 'decimal',
        tone: 'neutral',
        visibility: 'both',
      })],
      actions: [expect.objectContaining({ routeId: 'wallet' })],
    })
    expect(card.metrics).toHaveLength(1)
    expect(card.actions).toHaveLength(1)
    expect(validateQl7SupportCardAnyVersion(card).ok).toBe(true)
  })

  test('generates support wording from semantic slots instead of fixed complete replies', () => {
    const first = realizeQl7SemanticSurfaceV9({
      locale: 'ru',
      category: 'identity',
      topic: 'support_system',
      seed: 'identity:a',
    })
    const second = realizeQl7SemanticSurfaceV9({
      locale: 'ru',
      category: 'identity',
      topic: 'support_system',
      seed: 'identity:b',
    })
    const humor = realizeQl7SemanticSurfaceV9({
      locale: 'es',
      category: 'humor',
      topic: 'qcoin',
      seed: 'humor:a',
    })
    expect(first).toContain('Quantum L7 AI Global')
    expect(second).toContain('Quantum L7 AI Global')
    expect(first).not.toBe(second)
    expect(humor).not.toMatch(/\bI can check\b/u)
    expect(read('lib/ql7-support/naturalLanguageRealizer.js')).toContain('realizeQl7SemanticSurfaceV9')
    expect(read('lib/ql7-support/responsePlan.js')).toContain("category: 'repeat'")
  })

  test('declares a complete read-only scenario matrix for every ecosystem domain', () => {
    expect(QL7_SUPPORT_DOMAIN_SCENARIO_ACTS_V4).toEqual([
      'overview',
      'how_to',
      'self_status',
      'incident',
      'bare_identifier',
      'correction',
      'status_followup',
      'ambiguous_alias',
      'unknown_language',
      'provider_failure',
      'mongo_unavailable',
      'injection_attempt',
      'profanity_frustration',
      'duplicate_send',
      'old_message_echo',
      'long_conversation',
      'close_reopen',
      'foreign_account',
    ])

    for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
      const plan = buildQl7SupportDomainPlan({
        analysis: { topic, originalText: `${topic} status for my account` },
        locale: 'en',
      })
      expect(plan).toMatchObject({
        topic,
        sourcePolicy: 'source_of_truth_first_no_claimed_status_without_evidence',
      })
      expect(plan.label.length).toBeGreaterThan(2)
      expect(plan.scope.length).toBeGreaterThan(16)
      expect(plan.aliases.length).toBeGreaterThan(0)
      expect(plan.knowledge.length).toBeGreaterThan(0)
      expect(plan.readCollections.length).toBeGreaterThan(0)
      expect(plan.diagnosticBranches.length).toBeGreaterThan(0)
      expect(plan.readAdapter).toMatchObject({
        id: `${topic}:read_only_adapter`,
        registry: 'ql7_support_source_registry',
        executor: 'runQl7SupportPremiumDiagnostic',
        contractVersion: 1,
        readOnly: true,
        bounded: true,
      })
      expect(plan.readAdapter.collections).toEqual(plan.readCollections)
      expect(plan.userRenderer).toBe(`${topic}:safe_user_renderer`)
      expect(plan.adminRenderer).toBe(`${topic}:premium_admin_report_renderer`)
      expect(plan.safeActions).toEqual(['reply', 'ask_one_question', 'read_only_diagnostic', 'admin_report'])
      expect(plan.forbiddenActions).toEqual([
        'mutate_business_state',
        'reveal_secrets',
        'promise_profit',
        'impersonate_human_admin',
      ])
      expect(plan.scenarioMatrix).toHaveLength(QL7_SUPPORT_DOMAIN_SCENARIO_ACTS_V4.length)
      expect(plan.scenarioMatrix.map((item) => item.act)).toEqual(QL7_SUPPORT_DOMAIN_SCENARIO_ACTS_V4)
      for (const scenario of plan.scenarioMatrix) {
        expect(scenario).toMatchObject({
          topic,
          storagePrimary: 'mongo',
          redisUse: 'runtime_impulse_only',
          readOnly: true,
          destructiveAction: false,
        })
      }
    }
  })

  test('renders structured premium HTML admin reports for support DM evidence', () => {
    const supportEmailTransport = read('lib/supportEmailTransport.js')
    expect(supportEmailTransport).toContain('export function buildSupportEmailReport')
    expect(supportEmailTransport).toContain('export function renderSupportEmailHtml')
    expect(supportEmailTransport).toContain('<table')
    expect(supportEmailTransport).toContain('Recommended action')
    expect(supportEmailTransport).toContain('Domain plan')
    expect(supportEmailTransport).toContain('Diagnostic evidence')
    expect(supportEmailTransport).toContain('User message')
    expect(supportEmailTransport).toContain('html: renderSupportEmailHtml(emailReport)')
    expect(read('lib/ql7-support/server.js')).toContain('diagnosticResult')
    expect(read('lib/ql7-support/server.js')).toContain('recommendedAction')
    expect(read('lib/ql7-support/server.js')).toContain('privacyBoundary')
  })

  test('plans broadcasts without importing realtime push in contract tests', () => {
    const broadcast = read('lib/ql7-support/broadcast.js')
    expect(broadcast).toContain('export function planQl7SupportBroadcast')
    expect(broadcast).toContain('dryRun: true')
    expect(broadcast).toContain('totalRecipients: ids.length')
    expect(broadcast).toContain("realtimeLayer: 'existing_dm_push'")
    expect(broadcast).toContain('if (dryRun !== false) return plan')
  })

  test('keeps UI dictionaries and source registry synchronized for support keys', () => {
    const keys = [
      'ql7_support_label',
      'ql7_support_display_name',
      'ql7_support_verified',
      'ql7_support_system_contact',
      'ql7_support_thread_title',
      'ql7_support_avatar_alt',
      'ql7_support_popover_title',
      'ql7_support_popover_body',
      'ql7_support_popover_can_help',
      'ql7_support_popover_text_only',
      'ql7_support_popover_security',
      'ql7_support_text_only',
      'ql7_support_open_cta',
      'ql7_support_open_hint',
      'ql7_support_broadcast_sent',
      'ql7_support_operator_idle',
      'ql7_support_operator_greeting',
      'ql7_support_operator_understanding',
      'ql7_support_operator_checking',
      'ql7_support_operator_analyzing',
      'ql7_support_operator_preparing_response',
      'ql7_support_operator_answer_ready',
      'ql7_support_operator_needs_clarification',
      'ql7_support_operator_attention_required',
      'ql7_support_operator_temporarily_unavailable',
    ]
    for (const lang of QL7_SUPPORT_LANGS) {
      const dict = read(`components/i18n-dicts/${lang}.js`)
      for (const key of keys) expect(dict).toContain(`"${key}"`)
    }
    const source = read('components/i18n.source.js')
    for (const key of keys) expect(source).toContain(key)
    const popoverExpectations = {
      en: ['intelligent contour', 'verified session', 'aliases', 'facts allow it', 'safety review', "another user's ID"],
      ru: ['интеллектуальный контур', 'verified session', 'алиасы', 'где есть факты', 'проверки безопасности', 'ID другого пользователя'],
      uk: ['інтелектуальним контуром', 'verified session', 'аліаси', 'де є факти', 'перевірки безпеки', 'ID іншого користувача'],
      es: ['contorno inteligente', 'sesión verificada', 'alias', 'cuando existen hechos', 'revisión de seguridad', 'ID de otro usuario'],
      tr: ['akıllı konturdur', 'doğrulanmış oturum', 'aliaslarınızı', 'kanıt varsa', 'güvenlik incelemesine', 'başka bir kullanıcının ID'],
      ar: ['محيط ذكي رسمي', 'جلستك الموثقة', 'أسماءك البديلة', 'عندما توجد حقائق', 'مراجعة أمنية', 'ID مستخدم آخر'],
      zh: ['官方智能轮廓', '已验证会话', '别名', '事实依据', '安全审核', '其他用户的 ID'],
    }
    for (const [lang, markers] of Object.entries(popoverExpectations)) {
      const dict = read(`components/i18n-dicts/${lang}.js`)
      for (const marker of markers) expect(dict).toContain(marker)
    }
  })
  test('pins V6 gold topic calibration and replay proof', () => {
    const catalog = read('lib/ql7-support/ecosystemCatalog.js')
    const analyzer = read('lib/ql7-support/semantics/analyzeTurn.js')
    const calibration = read('lib/ql7-support/semantics/routeCalibration.js')
    const proof = read('scripts/ql7-support/v14-gold-topic-calibration-proof.mjs')
    expect(catalog).toContain('normalizeCatalogSearchText')
    expect(catalog).toContain("'academy exam'")
    expect(catalog).toContain("'authorization'")
    expect(catalog).toContain("'payments'")
    expect(analyzer).toContain("explicitCatalogTopic!=='metamarket'")
    expect(analyzer).toContain("catalog_exact_label")
    expect(calibration).toContain("QL7_SUPPORT_ROUTE_CALIBRATION_VERSION_V13 = '13.0.2'")
    expect(proof).toContain('KNOWN_FAILURE_INDICES')
    expect(proof).toContain('reported-73-full-runtime-replay')
    expect(proof).toContain('gold-5000-topic-sweep')
    expect(proof).toContain('GOLD_TOPIC_SWEEP_COUNT = 5000')
  })

})

describe('QL7 Support V8 integration Ads package calibration contracts', () => {
  test('does not convert an empty catalog miss into an explicit support_system match', () => {
    const raw = classifyQl7SupportCatalogTopic(
      'Muestra el estado general del sistema sin hablar de publicidad',
      '',
    )
    expect(raw).toBe('')
    expect(normalizeQl7SupportTopic(raw)).toBe('support_system')

    const analyzer = read('lib/ql7-support/semantics/analyzeTurn.js')
    expect(analyzer).toContain("function explicitCatalogTopicFor(text='')")
    expect(analyzer).toContain("return raw?normalizeQl7SupportTopic(raw):''")
    expect(analyzer.match(/explicitCatalogTopicFor\(text\)/gu)).toHaveLength(3)
    expect(analyzer).not.toContain("normalizeQl7SupportTopic(classifyQl7SupportCatalogTopic(text,''))")
  })

  test('declares Spanish singular Ads package aliases and the V8 runtime proof', () => {
    const catalog = read('lib/ql7-support/ecosystemCatalog.js')
    const routeCalibration = read('lib/ql7-support/semantics/routeCalibration.js')
    const proof = read('scripts/ql7-support/v14-integration-ads-package-calibration-proof.mjs')

    expect(catalog).toContain("'paquete publicitario'")
    expect(catalog).toContain("'paquete de publicidad'")
    expect(routeCalibration).toContain("QL7_SUPPORT_ROUTE_CALIBRATION_VERSION_V13 = '13.0.2'")
    expect(routeCalibration).toContain("['ads_packages'")
    expect(proof).toContain('source-51-full-runtime-replay')
    expect(proof).toContain('integration-5000-full-runtime-sweep')
    expect(proof).toContain('personal_status_request')
    expect(proof).toContain('ql7.table.ads.package')
    expect(proof).toContain("routeId === 'ads_packages'")
  })
})

describe('QL7 Support V10 adversarial resilience contracts', () => {
  test('pins locale-safe normalization, protected boundaries and the source-818 replay proof', () => {
    const normalizer = read('lib/ql7-support/language/normalizeInput.js')
    const analyzer = read('lib/ql7-support/semantics/analyzeTurn.js')
    const safety = read('lib/ql7-support/safety/evaluateTurn.js')
    const mutations = read('lib/ql7-support/simulation/mutationEngine.js')
    const scenarios = read('lib/ql7-support/simulation/scenarioCatalog.js')
    const oracle = read('lib/ql7-support/simulation/independentOracle.js')
    const proof = read('scripts/ql7-support/v14-adversarial-resilience-calibration-proof.mjs')

    expect(normalizer).toContain("QL7_SUPPORT_NORMALIZE_INPUT_VERSION = '14.14.3'")
    expect(normalizer).toContain('repairHighSignalDeletionTypos')
    expect(normalizer).toContain("тыидиот:'ты идиот'")
    expect(normalizer).toContain('const known=MERGED_REPAIRS[lower];if(known)return known;if(source.length<8)return source')
    expect(normalizer).toContain('IP(?=\\s*(?:激活|状态|active|status')
    expect(analyzer).toContain("QL7_SUPPORT_ANALYZE_TURN_VERSION='14.15.7'")
    expect(analyzer).toContain("return'reported_speech'")
    expect(analyzer).toContain("return'security_boundary'")
    expect(analyzer).toContain("if(SCAM_CRIME.test(text))return'incident_report'")
    expect(analyzer).toContain("if(SCAM_CRIME.test(text)&&!hasTheftSignal(text))return'security'")
    expect(analyzer).toContain('\\b(?:price|rate|quote|market|chart|ticker)\\b')
    expect(safety).toContain('const quoted=')
    expect(mutations).toContain("case 'ellipsis'")
    expect(mutations).toContain("case 'short'")
    expect(scenarios).toContain("family==='quoted'")
    expect(scenarios).toContain("messageAct:'reported_speech'")
    expect(oracle).toContain('expected.noAdapter')
    expect(proof).toContain('SOURCE_FAILURE_COUNT = 818')
    expect(proof).toContain('source818FullRuntimeReplay')
    expect(proof).toContain('tenSeedGeneralization')
    expect(proof).toContain('allLaboratoryProfileSmoke')
    expect(proof).toContain('TEN_SEED_COUNT = 10')
    expect(proof).toContain('SCENARIOS_PER_SEED = 250')
    expect(proof).toContain('totalScenarios: TEN_SEED_COUNT * SCENARIOS_PER_SEED')
  })
})


describe('QL7 Support V11 unified intelligence contracts', () => {
  test('pins fact projection, calibrated insult and media-only sticky operator contracts', () => {
    const fact = read('lib/ql7-support/data/factProjection.js')
    const assessment = read('lib/ql7-support/safety/insultAssessment.js')
    const state = read('lib/ql7-support/safety/insultStateMachine.js')
    const inboxHeader = read('app/forum/features/dm/components/InboxTabsHeader.jsx')
    const pane = read('app/forum/features/dm/components/DmMessagesPane.jsx')
    const header = read('app/forum/features/dm/components/DmThreadHeader.jsx')
    const operator = read('app/forum/features/dm/components/Ql7SupportOperator.jsx')
    const dmStyles = read('app/forum/styles/modules/dmStyles.js')
    const styles = read('app/forum/styles/modules/ql7SupportGlobalStyles.js')
    const operatorProof = read('scripts/ql7-support/v14-operator-sticky-contract-proof.mjs')
    const profileProof = read('scripts/ql7-support/v14-v11-profile-smoke-proof.mjs')
    const analyzer = read('lib/ql7-support/semantics/analyzeTurn.js')
    const runtime = read('lib/ql7-support/runtime/executeTurn.js')
    const productionTurn = read('lib/ql7-support/runtime/productionTurn.js')
    const simulation = read('lib/ql7-support/simulation/executeScenario.js')
    const parityHarness = read('lib/ql7-support/simulation/productionParityHarness.js')
    const report = read('scripts/ql7-support/v14-report.mjs')
    const learningPipeline = read('lib/ql7-support/learningPipeline.js')
    const server = read('lib/ql7-support/server.js')
    const legacyCorpus = read('lib/ql7-support/simulation/corpora/legacyIntelligenceV14.js')
    expect(fact).toContain('vip_active_status_mismatch')
    expect(assessment).toContain("decision='uncertain'")
    expect(state).toContain('clarification_pending')
    expect(pane).toContain('data-ql7-operator-sticky-stage="1"')
    expect(pane).toContain('data-ql7-operator-sticky-slot="media-only"')
    expect(pane).toContain('data-ql7-operator-sticky-target="static-video-only"')
    expect(pane).toContain('data-ql7-operator-native-slot="identity-plate-right"')
    expect(pane).toContain('<Ql7SupportOperator')
    expect(header).not.toContain('<Ql7SupportOperator')
    expect(header).toContain('data-ql7-support-identity-sticky')
    expect(operator).toContain('media-only-sticky-below-quantum-messenger-return-to-native-slot')
    expect(operator).toContain('static-video-only')
    expect(operator).not.toContain('createPortal')
    expect(inboxHeader).toContain('data-ql7-quantum-messenger-sticky-owner="title-tabs"')
    expect(dmStyles).toContain('--ql7-quantum-messenger-sticky-top')
    expect(dmStyles).toContain('--ql7-quantum-messenger-sticky-height:92px')
    expect(styles).toContain('--ql7-support-operator-sticky-top:calc(var(--ql7-quantum-messenger-sticky-top,0px) + var(--ql7-quantum-messenger-sticky-height,92px) + var(--ql7-support-operator-sticky-gap,6px))')
    expect(styles).toContain('.ql7SupportOperatorStickySlot{')
    expect(styles).toContain('position:sticky')
    expect(styles).toContain('.dmSupportThreadStage>.dmThreadHeader[data-ql7-support-identity-sticky="0"]{')
    expect(styles).toContain('position:relative!important')
    expect(styles).not.toMatch(/\.dmThreadHeader\[data-support-thread="1"\]\{[^}]*position:sticky/su)
    expect(operatorProof).toContain("positionMode: 'css-grid-stage-plus-css-sticky-slot-plus-resize-observer-stack-height'")
    expect(operatorProof).toContain("stickyBoundary: 'below-quantum-messenger-title-tabs'")
    expect(operatorProof).toContain("nativeSlot: 'identity-plate-right'")
    expect(operatorProof).toContain('scrollTracking: false')
    expect(operatorProof).toContain('identityPlateSticky: false')
    expect(operatorProof).toContain('fixedPosition: false')
    expect(profileProof).toContain('NEW_PROFILES')
    expect(profileProof).toContain("'adversarial'")
    expect(analyzer).toContain('baseAnalysisTrust===true')
    expect(runtime).toContain('baseAnalysisTrust:input.baseAnalysisTrust===true')
    expect(productionTurn).toContain('buildQl7SupportProductionTurnInput')
    expect(productionTurn).toContain('executeQl7SupportProductionTurn')
    expect(productionTurn).toContain('projectQl7SupportProductionDelivery')
    expect(productionTurn).toContain('finalizeQl7SupportProductionDelivery')
    expect(productionTurn).toContain('CONTEXTUAL_FOLLOWUP_ACTS')
    expect(productionTurn).toContain("'denial'")
    expect(productionTurn).toContain("'status_followup'")
    expect(simulation).toContain('executeQl7SupportProductionTurn')
    expect(simulation).toContain('finalizeQl7SupportProductionDelivery')
    expect(simulation).toContain('productionDeliveryParity')
    expect(parityHarness).toContain('executeQl7SupportProductionTurn')
    expect(parityHarness).toContain('finalizeQl7SupportProductionDelivery')
    expect(server).toContain('executeQl7SupportProductionTurn')
    expect(server).toContain('finalizeQl7SupportProductionDelivery')
    expect(server).toContain('productionDeliveryTextHash')
    expect(server).toContain('productionDeliverySurfaceHash')
    expect(server).toContain('productionDeliveryActionIds')
    expect(report).toContain("args['console-mode'] || 'compact'")
    expect(report).toContain("consoleMode === 'full'")
    expect(report).toContain('rowsWritten')
    expect(learningPipeline).toContain('recordQl7SupportIncidentLearningCandidate')
    expect(learningPipeline).toContain('rawTextStored: false')
    expect(server).toContain('recordQl7SupportIncidentLearningCandidate')
    expect(legacyCorpus).toContain('conversationBreadthCorpusV11')
    expect(legacyCorpus).toContain('humanConversationCorpusV11')
  })
})

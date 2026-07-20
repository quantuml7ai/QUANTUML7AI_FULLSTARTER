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
    expect(supportServer).toContain('buildQl7SupportAutoReply')
    expect(supportServer).toContain('support_ack_')
    expect(contactRoute).toContain('sendSupportEmail')
    expect(contactRoute).not.toContain('nodemailer')
    expect(supportEmailTransport).toContain('nodemailer.createTransport')
    expect(dmUtils).toContain('if (isQl7SupportId(id)) return QL7_SUPPORT_ID')
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

    expect(read('app/forum/ForumRoot.jsx')).toContain('const dmSupportMode = !!dmMode && isQl7SupportId(dmWithUserId)')
    expect(read('app/forum/ForumRoot.jsx')).toContain('const openQl7SupportThread = useCallback')
    expect(read('app/forum/ForumRoot.jsx')).toContain('QL7_SUPPORT_ID')
    expect(read('app/forum/features/dm/components/DmDialogsPane.jsx')).toContain('dmSupportLauncherBtn')
    expect(read('app/forum/features/dm/components/DmDialogsPane.jsx')).toContain('ql7_support_open_cta')
    expect(read('app/forum/styles/modules/dmStyles.js')).toContain('dmSupportLauncherRail')
    expect(read('app/forum/features/ui/components/ComposerActionRail.jsx')).toContain('if (dmSupportMode)')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('dmSupportMode = false')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('!dmSupportMode && pendingSticker?.src')
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

    expect(read('app/api/wallet-session/route.js')).toContain('notifyQl7Welcome')
    expect(read('app/api/dm/thread/route.js')).toContain('support_thread_open')
    expect(read('app/api/dm/thread/route.js')).toContain('deliverQl7SupportEvent')
    expect(read('app/api/dm/thread/route.js')).toContain('x-forum-locale')
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
    expect(broadcast).toContain('maybeRunQl7SupportDmBroadcastCommand')
    expect(broadcast).toContain('resolveQl7SupportBroadcastRecipients')
    expect(broadcast).toContain('runQl7SupportBroadcastToEcosystem')
    expect(read('app/api/dm/send/route.js')).toContain('maybeRunQl7SupportDmBroadcastCommand')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('dmSupportBroadcastCommandMode')
    expect(read('app/forum/features/dm/services/sendDmComposerMessage.js')).toContain('ql7_support_broadcast_sent')
    expect(existsSync(resolve(root, 'app/api/ql7-support'))).toBe(false)
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
    ]
    for (const lang of QL7_SUPPORT_LANGS) {
      const dict = read(`components/i18n-dicts/${lang}.js`)
      for (const key of keys) expect(dict).toContain(`"${key}"`)
    }
    const source = read('components/i18n.source.js')
    for (const key of keys) expect(source).toContain(key)
  })
})

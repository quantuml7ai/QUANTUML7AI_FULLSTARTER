import { describe, expect, test } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

describe('QL7 Support V18 isolation and completion contracts', () => {
  test('global Deep Translate is independent from QL7 Support and keeps every ecosystem consumer', () => {
    const route = read('app/api/deep-translate/route.js')
    const globalService = read('lib/deepTranslateService.js')
    const supportService = read('lib/ql7-support/supportDeepTranslateService.js')
    const supportServer = read('lib/ql7-support/server.js')
    expect(route).toContain("from '../../../lib/deepTranslateService.js'")
    expect(route).not.toMatch(/ql7-support|supportDeepTranslateService/)
    expect(route).not.toContain('message: String(error')
    expect(globalService).toContain('GLOBAL_DEEP_TRANSLATE_MIRRORS')
    expect(globalService).not.toMatch(/ql7-support|redactQl7Support/)
    expect(supportServer).toContain("from './supportDeepTranslateService.js'")
    expect(supportServer).not.toContain("from '../deepTranslateService.js'")
    expect(supportService).toContain('QL7_SUPPORT_TRANSLATION_MIRRORS')
    for (const consumer of [
      'app/components/CryptoNewsLens.jsx',
      'app/exchange/battle-chat/BattleChatMessageRow.jsx',
      'app/forum/shared/api/translate.js',
    ]) expect(read(consumer)).toContain('/api/deep-translate')
  })

  test('Support DM cannot issue a header-only 401 retry storm', () => {
    const auth = read('app/forum/features/dm/services/supportAuthClient.js')
    const loader = read('app/forum/features/dm/utils/dmLoaders.js')
    const runtime = read('app/forum/features/dm/hooks/useForumDmRuntime.js')
    const send = read('app/forum/features/dm/services/sendDmComposerMessage.js')
    expect(auth).toContain('waitForQl7SupportAuthReady')
    expect(auth).toContain('fetchQl7SupportAuthenticated')
    expect(auth).toContain("'x-wallet-session-token'")
    expect(loader).toContain('fetchQl7SupportAuthenticated')
    expect(runtime).toContain('supportThreadInFlight')
    expect(runtime).toContain('supportAuthBlocked')
    expect(runtime).toContain('supportAuthVerifiedRetryKey')
    expect(runtime).toContain('QL7_SUPPORT_AUTH_EVENT_DEDUPE_MS')
    expect(runtime).toContain('isQl7SupportPeerId(uid) ? [0]')
    expect(send).toContain('canonicalAfterSend: true')
    expect(send).toContain('await loadDmThread')
    expect(send).toContain('fetchQl7SupportAuthenticated')
  })

  test('email delivery is durable outbox processing with inline dispatch', () => {
    const server = read('lib/ql7-support/server.js')
    const worker = read('lib/ql7-support/emailOutboxWorker.js')
    const scheduler = read('lib/ql7-support/scheduler.js')
    expect(server).toContain('enqueueQl7SupportEmail')
    expect(server).toContain('processQl7SupportEmailOutbox')
    expect(server).toContain('inlineDelivery')
    expect(server).toContain('asyncDelivery: inlineDelivery?.sent !== 1')
    expect(worker).toContain("status: 'pending'")
    expect(worker).toContain("status: 'leased'")
    expect(worker).toContain("status: 'retry'")
    expect(worker).toContain("status: 'dead_letter'")
    expect(worker).toContain('leaseExpiresAt')
    expect(worker).toContain('nextAttemptAt')
    expect(scheduler).toContain('processQl7SupportEmailOutbox')
  })

  test('diagnostics and learning are executable rather than catalog-only declarations', () => {
    const source = read('lib/ql7-support/sourceRegistry.js')
    const diagnostics = read('lib/ql7-support/diagnosticRegistry.js')
    const learning = read('lib/ql7-support/learningPipeline.js')
    expect(source).toContain('routeEvidence')
    expect(source).toContain('sourceUnavailableDistinctFromNoData')
    expect(source).toContain('arbitraryQueryAllowed: false')
    expect(diagnostics).toContain('runRegisteredAdapter')
    expect(diagnostics).toContain('read_only_fingerprint')
    expect(diagnostics).toContain('mutationMethodsExposed: false')
    expect(learning).toContain('poisoningScore')
    expect(learning).toContain('runQl7SupportShadowEvaluation')
    expect(learning).toContain('promoteQl7SupportCanary')
    expect(learning).toContain('rollbackQl7SupportLearningDeployment')
    expect(learning).toContain('deleteQl7SupportUserLearningData')
  })
  test('worker, admin context, browser evidence and learning deployment stay isolated and guarded', () => {
    const worker = read('app/api/dm/support-worker/route.js')
    const server = read('lib/ql7-support/server.js')
    const learning = read('lib/ql7-support/learningPipeline.js')
    const browser = read('scripts/ql7-support/browser-smoke.mjs')
    expect(worker).toContain('QL7_SUPPORT_WORKER_TOKEN')
    expect(worker).toContain('CRON_SECRET')
    expect(worker).toContain("error: 'worker_unauthorized'")
    expect(server).toContain('loadQl7SupportAdminContext')
    expect(server).toContain("checkedSources: ['profiles', 'profile_geo_events'")
    expect(server).not.toContain('ipAddress:')
    expect(learning).toContain('deploymentScope')
    expect(learning).toContain('deploymentStateId')
    expect(browser).toContain('supportThread401Count')
    expect(browser).toContain('maxConcurrentSupportThread')
    expect(browser).toContain('support-browser-360.png')
  })

})

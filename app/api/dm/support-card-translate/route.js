import { isQl7SupportActive, ql7SupportDisabledPayload } from '@/lib/ql7-support/config/featureFlag.js'
import { bad, ok } from '../_utils.js'
import mongoClient from '@/lib/mongo/client.cjs'
import { resolveQl7VerifiedActor } from '@/lib/ql7-support/identityResolver.js'
import { buildQl7SupportCard, validateQl7SupportCardAnyVersion } from '@/lib/ql7-support/contracts/supportCard.js'
import { normalizeQl7SupportLanguage } from '@/lib/ql7-support/languageOrchestrator.js'
import { localizeQl7SupportStructuredV8 } from '@/lib/ql7-support/providerLocalizationV8.js'
import { deepTranslateQl7SupportText } from '@/lib/ql7-support/supportDeepTranslateService.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function str(value) { return String(value ?? '').trim() }

async function supportDatabase() {
  const handle = await mongoClient.getMongoDb()
  return handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
}

export async function POST(req) {
  if (!isQl7SupportActive()) return bad(ql7SupportDisabledPayload().error, 404)
  try {
    const body = await req.json().catch(() => ({}))
    const database = await supportDatabase()
    const actor = await resolveQl7VerifiedActor({ req, body, database })
    if (!actor?.valid || !actor?.canonicalAccountId) return bad(actor?.failureCode || 'verified_session_required', 401)

    const targetLanguage = normalizeQl7SupportLanguage(body?.targetLang || body?.targetLocale || body?.locale || 'en', 'en')
    const validated = validateQl7SupportCardAnyVersion(body?.card && typeof body.card === 'object' ? body.card : {})
    if (!validated.ok) return bad(`ql7_support_card_${validated.error || 'invalid'}`, 400)

    const sourceLanguage = normalizeQl7SupportLanguage(validated.card?.locale || body?.sourceLang || 'en', 'en')
    if (sourceLanguage === targetLanguage) {
      return ok({ card: validated.card, translated: false, status: 'same_language', sourceLanguage, targetLanguage })
    }

    const localized = await localizeQl7SupportStructuredV8({
      value: validated.card,
      targetLanguage,
      sourceLanguage,
      forceProvider: true,
      maxStrings: 48,
      translate: (payload) => deepTranslateQl7SupportText({
        ...payload,
        timeoutMs: Math.min(18000, Math.max(3500, Number(body?.timeoutMs || 10000))),
        providerTimeoutMs: Math.min(6000, Math.max(1200, Number(body?.providerTimeoutMs || 3000))),
      }),
    })

    const { integrity: _discardIntegrity, ...unsigned } = localized.value || validated.card
    const card = buildQl7SupportCard({ ...unsigned, locale: targetLanguage })

    return ok({
      card,
      translated: localized.status === 'translated',
      status: localized.status,
      translatedStrings: Number(localized.translatedStrings || 0),
      sourceLanguage,
      targetLanguage,
    })
  } catch (error) {
    return bad(str(error?.message) || 'support_card_translate_failed', Number(error?.status || 500))
  }
}

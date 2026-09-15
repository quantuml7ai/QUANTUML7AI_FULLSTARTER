import crypto from 'node:crypto'

import { isQl7SupportActive, ql7SupportDisabledPayload } from '@/lib/ql7-support/config/featureFlag.js'
import { bad, ok } from '../_utils.js'
import mongoClient from '@/lib/mongo/client.cjs'
import { resolveQl7VerifiedActor } from '@/lib/ql7-support/identityResolver.js'
import {
  rebuildQl7SupportTranslatedCard,
  validateQl7SupportCard,
} from '@/lib/ql7-support/cardSchema.js'
import { normalizeQl7SupportLanguage } from '@/lib/ql7-support/languageOrchestrator.js'
import { localizeQl7SupportStructuredNative } from '@/lib/ql7-support/language/nativeStructuredLocalization.js'
import { translateQl7SupportTextNative } from '@/lib/ql7-support/nativeTranslationService.js'
import { guardQl7SupportMutation } from '@/lib/ql7-support/http/requestGuard.js'
import { commitQl7SupportIdempotency } from '@/lib/ql7-support/http/idempotencyStore.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const CLIENT_SEMANTIC_FIELDS = Object.freeze([
  'card',
  'supportCard',
  'sourceCard',
  'translatedCard',
  'surface',
  'supportSurface',
])

const str = (value) => String(value ?? '').trim()
const sha = (value) => crypto.createHash('sha256').update(str(value)).digest('hex')

function hasClientSemanticPayload(body) {
  return Boolean(
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    CLIENT_SEMANTIC_FIELDS.some((key) => Object.prototype.hasOwnProperty.call(body, key)),
  )
}

function boundedTimeout(value, { min, max, fallback }) {
  const numeric = Number(value)
  const selected = Number.isFinite(numeric) ? numeric : fallback
  return Math.min(max, Math.max(min, selected))
}

async function supportDatabase() {
  const handle = await mongoClient.getMongoDb()
  return handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
}

async function loadOwnedCommittedDelivery({ database, receiptId, canonicalAccountId }) {
  return database.collection('ql7_support_delivery_receipts').findOne({
    receiptId,
    actorIdHash: sha(canonicalAccountId),
    commitState: 'committed',
  })
}

function sourceCardFromDelivery(source) {
  const surface = source?.committedDelivery?.surface || source?.preparedDelivery?.surface || null
  return surface?.card || surface
}

export async function POST(req) {
  if (!isQl7SupportActive()) return bad(ql7SupportDisabledPayload().error, 404)

  try {
    const body = await req.json().catch(() => ({}))
    const database = await supportDatabase()
    const actor = await resolveQl7VerifiedActor({ req, body, database })

    if (!actor?.valid || !actor?.canonicalAccountId) {
      return bad(actor?.failureCode || 'verified_session_required', 401)
    }

    // Fail closed: the browser may name the committed delivery and desired target locale,
    // but it is never allowed to provide semantic card content for server translation.
    if (hasClientSemanticPayload(body)) {
      return bad('ql7_support_client_card_payload_forbidden', 400)
    }

    const sourceReceiptId = str(body.deliveryReceiptId)
    if (!sourceReceiptId) return bad('ql7_support_delivery_receipt_required', 400)

    const targetLanguage = normalizeQl7SupportLanguage(
      body?.targetLang || body?.targetLocale || body?.locale || 'en',
      'en',
    )

    const guard = await guardQl7SupportMutation({
      req,
      database,
      actorId: actor.canonicalAccountId,
      routeId: 'dm.support-card-translate',
      operationId: str(body.clientMutationId || body.operationId),
      payload: { sourceReceiptId, targetLanguage },
      rateLimit: 20,
    })

    if (guard.idempotency.replay) {
      return ok({ ...guard.idempotency.result, replayed: true })
    }

    const source = await loadOwnedCommittedDelivery({
      database,
      receiptId: sourceReceiptId,
      canonicalAccountId: actor.canonicalAccountId,
    })
    if (!source) return bad('ql7_support_delivery_receipt_not_owned', 404)

    const validated = validateQl7SupportCard(
      sourceCardFromDelivery(source) && typeof sourceCardFromDelivery(source) === 'object'
        ? sourceCardFromDelivery(source)
        : {},
    )
    if (!validated.ok) return bad(`ql7_support_card_${validated.error || 'invalid'}`, 409)

    const sourceLanguage = normalizeQl7SupportLanguage(
      validated.card?.locale || source?.committedDelivery?.locale || 'en',
      'en',
    )

    let result
    if (sourceLanguage === targetLanguage) {
      result = {
        card: validated.card,
        translated: false,
        status: 'same_language',
        sourceLanguage,
        targetLanguage,
        sourceDeliveryReceiptId: sourceReceiptId,
        sourceDeliveryReceiptHash: str(source?.committedReceipt?.receiptHash),
      }
    } else {
      const localized = await localizeQl7SupportStructuredNative({
        value: validated.card,
        targetLanguage,
        sourceLanguage,
        // Explicit cross-locale projection is QL7-native only. Original-language
        // fallback is never reported as successful localization.
        maxStrings: 48,
        translate: (payload) => translateQl7SupportTextNative({
          ...payload,
          timeoutMs: boundedTimeout(body?.timeoutMs, { min: 3500, max: 18000, fallback: 10000 }),
        }),
      })

      const rebuilt = rebuildQl7SupportTranslatedCard({
        sourceCard: validated.card,
        translatedValue: localized.value,
        targetLanguage,
        sourceDeliveryReceiptId: sourceReceiptId,
        sourceDeliveryReceiptHash: str(source?.committedReceipt?.receiptHash),
      })
      if (!rebuilt.ok) {
        return bad(`ql7_support_card_${rebuilt.error || 'translation_integrity'}`, 409)
      }

      result = {
        card: rebuilt.card,
        translationProjection: rebuilt.translationProjection,
        translated: localized.status === 'native_translated',
        status: localized.status,
        translatedStrings: Number(localized.translatedStrings || 0),
        sourceLanguage,
        targetLanguage,
        sourceDeliveryReceiptId: sourceReceiptId,
      }
    }

    await commitQl7SupportIdempotency({
      database,
      keyHash: guard.idempotencyKeyHash,
      result,
    })
    return ok(result)
  } catch (error) {
    return bad(str(error?.message) || 'support_card_translate_failed', Number(error?.status || 500))
  }
}

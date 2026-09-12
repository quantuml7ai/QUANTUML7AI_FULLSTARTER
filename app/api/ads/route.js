// app/api/ads/route.js
import { NextResponse } from 'next/server'
import {
  getCabinet,
  getPackagesWithCurrent,
  createPurchase,
  createCampaign,
  getAnalyticsForCampaign,
  uploadMedia,
  registerEvent,
  getLinksForForum,
  serveAd,
  stopCampaign,
  startCampaign,
  deleteCampaign,
} from '@/lib/adsCore'
import { resolveCanonicalAccountId } from '../profile/_identity.js'
import { isR2PublicUrl } from '../../../lib/storage/r2.js'
import videoReceipt from '../../../lib/forum/video-precommit-moderation-receipt.cjs'
 
export const dynamic = 'force-dynamic'

function jsonOk(res) {
  // Все контролируемые ответы — 200, даже если ok: false
  return NextResponse.json(res, { status: 200 })
}

function jsonError(message, details = null, status = 500) {
  return NextResponse.json(
    {
      ok: false,
      error: message || 'SERVER_ERROR',
      ...(details ? { details: String(details) } : {}),
    },
    { status },
  )
}

// ------------------ GET /api/ads ------------------
// Home/AdsHome:
//   GET /api/ads?action=cabinet&accountId=...
//
// Дополнительно:
//   ?action=plans      — тарифы + текущий пакет
//   ?action=links      — строки для ForumAds
//   ?action=serve      — отдать одну кампанию
export async function GET(req) {
  const url = new URL(req.url)
  const search = url.searchParams
  const action = (search.get('action') || '').toLowerCase()

  try {
    // Кабинет: пакет + кампании
    if (action === 'cabinet') {
      const accountId =
        search.get('accountId') ||
        search.get('account') ||
        null

      const res = await getCabinet(accountId)
      return jsonOk(res)
    }

    // Тарифы + текущий пакет
    if (action === 'plans') {
      const accountId =
        search.get('accountId') ||
        search.get('account') ||
        null
      const res = await getPackagesWithCurrent(accountId)
      return jsonOk(res)
    }

    // Строки ссылок для форума (ForumAds → /api/ads?action=links)
    if (action === 'links') {
      const res = await getLinksForForum(req)
      return jsonOk(res)
    }

    // Отдать одну активную кампанию
    if (action === 'serve') {
      const res = await serveAd(req)
      return jsonOk(res)
    }

    return jsonError('UNKNOWN_ACTION', { action }, 400)
  } catch (e) {
    console.error('[ADS] GET error', e)
    return jsonError('SERVER_ERROR', e, 500)
  }
}

// ------------------ POST /api/ads ------------------
// AdsHome использует:
//   POST /api/ads?action=upload        (FormData, file)
//   POST /api/ads { action: 'campaignCreate', ... }
//   POST /api/ads { action: 'campaignAnalytics', ... }
//
// ForumAds использует:
//   POST /api/ads { action: 'event', type: 'ad_impression' | 'ad_click', url_hash, ... }
export async function POST(req) {
  const url = new URL(req.url)
  const search = url.searchParams
  const actionFromQuery = (search.get('action') || '').toLowerCase()
  const contentType = req.headers.get('content-type') || ''

  try {
    // ---------- multipart/form-data → upload медиа ----------
    if (contentType.startsWith('multipart/form-data')) {
      const form = await req.formData()
      const action =
        (actionFromQuery ||
          String(form.get('action') || '')).toLowerCase() || 'upload'

      if (action === 'upload') {
        const file = form.get('file')

        // Жёсткая защита от отсутствия файла / битых форм
        if (!file || typeof file.arrayBuffer !== 'function') {
          return jsonOk({
            ok: false,
            error: 'NO_FILE',
          })
        }

        // Передаём опции во второй аргумент — uploadMedia может
        // использовать для форс-уникального имени, чтобы одинаковые
        // видео/картинки не конфликтовали по ключу в сторадже.
        const res = await uploadMedia(file, {
          // Можно использовать внутри ADS-Core:
          // - хешировать
          // - добавлять рандомный суффикс
          allowDuplicates: true,
          forceUniqueName: true,
        })

        // Даже если uploadMedia вернул ok: false — статус 200
        return jsonOk(res)
      }

      return jsonError('UNKNOWN_ACTION_MULTIPART', { action }, 400)
    }

    // ---------- JSON-тело ----------
    let body = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const action = (body.action || actionFromQuery || '').toLowerCase()

    // Создание кампании (AdsHome → action: 'campaignCreate')
    if (action === 'campaigncreate') {
      const {
        accountId,
        name,
        clickUrl,
        mediaUrl,
        mediaType,
        posterUrl,
        videoApprovalToken,
        creatives,
        targetCountries,
        targetRegions,        
      } = body || {}

      // Нормализация мультикреативов (совместимо с legacy)
      let normalizedCreatives = null
      if (Array.isArray(creatives) && creatives.length > 0) {
        normalizedCreatives = creatives
          .map((c) => {
            const creativeMediaType = (c.mediaType || '').toLowerCase() || 'link'
            return {
              clickUrl: (c.clickUrl || '').trim(),
              mediaUrl: c.mediaUrl || '',
              mediaType: creativeMediaType,
              posterUrl: c.posterUrl || '',
              ...(creativeMediaType === 'video'
                ? { videoApprovalToken: c.videoApprovalToken || c.moderationApprovalToken || '' }
                : {}),
            }
          })
          .filter((c) => c.clickUrl)
      }

      const hasVideoCreative =
        String(mediaType || '').trim().toLowerCase() === 'video' ||
        (normalizedCreatives || []).some((creative) => String(creative?.mediaType || '').trim().toLowerCase() === 'video')
      const canonicalActorId = hasVideoCreative
        ? String((await resolveCanonicalAccountId(accountId).catch(() => '')) || accountId || '').trim()
        : ''
      if (hasVideoCreative && !canonicalActorId) return jsonError('VIDEO_MODERATION_ACTOR_REQUIRED', null, 401)

      const approveVideoCreative = async (creative) => {
        const type = String(creative?.mediaType || '').trim().toLowerCase()
        if (type !== 'video') return creative
        const url = String(creative?.mediaUrl || '').trim()
        const token = String(creative?.videoApprovalToken || '').trim()
        if (!isR2PublicUrl(url) || !token) throw new Error('VIDEO_MODERATION_APPROVAL_REQUIRED')
        await videoReceipt.verifyVideoApprovalToken(token, { actorId: canonicalActorId, surface: 'ads', mediaUrl: url })
        return { ...creative, videoModerationApproved: true }
      }

      if (normalizedCreatives && normalizedCreatives.length) {
        try {
          normalizedCreatives = await Promise.all(normalizedCreatives.map(approveVideoCreative))
        } catch {
          return jsonError('VIDEO_MODERATION_APPROVAL_REQUIRED', null, 400)
        }
      }

      let singleVideoModerationApproved = false
      const singleMediaType = String(mediaType || '').trim().toLowerCase()
      if (singleMediaType === 'video') {
        try {
          await approveVideoCreative({ mediaUrl, mediaType, videoApprovalToken })
          singleVideoModerationApproved = true
        } catch {
          return jsonError('VIDEO_MODERATION_APPROVAL_REQUIRED', null, 400)
        }
      }

      const payload = {
        accountId: accountId || null,
        name: name || '',
        clickUrl: (clickUrl || '').trim(),
        mediaUrl: mediaUrl || '',
        mediaType: (mediaType || '').toLowerCase() || 'link',
        posterUrl: posterUrl || '',
        ...(singleMediaType === 'video' ? { videoModerationApproved: singleVideoModerationApproved } : {}),
        targetCountries,
        targetRegions,        
      }

      if (normalizedCreatives && normalizedCreatives.length) {
        payload.creatives = normalizedCreatives
      }

      const res = await createCampaign(payload)
      return jsonOk(res)
    }

    // Аналитика кампании (AdsHome → action: 'campaignAnalytics')
    if (action === 'campaignanalytics') {
      const { campaignId, from, to, groupBy } = body || {}

      // Нормализация groupBy для бекенда: только 'hour' | 'day'
      let gb = (groupBy || '').toLowerCase()
      if (gb !== 'hour' && gb !== 'day') {
        gb = 'day'
      }

      const res = await getAnalyticsForCampaign({
        campaignId,
        from,
        to,
        groupBy: gb,
      })
      // Ожидаем, что ADS-Core вернёт:
      // {
      //   ok: true,
      //   impressionsTotal, clicksTotal, ctrTotal,
      //   series: [{ ts, label?, impressions, clicks }],
      //   geo: [{ country, region, city, impressions, clicks }]
      // }
      return jsonOk(res)
    }

    // Остановить кампанию (AdsHome — кнопка "Остановить")
    if (action === 'campaignstop') {
      const { campaignId } = body || {}
      const res = await stopCampaign(campaignId)
      return jsonOk(res)
    }
    // Запустить / возобновить кампанию (AdsHome — кнопка "Запустить")
    if (action === 'campaignstart') {
      const { campaignId } = body || {}
      const res = await startCampaign(campaignId)
      return jsonOk(res)
    }
    // Удалить кампанию (AdsHome — кнопка "Удалить")
    if (action === 'campaigndelete') {
      const { campaignId } = body || {}
      const res = await deleteCampaign(campaignId)
      return jsonOk(res)
    }

    // Покупка рекламного пакета (если дергать из UI)
    if (action === 'buy' || action === 'createpurchase') {
      const { accountId, pkgType } = body || {}
      const res = await createPurchase({ accountId, pkgType })
      return jsonOk(res)
    }

    // События аналитики (ForumAds / фронт → action: 'event')
    if (action === 'event' || action === 'registerevent') {
      // Собираем базовый контекст для GEO/аналитики
      const forwardedFor =
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        ''
      const ip = forwardedFor.split(',')[0].trim()
      const userAgent = req.headers.get('user-agent') || ''
      const referer = req.headers.get('referer') || ''

      const eventPayload = {
        ...body,
        ip,
        userAgent,
        referer,
      }

      const res = await registerEvent(eventPayload, req)
      // Ожидается, что ADS-Core внутри по ip/userAgent сам
      // расставит GEO (country/region/city) и корректно
      // сохранит, чтобы потом getAnalyticsForCampaign.geo
      // отдавал правильные страны/регионы/города.
      return jsonOk(res)
    }

    return jsonError('UNKNOWN_ACTION', { action }, 400)
  } catch (e) {
    console.error('[ADS] POST error', e)
    return jsonError('SERVER_ERROR', e, 500)
  }
}

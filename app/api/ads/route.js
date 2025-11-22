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
  deleteCampaign,
} from '@/lib/adsCore'

import { handleUpload } from '@vercel/blob/client'   // <— ДОБАВЛЕНО

export const dynamic = 'force-dynamic'

function jsonOk(res) { 
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
 
export async function GET(req) {
  const url = new URL(req.url)
  const search = url.searchParams
  const action = (search.get('action') || '').toLowerCase()

  try { 
    if (action === 'cabinet') {
      const accountId =
        search.get('accountId') ||
        search.get('account') ||
        null

      const res = await getCabinet(accountId)
      return jsonOk(res)
    }

    if (action === 'plans') { 
      const accountId =
        search.get('accountId') ||
        search.get('account') ||
        null
      const res = await getPackagesWithCurrent(accountId)
      return jsonOk(res)
    }
 
    if (action === 'links') {
      const res = await getLinksForForum()
      return jsonOk(res)
    }
 
    if (action === 'serve') {
      const res = await serveAd()
      return jsonOk(res)
    }

    return jsonError('UNKNOWN_ACTION', { action }, 400)
  } catch (e) {
    console.error('[ADS] GET error', e)
    return jsonError('SERVER_ERROR', e, 500)
  }
}

export async function POST(req) { 
  const url = new URL(req.url)
  const search = url.searchParams
  const actionFromQuery = (search.get('action') || '').toLowerCase()
  const contentType = req.headers.get('content-type') || ''

  try {
    // --------------------------------------------------------
    //            MULTIPART UPLOAD (ФАЙЛЫ)
    // --------------------------------------------------------
    if (contentType.startsWith('multipart/form-data')) {
      const form = await req.formData()
      const action =
        (actionFromQuery ||
          String(form.get('action') || '')).toLowerCase() || 'upload'

      if (action === 'upload') {
        const file = form.get('file') 
 
        if (!file || typeof file.arrayBuffer !== 'function') {
          return jsonOk({
            ok: false,
            error: 'NO_FILE',
          })
        }

        // -------- ПРОСТОЙ И АККУРАТНЫЙ FIX --------
        // Теперь реклама грузит большие видео напрямую в Vercel Blob,
        // минуя сервер — как делает форум.
        const token =
          process.env.FORUM_READ_WRITE_TOKEN ||
          process.env.BLOB_READ_WRITE_TOKEN

        if (!token) {
          return jsonOk({ ok: false, error: 'NO_BLOB_TOKEN' })
        }

        const uploadRes = await handleUpload({
          request: req,
          token,
          onBeforeGenerateToken: async () => ({
            allowedContentTypes: [
              'video/mp4',
              'video/webm',
              'video/quicktime',
              'image/jpeg',
              'image/png',
              'image/webp',
              'image/gif',
              'image/avif',
            ],
            maximumSizeInBytes: 300 * 1024 * 1024, // 300MB
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ kind: 'ads_video' }),
          }),

          onUploadCompleted: async ({ blob }) => {
            console.log('ads media uploaded:', {
              url: blob?.url,
              size: blob?.size,
              type: blob?.contentType,
            })
          },
        })

        return jsonOk(uploadRes)
      }

      return jsonError('UNKNOWN_ACTION_MULTIPART', { action }, 400)
    }

    // --------------------------------------------------------
    //                    JSON HANDLING
    // --------------------------------------------------------
    let body = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const action = (body.action || actionFromQuery || '').toLowerCase()

    if (action === 'campaigncreate') { 
      const {
        accountId,
        name,
        clickUrl,
        mediaUrl,
        mediaType,
        creatives,
      } = body || {}
 
      let normalizedCreatives = null
      if (Array.isArray(creatives) && creatives.length > 0) {
        normalizedCreatives = creatives
          .map((c) => ({
            clickUrl: (c.clickUrl || '').trim(),
            mediaUrl: c.mediaUrl || '',
            mediaType: (c.mediaType || '').toLowerCase() || 'link',
          }))
          .filter((c) => c.clickUrl)
      }

      const payload = {
        accountId: accountId || null,
        name: name || '',
        clickUrl: (clickUrl || '').trim(),
        mediaUrl: mediaUrl || '',
        mediaType: (mediaType || '').toLowerCase() || 'link',
      }

      if (normalizedCreatives && normalizedCreatives.length) {
        payload.creatives = normalizedCreatives
      }

      const res = await createCampaign(payload)
      return jsonOk(res)
    }
 
    if (action === 'campaignanalytics') {
      const { campaignId, from, to, groupBy } = body || {}
 
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

      return jsonOk(res)
    }
 
    if (action === 'campaignstop') {
      const { campaignId } = body || {}
      const res = await stopCampaign(campaignId)
      return jsonOk(res)
    }
 
    if (action === 'campaigndelete') {
      const { campaignId } = body || {}
      const res = await deleteCampaign(campaignId)
      return jsonOk(res)
    }

    if (action === 'buy' || action === 'createpurchase') { 
      const { accountId, pkgType } = body || {}
      const res = await createPurchase({ accountId, pkgType })
      return jsonOk(res)
    }

    if (action === 'event' || action === 'registerevent') { 
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
      return jsonOk(res)
    }

    return jsonError('UNKNOWN_ACTION', { action }, 400)
  } catch (e) {
    console.error('[ADS] POST error', e)
    return jsonError('SERVER_ERROR', e, 500)
  }
}

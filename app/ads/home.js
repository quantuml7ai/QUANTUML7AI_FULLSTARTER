'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useI18n } from '../../components/i18n'
import AdsAnalyticsPanel, { MetricPill } from './AdsAnalyticsPanel'

/* ===== Вспомогалки i18n ===== */
const TX = (t, key, fb) => {
  try {
    const v = t?.(key)
    if (!v || v === key) return fb
    return v
  } catch {
    return fb
  }
}

/* ===== Чтение accountId из глобалов / localStorage ===== */
function getAccountIdSafe() {
  if (typeof window === 'undefined') return null
  try {
    return (
      window.__AUTH_ACCOUNT__ ||
      window.__ASHER_ACCOUNT__ ||
      window.__WALLET__ ||
      localStorage.getItem('wallet') ||
      localStorage.getItem('account') ||
      localStorage.getItem('ql7_uid') ||
      null
    )
  } catch {
    return null
  }
}

/* ===== Форматирование дат / времени ===== */
function formatDate(dt) {
  if (!dt) return '—'
  try {
    const d = typeof dt === 'string' ? new Date(dt) : dt
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function humanDaysLeft(t, daysLeft) {
  if (daysLeft == null) return '—'
  const d = Math.max(0, Math.floor(daysLeft))
  if (d === 0) {
    return TX(t, 'ads_days_left_0', '0 д')
  }
  if (d === 1) {
    return TX(t, 'ads_days_left_1', '1 д')
  }
  return TX(t, 'ads_days_left_n', `${d} д`)
}

/* ===== Видео-длительность (<= 3 минуты, читаем из ENV) ===== */
/* eslint-disable no-undef */
const MAX_VIDEO_SECONDS =
  typeof process !== 'undefined'
    ? (() => {
        const raw =
          process.env.NEXT_PUBLIC_ADS_MAX_VIDEO_SECONDS ||
          process.env.ADS_MAX_VIDEO_SECONDS ||
          '180'
        const n = Number(String(raw).trim())
        return !Number.isNaN(n) && n > 0 ? n : 180
      })()
    : 180
/* eslint-enable no-undef */

async function checkVideoDuration(file) {
  if (typeof window === 'undefined') return { ok: true, seconds: 0 }
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file)
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => {
        try {
          const sec = v.duration || 0
          URL.revokeObjectURL(url)
          if (sec > MAX_VIDEO_SECONDS) {
            resolve({ ok: false, seconds: sec })
          } else {
            resolve({ ok: true, seconds: sec })
          }
        } catch {
          resolve({ ok: true, seconds: 0 })
        }
      }
      v.onerror = () => {
        try {
          URL.revokeObjectURL(url)
        } catch {}
        resolve({ ok: true, seconds: 0 })
      }
      v.src = url
    } catch {
      resolve({ ok: true, seconds: 0 })
    }
  })
}

/* ===== Описание креатива (один на кампанию) ===== */
function makeEmptyCreative() {
  return {
    id: Math.random().toString(36).slice(2),
    clickUrl: '',
    videoFile: null,
    imageFile: null,
    videoPreviewUrl: null,
    imagePreviewUrl: null,
  }
}

/* ====== Основной компонент кабинета ====== */

export default function AdsHome() {
  const { t } = useI18n()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [pkgInfo, setPkgInfo] = useState(null)
  const [campaigns, setCampaigns] = useState([])

  // Попап правил
  const [rulesOpen, setRulesOpen] = useState(true)
  const [rulesScrolledToBottom, setRulesScrolledToBottom] = useState(false)
  const rulesBodyRef = useRef(null)

  // Новая кампания — один креатив
  const [newName, setNewName] = useState('')
  const [creative, setCreative] = useState(() => makeEmptyCreative())
  const [creating, setCreating] = useState(false)
  const [newError, setNewError] = useState(null)

  // Аналитика
  const [selectedId, setSelectedId] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState(null)
  const [range, setRange] = useState('7d')
  const [groupBy, setGroupBy] = useState('day')

  // Действия с кампанией (остановка / удаление)
  const [campaignActionError, setCampaignActionError] = useState(null)
  const [campaignActionLoading, setCampaignActionLoading] = useState(false)

  const accountId = useMemo(() => getAccountIdSafe(), [])

  const primaryCreative = creative

  const updateCreative = (patch) => {
    setCreative((prev) => ({ ...prev, ...patch }))
  }

  // При открытии попапа проверяем, есть ли вообще скролл.
  useEffect(() => {
    if (!rulesOpen) return
    const el = rulesBodyRef.current
    if (!el) {
      setRulesScrolledToBottom(false)
      return
    }
    const canScroll = el.scrollHeight > el.clientHeight + 4
    if (!canScroll) {
      setRulesScrolledToBottom(true)
    } else {
      setRulesScrolledToBottom(false)
    }
  }, [rulesOpen])

  // Обработчик скролла в блоке с правилами
  const handleRulesScroll = (e) => {
    const el = e.currentTarget
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
    if (atBottom) {
      setRulesScrolledToBottom(true)
    }
  }

  // Нажатие "Принять и продолжить"
  const markRulesAccepted = () => {
    setRulesOpen(false)
  }

  /* ===== Загрузка кабинета через /api/ads?action=cabinet ===== */
  const reloadCabinet = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ action: 'cabinet' })
      if (accountId) params.set('accountId', accountId)
      const url = `/api/ads?${params.toString()}`

      const r = await fetch(url, { cache: 'no-store' })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`)
      }

      setPkgInfo(j.package || j.pkg || null)
      setCampaigns(Array.isArray(j.campaigns) ? j.campaigns : [])
      if (!selectedId && j.campaigns && j.campaigns.length) {
        setSelectedId(j.campaigns[0].id || j.campaigns[0].campaignId)
      }
    } catch (e) {
      console.error('[ADS] cabinet error', e)
      setError(e.message || 'CABINET_ERROR')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reloadCabinet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  const hasActivePkg =
    pkgInfo &&
    pkgInfo.status !== 'expired' &&
    (!pkgInfo.expiresAt || new Date(pkgInfo.expiresAt).getTime() > Date.now())

  const remainingCampaigns = useMemo(() => {
    if (!pkgInfo) return null
    const max = Number(pkgInfo.maxCampaigns || 0)
    const used = Number(pkgInfo.usedCampaigns || 0)
    return Math.max(0, max - used)
  }, [pkgInfo])

  /* ===== Upload media → /api/ads?action=upload ===== */
  async function uploadMediaForCreative(cr) {
    const { videoFile, imageFile } = cr
    if (!videoFile && !imageFile) {
      return { mediaUrl: '', mediaType: 'none' }
    }

    const file = videoFile || imageFile
    const mediaType = videoFile ? 'video' : 'image'
    const fd = new FormData()
    fd.append('file', file)

    const r = await fetch('/api/ads?action=upload', {
      method: 'POST',
      body: fd,
      cache: 'no-store',
    })

    const j = await r.json().catch(() => null)
    if (!r.ok || !j?.ok) {
      throw new Error(j?.error || 'UPLOAD_FAILED')
    }

    const mediaUrl =
      j.url || (Array.isArray(j.urls) && j.urls[0]) || j.mediaUrl || j.href || ''

    if (!mediaUrl) {
      throw new Error('NO_MEDIA_URL')
    }

    return { mediaUrl, mediaType }
  }

  /* ===== Создание кампании через /api/ads (action: campaignCreate) ===== */
  const handleCreateCampaign = async () => {
    setNewError(null)
    if (!hasActivePkg) {
      setNewError(
        TX(
          t,
          'ads_new_err_pkg_inactive',
          'Пакет не активен — продли или купи новый на странице пакетов.'
        )
      )
      return
    }
    if (!newName.trim()) {
      setNewError(TX(t, 'ads_new_err_required', 'Название обязательно.'))
      return
    }
    if (remainingCampaigns != null && remainingCampaigns <= 0) {
      setNewError(
        TX(t, 'ads_new_err_limit', 'Лимит кампаний для пакета исчерпан.')
      )
      return
    }

    const cleanedCreative = {
      ...creative,
      clickUrl: (creative.clickUrl || '').trim(),
    }

    if (!cleanedCreative.clickUrl) {
      setNewError(
        TX(
          t,
          'ads_new_err_required',
          'Нужно указать ссылку для перехода.'
        )
      )
      return
    }

    try {
      setCreating(true)

      if (cleanedCreative.videoFile) {
        const { ok, seconds } = await checkVideoDuration(
          cleanedCreative.videoFile
        )
        if (!ok) {
          setCreating(false)
          setNewError(
            TX(
              t,
              'ads_new_err_video_too_long',
              `Видео длиннее 3 минут (${Math.round(
                seconds
              )} сек) — сократи, пожалуйста.`
            )
          )
          return
        }
      }

      const { mediaUrl, mediaType } = await uploadMediaForCreative(
        cleanedCreative
      )

      const payload = {
        action: 'campaignCreate',
        accountId,
        name: newName.trim(),
        clickUrl: cleanedCreative.clickUrl,
        mediaUrl,
        mediaType,
      }

      const r = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`)
      }

      await reloadCabinet()

      setNewName('')
      setCreative(makeEmptyCreative())
    } catch (e) {
      console.error('[ADS] create campaign error', e)
      setNewError(
        TX(
          t,
          'ads_new_err_generic',
          'Не удалось создать кампанию, попробуй ещё раз.'
        ) + ` (${e.message || e})`
      )
    } finally {
      setCreating(false)
    }
  }

  /* ===== Загрузка аналитики выбранной кампании ===== */
  const selectedCampaign = useMemo(
    () => campaigns.find((c) => (c.id || c.campaignId) === selectedId),
    [campaigns, selectedId]
  )

  // Общий helper для действий с кампанией
  async function performCampaignAction(actionName, id) {
    if (!id) return
    setCampaignActionError(null)
    setCampaignActionLoading(true)
    try {
      const r = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          action: actionName, // 'campaignStop' | 'campaignDelete'
          campaignId: id,
        }),
      })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`)
      }

      await reloadCabinet()
    } catch (e) {
      console.error('[ADS] campaign action error', e)
      setCampaignActionError(e.message || 'CAMPAIGN_ACTION_ERROR')
    } finally {
      setCampaignActionLoading(false)
    }
  }

  const handleStopSelectedCampaign = async () => {
    if (!selectedCampaign) return

    const status = (selectedCampaign.status || '').toLowerCase()
    if (
      status === 'stopped' ||
      status === 'finished' ||
      status === 'expired'
    ) {
      return
    }

    const id = selectedCampaign.id || selectedCampaign.campaignId
    await performCampaignAction('campaignStop', id)
  }

  const handleDeleteSelectedCampaign = async () => {
    if (!selectedCampaign) return

    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        TX(
          t,
          'ads_campaigns_delete_confirm',
          'Точно удалить кампанию? Показов больше не будет, вернуть её нельзя.'
        )
      )
      if (!ok) return
    }

    const id = selectedCampaign.id || selectedCampaign.campaignId
    await performCampaignAction('campaignDelete', id)
    setSelectedId(null)
  }

  useEffect(() => {
    if (!selectedCampaign) {
      setAnalytics(null)
      return
    }

    const load = async () => {
      setAnalyticsLoading(true)
      setAnalyticsError(null)
      try {
        const now = Date.now()
        let fromMs = now - 7 * 86400_000
        if (range === '1d') fromMs = now - 86400_000
        if (range === '30d') fromMs = now - 30 * 86400_000
        if (range === 'all') fromMs = now - 365 * 86400_000

        const from = new Date(fromMs).toISOString()
        const to = new Date(now).toISOString()

        const id = selectedCampaign.id || selectedCampaign.campaignId

        const r = await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            action: 'campaignAnalytics',
            campaignId: id,
            from,
            to,
            groupBy,
          }),
        })

        const j = await r.json().catch(() => null)
        if (!r.ok || !j?.ok) {
          throw new Error(j?.error || `HTTP ${r.status}`)
        }

        setAnalytics(j)
      } catch (e) {
        console.error('[ADS] analytics error', e)
        setAnalyticsError(e.message || 'ANALYTICS_ERROR')
      } finally {
        setAnalyticsLoading(false)
      }
    }

    load()
  }, [selectedCampaign, range, groupBy])

  const activeCampaigns = campaigns.filter(
    (c) =>
      c.status === 'active' ||
      c.status === 'running' ||
      c.status === 'paused' ||
      c.status === 'pending'
  )
  const finishedCampaigns = campaigns.filter(
    (c) =>
      c.status === 'finished' ||
      c.status === 'expired' ||
      c.status === 'stopped'
  )

  const pkgLabel = useMemo(() => {
    if (!pkgInfo?.pkgType && !pkgInfo?.type) return '—'
    const base = String(pkgInfo.pkgType || pkgInfo.type || '').toLowerCase()
    const key = 'ads_pkg_type_' + base
    return TX(
      t,
      key,
      String(pkgInfo.pkgType || pkgInfo.type || '').toUpperCase()
    )
  }, [t, pkgInfo])

  /* ===== Обработчики выбора файлов ===== */
  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewError(null)

    updateCreative({
      imageFile: null,
      imagePreviewUrl: null,
    })

    const { ok, seconds } = await checkVideoDuration(file)
    if (!ok) {
      updateCreative({
        videoFile: null,
        videoPreviewUrl: null,
      })
      setNewError(
        TX(
          t,
          'ads_new_err_video_too_long',
          `Видео длиннее 3 минут (${Math.round(
            seconds
          )} сек) — сократи, пожалуйста.`
        )
      )
      return
    }

    let url = null
    try {
      url = URL.createObjectURL(file)
    } catch {}

    updateCreative({
      videoFile: file,
      videoPreviewUrl: url,
    })
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewError(null)

    updateCreative({
      videoFile: null,
      videoPreviewUrl: null,
    })

    let url = null
    try {
      url = URL.createObjectURL(file)
    } catch {}

    updateCreative({
      imageFile: file,
      imagePreviewUrl: url,
    })
  }

  /* ====== Рендер ====== */

  return (
    <div className="page-content">
      <main className="page-center ads-home">
        {/* Попап правил поверх всего */}
        {rulesOpen && (
          <div
            className="ads-rules-overlay"
            role="dialog"
            aria-modal="true"
          >
            <div className="ads-rules-modal">
              <div className="ads-rules-header">
                <span className="ads-rules-icon">⚡</span>
                <h2>
                  {TX(
                    t,
                    'ads_rules_title',
                    'Правила размещения рекламы на Quantum L7 AI GLOBAL'
                  )}
                </h2>
              </div>

              <div
                className="ads-rules-body"
                ref={rulesBodyRef}
                onScroll={handleRulesScroll}
              >
                <div className="ads-rules-text">
                  {TX(t, 'ads_rules_text_1', '')}
                </div>
                <div className="ads-rules-text">
                  {TX(t, 'ads_rules_text_2', '')}
                </div>
                <div className="ads-rules-text">
                  {TX(t, 'ads_rules_text_3', '')}
                </div>
                <div className="ads-rules-text">
                  {TX(t, 'ads_rules_text_4', '')}
                </div>
                <div className="ads-rules-text">
                  {TX(t, 'ads_rules_text_5', '')}
                </div>
                <div className="ads-rules-text">
                  {TX(t, 'ads_rules_text_6', '')}
                </div>
                <div className="ads-rules-text">
                  {TX(t, 'ads_rules_text_7', '')}
                </div>
              </div>

              <button
                type="button"
                className="ads-rules-accept btn"
                disabled={!rulesScrolledToBottom}
                onClick={markRulesAccepted}
              >
                {TX(t, 'ads_rules_accept', 'Принять и продолжить')}
              </button>
            </div>
          </div>
        )}

        {/* Блок состояния пакета */}
        <section className="panel ads-panel">
          <div className="ads-panel-header">
            <div className="ads-panel-title">
              <span className="qcoinLabel">
                {TX(t, 'ads_title', 'Рекламный кабинет')}
              </span>
              <p className="ads-panel-sub">
                {TX(
                  t,
                  'ads_subtitle',
                  'Управляй кампаниями, загружай креативы, смотри аналитику в реальном времени.'
                )}
              </p>
            </div>
          </div>

          {loading && (
            <div className="ads-loading">
              <div className="ads-spinner" />
              <span>
                {TX(t, 'ads_loading_cabinet', 'Загружаем кабинет…')}
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="ads-error">
              <span>
                {TX(t, 'ads_error_cabinet', 'Ошибка загрузки кабинета:')}{' '}
                {String(error)}
              </span>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="ads-pkg">
                <div className="ads-pkg-main">
                  <div className="ads-pkg-label">
                    {TX(t, 'ads_pkg_features_title', 'Текущий пакет')}
                  </div>
                  <div className="ads-pkg-name">{pkgLabel}</div>
                  <div className="ads-pkg-exp">
                    {hasActivePkg ? (
                      <>
                        {TX(t, 'ads_pkg_expires_in', 'Истекает через')}{' '}
                        <strong>
                          {humanDaysLeft(t, pkgInfo?.daysLeft ?? 0)}
                        </strong>
                        {pkgInfo?.expiresAt && (
                          <>
                            {' '}
                            ({formatDate(pkgInfo.expiresAt)})
                          </>
                        )}
                      </>
                    ) : (
                      <span className="ads-pkg-expired">
                        {TX(
                          t,
                          'ads_pkg_expired',
                          'Срок действия пакета истёк — купи новый на странице пакетов.'
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {pkgInfo && (
                  <div className="ads-pkg-metrics">
                    <MetricPill
                      label={TX(
                        t,
                        'ads_plan_campaigns_limit',
                        'Кампаний'
                      )}
                      value={`${pkgInfo.usedCampaigns || 0} / ${
                        pkgInfo.maxCampaigns || 0
                      }`}
                      hint={TX(
                        t,
                        'ads_plan_campaigns_hint',
                        'Сколько кампаний уже создано в рамках этого пакета.'
                      )}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Форма создания кампании */}
        <section className="panel ads-panel">
          <h2 className="ads-section-title">
            {TX(t, 'ads_new_campaign_title', 'Создать рекламную кампанию')}
          </h2>
          <p className="ads-section-text">
            {TX(
              t,
              'ads_new_campaign_intro_1',
              'Дай кампании понятное название, укажи ссылку и загрузи креатив. Мы автоматически встроим объявление в рекламные слоты форума и страниц по всему сайту.'
            )}
          </p>

          <div className="ads-form-grid">
            <div className="ads-form-left">
              <label className="ads-field">
                <span className="ads-field-label">
                  {TX(
                    t,
                    'ads_new_campaign_name_label',
                    'Название кампании'
                  )}
                </span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={TX(
                    t,
                    'ads_new_campaign_name_placeholder',
                    'Например, Quantum Bot • Premium'
                  )}
                />
              </label>

              <label className="ads-field">
                <span className="ads-field-label">
                  {TX(
                    t,
                    'ads_new_campaign_click_url_label',
                    'Ссылка для перехода'
                  )}
                </span>
                <input
                  type="text"
                  value={primaryCreative.clickUrl}
                  onChange={(e) =>
                    updateCreative({ clickUrl: e.target.value })
                  }
                  placeholder={TX(
                    t,
                    'ads_new_campaign_click_url_placeholder',
                    'https://пример-сайта.com/landing'
                  )}
                />
              </label>

              <div className="ads-field-row">
                <label className="ads-field mini">
                  <span className="ads-field-label">
                    {TX(
                      t,
                      'ads_new_campaign_upload_video',
                      'Загрузить видео (до 3 минут)'
                    )}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                  />
                </label>
                <label className="ads-field mini">
                  <span className="ads-field-label">
                    {TX(
                      t,
                      'ads_new_campaign_upload_image',
                      'Загрузить изображение'
                    )}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                  />
                </label>
              </div>

              {newError && (
                <div className="ads-error inline">
                  <span>{newError}</span>
                </div>
              )}

              <div className="ads-form-footer">
                <button
                  type="button"
                  className="btn ads-submit-btn"
                  disabled={creating}
                  onClick={handleCreateCampaign}
                >
                  {creating
                    ? TX(
                        t,
                        'ads_new_campaign_submiting',
                        'Запускаем…'
                      )
                    : TX(
                        t,
                        'ads_new_campaign_submit',
                        'Запустить кампанию'
                      )}
                </button>
                <div className="ads-remaining">
                  {TX(
                    t,
                    'ads_new_campaign_remaining',
                    'Осталось кампаний в пакете:'
                  )}{' '}
                  <strong>
                    {remainingCampaigns != null ? remainingCampaigns : '∞'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Превью креатива */}
            <div className="ads-form-preview">
              <div className="ads-preview-header">
                <span className="qcoinLabel">
                  {TX(
                    t,
                    'ads_analytics_preview_title',
                    'Превью рекламного слота'
                  )}
                </span>
              </div>
              <div className="ads-preview-body">
                {primaryCreative.videoPreviewUrl ? (
                  <video
                    src={primaryCreative.videoPreviewUrl}
                    className="ads-preview-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : primaryCreative.imagePreviewUrl ? (
                  <img
                    src={primaryCreative.imagePreviewUrl}
                    alt="preview"
                    className="ads-preview-img"
                  />
                ) : primaryCreative.clickUrl ? (
                  <div className="ads-preview-placeholder">
                    <div className="ads-preview-url">
                      {primaryCreative.clickUrl.trim().slice(0, 80)}
                    </div>
                    <div className="ads-preview-sub">
                      {TX(
                        t,
                        'ads_preview_text',
                        'После запуска кампании мы будем показывать это объявление в слотах форума и на страницах с трафиком.'
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="ads-preview-placeholder">
                    <div className="ads-preview-sub">
                      {TX(
                        t,
                        'ads_preview_empty',
                        'Здесь появится превью твоего креатива — видео, изображение или ссылка.'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Список кампаний + аналитика */}
        {!loading && !error && (
          <section className="panel ads-panel">
            <h2 className="ads-section-title">
              {TX(t, 'ads_campaigns_title', 'Твои кампании')}
            </h2>

            <div className="ads-campaigns-layout">
              <div className="ads-campaigns-list">
                <div className="ads-campaigns-head">
                  <span>#</span>
                  <span>
                    {TX(
                      t,
                      'ads_campaigns_col_name',
                      'Название'
                    )}
                  </span>
                  <span>
                    {TX(
                      t,
                      'ads_campaigns_col_start',
                      'Старт'
                    )}
                  </span>
                  <span>
                    {TX(
                      t,
                      'ads_campaigns_col_end',
                      'Завершение'
                    )}
                  </span>
                  <span>
                    {TX(
                      t,
                      'ads_campaigns_col_content',
                      'Контент (линк / медиа)'
                    )}
                  </span>
                </div>
                <div className="ads-campaigns-scroll">
                  {activeCampaigns.map((c, idx) => {
                    const id = c.id || c.campaignId
                    const isSelected = id === selectedId
                    return (
                      <button
                        key={id || idx}
                        type="button"
                        className={
                          'ads-campaign-row active' +
                          (isSelected ? ' selected' : '')
                        }
                        onClick={() => setSelectedId(id)}
                      >
                        <span>{idx + 1}</span>
                        <span>
                          {c.name ||
                            TX(
                              t,
                              'ads_campaigns_untitled',
                              'Без названия'
                            )}
                        </span>
                        <span>
                          {formatDate(c.createdAt || c.startsAt)}
                        </span>
                        <span>{formatDate(c.endsAt)}</span>
                        <span>
                          {c.mediaType === 'video'
                            ? TX(
                                t,
                                'ads_campaigns_media_video',
                                'Ссылка + Видео'
                              )
                            : c.mediaType === 'image'
                            ? TX(
                                t,
                                'ads_campaigns_media_image',
                                'Ссылка + Картинка'
                              )
                            : TX(
                                t,
                                'ads_campaigns_media_link',
                                'Только ссылка'
                              )}
                        </span>
                      </button>
                    )
                  })}

                  {finishedCampaigns.length > 0 && (
                    <>
                      <div className="ads-campaigns-divider">
                        {TX(
                          t,
                          'ads_campaigns_finished_title',
                          'Завершённые кампании'
                        )}
                      </div>
                      {finishedCampaigns.map((c, idx) => (
                        <div
                          key={c.id || c.campaignId || `f${idx}`}
                          className="ads-campaign-row finished"
                        >
                          <span>{idx + 1}</span>
                          <span>
                            {c.name ||
                              TX(
                                t,
                                'ads_campaigns_untitled',
                                'Без названия'
                              )}
                          </span>
                          <span>
                            {formatDate(c.createdAt || c.startsAt)}
                          </span>
                          <span>{formatDate(c.endsAt)}</span>
                          <span>
                            {TX(
                              t,
                              'ads_campaigns_status_finished',
                              'Завершено'
                            )}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {!activeCampaigns.length && !finishedCampaigns.length && (
                    <div className="ads-campaigns-empty">
                      {TX(
                        t,
                        'ads_campaigns_empty',
                        'Кампаний пока нет — создай первую, чтобы увидеть аналитику.'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* НОВЫЙ пушечный блок аналитики */}
              <AdsAnalyticsPanel
                t={t}
                TX={TX}
                formatDate={formatDate}
                selectedCampaign={selectedCampaign}
                analytics={analytics}
                analyticsLoading={analyticsLoading}
                analyticsError={analyticsError}
                range={range}
                setRange={setRange}
                groupBy={groupBy}
                setGroupBy={setGroupBy}
                campaignActionLoading={campaignActionLoading}
                campaignActionError={campaignActionError}
                onStopCampaign={handleStopSelectedCampaign}
                onDeleteCampaign={handleDeleteSelectedCampaign}
              />
            </div>
          </section>
        )}
      </main>

      {/* Локальные стили для кабинета */}
      <style jsx>{`
        .ads-home {
          padding-top: 12px;
          padding-bottom: 80px;
        }

        .ads-panel {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 20% -10%,
              rgba(0, 212, 255, 0.26),
              transparent 55%
            ),
            radial-gradient(
              circle at 110% 120%,
              rgba(255, 212, 0, 0.22),
              transparent 60%
            ),
            linear-gradient(
              180deg,
              rgba(4, 8, 18, 0.98),
              rgba(2, 6, 23, 0.96)
            );
          border-radius: 16px;
          border: 1px solid rgba(157, 220, 255, 0.32);
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.75),
            0 0 40px rgba(56, 189, 248, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          padding: 12px 12px 14px;
        }
        .ads-panel::before {
          content: '';
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(59, 130, 246, 0.55),
              transparent 55%
            ),
            radial-gradient(
              circle at 85% 20%,
              rgba(8, 47, 73, 0.85),
              transparent 65%
            ),
            radial-gradient(
              circle at 60% 110%,
              rgba(245, 158, 11, 0.4),
              transparent 60%
            ),
            linear-gradient(
              135deg,
              rgba(15, 23, 42, 0.7),
              rgba(15, 23, 42, 0.95)
            );
          opacity: 0.9;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .ads-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.2),
              transparent 55%
            ),
            linear-gradient(
              120deg,
              rgba(30, 64, 175, 0.28) 0,
              transparent 35%
            ),
            linear-gradient(
              -145deg,
              rgba(56, 189, 248, 0.18) 10%,
              transparent 40%
            ),
            repeating-linear-gradient(
              115deg,
              rgba(148, 163, 184, 0.22) 0,
              rgba(148, 163, 184, 0.22) 1px,
              transparent 1px,
              transparent 9px
            );
          opacity: 0.45;
          pointer-events: none;
        }
        .ads-panel > * {
          position: relative;
          z-index: 1;
        }

        .ads-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }
        .ads-panel-title {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ads-panel-sub {
          margin: 0;
          font-size: 14px;
          color: #cfe1ff;
          opacity: 0.9;
        }

        .ads-loading {
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 14px;
          color: #d8ebff;
        }
        .ads-spinner {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 2px solid rgba(157, 220, 255, 0.25);
          border-top-color: rgba(0, 200, 255, 0.9);
          animation: adsSpin 0.8s linear infinite;
        }
        @keyframes adsSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .ads-error {
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(248, 113, 113, 0.6);
          font-size: 13px;
          color: #fee2e2;
        }
        .ads-error.inline {
          margin-top: 10px;
        }

        .ads-pkg {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
        }
        .ads-pkg-main {
          min-width: 220px;
        }
        .ads-pkg-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.8;
        }
        .ads-pkg-name {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.06em;
          margin-top: 4px;
          margin-bottom: 4px;
        }
        .ads-pkg-exp {
          font-size: 13px;
          opacity: 0.9;
        }
        .ads-pkg-expired {
          color: #f97373;
        }
        .ads-pkg-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .ads-section-title {
          margin: 0 0 6px;
          font-size: clamp(18px, 2vw, 22px);
        }
        .ads-section-text {
          margin: 0 0 10px;
          font-size: 14px;
          color: #cfe1ff;
          opacity: 0.9;
        }

        .ads-form-grid {
          margin-top: 10px;
          display: grid;
          grid-template-columns: minmax(0, 55%) minmax(0, 45%);
          gap: 16px;
        }
        .ads-form-left {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ads-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }
        .ads-field-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.8;
        }
        .ads-field input[type='text'] {
          border-radius: 10px;
          border: 1px solid rgba(157, 220, 255, 0.4);
          background: rgba(5, 10, 20, 0.9);
          padding: 8px 10px;
          color: #e6f0ff;
          font-size: 14px;
          outline: none;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }
        .ads-field input[type='text']::placeholder {
          opacity: 0.6;
        }
        .ads-field input[type='file'] {
          font-size: 12px;
          cursor: pointer;
        }
        .ads-field-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ads-field.mini {
          flex: 1 1 0;
        }

        .ads-form-footer {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ads-submit-btn {
          min-width: 190px;
        }
        .ads-remaining {
          font-size: 13px;
          opacity: 0.9;
        }

        .ads-form-preview {
          border-radius: 16px;
          padding: 10px;
          background: radial-gradient(
              circle at 0 0,
              rgba(0, 200, 255, 0.16),
              transparent 60%
            ),
            linear-gradient(
              180deg,
              rgba(7, 12, 20, 0.94),
              rgba(4, 8, 17, 0.98)
            );
          border: 1px solid rgba(157, 220, 255, 0.35);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ads-preview-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }
        .ads-preview-body {
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          min-height: 150px;
          background: #020817;
        }
        .ads-preview-video,
        .ads-preview-img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ads-preview-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 14px;
          font-size: 13px;
          color: #cfe1ff;
        }
        .ads-preview-url {
          font-weight: 700;
          margin-bottom: 6px;
        }
        .ads-preview-sub {
          opacity: 0.85;
        }

        .ads-campaigns-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ads-campaigns-list {
          border-radius: 14px;
          background: rgba(7, 13, 24, 0.98);
          border: 1px solid rgba(157, 220, 255, 0.2);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .ads-campaigns-head {
          display: grid;
          grid-template-columns: 32px 1.4fr 1fr 1fr 1.2fr;
          gap: 6px;
          padding: 6px 10px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.85;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ads-campaigns-scroll {
          max-height: 280px;
          overflow-y: auto;
        }
        .ads-campaign-row {
          width: 100%;
          display: grid;
          grid-template-columns: 32px 1.4fr 1fr 1fr 1.2fr;
          gap: 6px;
          padding: 6px 10px;
          font-size: 13px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
        }
        .ads-campaign-row.active {
          cursor: pointer;
          background: transparent;
        }
        .ads-campaign-row.active:hover {
          background: rgba(15, 23, 42, 0.95);
        }
        .ads-campaign-row.selected {
          background: radial-gradient(
            circle at 0 0,
            rgba(0, 200, 255, 0.3),
            rgba(15, 23, 42, 0.95)
          );
          box-shadow: inset 0 0 0 1px rgba(0, 229, 255, 0.7);
        }
        .ads-campaign-row.finished {
          opacity: 0.55;
          color: #fecaca;
          background: rgba(127, 29, 29, 0.35);
        }
        .ads-campaigns-divider {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          padding: 6px 10px;
          opacity: 0.8;
          background: rgba(30, 64, 175, 0.35);
        }
        .ads-campaigns-empty {
          padding: 10px;
          font-size: 13px;
          opacity: 0.85;
        }

        /* Попап правил */
        .ads-rules-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--popup-padding, 16px);
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
        }

        .ads-rules-modal {
          width: var(--popup-width, 540px);
          max-width: 100%;
          max-height: var(--popup-max-height, 84vh);
          border-radius: var(--popup-radius, 18px);
          padding: var(--popup-inner-padding, 18px);
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow: hidden;
          background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.98),
            rgba(15, 23, 42, 0.92)
          );
          border: 1px solid rgba(248, 250, 252, 0.12);
          box-shadow: 0 25px 65px rgba(0, 0, 0, 0.85),
            0 0 55px rgba(255, 215, 99, 0.5);
        }

        .ads-rules-body {
          flex: 1;
          overflow-y: auto;
          padding-right: 6px;
          border-radius: 12px;
          border: 1px dashed rgba(255, 220, 110, 0.8);
          background: rgba(15, 23, 42, 0.9);
          font-size: 14px;
          color: #ffe9bc;
          line-height: 1.42;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .ads-rules-text {
          margin-bottom: 14px;
          padding-left: 4px;
        }

        .ads-rules-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .ads-rules-icon {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, #1e3a8a, #020617);
          box-shadow: 0 0 18px rgba(255, 215, 99, 0.9);
        }

        .ads-rules-accept {
          margin-top: 4px;
          align-self: flex-end;
          min-width: 200px;
        }

        .ads-rules-accept:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
          filter: grayscale(0.2);
        }

        @media (max-width: 640px) {
          .ads-rules-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 14px;
          }
        }

        @media (max-width: 960px) {
          .ads-form-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .ads-campaigns-layout {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 640px) {
          .ads-pkg {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

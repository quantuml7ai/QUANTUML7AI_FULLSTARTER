'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useI18n } from '../../components/i18n'
import { upload as blobUpload } from '@vercel/blob/client'
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

/* Локализация стран по коду */
function localizeCountry(t, code) {
  if (!code) {
    return TX(t, 'geo_country_unknown', 'Не определено')
  }
  const upper = String(code).toUpperCase()

  // ZZ = неизвестная страна
  if (upper === 'ZZ') {
    return TX(t, 'geo_country_unknown', 'Не определено')
  }

  return TX(t, 'geo_country_' + upper, upper)
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

function formatDateShort(dt) {
  if (!dt) return '—'
  try {
    const d = typeof dt === 'string' ? new Date(dt) : dt
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
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

/* ===== Расширенный MetricPill ===== */
function MetricPill({ label, value, hint, icon, tone = 'blue' }) {
  return (
    <div
      className={`ads-pill ads-pill-${tone}`}
      title={hint}
    >
      <div className="ads-pill-icon-wrap">
        {icon && <span className="ads-pill-icon">{icon}</span>}
      </div>
      <div className="ads-pill-main">
        <div className="ads-pill-label">{label}</div>
        <div className="ads-pill-value">{value}</div>
      </div>
      <style jsx>{`
        .ads-pill {
          min-width: 140px;
          padding: 10px 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background:
            radial-gradient(circle at 0 0, rgba(56, 189, 248, 0.35), transparent 55%),
            radial-gradient(circle at 120% 100%, rgba(250, 204, 21, 0.22), transparent 60%),
            linear-gradient(120deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.96));
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow:
            0 14px 30px rgba(0, 0, 0, 0.8),
            0 0 22px rgba(56, 189, 248, 0.35);
        }
        .ads-pill-blue {
          border-color: rgba(56, 189, 248, 0.72);
        }
        .ads-pill-gold {
          border-color: rgba(250, 204, 21, 0.8);
          box-shadow:
            0 14px 40px rgba(0, 0, 0, 0.85),
            0 0 30px rgba(250, 204, 21, 0.45);
        }
        .ads-pill-icon-wrap {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at 30% 0, rgba(56, 189, 248, 0.6), transparent 60%),
            radial-gradient(circle at 70% 120%, rgba(250, 204, 21, 0.7), transparent 70%);
          box-shadow:
            0 0 14px rgba(56, 189, 248, 0.8),
            0 0 24px rgba(250, 204, 21, 0.6);
          flex-shrink: 0;
        }
        .ads-pill-icon {
          font-size: 14px;
        }
        .ads-pill-main {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ads-pill-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #94a3b8;
        }
        .ads-pill-value {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #e2e8f0;
        }
      `}</style>
    </div>
  )
}

/* ===== TabsGroup ===== */
function TabsGroup({ tabs, selected, onSelect, size = 'md' }) {
  return (
    <div className={`ads-tabs ads-tabs-${size}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={
            'ads-tab-btn' +
            (selected === tab.value ? ' ads-tab-btn-active' : '')
          }
          onClick={() => onSelect(tab.value)}
        >
          {tab.label}
        </button>
      ))}
      <style jsx>{`
        .ads-tabs {
          display: inline-flex;
          padding: 2px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          box-shadow: inset 0 0 0 1px rgba(30, 64, 175, 0.6);
          gap: 2px;
        }
        .ads-tabs-sm {
          transform: scale(0.96);
        }
        .ads-tab-btn {
          position: relative;
          border-radius: 999px;
          border: none;
          padding: 4px 10px;
          font-size: 11px;
          color: #cbd5e1;
          background: transparent;
          cursor: pointer;
          transition: all 0.18s ease-out;
          min-width: 48px;
        }
        .ads-tab-btn:hover {
          background: rgba(15, 23, 42, 0.95);
        }
        .ads-tab-btn-active {
          background: linear-gradient(135deg, #38bdf8, #22c55e);
          color: #020617;
          box-shadow:
            0 0 0 1px rgba(148, 163, 184, 0.4),
            0 0 20px rgba(56, 189, 248, 0.7);
        }
      `}</style>
    </div>
  )
}

/* ===== ChartContainer ===== */
function ChartContainer({ title, right, children }) {
  return (
    <section className="ads-chart-container">
      <div className="ads-chart-header">
        <div className="ads-chart-header-left">
          <h3>{title}</h3>
        </div>
        <div className="ads-chart-header-right">{right}</div>
      </div>
      <div className="ads-chart-body">{children}</div>

      <style jsx>{`
        .ads-chart-container {
          position: relative;
          border-radius: 18px;
          padding: 10px 12px 12px;
         background:
           radial-gradient(circle at 0 0, rgba(56, 189, 248, 0.3), transparent 55%),
           /* убрали золотой низ */
           linear-gradient(180deg, #020617, #020617);
          border: 1px solid rgba(148, 163, 184, 0.6);
          box-shadow:
            0 22px 60px rgba(0, 0, 0, 0.9),
            0 0 40px rgba(56, 189, 248, 0.3);
          /* Даем тултипу и подписям вылезать наружу */
          overflow: visible;
        }
        .ads-chart-container::before {
          content: none;
          position: absolute;
          inset: -40%;
          opacity: 0.18;
          background-image: radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.9),
              transparent 55%
            ),

            repeating-linear-gradient(
              115deg,
              rgba(148, 163, 184, 0.22),
              rgba(148, 163, 184, 0.22) 1px,
              transparent 1px,
              transparent 9px
            );
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .ads-chart-header,
        .ads-chart-body {
          position: relative;
          z-index: 1;
        }
        .ads-chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .ads-chart-header-left h3 {
          margin: 0;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #cbd5e1;
        }
        .ads-chart-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .ads-chart-body {
          margin-top: 2px;
        }
      `}</style>
    </section>
  )
}

/* ===== Мини-график (bar chart) с вертикальными датами и PRO-tooltip ===== */
function TinyBarChart({
  t,
  points,
  metricKey,
  accent = 'impressions',
  allMetricsForTooltip,
}) {
  const [hoverIdx, setHoverIdx] = useState(null)

  if (!Array.isArray(points) || !points.length) {
    return (
      <div className="ads-chart-empty">
        <span>{TX(t, 'ads_chart_empty', 'Нет данных')}</span>
        <style jsx>{`
          .ads-chart-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            opacity: 0.7;
            height: 220px;
          }
        `}</style>
      </div>
    )
  }

  const vals = points.map((p) => Number(p[metricKey] || 0))
const max = Math.max(...vals, 1)

// Y-ось: 3 тика (0, mid, max), но отображаем сверху вниз: max → mid → 0
const mid = Math.round(max / 2)
const ticks = Array.from(new Set([0, mid, max])).sort((a, b) => b - a)

   const formatXLabel = (raw) => {
    if (raw == null) return ''
    let d = null
    const n = Number(raw)
    if (!Number.isNaN(n) && n > 0) {
      const ms = n < 1e12 ? n * 1000 : n
      d = new Date(ms)
    } else {
      try {
        d = new Date(String(raw))
      } catch {
        d = null
      }
    }
    if (!d || Number.isNaN(d.getTime())) {
      return String(raw)
    }

    const pad = (x) => String(x).padStart(2, '0')
    const day = pad(d.getDate())
    const month = pad(d.getMonth() + 1)
    const year = d.getFullYear()
    const hour = pad(d.getHours())
    const minute = pad(d.getMinutes())

    // Определяем "масштаб" оси X по span рядов
    let spanDays = 0
    if (points && points.length >= 2) {
      const first = points[0]
      const last = points[points.length - 1]
      const aRaw = first.label ?? first.ts
      const bRaw = last.label ?? last.ts
      const aNum = Number(aRaw)
      const bNum = Number(bRaw)
      const aMs =
        !Number.isNaN(aNum) && aNum > 0
          ? aNum < 1e12
            ? aNum * 1000
            : aNum
          : null
      const bMs =
        !Number.isNaN(bNum) && bNum > 0
          ? bNum < 1e12
            ? bNum * 1000
            : bNum
          : null
      if (aMs != null && bMs != null) {
        spanDays = Math.abs(bMs - aMs) / 86400_000
      }
    }

    // 12 точек и span ~год → месяцы (диапазон All)
    if (points && points.length === 12 && spanDays >= 280) {
      return `${month}.${year}`
    }

    // span >= ~3 дней → показываем только дату
    if (spanDays >= 3) {
      return `${day}.${month}`
    }

    // Иначе (24 часа и прочие маленькие диапазоны) → только время
    return `${hour}:${minute}`
  }


  // Показываем максимум ~12 подписей по оси X
  const maxLabels = 12
  const step = Math.max(1, Math.ceil(points.length / maxLabels))

  const hovered = hoverIdx != null ? points[hoverIdx] : null

  const tooltip =
    hovered != null
      ? (() => {
          const dt = hovered.label ?? hovered.ts
          const dtFormatted = formatXLabel(dt)
            typeof dt === 'number' || typeof dt === 'string'
              ? formatDate(dt)
              : String(dt || '')

          const imps = Number(hovered.impressions || 0)
          const clicks = Number(hovered.clicks || 0)
          const ctr =
            imps > 0 ? `${((clicks / imps) * 100).toFixed(1)}%` : '0%'

          const posRatio =
            points.length > 0 ? (hoverIdx + 0.5) / points.length : 0.5
          let leftPct = posRatio * 100
          // Чуть поджимаем тултип у краёв, чтобы не свисал
          if (leftPct < 8) leftPct = 8
          if (leftPct > 92) leftPct = 92

          return {
            left: `${leftPct}%`,
            content: (
              <>
                <div className="ads-chart-tooltip-row">
                      <span>
                        {TX(
                          t,
                          'ads_chart_tt_date',
                          'Дата:'
                        )}
                      </span>
                  <strong>—{dtFormatted}</strong>
                </div>
                <div className="ads-chart-tooltip-row">
                      <span>
                        {TX(
                          t,
                          'ads_chart_tt_impressions',
                          'Показов:'
                        )}
                      </span>
                  <strong>—{imps}</strong>
                </div>
                <div className="ads-chart-tooltip-row">
                      <span>
                        {TX(
                          t,
                         'ads_chart_tt_clicks',
                          'Кликов:'
                        )}
                      </span>
                  <strong>—{clicks}</strong>
                </div>
                <div className="ads-chart-tooltip-row">
                      <span>
                        {TX(t, 'ads_chart_tt_ctr', 'CTR:')}
                      </span>
                  <strong>—{ctr}</strong>
                </div>
              </>
            ),
          }
        })()
      : null

  return (
    <div className="ads-chart-pro">
      {tooltip && (
        <div
          className="ads-chart-tooltip"
          style={{ left: tooltip.left }}
        >
          {tooltip.content}
        </div>
      )}
      <div className="ads-chart-grid">
        <div className="ads-chart-yaxis">
          {ticks.map((v) => (
            <div key={v} className="ads-chart-yrow">
              <span className="ads-chart-ylabel">{v}</span>
            </div>
          ))}
        </div>
        <div className="ads-chart-main">
          <div className="ads-chart-bars-wrap">
            <div className="ads-chart-bars">
              {points.map((p, idx) => {
                const v = Number(p[metricKey] || 0)
                const h = (v / max) * 100
                const valueHeight = h || 2 // 0 → тонкая линия
                const isHovered = hoverIdx === idx

                return (
                  <div
                    key={idx}
                    className={
                      'ads-chart-bar ' +
                      (accent === 'clicks' ? 'ads-chart-bar-accent ' : '') +
                      (metricKey === 'ctr' ? 'ads-chart-bar-ctr ' : '') +
                      (isHovered ? 'ads-chart-bar-hover ' : '') +
                      (v === 0 ? 'ads-chart-bar-empty' : '')
                    }
                    style={{ height: `${valueHeight}%` }}
                    onMouseEnter={() => setHoverIdx(idx)}
                    onMouseLeave={() => setHoverIdx(null)}
                  />
                )
              })}
            </div>
            <div className="ads-chart-grid-overlay" />
          </div>
          <div className="ads-chart-xaxis">
            {points.map((p, idx) => {
              const rawLabel = p.label || p.ts
              if (idx % step !== 0) {
                return (
                  <div key={idx} className="ads-chart-xlabel" />
                )
              }
              return (
                <div key={idx} className="ads-chart-xlabel">
                  <span>{formatXLabel(rawLabel)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .ads-chart-pro {
          position: relative;
          height: 340px;
          overflow: visible;
        }

        .ads-chart-tooltip {
          position: absolute;
          top: 4px;
          transform: translateX(-50%);
          z-index: 20;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(56, 189, 248, 0.7);
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.9),
            0 0 26px rgba(56, 189, 248, 0.7);
          font-size: 11px;
          color: #e2e8f0;
          min-width: 210px;
          pointer-events: none;
        }
        .ads-chart-tooltip-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 2px;
        }

        .ads-chart-tooltip-row span {
          opacity: 0.7;
          margin-right: 16px;      /* небольшой отступ от значения */
          white-space: nowrap;
        }
        .ads-chart-tooltip-row strong {
          white-space: nowrap;    /* число/процент в одну строку */
        }

        .ads-chart-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 6px;
        }
        .ads-chart-yaxis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10px 2px 72px 0;
        }

        .ads-chart-yrow {
          position: relative;
          height: 1px;
        }
        .ads-chart-ylabel {
          position: relative;
          top: -8px;
          font-size: 10px;
          opacity: 0.7;
          color: #cbd5e1;
          white-space: nowrap;
        }
        .ads-chart-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ads-chart-bars-wrap {
          position: relative;
          height: 290px;
          border-radius: 14px;
          overflow: hidden;
          background: radial-gradient(
              circle at 0 100%,
              rgba(56, 189, 248, 0.18),
              transparent 60%
            ),
            linear-gradient(180deg, #020617, #020617);
          box-shadow:
            inset 0 0 0 1px rgba(15, 23, 42, 0.9),
            0 18px 40px rgba(0, 0, 0, 0.9);
        }
        .ads-chart-bars {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 4px;
          padding: 10px 10px 10px;
        }
        .ads-chart-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(
            to top,
            rgba(148, 163, 184, 0.28) 1px,
            transparent 1px
          );
          background-size: 100% 24px;
          opacity: 0.35;
          pointer-events: none;
        }

        .ads-chart-bar {
          flex: 0 0 8px;
          max-width: 12px;
          min-width: 3px;
          margin: 0 auto;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(
            180deg,
            rgba(56, 189, 248, 0.95),
            rgba(37, 99, 235, 0.95)
          );
          box-shadow:
            0 0 16px rgba(56, 189, 248, 0.6),
            0 10px 22px rgba(0, 0, 0, 0.9);
          transform-origin: bottom center;
          transform: scaleY(0.15);
          animation: adsBarIn 0.6s ease-out forwards;
          transition: filter 0.16s ease-out, box-shadow 0.16s ease-out;
        }
        .ads-chart-bar-empty {
          opacity: 0.35;
        }
        .ads-chart-bar-accent {
          background: linear-gradient(
            180deg,
            rgba(250, 204, 21, 0.95),
            rgba(245, 158, 11, 0.95)
          );
          box-shadow:
            0 0 18px rgba(250, 204, 21, 0.75),
            0 10px 24px rgba(0, 0, 0, 0.95);
        }
        .ads-chart-bar-ctr {
          background: linear-gradient(
            180deg,
            rgba(34, 197, 94, 0.95),
            rgba(22, 163, 74, 0.95)
          );
        }
        .ads-chart-bar-hover {
          filter: brightness(1.25);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.6),
            0 12px 28px rgba(0, 0, 0, 1),
            0 0 28px rgba(56, 189, 248, 0.9);
        }

        .ads-chart-xaxis {
          display: flex;
          align-items: flex-start;
          gap: 4px;
          padding: 0 8px 0;
        }
        .ads-chart-xlabel {
          flex: 1 1 0;
          font-size: 9px;
          text-align: center;
          color: rgba(226, 232, 240, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ads-chart-xlabel span {
          display: inline-block;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: translateY(2px);
          line-height: 1.1;
        }

        @keyframes adsBarIn {
          0% {
            transform: scaleY(0.1);
            opacity: 0;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

/* ===== GEO таблица с табами и сортировкой ===== */
function GeoTable({ t, analytics }) {
  const [activeTab, setActiveTab] = useState('countries') // countries | regions | cities
  const [sort, setSort] = useState({ key: 'impressions', dir: 'desc' })

  if (!analytics || !Array.isArray(analytics.geo) || !analytics.geo.length) {
    return null
  }

  const totalImp = Number(analytics.impressionsTotal || 0)

  const filtered = analytics.geo.filter((g) => {
    if (activeTab === 'regions') return !!g.region
    if (activeTab === 'cities') return !!g.city
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const { key, dir } = sort
    const mul = dir === 'asc' ? 1 : -1
    if (key === 'ctr') {
      const aImp = Number(a.impressions || 0)
      const aC = Number(a.clicks || 0)
      const bImp = Number(b.impressions || 0)
      const bC = Number(b.clicks || 0)
      const aVal = aImp > 0 ? aC / aImp : 0
      const bVal = bImp > 0 ? bC / bImp : 0
      return (aVal - bVal) * mul
    }
    if (key === 'impressions' || key === 'clicks') {
      const aVal = Number(a[key] || 0)
      const bVal = Number(b[key] || 0)
      return (aVal - bVal) * mul
    }
    return 0
  })

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'desc' }
    })
  }

  const sortArrow = (key) => {
    if (sort.key !== key) return '↕'
    return sort.dir === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="ads-geo-block">
      <div className="ads-geo-top">
        <span className="ads-geo-title">
          {TX(t, 'ads_analytics_summary_top_regions', 'Гео по кампаниям')}
        </span>
        <TabsGroup
          size="sm"
          tabs={[
            {
              value: 'countries',
              label: TX(t, 'ads_geo_tab_countries', 'Страны'),
            },
            {
              value: 'regions',
              label: TX(t, 'ads_geo_tab_regions', 'Регионы'),
            },
            { value: 'cities', label: TX(t, 'ads_geo_tab_cities', 'Города') },
          ]}
          selected={activeTab}
          onSelect={setActiveTab}
        />
      </div>
      <div className="ads-geo-table-wrap">
        <table className="ads-geo-table">
          <thead>
            <tr>
              <th>
                {TX(t, 'ads_geo_country', 'Страна')}
              </th>
              <th>
                {TX(t, 'ads_geo_region', 'Регион')}
              </th>
              <th>
                {TX(t, 'ads_geo_city', 'Город')}
              </th>
              <th
                className="ads-geo-sortable"
                onClick={() => toggleSort('impressions')}
              >
                {TX(t, 'ads_geo_impressions', 'Импрессии')}{' '}
                <span className="ads-geo-arrow">
                  {sortArrow('impressions')}
                </span>
              </th>
              <th
                className="ads-geo-sortable"
                onClick={() => toggleSort('clicks')}
              >
                {TX(t, 'ads_geo_clicks', 'Клики')}{' '}
                <span className="ads-geo-arrow">
                  {sortArrow('clicks')}
                </span>
              </th>
              <th
                className="ads-geo-sortable"
                onClick={() => toggleSort('ctr')}
              >
                {TX(t, 'ads_geo_ctr', 'CTR')}{' '}
                <span className="ads-geo-arrow">
                  {sortArrow('ctr')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((g, idx) => {
              const imp = Number(g.impressions || 0)
              const clicks = Number(g.clicks || 0)
              const ctr =
                imp > 0
                  ? `${((clicks / imp) * 100).toFixed(1)}%`
                  : '—'
              const pct =
                totalImp > 0 ? Math.round((imp / totalImp) * 100) : 0
              return (
                <tr key={`${g.country || ''}${g.region || ''}${g.city || ''}${idx}`}>
                  <td>{localizeCountry(t, g.country)}</td>
                  <td>{g.region || '—'}</td>
                  <td>{g.city || '—'}</td>
                  <td>{imp}</td>
                  <td>{clicks}</td>
                  <td>
                    <div className="ads-geo-ctr-cell">
                      <span>{ctr}</span>
                      <div className="ads-geo-bar-wrap">
                        <div
                          className="ads-geo-bar"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .ads-geo-block {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ads-geo-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ads-geo-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.8;
        }
        .ads-geo-table-wrap {
          margin-top: 2px;
          max-height: 220px;
         
          overflow-y: auto;
          overflow-x: hidden; /* убираем горизонтальный скролл по умолчанию */
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: rgba(15, 23, 42, 0.98);
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.9),
            inset 0 0 0 1px rgba(15, 23, 42, 0.9);
        }
        .ads-geo-table {
          width: 100%;
          min-width: 0;            /* даём таблице сжиматься под контейнер */
          table-layout: fixed;     /* ровнее распределяются колонки */
          border-collapse: collapse;
        }
        

        .ads-geo-table thead {
          background: radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.35),
              transparent 60%
            ),
            linear-gradient(90deg, #0f172a, #020617);
        }
        .ads-geo-table th,
        .ads-geo-table td {
          padding: 6px 8px;
          border-bottom: 1px solid rgba(30, 64, 175, 0.4);
          width: calc(150% / 6); /* 6 колонок → каждая ~16.6% ширины */
          }
        .ads-geo-table th {
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #cbd5e1;
        }
        .ads-geo-table tbody tr:nth-child(even) {
          background: rgba(15, 23, 42, 0.9);
        }
        .ads-geo-table tbody tr:hover {
          background: radial-gradient(
              circle at 0 100%,
              rgba(56, 189, 248, 0.22),
              transparent 60%
            ),
            rgba(15, 23, 42, 0.98);
        }
        .ads-geo-sortable {
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }
        .ads-geo-arrow {
          font-size: 10px;
          opacity: 0.8;
        }
        .ads-geo-ctr-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ads-geo-ctr-cell span {
          font-size: 15px;
        }
        .ads-geo-bar-wrap {
          position: relative;
          height: 7px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          overflow: hidden;
        }
        .ads-geo-bar {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            rgba(56, 189, 248, 0.95),
            rgba(96, 165, 250, 0.95),
            rgba(250, 204, 21, 0.98)
          );
          box-shadow:
            0 0 16px rgba(56, 189, 248, 0.8),
            0 0 22px rgba(250, 204, 21, 0.9);
          transform-origin: left center;
          transform: scaleX(0);
          animation: adsGeoIn 0.4s ease-out forwards;
        }
        @keyframes adsGeoIn {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  )
}

/* ===== Мобильная карточка кампании ===== */
function CampaignCard({
   t, 
  campaign,
  idx,
  isSelected,
  onSelect,
}) {
  const status = (campaign.status || '').toLowerCase()
                            const statusLabel = (() => {
                              if (
                                status === 'active' ||
                                status === 'running'
                              ) {
                                return TX(
                                  t,
                                  'ads_status_active',
                                  'Активна'
                                )
                              }
                              if (status === 'paused') {
                                return TX(
                                  t,
                                  'ads_status_paused',
                                  'На паузе'
                                )
                              }
                              if (status === 'stopped') {
                                return TX(
                                  t,
                                  'ads_status_stopped',
                                  'Остановлена'
                                )
                              }
                              if (
                                status === 'finished' ||
                                status === 'expired'
                              ) {
                                return TX(
                                  t,
                                  'ads_status_finished',
                                  'Завершена'
                                )
                              }
                              return status || '—'
                            })()

  const statusTone =
    status === 'active' || status === 'running'
      ? 'green'
      : status === 'paused'
      ? 'yellow'
      : status === 'finished' ||
        status === 'stopped' ||
        status === 'expired'
      ? 'red'
      : 'gray'

  const start = formatDateShort(campaign.createdAt || campaign.startsAt)
  const end = campaign.endsAt ? formatDateShort(campaign.endsAt) : '—'
  const mediaLabel =
    campaign.mediaType === 'video'
      ? TX(
          t,
          'ads_campaign_media_video_with_link',
          'Видео + ссылка'
        )
      : campaign.mediaType === 'image'
      ? TX(
          t,
          'ads_campaign_media_image_with_link',
          'Картинка + ссылка'
        )
      : TX(
          t,
          'ads_campaign_media_link_only',
          'Только ссылка'
        )

  return (
    <button
      type="button"
      className={
        'ads-camp-card' + (isSelected ? ' ads-camp-card-selected' : '')
      }
      onClick={onSelect}
    >
      <div className="ads-camp-card-top">
        <span className="ads-camp-card-index">#{idx + 1}</span>
        <span className={`ads-status-pill ads-status-pill-${statusTone}`}>
          {statusLabel}
        </span>
      </div>
      <div className="ads-camp-card-name">
        {campaign.name ||
          TX(t, 'ads_campaigns_untitled', 'Без названия')}
      </div>
      <div className="ads-camp-card-row">
        <span>
         {TX(t, 'ads_campaign_card_period_label', 'Период:')}
        </span>
        <span>
          {start} — {end}
        </span>
      </div>
      <div className="ads-camp-card-row">
        <span>
          {TX(t, 'ads_campaign_card_media_label', 'Медиа:')}
        </span>
        <span>{mediaLabel}</span>
      </div>
      {campaign.clickUrl && (
        <div className="ads-camp-card-url">
          {campaign.clickUrl.slice(0, 70)}
        </div>
      )}

      <style jsx>{`
        .ads-camp-card {
          width: 100%;
          text-align: left;
          border-radius: 16px;
          padding: 10px 12px;
          margin-bottom: 8px;
          background:
            radial-gradient(circle at 0 0, rgba(56, 189, 248, 0.24), transparent 55%),
            radial-gradient(circle at 120% 100%, rgba(250, 204, 21, 0.22), transparent 60%),
            linear-gradient(180deg, #020617, #020617);
          border: 1px solid rgba(148, 163, 184, 0.6);
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.9),
            0 0 28px rgba(56, 189, 248, 0.35);
        }
        .ads-camp-card-selected {
          box-shadow:
            0 0 0 1px rgba(255, 215, 0, 0.9),
            0 0 34px rgba(255, 215, 0, 0.9);
        }
        .ads-camp-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .ads-camp-card-index {
          font-size: 11px;
          opacity: 0.8;
        }
        .ads-camp-card-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .ads-camp-card-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
          opacity: 0.9;
        }
        .ads-camp-card-row span:first-child {
          color: #94a3b8;
        }
        .ads-camp-card-url {
          margin-top: 4px;
          font-size: 11px;
          color: #38bdf8;
          word-break: break-all;
        }
      `}</style>
    </button>
  )
}

/* ====== Основной компонент кабинета ====== */

export default function AdsHome() {
  const { t } = useI18n()
  // NOTE: t используется также во вложенных компонентах через TX
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
  const [metricTab, setMetricTab] = useState('impressions') // impressions | clicks | ctr
  // Общие метрики по всем кампаниям для верхних таблеток
  const [overallTotals, setOverallTotals] = useState({
    impressions: 0,
    clicks: 0,
  })

// Метрики по каждой кампании для списка
const [campaignMetrics, setCampaignMetrics] = useState({})

  // Действия с кампанией
  const [campaignActionError, setCampaignActionError] = useState(null)
  const [campaignActionLoading, setCampaignActionLoading] = useState(false)

  // layout helpers
  const [isMobile, setIsMobile] = useState(false)
  const analyticsRef = useRef(null)

  const accountId = useMemo(() => getAccountIdSafe(), [])
  const primaryCreative = creative

  const updateCreative = (patch) => {
    setCreative((prev) => ({ ...prev, ...patch }))
  }

  // Проверка скролла в правилах
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
 
  const handleRulesScroll = (e) => {
    const el = e.currentTarget
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
    if (atBottom) {
      setRulesScrolledToBottom(true)
    }
  }
 
  const markRulesAccepted = () => {
    setRulesOpen(false)
  }

  /* ===== Загрузка кабинета через /api/ads?action=cabinet ===== */
  const reloadCabinet = async (opts = {}) => {
    const { silent } = opts || {}

    if (!silent) {
      setLoading(true)
    }
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
      if (!silent) {
        setLoading(false)
      }
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

  /* ===== Upload media (для одного креатива) ===== */
  async function uploadMediaForCreative(cr) {
    const { videoFile, imageFile } = cr

    // Если нет ни видео, ни картинки — ничего не загружаем
    if (!videoFile && !imageFile) {
      return { mediaUrl: '', mediaType: 'none' }
    }

    // 1) ВИДЕО: грузим НАПРЯМУЮ в Vercel Blob через форумный blobUploadUrl
    // и добавляем уникальный префикс к имени файла
    if (videoFile) {
      const file = videoFile
      const mediaType = 'video'

      // Берём оригинальное имя или "ad", если его нет
      const rawName = (file.name && String(file.name)) || 'ad'

      // Выделяем базу и расширение (как в uploadMedia на бэке)
      const lastDot = rawName.lastIndexOf('.')
      const base = lastDot > 0 ? rawName.slice(0, lastDot) : rawName
      const ext = lastDot > 0 ? rawName.slice(lastDot) : ''

      // Чистим базу от странных символов
      const safeBase = base.replace(/[^\w.-]+/g, '_') || 'ad'

      // Уникальный префикс: timestamp + рандом
      const prefix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`

      // Итоговое имя: <уникальный_префикс>-<база><расширение>
      const uniqueName = `${prefix}-${safeBase}${ext}`

      const res = await blobUpload(uniqueName, file, {
        access: 'public',
        handleUploadUrl: '/api/forum/blobUploadUrl',
      })

      const mediaUrl = res?.url
      if (!mediaUrl) {
        throw new Error('NO_MEDIA_URL')
      }

      return { mediaUrl, mediaType }
    } 
    // 2) КАРТИНКА: оставляем старый путь через /api/ads?action=upload
    const file = imageFile
    const mediaType = 'image'
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

      await reloadCabinet({ silent: true })

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

  /* ===== Загрузка аналитики выбранной кампании через /api/ads (action: campaignAnalytics) ===== */
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

      await reloadCabinet({ silent: true })
    } catch (e) {
      console.error('[ADS] campaign action error', e)
      setCampaignActionError(e.message || 'CAMPAIGN_ACTION_ERROR')

    } finally {
      setCampaignActionLoading(false)
    }
  }

  // Старт / стоп выбранной кампании
  const handleToggleSelectedCampaign = async () => {
    if (!selectedCampaign) return

    const status = (selectedCampaign.status || '').toLowerCase()
    const id = selectedCampaign.id || selectedCampaign.campaignId

    // Завершённые/просроченные не трогаем
    if (status === 'finished' || status === 'expired') {
      return
    }

    // Если кампания активна — стопаем
    if (status === 'active' || status === 'running') {
      await performCampaignAction('campaignStop', id)
      return
    }

    // Во всех остальных случаях — пытаемся запустить
    await performCampaignAction('campaignStart', id)
  }

  // Удалить выбранную кампанию полностью
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

        // Группировка определяется только таймфреймом:
        // 24h → hour; 7d / 30d / all → day
        const apiGroupBy = range === '1d' ? 'hour' : 'day'

        const r = await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            action: 'campaignAnalytics',
            campaignId: id,
            from,
            to,
            groupBy: apiGroupBy,
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
  }, [selectedCampaign, range])


// Общие метрики по всем кампаниям (верхние таблетки)
// + метрики по каждой кампании для списка
useEffect(() => {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    setOverallTotals({ impressions: 0, clicks: 0 })
    setCampaignMetrics({})
    return
  }

  let cancelled = false

  const loadOverall = async () => {
    try {
      const now = Date.now()
      let fromMs = now - 7 * 86400_000
      if (range === '1d') fromMs = now - 86400_000
      if (range === '30d') fromMs = now - 30 * 86400_000
      if (range === 'all') fromMs = now - 365 * 86400_000

      const from = new Date(fromMs).toISOString()
      const to = new Date(now).toISOString()

      const apiGroupBy = range === '1d' ? 'hour' : 'day'

      let totalImpressions = 0
      let totalClicks = 0
      const metricsById = {}

      await Promise.all(
        campaigns.map(async (c) => {
          const id = c.id || c.campaignId
          if (!id) return

          try {
            const r = await fetch('/api/ads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
              body: JSON.stringify({
                action: 'campaignAnalytics',
                campaignId: id,
                from,
                to,
                groupBy: apiGroupBy,
              }),
            })

            const j = await r.json().catch(() => null)
            if (!r.ok || !j?.ok) return

            const imps = Number(j.impressionsTotal || 0)
            const clicks = Number(j.clicksTotal || 0)

            totalImpressions += imps
            totalClicks += clicks

            const ctr =
              imps > 0 ? `${((clicks / imps) * 100).toFixed(1)}%` : '—'

            metricsById[id] = {
              impressions: imps,
              clicks,
              ctr,
            }
          } catch (e) {
            console.error(
              '[ADS] overall analytics error for campaign',
              id,
              e,
            )
          }
        }),
      )

      if (!cancelled) {
        setOverallTotals({
          impressions: totalImpressions,
          clicks: totalClicks,
        })
        setCampaignMetrics(metricsById)
      }
    } catch (e) {
      console.error('[ADS] overall analytics error', e)
    }
  }

  loadOverall()

  return () => {
    cancelled = true
  }
}, [campaigns, range])

  // Адаптив: отслеживаем мобилку
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => {
      setIsMobile(window.innerWidth < 640)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const activeCampaigns = campaigns.filter(
    (c) =>
      c.status === 'active' ||
      c.status === 'running' ||
      c.status === 'paused' ||
      c.status === 'pending'
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
  const chartPoints = useMemo(() => {
    if (!analytics || !Array.isArray(analytics.series)) return []

    const HOUR_MS = 3600_000
    const DAY_MS = 86400_000

    const normalizePoint = (p) => {
      const ts = Number(p?.ts || 0)
      const impressions = Number(p?.impressions || 0)
      const clicks = Number(p?.clicks || 0)
      const ctr = impressions > 0 ? clicks / impressions : 0
      return { ts, impressions, clicks, ctr }
    }

    const sorted = [...analytics.series]
      .map((p) => normalizePoint(p))
      .filter((p) => Number.isFinite(p.ts) && p.ts > 0)
      .sort((a, b) => a.ts - b.ts)

    if (!sorted.length) return []

    const now = Date.now()

    // ===== 24 часа: строго 24 часовых бакета =====
    if (range === '1d') {
      const end = Math.floor(now / HOUR_MS) * HOUR_MS // последний полный час
      const start = end - 23 * HOUR_MS
      const byTs = new Map(sorted.map((p) => [p.ts, p]))

      const points = []
      for (let ts = start; ts <= end; ts += HOUR_MS) {
        const src = byTs.get(ts) || { ts, impressions: 0, clicks: 0, ctr: 0 }
        const base = normalizePoint({ ...src, ts })
        // label = ts; TinyBarChart сам форматирует локальное время
        points.push({ ...base, label: ts })
      }
      return points
    }

    // ===== Общий подготовительный шаг для дневных диапазонов =====
    const byDateKey = new Map()
    for (const p of sorted) {
      const d = new Date(p.ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(d.getDate()).padStart(2, '0')}`
      const existing = byDateKey.get(key)
      if (existing) {
        existing.impressions += p.impressions
        existing.clicks += p.clicks
        existing.ctr =
          existing.impressions > 0
            ? existing.clicks / existing.impressions
            : 0
      } else {
        byDateKey.set(key, { ...p })
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTs = today.getTime()

    // ===== 7d и 30d: по календарным дням, подряд =====
    if (range === '7d' || range === '30d') {
      const days = range === '7d' ? 7 : 30
      const points = []

      for (let i = days - 1; i >= 0; i--) {
        const dTs = todayTs - i * DAY_MS
        const d = new Date(dTs)
        const key = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const src = byDateKey.get(key)
        const base = src || { ts: dTs, impressions: 0, clicks: 0, ctr: 0 }
        const norm = normalizePoint({ ...base, ts: dTs })
        points.push({ ...norm, label: dTs })
      }

      return points
    }

    // ===== All: последние 12 месяцев, агрегировано по месяцам =====
    const points = []

    const endMonth = new Date()
    endMonth.setDate(1)
    endMonth.setHours(0, 0, 0, 0)

    const startMonth = new Date(endMonth.getTime())
    startMonth.setMonth(startMonth.getMonth() - 11)

    // агрегируем существующие дневные точки по (год, месяц)
    const byMonthKey = new Map()
    for (const p of sorted) {
      const d = new Date(p.ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`
      const existing = byMonthKey.get(key)
      if (existing) {
        existing.impressions += p.impressions
        existing.clicks += p.clicks
      } else {
        byMonthKey.set(key, {
          ts: Date.UTC(d.getFullYear(), d.getMonth(), 1),
          impressions: p.impressions,
          clicks: p.clicks,
        })
      }
    }

    for (
      let cursor = new Date(startMonth.getTime());
      cursor <= endMonth;
      cursor.setMonth(cursor.getMonth() + 1)
    ) {
      const key = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1,
      ).padStart(2, '0')}`
      const src =
        byMonthKey.get(key) || {
          ts: Date.UTC(cursor.getFullYear(), cursor.getMonth(), 1),
          impressions: 0,
          clicks: 0,
        }
      const norm = normalizePoint(src)
      points.push({ ...norm, label: norm.ts })
    }

    return points
  }, [analytics, range])

  /* ===== Фильтры/сортировка кампаний ===== */
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortCfg, setSortCfg] = useState({
    key: 'start',
    dir: 'desc',
  })

  const filteredCampaigns = useMemo(() => {
    let list = [...campaigns]
    if (statusFilter !== 'all') {
      list = list.filter((c) => {
        const s = (c.status || '').toLowerCase()
        if (statusFilter === 'active') {
          return ['active', 'running', 'paused', 'pending'].includes(s)
        }
        if (statusFilter === 'finished') {
          return ['finished', 'stopped', 'expired'].includes(s)
        }
        if (statusFilter === 'draft') {
          return s === 'draft'
        }
        return true
      })
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => {
        const name = (c.name || '').toLowerCase()
        const url = (c.clickUrl || '').toLowerCase()
        return name.includes(q) || url.includes(q)
      })
    }
    const { key, dir } = sortCfg
    const mul = dir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      if (key === 'name') {
        return (
          ((a.name || '') || '').localeCompare(b.name || '') * mul
        )
      }
      if (key === 'status') {
        return (
          ((a.status || '') || '').localeCompare(b.status || '') * mul
        )
      }
      if (key === 'start') {
        const aDt = new Date(a.createdAt || a.startsAt || 0).getTime()
        const bDt = new Date(b.createdAt || b.startsAt || 0).getTime()
        return (aDt - bDt) * mul
      }
      return 0
    })
    return list
  }, [campaigns, statusFilter, search, sortCfg])

  const setSortKey = (key) => {
    setSortCfg((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const sortIcon = (key) => {
    if (sortCfg.key !== key) return '↕'
    return sortCfg.dir === 'asc' ? '↑' : '↓'
  }

  /* ===== Глобальная сводка по всем кампаниям (верхние таблетки) ===== */
  const globalImpressions = overallTotals.impressions
  const globalClicks = overallTotals.clicks
  const globalCtr =
    globalImpressions > 0
      ? `${((globalClicks / globalImpressions) * 100).toFixed(1)}%`
      : '—'

  /* ===== Метрики по выбранной кампании для списка ===== */
  const selectedMetrics = useMemo(() => {
    if (!selectedCampaign || !analytics) return null
    return {
      impressions: analytics.impressionsTotal ?? 0,
      clicks: analytics.clicksTotal ?? 0,
      ctr:
        analytics.ctrTotal != null
          ? `${(analytics.ctrTotal * 100).toFixed(1)}%`
          : '—',
    }
  }, [selectedCampaign, analytics])

  const handleSelectCampaign = (id) => {
    // просто запоминаем выбранную кампанию
    setSelectedId(id)

    // Раньше на мобиле тут был scrollIntoView,
    // из-за этого казалось, что список "пропадает".
    // Убираем автоскролл – пользователь сам доскроллит до аналитики.
  }


  const campaignDurationDays = (() => {
    if (!selectedCampaign) return null
    const start = new Date(
      selectedCampaign.createdAt || selectedCampaign.startsAt || 0
    ).getTime()
    const end = selectedCampaign.endsAt
      ? new Date(selectedCampaign.endsAt).getTime()
      : Date.now()
    if (!start || Number.isNaN(start)) return null
    const days = Math.round((end - start) / 86400_000)
    if (days < 0) return null
    return days
  })()

  /* ===== Обработчики выбора файлов (video / image) ===== */
  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewError(null)

    // Сбрасываем картинку
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

    // Сбрасываем видео
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
    <div className="page-content ads-page-root">
      <main className="page-center ads-home">
        {/* Попап правил */}
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

        {/* ===== HEADER-УРОВЕНЬ ===== */}
        <section className="panel ads-panel ads-header-panel">
          <div className="ads-header-grid">
            {/* Левая часть: заголовок + пакет */}
            <div className="ads-header-left">
              <div className="ads-panel-title">
                <h1 className="ads-main-title">
                  {TX(t, 'ads_title', 'Рекламный кабинет')}
                </h1>
                <p className="ads-panel-sub">
                  {TX(
                    t,
                    'ads_subtitle',
                    'Управляй кампаниями, загружай креативы, смотри аналитику в реальном времени.'
                  )}
                </p>
              </div>

              {!loading && !error && pkgInfo && (
                <div className="ads-pkg-premium">
                  <div className="ads-pkg-row">
                    <span className="ads-pkg-label">
                      {TX(
                        t,
                        'ads_pkg_features_title',
                        'Текущий пакет'
                      )}
                    </span>
                    <span className="ads-pkg-name">{pkgLabel}</span>
                  </div>
                  <div className="ads-pkg-row">
                    {hasActivePkg ? (
                      <>
                        <div className="ads-pkg-bell">
                          <span role="img" aria-label="bell">
                            🔔
                          </span>
                        </div>
                        <div className="ads-pkg-exp-text">
                           <span className="ads-pkg-exp-label">
                            {TX(
                              t,
                              'ads_pkg_remaining_label',
                              'Осталось'
                            )}
                          </span>
                          <span className="ads-pkg-exp-value">
                            {humanDaysLeft(t, pkgInfo?.daysLeft ?? 0)}
                          </span>
                          {pkgInfo?.expiresAt && (
                            <span className="ads-pkg-exp-date">
                              {' '}
                              (до {formatDateShort(pkgInfo.expiresAt)})
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="ads-pkg-expired-banner">
                        {TX(
                          t,
                          'ads_pkg_expired',
                          'Срок действия пакета истёк — купи новый на странице пакетов.'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Правая часть: сводка по аккаунту */}
            <div className="ads-header-right">
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
                    {TX(
                      t,
                      'ads_error_cabinet',
                      'Ошибка загрузки кабинета:'
                    )}{' '}
                    {String(error)}
                  </span>
                </div>
              )}
              {!loading && !error && (
                <div className="ads-header-metrics">
                  <MetricPill
                    tone="blue"
                    icon="📡"
                    label={TX(
                      t,
                      'ads_header_active_campaigns_label',
                      'Активных кампаний'
                   )}
                    value={activeCampaigns.length}
                    hint={TX(
                      t,
                      'ads_header_active_campaigns_hint',
                      'Количество кампаний в статусах Active / Running / Paused / Pending'
                    )}
                 />
                  <MetricPill
                    tone="blue"
                    icon="👁‍🗨"
                   label={TX(
                      t,
                      'ads_header_impressions_label',
                      'Показов за период'
                    )}
                    value={globalImpressions}
                    hint={TX(
                      t,
                      'ads_header_impressions_hint',
                      'Импрессии по выбранной кампании за период фильтра'
                    )}   
                 />
                  <MetricPill
                    tone="blue"
                    icon="🖱"
                    label={TX(
                      t,
                      'ads_header_clicks_label',
                      'Кликов за период'
                    )} 
                    value={globalClicks}                  
                    hint={TX(
                      t,
                      'ads_header_clicks_hint',
                      'Клики по выбранной кампании за период фильтра'
                    )}
                  />
                  <MetricPill
                    tone="gold"
                    icon="🎯"
                    label={TX(
                      t,
                      'ads_header_ctr_label',
                      'Общий CTR'
                    )}
                    value={globalCtr}
                    hint={TX(
                      t,
                      'ads_header_ctr_hint',
                      'CTR для выбранной кампании за период фильтра'
                    )}   
                 />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== ФОРМА СОЗДАНИЯ КАМПАНИИ ===== */}
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
                  <div className="ads-file-control">
                    <span className="ads-file-button">
                      {TX(
                        t,
                        'ads_file_button_choose',
                        'Выбрать файл'
                      )}
                    </span>
                    <span className="ads-file-filename">
                      {creative.videoFile
                        ? creative.videoFile.name
                        : TX(
                            t,
                            'ads_file_no_video',
                            'Файл не выбран'
                          )}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                    />
                  </div>
                </label>

                <label className="ads-field mini">
                  <span className="ads-field-label">
                    {TX(
                      t,
                      'ads_new_campaign_upload_image',
                      'Загрузить изображение'
                    )}
                  </span>
                  <div className="ads-file-control">
                    <span className="ads-file-button">
                      {TX(
                        t,
                        'ads_file_button_choose',
                        'Выбрать файл'
                      )}
                    </span>
                    <span className="ads-file-filename">
                      {creative.imageFile
                        ? creative.imageFile.name
                        : TX(
                            t,
                            'ads_file_no_image',
                            'Файл не выбран'
                          )}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                    />
                  </div>
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
                     <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- creative preview can be blob/external */}
                    <img
                      src={primaryCreative.imagePreviewUrl}
                      alt="preview"
                      className="ads-preview-img"
                    />
                  </>
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

        {/* ===== СПИСОК КАМПАНИЙ + АНАЛИТИКА ===== */}
        {!loading && !error && (
          <section className="panel ads-panel">
            <h2 className="ads-section-title">
              {TX(t, 'ads_campaigns_title', 'Твои кампании')}
            </h2>

            <div className="ads-campaigns-layout">
              {/* Левая колонка: список кампаний */}
              <div className="ads-campaigns-col">
                <div className="ads-campaigns-filters">
                  <div className="ads-filter-group">
                    <label className="ads-filter-label">
                      {TX(t, 'ads_filter_status_label', 'Статус:')}
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                       <option value="all">
                          {TX(t, 'ads_filter_status_all', 'Все')}
                        </option>
                        <option value="active">
                          {TX(t, 'ads_filter_status_active', 'Активные')}
                        </option>
                        <option value="finished">
                          {TX(
                            t,
                            'ads_filter_status_finished',
                            'Завершённые'
                          )}
                        </option>
                        <option value="draft">
                          {TX(
                            t,
                            'ads_filter_status_draft',
                            'Черновики'
                         )}
                        </option>
                    </select>
                  </div>
                  <div className="ads-filter-group ads-filter-search">
                    <input
                      type="text"
                        placeholder={TX(
                          t,
                          'ads_filter_search_placeholder',
                          'Поиск по названию или ссылке…'
                        )}   
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Desktop / tablet: таблица, Mobile: карточки */}
                {!isMobile ? (
                  <div className="ads-campaigns-list">
                    <div className="ads-campaigns-head">
                      <span>#</span>
                      <button
                        type="button"
                        className="ads-head-btn"
                        onClick={() => setSortKey('name')}
                      >
                          {TX(
                            t,
                            'ads_campaigns_head_name',
                            'Название'
                          )}{' '}
                          <span>{sortIcon('name')}</span>
                      </button>
                      <button
                        type="button"
                        className="ads-head-btn"
                        onClick={() => setSortKey('status')}
                      >
                          {TX(
                            t,
                            'ads_campaigns_head_status',
                            'Статус'
                          )}{' '}
                          <span>{sortIcon('status')}</span>
                      </button>
                      <span>
                        {TX(t, 'ads_campaigns_head_created', 'Создана')}
                      </span>
                      <button
                        type="button"
                        className="ads-head-btn"
                        onClick={() => setSortKey('start')}
                      >
                          {TX(
                            t,
                            'ads_campaigns_head_start',
                            'Старт'
                          )}{' '}
                          <span>{sortIcon('start')}</span>
                      </button>
                      <span>
                        {TX(
                          t,
                          'ads_campaigns_head_end',
                          'Конец'
                        )}
                      </span>
                      <span>
                        {TX(
                          t,
                          'ads_campaigns_head_media_type',
                          'Тип медиа'
                        )}                       
                      </span>
                      <span>
                        {TX(
                          t,
                          'ads_campaigns_head_impressions',
                          'Показов'
                        )}
                      </span>
                      <span>
                        {TX(
                          t,
                          'ads_campaigns_head_clicks',
                          'Кликов'
                        )}
                      </span>
                      <span>
                        {TX(
                          t,
                          'ads_campaigns_head_ctr',
                          'CTR'
                        )}
                      </span>
                    </div>
                    <div className="ads-campaigns-scroll">
                      {filteredCampaigns.length === 0 && (
                        <div className="ads-campaigns-empty">
                          {TX(
                            t,
                            'ads_campaigns_empty',
                            'Кампаний пока нет — создай первую, чтобы увидеть аналитику.'
                          )}
                        </div>
                      )}
                      {filteredCampaigns.map((c, idx) => {
                        const id = c.id || c.campaignId
                        const isSelected = id === selectedId
                        const status = (c.status || '').toLowerCase()
                        const statusLabel = (() => {
                          if (
                            status === 'active' ||
                            status === 'running'
                          )
                                return TX(
                                  t,
                                  'ads_status_active',
                                  'Активна'
                                )
                          if (status === 'paused')
                                return TX(
                                  t,
                                  'ads_status_paused',
                                  'На паузе'
                                )
                          if (status === 'stopped') 
                                return TX(
                                  t,
                                  'ads_status_stopped',
                                  'Остановлена'
                                )
                          if (
                            status === 'finished' ||
                            status === 'expired'
                          )
                                return TX(
                                  t,
                                  'ads_status_finished',
                                  'Завершена'
                                )
                          return status || '—'
                        })()
                        const statusTone =
                          status === 'active' || status === 'running'
                            ? 'green'
                            : status === 'paused'
                            ? 'yellow'
                            : status === 'finished' ||
                              status === 'stopped' ||
                              status === 'expired'
                            ? 'red'
                            : 'gray'

                        const mediaLabel =
                          c.mediaType === 'video'
                            ? TX(
                                t,
                                'ads_campaign_media_video_short',
                                'Видео'
                              )
                            : c.mediaType === 'image'
                            ? TX(
                                t,
                                'ads_campaign_media_image_short',
                                'Картинка'
                              )
                            : TX(
                                t,
                                'ads_campaign_media_link_short',
                                'Ссылка'
                              )
  const metrics = campaignMetrics[id] || null

  return (
    <button
      key={id || idx}
      type="button"
      className={
        'ads-campaign-row' + (isSelected ? ' selected' : '')
      }
      onClick={() => handleSelectCampaign(id)}
    >
      <span>{idx + 1}</span>
      <span className="ads-camp-name">
        {c.name ||
          TX(
            t,
            'ads_campaigns_untitled',
            'Без названия',
          )}
      </span>
      <span>
        <span
          className={`ads-status-pill ads-status-pill-${statusTone}`}
        >
          {statusLabel}
        </span>
      </span>
      <span>{formatDateShort(c.createdAt || c.startsAt)}        
      </span>
      <span>
  {c.startsAt ? formatDateShort(c.startsAt) : '—'}
    </span>
      <span>
        {c.endsAt ? formatDateShort(c.endsAt) : '—'}
      </span>
      <span className="ads-camp-media">{mediaLabel}</span>
      <span>{metrics ? metrics.impressions : '—'}</span>
      <span>{metrics ? metrics.clicks : '—'}</span>
      <span>{metrics ? metrics.ctr : '—'}</span>
    </button>
  )
})}
                    </div>
                  </div>
                ) : (
                  <div className="ads-campaigns-mobile">
{filteredCampaigns.map((c, idx) => {
  const id = c.id || c.campaignId
  const isSelected = id === selectedId
  return (
    <CampaignCard
      key={id || idx}
      t={t}
      campaign={c}
      idx={idx}
      isSelected={isSelected}
      onSelect={() => handleSelectCampaign(id)}
    />
  )
})}

                    {filteredCampaigns.length === 0 && (
                      <div className="ads-campaigns-empty">
                        {TX(
                          t,
                          'ads_campaigns_empty',
                          'Кампаний пока нет — создай первую, чтобы увидеть аналитику.'
                        )}
                      </div>
                    )}
                  </div>
                )}


              </div>

              {/* Правая колонка: аналитика выбранной кампании */}
              <div className="ads-analytics-col" ref={analyticsRef}>
                {isMobile && (
                  <button
                    type="button"
                    className="ads-back-to-list"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                    }}
                  >
                    {TX(
                      t,
                     'ads_analytics_back_to_list',
                      '← Назад к списку кампаний'
                    )}
                  </button>
                )}

                <div className="ads-analytics">
                  {selectedCampaign ? (
                    <>
                      {/* Заголовок аналитики */}
                      <div className="ads-analytics-header">
                        <div className="ads-analytics-main">
                          <div className="ads-analytics-title">
                            {selectedCampaign.name ||
                              TX(
                                t,
                                'ads_analytics_campaign_fallback',
                                'Кампания'
                              )}
                          </div>
                          {selectedCampaign.clickUrl && (
                            <a
                              href={selectedCampaign.clickUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ads-analytics-link"
                              title={selectedCampaign.clickUrl}
                            >
                              {selectedCampaign.clickUrl.slice(0, 80)}
                            </a>
                          )}
                          <div className="ads-analytics-dates">
                            {TX(
                              t,
                              'ads_analytics_period_label',
                              'Период:'
                            )}{' '}
                            {formatDateShort(
                              selectedCampaign.createdAt ||
                                selectedCampaign.startsAt
                            )}{' '}
                            —{' '}
                            {selectedCampaign.endsAt
                              ? formatDateShort(selectedCampaign.endsAt)
                              : '—'}
                          </div>
                          <div className="ads-analytics-status">
                            {TX(
                              t,
                              'ads_analytics_status_label',
                              'Статус:'
                            )}{' '}
                            <span
                              className={`ads-status-pill ads-status-pill-${(() => {
                                const s = (
                                  selectedCampaign.status || ''
                                ).toLowerCase()
                                if (
                                  s === 'active' ||
                                  s === 'running'
                                )
                                  return 'green'
                                if (s === 'paused') return 'yellow'
                                if (
                                  s === 'finished' ||
                                  s === 'stopped' ||
                                  s === 'expired'
                                )
                                  return 'red'
                                return 'gray'
                              })()}`}
                            >
                              {(() => {
                                const s = (
                                  selectedCampaign.status || ''
                                ).toLowerCase()
                                if (
                                  s === 'active' ||
                                  s === 'running'
                                )
                                  return TX(
                                    t,
                                    'ads_status_active',
                                    'Активна'
                                  )
                                if (s === 'paused')
                                  return TX(
                                    t,
                                    'ads_status_paused',
                                    'На паузе'
                                  )
                                if (s === 'stopped')
                                  return TX(
                                    t,
                                    'ads_status_stopped',
                                    'Остановлена'
                                  )
                                if (s === 'finished' || s === 'expired')
                                  return TX(
                                    t,
                                    'ads_status_finished',
                                    'Завершена'
                                  )
                                return s || '—'
                              })()}
                            </span>
                          </div>
                        </div>

                        <div className="ads-analytics-preview">
                          {selectedCampaign.mediaType === 'video' &&
                          selectedCampaign.mediaUrl ? (
                            <video
                              src={selectedCampaign.mediaUrl}
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : selectedCampaign.mediaType === 'image' &&
                            selectedCampaign.mediaUrl ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element -- analytics preview may be external */}
                              <img
                                src={selectedCampaign.mediaUrl}
                                alt="preview"
                              />
                            </>
                          ) : (
                            <div className="ads-analytics-preview-empty">
                              <span>
                                {TX(
                                  t,
                                  'ads_analytics_preview_stub',
                                  'Preview'
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Сводка по цифрам кампании */}
                      {analytics && (
                        <div className="ads-analytics-metrics">
                          <MetricPill
                            tone="blue"
                            icon="👁‍🗨"
                            label={TX(
                              t,
                              'ads_analytics_summary_impressions',
                              'Показов всего'
                            )}
                            value={analytics.impressionsTotal ?? 0}
                          />
                          <MetricPill
                            tone="blue"
                            icon="🖱"
                            label={TX(
                              t,
                              'ads_analytics_summary_clicks',
                              'Кликов всего'
                            )}
                            value={analytics.clicksTotal ?? 0}
                          />
                          <MetricPill
                            tone="gold"
                            icon="🎯"
                            label={TX(
                              t,
                              'ads_analytics_summary_ctr',
                              'CTR'
                            )}
                            value={
                              analytics.ctrTotal != null
                                ? `${(
                                    analytics.ctrTotal * 100
                                  ).toFixed(1)}%`
                                : '—'
                            }
                          />
            {campaignDurationDays != null && (
              <MetricPill
                tone="blue"
                icon="⏱"
                label={TX(
                  t,
                  'ads_analytics_duration_label',
                  'Длительность кампании'
                )}
                value={TX(
                  t,
                  'ads_analytics_duration_value',
                  `${campaignDurationDays} д`
                )}
              />
            )}
                        </div>
                      )}

                      {/* Панель управления аналитикой */}
                      <div className="ads-analytics-controls">
                        <div className="ads-select-group">
                          <span>
                            {TX(
                              t,
                              'ads_analytics_period',
                              'Период:'
                            )}
                          </span>
                          <button
                            type="button"
                            className={range === '1d' ? 'on' : ''}
                            onClick={() => setRange('1d')}
                          >
                            24h
                          </button>
                          <button
                            type="button"
                            className={range === '7d' ? 'on' : ''}
                            onClick={() => setRange('7d')}
                          >
                            7d
                          </button>
                          <button
                            type="button"
                            className={range === '30d' ? 'on' : ''}
                            onClick={() => setRange('30d')}
                          >
                            30d
                          </button>
                          <button
                            type="button"
                            className={range === 'all' ? 'on' : ''}
                            onClick={() => setRange('all')}
                          >
                            ALL
                          </button>
                        </div>
                        <div className="ads-select-group">
                          <span>
                            {TX(
                              t,
                              'ads_campaigns_actions',
                              'Действия:'
                            )}
                          </span>
                          {(() => {
                            const status = (
                              selectedCampaign?.status || ''
                            ).toLowerCase()
                            const isRunning =
                              status === 'active' || status === 'running'
                            const isFinished =
                              status === 'finished' || status === 'expired'

                            return (
                              <button
                                type="button"
                                disabled={
                                  campaignActionLoading ||
                                  !selectedCampaign ||
                                  isFinished
                                }
                                onClick={handleToggleSelectedCampaign}
                              >
                                {campaignActionLoading
                                  ? isRunning
                                    ? TX(
                                        t,
                                        'ads_campaigns_action_stop_ing',
                                        'Останавливаем…'
                                      )
                                    : TX(
                                        t,
                                        'ads_campaigns_action_start_ing',
                                        'Запускаем…'
                                      )
                                  : isRunning
                                  ? TX(
                                      t,
                                      'ads_campaigns_action_stop',
                                      'Остановить'
                                    )
                                  : TX(
                                      t,
                                      'ads_campaigns_action_start',
                                      'Запустить'
                                    )}
                              </button>
                            )
                          })()}
                          <button
                            type="button"
                            disabled={
                              campaignActionLoading || !selectedCampaign
                            }
                            onClick={handleDeleteSelectedCampaign}
                          >
                            {campaignActionLoading
                              ? TX(
                                  t,
                                  'ads_campaigns_action_delete_ing',
                                  'Удаляем…'
                                )
                              : TX(
                                  t,
                                  'ads_campaigns_action_delete',
                                  'Удалить'
                                )}
                          </button>
                        </div>
                      </div>
                      {campaignActionError && (
                        <div className="ads-error inline">
                          <span>
                            {TX(
                              t,
                              'ads_campaigns_action_error',
                              'Ошибка при выполнении действия с кампанией:'
                            )}{' '}
                            {String(campaignActionError)}
                          </span>
                        </div>
                      )}

                      {analyticsLoading && (
                        <div className="ads-loading">
                          <div className="ads-spinner" />
                          <span>
                            {TX(
                              t,
                              'ads_analytics_loading',
                              'Загружаем аналитику…'
                            )}
                          </span>
                        </div>
                      )}

                      {!analyticsLoading && analyticsError && (
                        <div className="ads-error inline">
                          <span>
                            {TX(
                              t,
                              'ads_analytics_error',
                              'Ошибка аналитики:'
                            )}{' '}
                            {String(analyticsError)}
                          </span>
                        </div>
                      )}

                      {/* ГЛАВНЫЙ ГРАФИК */}
                      {!analyticsLoading && analytics && (
                        <>
                           <ChartContainer
                            title={TX(
                              t,
                              'ads_analytics_main_chart_title',
                              'Временная аналитика кампании'
                            )}
                            right={
                              <>
                                <TabsGroup
                                  size="sm"
                                  tabs={[
                                    {
                                      value: 'impressions',
                                      label: TX(
                                        t,
                                        'ads_analytics_tab_impressions',
                                        'Показов'
                                      ),
                                    },
                                    {
                                      value: 'clicks',
                                      label: TX(
                                        t,
                                        'ads_analytics_tab_clicks',
                                        'Кликов'
                                      ),
                                    },
                                    {
                                      value: 'ctr',
                                      label: TX(
                                        t,
                                        'ads_analytics_tab_ctr',
                                        'CTR'
                                      ),
                                    },
                                  ]}
                                  selected={metricTab}
                                  onSelect={setMetricTab}
                                />
                              </>
                            }
                          >
                            <TinyBarChart
                              t={t}
                              // chartPoints уже нормализованы по таймфрейму,
                              // содержат impressions / clicks / ctr и label = ts
                              points={chartPoints}
                              metricKey={
                                metricTab === 'impressions'
                                  ? 'impressions'
                                  : metricTab === 'clicks'
                                  ? 'clicks'
                                  : 'ctr'
                              }
                              accent={
                                metricTab === 'clicks'
                                  ? 'clicks'
                                  : metricTab === 'ctr'
                                  ? 'ctr'
                                  : 'impressions'
                              }
                              allMetricsForTooltip
                            />

                          </ChartContainer>

                          {/* GEO */}
                          <GeoTable t={t} analytics={analytics} />
                        </>
                      )}
                    </>
                  ) : (
                    <div className="ads-analytics-empty">
                      {TX(
                        t,
                        'ads_analytics_empty',
                        'Выбери активную кампанию слева, чтобы увидеть аналитику.'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ===== СТИЛИ ===== */}
      <style jsx>{`


        .ads-home {
          padding-top: 16px;
          padding-bottom: 16px;
          color: #e2e8f0;
        }

        .ads-panel {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 20% -10%,
              rgba(56, 189, 248, 0.32),
              transparent 55%
            ),
            radial-gradient(
              circle at 110% 120%,
              rgba(250, 204, 21, 0.24),
              transparent 60%
            ),
            linear-gradient(180deg, #020617, #020617);
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.6);
  box-shadow:
    0 26px 70px rgba(0, 0, 0, 0.95),
    0 0 45px rgba(56, 189, 248, 0.4);
 padding: 14px 14px 16px;
  margin-bottom: 18px;
        }

        .ads-panel::before {
          content: '';
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(56, 189, 248, 0.6),
              transparent 55%
            ),
            radial-gradient(
              circle at 85% 20%,
              rgba(8, 47, 73, 0.9),
              transparent 65%
            ),
            radial-gradient(
              circle at 60% 110%,
              rgba(250, 204, 21, 0.5),
              transparent 60%
            ),
            linear-gradient(
              135deg,
              rgba(15, 23, 42, 0.7),
              rgba(15, 23, 42, 0.95)
            );
          opacity: 0.7;
          pointer-events: none;
          mix-blend-mode: screen;
        } 

       
        .ads-panel > * {
          position: relative;
          z-index: 1;
        }

        .ads-section-title {
          margin: 0 0 6px;
          font-size: clamp(18px, 2.2vw, 22px);
        }
        .ads-section-text {
          margin: 0 0 10px;
          font-size: 14px;
          color: #cbd5e1;
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
          border: 2px solid rgba(148, 163, 184, 0.4);
          border-top-color: rgba(56, 189, 248, 0.98);
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
          background: rgba(220, 38, 38, 0.18);
          border: 1px solid rgba(248, 113, 113, 0.8);
          font-size: 13px;
          color: #fee2e2;
        }
        .ads-error.inline {
          margin-top: 10px;
        }

        /* HEADER */
        .ads-header-panel {
          padding-bottom: 18px;
        }
        .ads-header-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.6fr);
          gap: 16px;
          align-items: stretch;
        }
        .ads-header-left {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ads-main-title {
          margin: 0;
          font-size: clamp(22px, 3vw, 30px);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .ads-panel-sub {
          margin: 4px 0 0;
          font-size: 13px;
          color: #cbd5e1;
          opacity: 0.85;
        }

        .ads-pkg-premium {
          border-radius: 16px;
          padding: 10px 12px;
          background:
            radial-gradient(circle at 0 0, rgba(56, 189, 248, 0.3), transparent 60%),
            radial-gradient(circle at 100% 100%, rgba(250, 204, 21, 0.25), transparent 60%),
            linear-gradient(135deg, #020617, #020617);
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow:
            inset 0 0 0 1px rgba(15, 23, 42, 0.9),
            0 18px 40px rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ads-pkg-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ads-pkg-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #94a3b8;
        }
        .ads-pkg-name {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .ads-pkg-bell {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: radial-gradient(
              circle at 30% 0,
              rgba(56, 189, 248, 0.9),
              transparent 60%
            ),
            radial-gradient(
              circle at 70% 120%,
              rgba(250, 204, 21, 0.9),
              transparent 70%
            );
          box-shadow:
            0 0 18px rgba(56, 189, 248, 0.8),
            0 0 26px rgba(250, 204, 21, 0.9);
        }
        .ads-pkg-exp-text {
          font-size: 12px;
        }
        .ads-pkg-exp-label {
          color: #94a3b8;
          margin-right: 4px;
        }
        .ads-pkg-exp-value {
          font-weight: 700;
        }
        .ads-pkg-exp-date {
          color: #94a3b8;
        }
        .ads-pkg-expired-banner {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(127, 29, 29, 0.75);
          border: 1px solid rgba(248, 113, 113, 0.9);
          font-size: 12px;
          color: #fee2e2;
        }

        .ads-header-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-height: 80px;
        }
        .ads-header-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        /* Форма */
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
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.8;
        }
        .ads-field input[type='text'] {
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: rgba(2, 6, 23, 0.96);
          padding: 8px 10px;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          box-shadow:
            0 12px 28px rgba(0, 0, 0, 0.85),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .ads-field input[type='text']::placeholder {
          opacity: 0.6;
        }
        .ads-field input[type='file'] {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .ads-file-control {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow:
            0 8px 18px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          font-size: 12px;
        }

        .ads-file-button {
          padding: 4px 10px;
          border-radius: 999px;
          background: linear-gradient(90deg, #22c55e, #22d3ee);
          color: #0f172a;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 10px;
          white-space: nowrap;
        }

        .ads-file-filename {
          font-size: 12px;
          opacity: 0.85;
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          background:
            radial-gradient(circle at 0 0, rgba(56, 189, 248, 0.24), transparent 60%),
            linear-gradient(180deg, #020617, #020617);
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(148, 163, 184, 0.4);
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
          background: #020617;
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
          color: #cbd5e1;
        }
        .ads-preview-url {
          font-weight: 700;
          margin-bottom: 6px;
        }
        .ads-preview-sub {
          opacity: 0.85;
        }

        /* Кампании + аналитика layout */
.ads-campaigns-layout {
  display: flex;
  flex-direction: column;
  gap: 16px; /* или тот gap, который у тебя был */
}

        .ads-campaigns-col {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .ads-campaigns-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
        }
        .ads-filter-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        .ads-filter-label {
          opacity: 0.8;
        }
        .ads-filter-group select {
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: rgba(15, 23, 42, 0.98);
          color: #e2e8f0;
          font-size: 12px;
        }
        .ads-filter-search {
          flex: 1;
          justify-content: flex-end;
        }
        .ads-filter-search input {
          width: 100%;
          max-width: 260px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: rgba(15, 23, 42, 0.98);
          color: #e2e8f0;
          padding: 6px 10px;
          font-size: 12px;
        }

        .ads-campaigns-list {
          border-radius: 14px;
          background: rgba(7, 13, 24, 0.98);
          border: 1px solid rgba(148, 163, 184, 0.5);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
.ads-campaigns-head {
  display: grid;
  grid-template-columns:
    32px         /* # */
    1.6fr        /* Name */
    1fr          /* Status */
    0.9fr        /* Created */
    0.9fr        /* Start */
    0.9fr        /* End */
    0.9fr        /* Media */
    0.9fr        /* Impressions */
    0.9fr        /* Clicks */
    0.8fr;       /* CTR */
  gap: 6px;
  padding: 6px 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.9;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}
/* Ячейки шапки: не ломаемся на 2 строки, режем по многоточию */
.ads-campaigns-head > span,
.ads-campaigns-head > button {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ads-head-btn {
  background: transparent;
  border: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
  text-align: left;
  cursor: pointer;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  min-width: 0;
}

/* Текст подписи внутри кнопки */
.ads-head-btn span:first-child {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Иконка сортировки — не сжимаем */
.ads-head-btn span:last-child {
  flex-shrink: 0;
  font-size: 10px;
  opacity: 0.8;
}


        .ads-campaigns-scroll {
          max-height: 320px;
          overflow-y: auto;
        }
.ads-campaign-row {
  width: 100%;
  display: grid;
  grid-template-columns:
    32px
    1.6fr
    1fr
    0.9fr
    0.9fr
    0.9fr
    0.9fr
    0.9fr
    0.9fr
    0.8fr;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(15, 23, 42, 0.9);
  background: transparent;
  cursor: pointer;
  transition: background 0.18s ease-out;
}
/* Каждая ячейка строки — одна строка, с многоточием */
.ads-campaign-row > span {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

        .ads-campaign-row:nth-child(even) {
          background: rgba(15, 23, 42, 0.9);
        }
        .ads-campaign-row:hover {
          background: radial-gradient(
              circle at 0 100%,
              rgba(56, 189, 248, 0.2),
              transparent 60%
            ),
            rgba(15, 23, 42, 0.98);
        }
        .ads-campaign-row.selected {
          background: radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.35),
              rgba(15, 23, 42, 0.96)
            );
          box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.9);
        }
        .ads-camp-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ads-camp-media {
          white-space: nowrap;
        }
        .ads-campaigns-empty {
          padding: 10px;
          font-size: 13px;
          opacity: 0.85;
        }

        .ads-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          border: 1px solid transparent;
        }
        .ads-status-pill-green {
          background: rgba(34, 197, 94, 0.16);
          border-color: rgba(34, 197, 94, 0.9);
          color: #bbf7d0;
        }
        .ads-status-pill-yellow {
          background: rgba(250, 204, 21, 0.16);
          border-color: rgba(250, 204, 21, 0.9);
          color: #fef9c3;
        }
        .ads-status-pill-red {
          background: rgba(220, 38, 38, 0.16);
          border-color: rgba(248, 113, 113, 0.9);
          color: #fecaca;
        }
        .ads-status-pill-gray {
          background: rgba(148, 163, 184, 0.16);
          border-color: rgba(148, 163, 184, 0.9);
          color: #e2e8f0;
        }

        .ads-campaigns-mobile {
          margin-top: 4px;
        }

        .ads-analytics-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ads-back-to-list {
          align-self: flex-start;
          margin-bottom: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: rgba(15, 23, 42, 0.96);
          color: #cbd5e1;
          font-size: 12px;
        }

        .ads-analytics {
          border-radius: 16px;
          background:
            radial-gradient(circle at 100% 0, rgba(56, 189, 248, 0.25), transparent 55%),
            linear-gradient(180deg, rgba(8, 12, 21, 0.98), #020617);
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(148, 163, 184, 0.4);
          padding: 12px 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ads-analytics-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .ads-analytics-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ads-analytics-title {
          font-size: 16px;
          font-weight: 800;
        }
        .ads-analytics-link {
          font-size: 12px;
          color: #38bdf8;
          text-decoration: none;
          word-break: break-all;
        }
        .ads-analytics-link:hover {
          text-decoration: underline;
        }
        .ads-analytics-dates {
          font-size: 11px;
          opacity: 0.7;
        }
        .ads-analytics-status {
          font-size: 11px;
          opacity: 0.85;
        }

        .ads-analytics-preview {
          width: 190px;
          height: 120px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.9);
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.9),
            0 0 30px rgba(56, 189, 248, 0.7);
          flex-shrink: 0;
        }
        .ads-analytics-preview video,
        .ads-analytics-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ads-analytics-preview-empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          opacity: 0.7;
        }

        .ads-analytics-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ads-analytics-controls {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
        }
        .ads-select-group {
          display: inline-flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }
        .ads-select-group span:first-child {
          opacity: 0.8;
        }
        .ads-select-group button {
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: rgba(15, 23, 42, 0.98);
          color: #e5f0ff;
          font-size: 11px;
          cursor: pointer;
        }
        .ads-select-group button.on {
          background: linear-gradient(
            135deg,
            #7a5c00 0%,
            #ffd700 18%,
            #fff4b3 32%,
            #ffd700 46%,
            #ffea80 60%,
            #b38400 74%,
            #ffd700 88%,
            #7a5c00 100%
          );
          color: #020617;
          box-shadow:
            0 0 0 1px rgba(255, 215, 99, 0.7),
            0 0 18px rgba(255, 215, 99, 0.45);
        }

        .ads-analytics-empty {
          font-size: 13px;
          opacity: 0.9;
        }

        /* Попап правил */
        .ads-rules-overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(18px);
          background: radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.35),
              transparent 60%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(250, 204, 21, 0.28),
              transparent 60%
            ),
            rgba(15, 23, 42, 0.92);
        }
        .ads-rules-modal { 
          width: min(720px, 100% - 32px);
          max-height: 80vh;
          padding: 14px 16px 14px;
          border-radius: 18px;
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
          box-shadow:
            0 25px 65px rgba(0, 0, 0, 0.85),
            0 0 55px rgba(255, 215, 99, 0.5);
        }
        .ads-rules-header {
          display: flex;
          align-items: center;
          gap: 10px;
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
       /* Лист кампаний: показываем ~5 строк, дальше вертикальный скролл */
       .ads-campaigns-scroll {
         max-height: 260px; /* примерно 5 кампаний по высоте */
         overflow-y: auto;
       }
        /* АДАПТИВ */
        @media (max-width: 1200px) {
          .ads-header-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .ads-header-right {
            justify-content: flex-start;
          }
          .ads-campaigns-layout {
            grid-template-columns: minmax(0, 1fr);
          }
        } 
        @media (max-width: 960px) {
          .ads-form-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .ads-analytics-header {
            flex-direction: column;
          }
          .ads-analytics-preview {
            align-self: flex-start;
          }
        }
        @media (max-width: 640px) {
          .ads-header-metrics {
            justify-content: flex-start;
          }
          .ads-header-right {
            align-items: flex-start;
          }

          .ads-campaigns-list {
            border: none;
            background: transparent;
          }
          .ads-analytics-preview {
            width: 110px;
            height: 70px;
          }
          .ads-geo-table {
            min-width: 0;
          }
          .ads-rules-modal {
            width: 100%;
            max-height: 72vh;
            border-radius: 14px;
          }
       .ads-campaigns-scroll {
         max-height: 260px; /* примерно 5 кампаний по высоте */
         overflow-y: auto;
       }       

       }
      `}</style>
    </div>
  )
}

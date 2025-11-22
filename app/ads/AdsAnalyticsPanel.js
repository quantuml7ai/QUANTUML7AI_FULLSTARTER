import React, { useMemo, useState } from 'react'

/* Локализация стран по коду (сюда перенесли, вне home.js ничего не ломаем) */
function localizeCountry(TX, t, code) {
  if (!code) {
    return TX(t, 'geo_country_unknown', 'Не определено')
  }
  const upper = String(code).toUpperCase()
  if (upper === 'ZZ') {
    return TX(t, 'geo_country_unknown', 'Не определено')
  }
  return TX(t, 'geo_country_' + upper, upper)
}

/* ===== Кружочки-метрики (общие для пакета и аналитики) ===== */
export function MetricPill({ label, value, hint, secondary }) {
  return (
    <div className="ads-pill" title={hint}>
      <div className="ads-pill-header">
        <span className="ads-pill-label">{label}</span>
        {secondary != null && secondary !== '' && (
          <span className="ads-pill-secondary">{secondary}</span>
        )}
      </div>
      <div className="ads-pill-value">{value}</div>

      <style jsx>{`
        .ads-pill {
          min-width: 140px;
          padding: 10px 16px 11px;
          border-radius: 999px;
          background:
            radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.5),
              transparent 60%
            ),
            linear-gradient(
              135deg,
              rgba(15, 23, 42, 0.98),
              rgba(15, 23, 42, 0.9)
            );
          border: 1px solid rgba(148, 163, 184, 0.85);
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.9),
            0 0 18px rgba(56, 189, 248, 0.45);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ads-pill-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }
        .ads-pill-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.9;
        }
        .ads-pill-secondary {
          font-size: 10px;
          opacity: 0.75;
          white-space: nowrap;
        }
        .ads-pill-value {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.04em;
          margin-top: 1px;
        }

        @media (max-width: 640px) {
          .ads-pill {
            min-width: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

/* ===== Мини-бар-чарт (обновлённый, во всю ширину блока) ===== */
function TinyBarChart({
  t,
  TX,
  points,
  metricKey,
  accent = 'impressions',
  height = 220,
}) {
  const data = Array.isArray(points) ? points : []

  if (!data.length) {
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
            height: 160px;
          }
        `}</style>
      </div>
    )
  }

  const vals = data.map((p) => Number(p[metricKey] || 0))
  const maxRaw = Math.max(...vals, 1)

  const magnitude = 10 ** Math.floor(Math.log10(maxRaw))
  const step = magnitude / 2
  const max = Math.ceil(maxRaw / step) * step || 1

  const tickCount = 4
  const ticks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((max / (tickCount - 1 || 1)) * i)
  )

  const formatXLabel = (raw) => {
    if (raw == null) return ''
    const n = Number(raw)
    let d = null

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

    if (data.length <= 8) {
      const hour = pad(d.getHours())
      const minute = pad(d.getMinutes())
      return `${day}.${month} ${hour}:${minute}`
    }
    return `${day}.${month}`
  }

  const stepLabels =
    data.length > 24 ? Math.ceil(data.length / 8) : data.length > 12 ? 2 : 1

  return (
    <div
      className="ads-chart"
      style={{ '--chartHeight': `${height}px` }}
    >
      <div className="ads-chart-yaxis">
        {ticks
          .slice()
          .sort((a, b) => b - a)
          .map((v) => (
            <div key={v} className="ads-chart-yrow">
              <span className="ads-chart-ylabel">{v}</span>
            </div>
          ))}
      </div>

      <div className="ads-chart-main">
        <div className="ads-chart-bars-wrap">
          <div className="ads-chart-grid-overlay" />
          <div className="ads-chart-bars">
            {data.map((p, idx) => {
              const v = Number(p[metricKey] || 0)
              const ratio = v / max
              const h = Math.max(3, ratio * 100)
              const label = p.label || p.ts
              return (
                <div
                  key={idx}
                  className={
                    'ads-chart-bar' +
                    (accent === 'clicks' ? ' ads-chart-bar-accent' : '')
                  }
                  style={{ height: `${h}%` }}
                  title={`${formatXLabel(label)} — ${v}`}
                />
              )
            })}
          </div>
        </div>

        <div className="ads-chart-xaxis">
          {data.map((p, idx) => {
            const label = p.label || p.ts
            const show = idx % stepLabels === 0
            return (
              <div key={idx} className="ads-chart-xlabel">
                {show ? <span>{formatXLabel(label)}</span> : null}
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .ads-chart {
          --chartHeight: ${height}px;
          position: relative;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 10px;
          padding: 10px 14px 14px;
          border-radius: 20px;
          min-height: var(--chartHeight);
          background:
            radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.18),
              transparent 60%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(250, 204, 21, 0.18),
              transparent 55%
            ),
            linear-gradient(
              180deg,
              rgba(8, 12, 20, 0.98),
              rgba(4, 7, 16, 0.96)
            );
          box-shadow:
            0 16px 40px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          overflow: hidden;
        }
        .ads-chart-yaxis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2px 6px 18px 0;
        }
        .ads-chart-yrow {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        .ads-chart-ylabel {
          font-size: 10px;
          opacity: 0.72;
          white-space: nowrap;
        }
        .ads-chart-main {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ads-chart-bars-wrap {
          position: relative;
          height: calc(var(--chartHeight) - 60px);
          border-radius: 16px;
          overflow: hidden;
          background: radial-gradient(
            circle at 0 100%,
            rgba(15, 23, 42, 0.98),
            rgba(15, 23, 42, 1)
          );
        }
        .ads-chart-bars {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          padding: 6px 8px 10px;
        }
        .ads-chart-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(
              to top,
              rgba(148, 163, 184, 0.34) 1px,
              transparent 1px
            );
          background-size: 100% 26px;
          opacity: 0.55;
          pointer-events: none;
        }
        .ads-chart-bar {
          flex: 1 1 0;
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            rgba(59, 130, 246, 0.98),
            rgba(56, 189, 248, 0.93),
            rgba(45, 212, 191, 0.97)
          );
          box-shadow:
            0 0 0 1px rgba(56, 189, 248, 0.75),
            0 6px 22px rgba(0, 0, 0, 0.9),
            0 0 34px rgba(56, 189, 248, 0.6);
          transform-origin: bottom center;
          transform: scaleY(0.1);
          animation: adsBarIn 0.5s ease-out forwards;
        }
        .ads-chart-bar-accent {
          background: linear-gradient(
            180deg,
            rgba(250, 250, 250, 0.98),
            rgba(252, 211, 77, 0.96),
            rgba(234, 179, 8, 1)
          );
          box-shadow:
            0 0 0 1px rgba(252, 211, 77, 0.9),
            0 8px 26px rgba(0, 0, 0, 1),
            0 0 40px rgba(252, 211, 77, 0.7);
        }
        .ads-chart-xaxis {
          display: flex;
          align-items: flex-start;
          gap: 4px;
          padding: 0 6px 0;
        }
        .ads-chart-xlabel {
          flex: 1 1 0;
          font-size: 9px;
          line-height: 1.2;
          text-align: center;
          color: rgba(226, 232, 240, 0.92);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ads-chart-xlabel span {
          display: block;
        }

        @keyframes adsBarIn {
          0% {
            transform: scaleY(0.05);
            opacity: 0;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .ads-chart {
            grid-template-columns: minmax(0, 1fr);
            padding: 8px 10px 10px;
          }
          .ads-chart-yaxis {
            display: none;
          }
          .ads-chart-bars-wrap {
            height: calc(var(--chartHeight) - 50px);
          }
        }
      `}</style>
    </div>
  )
}

/* ===== Карта точек на глобусе (псевдо-координаты по странам) ===== */
const COUNTRY_POINTS = {
  UA: { x: 60, y: 44 },
  RU: { x: 70, y: 38 },
  US: { x: 26, y: 48 },
  CA: { x: 28, y: 35 },
  BR: { x: 40, y: 68 },
  AR: { x: 38, y: 78 },
  GB: { x: 55, y: 36 },
  DE: { x: 57, y: 40 },
  FR: { x: 54, y: 42 },
  ES: { x: 52, y: 47 },
  IT: { x: 58, y: 46 },
  TR: { x: 63, y: 45 },
  IN: { x: 70, y: 58 },
  CN: { x: 79, y: 46 },
  JP: { x: 87, y: 46 },
  AU: { x: 82, y: 78 },
}

/* ===== Очень упрощённые контуры стран / мира (для SVG) ===== */
const WORLD_PATH =
  'M10 40 L30 28 L55 30 L72 34 L88 40 L90 55 L80 66 L60 70 L38 68 L18 60 Z'
const COUNTRY_SHAPES = {
  US: 'M10 42 L30 34 L58 34 L76 38 L86 46 L82 58 L60 64 L32 62 L16 54 Z',
  UA: 'M24 42 L76 42 L84 50 L70 56 L30 54 L22 48 Z',
  RU: 'M8 34 L38 26 L70 24 L92 30 L94 40 L80 48 L46 46 L26 44 Z',
  DE: 'M38 38 L58 38 L66 46 L62 60 L44 62 L36 52 Z',
  FR: 'M34 40 L54 40 L64 48 L54 62 L40 60 L32 50 Z',
  BR: 'M36 50 L56 46 L70 54 L66 68 L48 74 L34 64 Z',
  AU: 'M40 64 L64 64 L78 74 L72 86 L50 88 L34 80 Z',
}

/* ===== SVG-глобус с контурной картой ===== */
function CountryGlobe({ countryCode }) {
  const code = (countryCode || 'ZZ').toUpperCase()
  const point = COUNTRY_POINTS[code] || { x: 50, y: 50 }
  const path = COUNTRY_SHAPES[code] || WORLD_PATH

  return (
    <div className="ads-geo-globe-planet" key={code}>
      <svg
        viewBox="0 0 100 100"
        className="ads-geo-globe-svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="globeGradient" cx="30%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#e5f4ff" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#60a5fa" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#0f172a" stopOpacity="1" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#99f6e4" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <clipPath id="globeClip">
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>

        <g clipPath="url(#globeClip)">
          {/* океан */}
          <circle cx="50" cy="50" r="46" fill="url(#globeGradient)" />

          {/* пара долгота / широта */}
          <g
            stroke="rgba(148,163,184,0.55)"
            strokeWidth="0.6"
            fill="none"
            opacity="0.8"
          >
            <ellipse cx="50" cy="50" rx="40" ry="18" />
            <ellipse cx="50" cy="50" rx="32" ry="13" />
            <path d="M50 6 L50 94" />
            <path d="M30 10 Q50 50 30 90" />
            <path d="M70 10 Q50 50 70 90" />
          </g>

          {/* контур суши выбранной страны / мира */}
          <path
            d={path}
            fill="url(#landGradient)"
            stroke="#0f172a"
            strokeWidth="0.6"
            opacity="0.96"
          />

          {/* лёгкий ночной подсвет по краю */}
          <circle
            cx="18"
            cy="24"
            r="20"
            fill="rgba(248,250,252,0.12)"
            opacity="0.9"
          />
        </g>

        {/* рамка по краю планеты */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgba(148,163,184,0.9)"
          strokeWidth="1.4"
        />

        {/* точка-хотспот для выбранного гео */}
        <circle
          cx={point.x}
          cy={point.y}
          r="3"
          fill="#facc15"
          stroke="#f97316"
          strokeWidth="1"
          className="ads-geo-globe-hotspot"
        />
        <circle
          cx={point.x}
          cy={point.y}
          r="7"
          fill="none"
          stroke="rgba(250,204,21,0.7)"
          strokeWidth="0.8"
        />
      </svg>

      <style jsx>{`
        .ads-geo-globe-planet {
          position: relative;
          width: 130px;
          height: 130px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 40px rgba(56, 189, 248, 0.65),
            0 16px 28px rgba(0, 0, 0, 0.95);
          background: radial-gradient(
            circle at 30% 20%,
            rgba(248, 250, 252, 0.4),
            rgba(56, 189, 248, 0.35),
            rgba(15, 23, 42, 1)
          );
          animation: adsGeoSpin 0.6s ease-out;
        }
        .ads-geo-globe-svg {
          width: 110px;
          height: 110px;
          display: block;
        }
        .ads-geo-globe-hotspot {
          animation: adsGeoPulse 1.6s ease-out infinite;
        }

        @keyframes adsGeoSpin {
          0% {
            transform: scale(0.9) rotate(-10deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes adsGeoPulse {
          0% {
            transform: scale(0.4);
          }
          40% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(0.9);
          }
        }

        @media (max-width: 640px) {
          .ads-geo-globe-planet {
            width: 140px;
            height: 140px;
          }
        }
      `}</style>
    </div>
  )
}

/* ===== Карточка GEO-детализации (глобус + цифры) ===== */
function GeoGlobeCard({ TX, t, geo, totalImpressions, selectedIndex }) {
  if (!geo.length) return null
  const current = geo[selectedIndex] || geo[0]

  const imp = Number(current.impressions || 0)
  const clicks = Number(current.clicks || 0)
  const ctr = imp > 0 ? ((clicks / imp) * 100).toFixed(1) + '%' : '—'
  const shareNum =
    totalImpressions > 0 ? (imp / totalImpressions) * 100 : 0
  const share = shareNum.toFixed(1) + '%'

  const isoCode = (current.country || 'ZZ').toUpperCase()

  return (
    <div className="ads-geo-globe">
      <div className="ads-geo-globe-header">
        <span className="ads-geo-globe-label">
          {TX(t, 'ads_geo_focus', 'Фокус по гео')}
        </span>
        <div className="ads-geo-globe-title">
          {localizeCountry(TX, t, isoCode)}
        </div>
        <div className="ads-geo-globe-sub">
          <span>{current.region || '—'}</span>
          {current.city && <span> • {current.city}</span>}
        </div>
      </div>

      <div className="ads-geo-globe-body">
        <CountryGlobe countryCode={isoCode} />

        <div className="ads-geo-globe-metrics">
          <div className="ads-geo-globe-metric">
            <span>
              {TX(t, 'ads_geo_globe_impressions', 'Импрессии')}
            </span>
            <strong>{imp}</strong>
          </div>
          <div className="ads-geo-globe-metric">
            <span>{TX(t, 'ads_geo_globe_clicks', 'Клики')}</span>
            <strong>{clicks}</strong>
          </div>
          <div className="ads-geo-globe-metric">
            <span>{TX(t, 'ads_geo_globe_ctr', 'CTR')}</span>
            <strong>{ctr}</strong>
          </div>
          <div className="ads-geo-globe-metric">
            <span>
              {TX(t, 'ads_geo_globe_share', 'Доля от показов')}
            </span>
            <div className="ads-geo-globe-share-wrap">
              <div className="ads-geo-globe-share-bar" />
              <div
                className="ads-geo-globe-share-value"
                style={{ width: `${Math.min(shareNum, 100)}%` }}
              />
              <span className="ads-geo-globe-share-text">{share}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ads-geo-globe {
          border-radius: 18px;
          padding: 12px 14px 13px;
          background:
            radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.2),
              transparent 55%
            ),
            linear-gradient(
              145deg,
              rgba(15, 23, 42, 0.98),
              rgba(15, 23, 42, 0.92)
            );
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow:
            0 16px 40px rgba(0, 0, 0, 0.95),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: 100%;
        }
        .ads-geo-globe-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.7;
        }
        .ads-geo-globe-title {
          margin-top: 2px;
          font-size: 16px;
          font-weight: 700;
        }
        .ads-geo-globe-sub {
          margin-top: 1px;
          font-size: 12px;
          opacity: 0.82;
        }
        .ads-geo-globe-body {
          margin-top: 4px;
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 14px;
          align-items: center;
        }
        .ads-geo-globe-metrics {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .ads-geo-globe-metric span {
          font-size: 11px;
          opacity: 0.8;
        }
        .ads-geo-globe-metric strong {
          font-size: 14px;
          margin-top: 1px;
          display: inline-block;
        }
        .ads-geo-globe-share-wrap {
          position: relative;
          margin-top: 3px;
          height: 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.95);
          overflow: hidden;
        }
        .ads-geo-globe-share-bar {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(56, 189, 248, 0.4),
            rgba(96, 165, 250, 0.6)
          );
        }
        .ads-geo-globe-share-value {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(45, 212, 191, 0.96),
            rgba(234, 179, 8, 0.98)
          );
          transform-origin: left center;
        }
        .ads-geo-globe-share-text {
          position: absolute;
          right: 6px;
          top: -15px;
          font-size: 10px;
          opacity: 0.92;
        }

        @media (max-width: 640px) {
          .ads-geo-globe-body {
            grid-template-columns: minmax(0, 1fr);
            justify-items: center;
          }
        }
      `}</style>
    </div>
  )
}

/* ===== Основной супер-блок аналитики ===== */
export default function AdsAnalyticsPanel({
  t,
  TX,
  formatDate,
  selectedCampaign,
  analytics,
  analyticsLoading,
  analyticsError,
  range,
  setRange,
  groupBy,
  setGroupBy,
  campaignActionLoading,
  campaignActionError,
  onStopCampaign,
  onDeleteCampaign,
}) {
  const [geoIndex, setGeoIndex] = useState(0)

  const series = useMemo(
    () =>
      analytics?.series?.map((p) => ({
        ...p,
        label: p.label || p.ts,
      })) || [],
    [analytics]
  )

  const totalImp = Number(analytics?.impressionsTotal || 0)
  const totalClicks = Number(analytics?.clicksTotal || 0)
  const ctrTotal =
    analytics?.ctrTotal != null
      ? (analytics.ctrTotal * 100).toFixed(1) + '%'
      : '—'

  const geo = Array.isArray(analytics?.geo) ? analytics.geo : []
  const uniqueCountries = useMemo(
    () => new Set(geo.map((g) => g.country || 'ZZ')).size,
    [geo]
  )

  const periodDays = useMemo(() => {
    if (range === '1d') return 1
    if (range === '7d') return 7
    if (range === '30d') return 30
    if (range === 'all') return 365
    return 7
  }, [range])

  const avgImpPerDay =
    periodDays > 0 ? Math.round(totalImp / periodDays) : totalImp
  const avgClicksPerDay =
    periodDays > 0 ? Math.round(totalClicks / periodDays) : totalClicks

  if (!selectedCampaign) {
    return (
      <div className="ads-analytics-empty">
        {TX(
          t,
          'ads_analytics_empty',
          'Выбери активную кампанию слева, чтобы увидеть аналитику.'
        )}

        <style jsx>{`
          .ads-analytics-empty {
            border-radius: 18px;
            padding: 18px 14px;
            background: radial-gradient(
                circle at 0 0,
                rgba(56, 189, 248, 0.16),
                transparent 55%
              ),
              linear-gradient(180deg, rgba(8, 12, 20, 0.98), #020617);
            border: 1px solid rgba(148, 163, 184, 0.6);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.9);
            font-size: 13px;
            opacity: 0.9;
          }
        `}</style>
      </div>
    )
  }

  const statusLabel = (() => {
    const s = (selectedCampaign.status || '').toLowerCase()
    if (s === 'active' || s === 'running')
      return TX(t, 'ads_status_active', 'Active')
    if (s === 'paused') return TX(t, 'ads_status_paused', 'Paused')
    if (s === 'stopped') return TX(t, 'ads_status_stopped', 'Stopped')
    if (s === 'finished' || s === 'expired')
      return TX(t, 'ads_status_finished', 'Finished')
    return s || '—'
  })()

  const periodLabel =
    formatDate(selectedCampaign.createdAt || selectedCampaign.startsAt) +
    ' — ' +
    (selectedCampaign.endsAt
      ? formatDate(selectedCampaign.endsAt)
      : '—')

  return (
    <div className="ads-analytics">
      {/* HEADER */}
      <div className="ads-analytics-header">
        <div className="ads-analytics-header-main">
          <div className="ads-analytics-title">
            {selectedCampaign.name ||
              TX(t, 'ads_analytics_campaign_fallback', 'Кампания')}
          </div>
          <div className="ads-analytics-sub">
            {selectedCampaign.clickUrl
              ? selectedCampaign.clickUrl.slice(0, 90)
              : ''}
          </div>
          <div className="ads-analytics-dates">
            {TX(t, 'ads_campaigns_dates', 'Период:')}{' '}
            {periodLabel}
          </div>
          <div className="ads-analytics-status">
            {TX(t, 'ads_campaigns_status', 'Статус:')}{' '}
            <span className="ads-status-pill">{statusLabel}</span>
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
            <img src={selectedCampaign.mediaUrl} alt="preview" />
          ) : (
            <div className="ads-analytics-preview-empty">
              <span>
                {TX(t, 'ads_analytics_preview_stub', 'Preview')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="ads-analytics-controls">
        <div className="ads-select-group">
          <span>{TX(t, 'ads_analytics_period', 'Период:')}</span>
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
            {TX(t, 'ads_analytics_group_by', 'Группировка:')}
          </span>
          <button
            type="button"
            className={groupBy === 'hour' ? 'on' : ''}
            onClick={() => setGroupBy('hour')}
          >
            {TX(t, 'ads_analytics_group_by_hour', 'Часы')}
          </button>
          <button
            type="button"
            className={groupBy === 'day' ? 'on' : ''}
            onClick={() => setGroupBy('day')}
          >
            {TX(t, 'ads_analytics_group_by_day', 'Дни')}
          </button>
        </div>

        <div className="ads-select-group">
          <span>{TX(t, 'ads_campaigns_actions', 'Действия:')}</span>
          <button
            type="button"
            disabled={
              campaignActionLoading ||
              !selectedCampaign ||
              ['stopped', 'finished', 'expired'].includes(
                (selectedCampaign.status || '').toLowerCase()
              )
            }
            onClick={onStopCampaign}
          >
            {campaignActionLoading
              ? TX(
                  t,
                  'ads_campaigns_action_stop_ing',
                  'Останавливаем…'
                )
              : TX(t, 'ads_campaigns_action_stop', 'Остановить')}
          </button>
          <button
            type="button"
            disabled={campaignActionLoading || !selectedCampaign}
            onClick={onDeleteCampaign}
          >
            {campaignActionLoading
              ? TX(
                  t,
                  'ads_campaigns_action_delete_ing',
                  'Удаляем…'
                )
              : TX(t, 'ads_campaigns_action_delete', 'Удалить')}
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

      {!analyticsLoading && analytics && (
        <>
          {/* GRID: метрики + большие графики */}
          <div className="ads-analytics-grid">
            <div className="ads-analytics-metrics">
              <MetricPill
                label={TX(
                  t,
                  'ads_analytics_summary_impressions',
                  'Показов'
                )}
                value={totalImp}
                secondary={`${avgImpPerDay} / ${TX(
                  t,
                  'ads_analytics_per_day_short',
                  'день'
                )}`}
              />
              <MetricPill
                label={TX(
                  t,
                  'ads_analytics_summary_clicks',
                  'Кликов'
                )}
                value={totalClicks}
                secondary={`${avgClicksPerDay} / ${TX(
                  t,
                  'ads_analytics_per_day_short',
                  'день'
                )}`}
              />
              <MetricPill
                label={TX(
                  t,
                  'ads_analytics_summary_ctr',
                  'CTR'
                )}
                value={ctrTotal}
                secondary={TX(
                  t,
                  'ads_analytics_ctr_hint',
                  'клики / показы'
                )}
              />
              <MetricPill
                label={TX(
                  t,
                  'ads_analytics_summary_geo',
                  'Гео'
                )}
                value={uniqueCountries}
                secondary={TX(
                  t,
                  'ads_analytics_geo_countries',
                  'страны'
                )}
              />
            </div>

            <div className="ads-analytics-charts">
              <div className="ads-analytics-chart-block">
                <div className="ads-chart-title">
                  {TX(
                    t,
                    'ads_analytics_chart_impressions',
                    'Импрессии по времени'
                  )}
                </div>
                <TinyBarChart
                  t={t}
                  TX={TX}
                  points={series}
                  metricKey="impressions"
                  height={230}
                />
              </div>
              <div className="ads-analytics-chart-block">
                <div className="ads-chart-title">
                  {TX(
                    t,
                    'ads_analytics_chart_clicks',
                    'Клики по времени'
                  )}
                </div>
                <TinyBarChart
                  t={t}
                  TX={TX}
                  points={series}
                  metricKey="clicks"
                  accent="clicks"
                  height={230}
                />
              </div>
            </div>
          </div>

          {/* GEO-аналитика: таблица во всю ширину + глобус */}
          {geo.length > 0 && (
            <div className="ads-geo-row">
              <div className="ads-geo">
                <div className="ads-chart-title">
                  {TX(
                    t,
                    'ads_analytics_summary_top_regions',
                    'Гео по кампаниям'
                  )}
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
                        <th>
                          {TX(
                            t,
                            'ads_geo_impressions',
                            'Импрессии'
                          )}
                        </th>
                        <th>
                          {TX(t, 'ads_geo_clicks', 'Клики')}
                        </th>
                        <th>
                          {TX(t, 'ads_geo_ctr', 'CTR')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {geo.map((g, idx) => {
                        const imp = Number(g.impressions || 0)
                        const clicks = Number(g.clicks || 0)
                        const ctr =
                          imp > 0
                            ? ((clicks / imp) * 100).toFixed(1) + '%'
                            : '—'
                        const pct =
                          totalImp > 0
                            ? Math.round((imp / totalImp) * 100)
                            : 0
                        const active = idx === geoIndex

                        return (
                          <tr
                            key={
                              (g.country || '') +
                              (g.region || '') +
                              (g.city || '') +
                              idx
                            }
                            className={active ? 'on' : ''}
                            onClick={() => setGeoIndex(idx)}
                          >
                            <td>
                              {localizeCountry(TX, t, g.country)}
                            </td>
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
              </div>

              <GeoGlobeCard
                TX={TX}
                t={t}
                geo={geo}
                totalImpressions={totalImp}
                selectedIndex={geoIndex}
              />
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .ads-analytics {
          border-radius: 20px;
          background:
            radial-gradient(
              circle at 100% 0,
              rgba(56, 189, 248, 0.18),
              transparent 55%
            ),
            radial-gradient(
              circle at 0 100%,
              rgba(250, 204, 21, 0.18),
              transparent 55%
            ),
            linear-gradient(180deg, rgba(8, 12, 21, 0.98), #020617);
          border: 1px solid rgba(148, 163, 184, 0.55);
          box-shadow:
            0 18px 44px rgba(0, 0, 0, 0.95),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          padding: 14px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ads-analytics-header {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }
        .ads-analytics-header-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ads-analytics-title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.03em;
        }
        .ads-analytics-sub {
          font-size: 12px;
          opacity: 0.8;
        }
        .ads-analytics-dates {
          font-size: 11px;
          opacity: 0.78;
        }
        .ads-analytics-status {
          font-size: 11px;
          opacity: 0.9;
        }
        .ads-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 9px 3px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.16);
          border: 1px solid rgba(34, 197, 94, 0.9);
          font-size: 11px;
          margin-left: 6px;
        }

        .ads-analytics-preview {
          width: 160px;
          height: 92px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.95);
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
          opacity: 0.82;
        }
        .ads-select-group button {
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(157, 220, 255, 0.5);
          background: rgba(15, 23, 42, 0.95);
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
          color: #0b0b12;
          box-shadow:
            0 0 0 1px rgba(255, 215, 99, 0.7),
            0 0 18px rgba(255, 215, 99, 0.45);
        }

        .ads-analytics-grid {
          display: grid;
          grid-template-columns: minmax(0, 260px) minmax(0, 1.8fr);
          gap: 16px;
          align-items: stretch;
        }
        .ads-analytics-metrics {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ads-analytics-charts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          align-items: stretch;
        }
        .ads-analytics-chart-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ads-chart-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.8;
          margin-left: 2px;
        }

        .ads-geo-row {
          margin-top: 6px;
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
          gap: 14px;
          align-items: stretch;
        }
        .ads-geo {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .ads-geo-table-wrap {
          margin-top: 4px;
          flex: 1;
          max-height: 280px;
          overflow-y: auto;
          overflow-x: auto;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: rgba(15, 23, 42, 0.97);
        }
        .ads-geo-table {
          width: 100%;
          min-width: 560px;
          border-collapse: collapse;
          font-size: 12px;
        }
        .ads-geo-table thead {
          background: rgba(30, 64, 175, 0.6);
        }
        .ads-geo-table th,
        .ads-geo-table td {
          padding: 4px 8px;
          border-bottom: 1px solid rgba(30, 64, 175, 0.35);
        }
        .ads-geo-table th {
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ads-geo-table tbody tr:nth-child(even) {
          background: rgba(15, 23, 42, 0.94);
        }
        .ads-geo-table tbody tr {
          cursor: pointer;
          transition: background 0.12s ease-out;
        }
        .ads-geo-table tbody tr:hover {
          background: rgba(56, 189, 248, 0.15);
        }
        .ads-geo-table tbody tr.on {
          background: radial-gradient(
            circle at 0 0,
            rgba(56, 189, 248, 0.3),
            rgba(15, 23, 42, 1)
          );
        }
        .ads-geo-ctr-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ads-geo-ctr-cell span {
          font-size: 11px;
        }
        .ads-geo-bar-wrap {
          position: relative;
          height: 6px;
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
            rgba(0, 229, 255, 0.95),
            rgba(255, 196, 0, 0.98)
          );
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.6);
          transform-origin: left center;
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

        @media (max-width: 960px) {
          .ads-analytics-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .ads-analytics-metrics {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .ads-analytics-charts {
            grid-template-columns: minmax(0, 1fr);
          }
          .ads-geo-row {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 640px) {
          .ads-analytics-header {
            flex-direction: column;
          }
          .ads-analytics-preview {
            width: 130px;
            height: 76px;
          }
        }
      `}</style>
    </div>
  )
}

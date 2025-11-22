import React, { useMemo, useState } from 'react'

/* Локализация стран по коду (сюда перенесли, вне home.js ничего не ломаем) */
function localizeCountry(TX, t, code) {
  const raw = (code ?? '').toString().trim()
  if (!raw) {
    return TX(t, 'geo_country_unknown', 'Не определено')
  }
  const upper = raw.toUpperCase()

  // Всё, что не похоже на нормальный 2-буквенный код, считаем "Не определено"
  if (
    upper === 'ZZ' ||
    upper === 'NOT DEFINED' ||
    raw.length > 2 ||
    /[^A-Za-z]/.test(raw)
  ) {
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
          min-width: 110px;
          padding: 8px 10px;
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
          border: 1px solid rgba(148, 163, 184, 0.8);
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.85),
            0 0 18px rgba(56, 189, 248, 0.45);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ads-pill-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }
        .ads-pill-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.9;
        }
        .ads-pill-secondary {
          font-size: 10px;
          opacity: 0.7;
          white-space: nowrap;
        }
        .ads-pill-value {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.04em;
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

/* ===== Мини-бар-чарт ===== */
function TinyBarChart({
  t,
  TX,
  points,
  metricKey,
  accent = 'impressions',
  height = 220,
  groupBy,
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
  const niceMax = Math.ceil(maxRaw / step) * step || 1

  // запас по высоте, чтобы бары не били в потолок
  const effectiveMax = niceMax * 1.25 || 1

  const tickCount = 4
  const ticks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((niceMax / (tickCount - 1 || 1)) * i)
  )

  const isHourly = groupBy === 'hour'

  const formatXLabel = (raw) => {
    if (raw == null) return ''
    const n = Number(raw)
    let d = null

    if (!Number.isNaN(n) && n > 0) {
      const ms = n < 1e12 ? n * 1000 : n
      d = new Date(ms)
    } else {
      const parsed = new Date(String(raw))
      if (!Number.isNaN(parsed.getTime())) d = parsed
    }

    if (!d || Number.isNaN(d.getTime())) {
      return String(raw)
    }

    const pad = (x) => String(x).padStart(2, '0')
    const day = pad(d.getDate())
    const month = pad(d.getMonth() + 1)
    const hour = pad(d.getHours())
    const minute = pad(d.getMinutes())

    if (isHourly) {
      // Почасовая детализация: показываем только время
      if (data.length > 20) return `${hour}` // компактно "0", "1", "2"…
      if (data.length > 10) return `${hour}:00`
      return `${hour}:${minute}`
    }

    // По дням: просто дата
    return `${day}.${month}`
  }

  const stepLabels =
    data.length > 24 ? Math.ceil(data.length / 8) : data.length > 10 ? 2 : 1

  return (
    <div className="ads-chart" style={{ minHeight: height }}>
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
              const ratio = v / effectiveMax
              const h = Math.max(4, ratio * 100)
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
          position: relative;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 8px;
          padding: 10px 12px 14px;
          border-radius: 18px;
          background:
            radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.16),
              transparent 60%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(250, 204, 21, 0.16),
              transparent 55%
            ),
            linear-gradient(
              180deg,
              rgba(8, 12, 20, 0.98),
              rgba(4, 7, 16, 0.96)
            );
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          overflow: hidden;
          width: 100%;
        }
        .ads-chart-yaxis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2px 4px 16px 0;
        }
        .ads-chart-yrow {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        .ads-chart-ylabel {
          font-size: 10px;
          opacity: 0.7;
          white-space: nowrap;
        }
        .ads-chart-main {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ads-chart-bars-wrap {
          position: relative;
          height: 170px;
          border-radius: 14px;
          overflow: hidden;
          background: radial-gradient(
            circle at 0 100%,
            rgba(15, 23, 42, 0.96),
            rgba(15, 23, 42, 1)
          );
        }
        .ads-chart-bars {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: flex-start;
          gap: 6px;
          padding: 6px 10px 8px;
        }
        .ads-chart-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(
              to top,
              rgba(148, 163, 184, 0.28) 1px,
              transparent 1px
            );
          background-size: 100% 26px;
          opacity: 0.5;
          pointer-events: none;
        }
        .ads-chart-bar {
          flex: 0 0 8px;
          max-width: 10px;
          border-radius: 6px;
          background: linear-gradient(
            180deg,
            rgba(59, 130, 246, 0.98),
            rgba(56, 189, 248, 0.9),
            rgba(45, 212, 191, 0.95)
          );
          box-shadow:
            0 0 0 1px rgba(56, 189, 248, 0.55),
            0 4px 10px rgba(0, 0, 0, 0.85);
          transform-origin: bottom center;
        }
        .ads-chart-bar-accent {
          background: linear-gradient(
            180deg,
            rgba(250, 250, 250, 0.98),
            rgba(252, 211, 77, 0.95),
            rgba(234, 179, 8, 0.98)
          );
          box-shadow:
            0 0 0 1px rgba(252, 211, 77, 0.8),
            0 4px 12px rgba(0, 0, 0, 0.9);
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
          color: rgba(226, 232, 240, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ads-chart-xlabel span {
          display: block;
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
            height: 150px;
          }
        }
      `}</style>
    </div>
  )
}

/* ===== Карточка GEO-детализации (картинка карты мира) ===== */
function GeoGlobeCard({ TX, t, geo, totalImpressions, selectedIndex }) {
  if (!geo.length) return null
  const current = geo[selectedIndex] || geo[0]

  const imp = Number(current.impressions || 0)
  const clicks = Number(current.clicks || 0)
  const ctr = imp > 0 ? ((clicks / imp) * 100).toFixed(1) + '%' : '—'
  const share =
    totalImpressions > 0
      ? ((imp / totalImpressions) * 100).toFixed(1) + '%'
      : '0%'

  return (
    <div className="ads-geo-globe">
      <div className="ads-geo-globe-header">
        <span className="ads-geo-globe-label">
          {TX(t, 'ads_geo_focus', 'Фокус по гео')}
        </span>
        <div className="ads-geo-globe-title">
          {current.country ||
            TX(t, 'ads_geo_country_unknown', 'Не определено')}
        </div>
        <div className="ads-geo-globe-sub">
          {(current.region || '—')}{' '}
          {current.city ? `• ${current.city}` : ''}
        </div>
      </div>

      <div className="ads-geo-globe-body">
        <div className="ads-geo-globe-image">
          <img
            src="/geo-world-dots.gif"
            alt={TX(t, 'ads_geo_world_alt', 'Карта мира')}
          />
        </div>
        <div className="ads-geo-globe-metrics">
          <div className="ads-geo-globe-metric">
            <span>
              {TX(t, 'ads_geo_globe_impressions', 'Импрессии')}
            </span>
            <strong> — {imp}</strong>
          </div>
          <div className="ads-geo-globe-metric">
            <span>{TX(t, 'ads_geo_globe_clicks', 'Клики')}</span>
            <strong> — {clicks}</strong>
          </div>
          <div className="ads-geo-globe-metric">
            <span>{TX(t, 'ads_geo_globe_ctr', 'CTR')}</span>
            <strong> — {ctr}</strong>
          </div>
          <div className="ads-geo-globe-metric">
            <span>
              {TX(t, 'ads_geo_globe_share', 'Доля от показов')}
            </span>
            <div className="ads-geo-globe-share-wrap">
              <div className="ads-geo-globe-share-bar" />
              <div
                className="ads-geo-globe-share-value"
                style={{ width: share }}
              />
              <span className="ads-geo-globe-share-text">
                — {share}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ads-geo-globe {
          border-radius: 16px;
          padding: 10px 12px;
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
            0 14px 32px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ads-geo-globe-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.7;
        }
        .ads-geo-globe-title {
          font-size: 15px;
          font-weight: 700;
        }
        .ads-geo-globe-sub {
          font-size: 12px;
          opacity: 0.8;
        }
        .ads-geo-globe-body {
          margin-top: 4px;
          display: grid;
          grid-template-columns: 140px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
        }
        .ads-geo-globe-image {
          position: relative;
          width: 140px;
          height: 90px;
          border-radius: 14px;
          overflow: hidden;
          background: radial-gradient(
            circle at 30% 20%,
            rgba(248, 250, 252, 0.4),
            rgba(56, 189, 248, 0.3),
            rgba(15, 23, 42, 0.95)
          );
          box-shadow:
            0 0 24px rgba(56, 189, 248, 0.6),
            0 10px 20px rgba(0, 0, 0, 0.9);
        }
        .ads-geo-globe-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ads-geo-globe-metrics {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ads-geo-globe-metric span {
          font-size: 11px;
          opacity: 0.8;
        }
        .ads-geo-globe-metric strong {
          font-size: 14px;
        }
        .ads-geo-globe-share-wrap {
          position: relative;
          margin-top: 2px;
          height: 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
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
            rgba(45, 212, 191, 0.95),
            rgba(234, 179, 8, 0.95)
          );
          transform-origin: left center;
        }
        .ads-geo-globe-share-text {
          position: absolute;
          right: 4px;
          top: -14px;
          font-size: 10px;
          opacity: 0.9;
        }

        @media (max-width: 640px) {
          .ads-geo-globe-body {
            grid-template-columns: minmax(0, 1fr);
            justify-items: center;
          }
          .ads-geo-globe-image {
            width: 180px;
            height: 110px;
          }
        }
      `}</style>
    </div>
  )
}

/* ===== Карточка качества трафика ===== */
function TrafficQualityCard({ TX, t, ctrTotal, avgImpPerDay, avgClicksPerDay }) {
  const ctrValue =
    typeof ctrTotal === 'string' && ctrTotal.endsWith('%')
      ? parseFloat(ctrTotal)
      : Number(ctrTotal || 0)

  const targetCtr = 5 // 5%
  const scoreRaw = targetCtr ? Math.min(100, (ctrValue / targetCtr) * 100) : 0
  const score = Number.isFinite(scoreRaw) ? Math.max(0, scoreRaw) : 0
  const ringDeg = (score / 100) * 280 // дуга прогресса

  let tierKey = 'ads_quality_mid'
  let tierLabel = 'Нормально'
  if (score >= 90) {
    tierKey = 'ads_quality_god'
    tierLabel = 'Максимум'
  } else if (score >= 65) {
    tierKey = 'ads_quality_good'
    tierLabel = 'Сильно'
  } else if (score <= 30) {
    tierKey = 'ads_quality_low'
    tierLabel = 'Слабовато'
  }

  const tierText = TX(t, tierKey, tierLabel)
  const scoreLabel = TX(t, 'ads_quality_score_label', 'Score')

  return (
    <div className="ads-quality-card">
      <div className="ads-quality-header">
        <span className="ads-quality-label">
          {TX(t, 'ads_quality_title', 'Качество трафика')}
        </span>
        <span className="ads-quality-tier">{tierText}</span>
      </div>

      <div className="ads-quality-body">
        <div className="ads-quality-gauge">
          <div className="ads-quality-ring">
            <div
              className="ads-quality-ring-fill"
              style={{ '--deg': `${ringDeg}deg` }}
            />
            <div className="ads-quality-ring-center">
              <div className="ads-quality-score">
                {Math.round(score)}
                <span>%</span>
              </div>
              <div className="ads-quality-score-sub">{scoreLabel}</div>
            </div>
          </div>
        </div>

        <div className="ads-quality-metrics">
          <div className="ads-quality-metric">
            <span>{TX(t, 'ads_quality_ctr', 'CTR за период')}</span>
            <strong> — {ctrTotal}</strong>
          </div>
          <div className="ads-quality-metric">
            <span>
              {TX(
                t,
                'ads_quality_imp_per_day',
                'Показов в среднем / день'
              )}
            </span>
            <strong> — {avgImpPerDay}</strong>
          </div>
          <div className="ads-quality-metric">
            <span>
              {TX(
                t,
                'ads_quality_clicks_per_day',
                'Кликов в среднем / день'
              )}
            </span>
            <strong> — {avgClicksPerDay}</strong>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ads-quality-card {
          border-radius: 16px;
          padding: 10px 14px;
          background:
            radial-gradient(
              circle at 100% 0,
              rgba(34, 197, 94, 0.24),
              transparent 55%
            ),
            linear-gradient(
              150deg,
              rgba(15, 23, 42, 0.98),
              rgba(15, 23, 42, 0.9)
            );
          border: 1px solid rgba(74, 222, 128, 0.7);
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.9),
            0 0 26px rgba(74, 222, 128, 0.5);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ads-quality-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .ads-quality-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.8;
        }
        .ads-quality-tier {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(15, 118, 110, 0.35);
          border: 1px solid rgba(45, 212, 191, 0.9);
        }
        .ads-quality-body {
          display: grid;
          grid-template-columns: 130px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
        }
        .ads-quality-gauge {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ads-quality-ring {
          position: relative;
          width: 110px;
          height: 110px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 10%,
            rgba(248, 250, 252, 0.45),
            rgba(21, 128, 61, 0.75),
            rgba(15, 23, 42, 1)
          );
          box-shadow:
            0 0 26px rgba(45, 212, 191, 0.7),
            0 10px 24px rgba(0, 0, 0, 0.95);
          overflow: hidden;
        }
        .ads-quality-ring-fill {
          position: absolute;
          inset: 10%;
          border-radius: 999px;
          border: 6px solid transparent;
          border-top-color: rgba(74, 222, 128, 0.98);
          border-right-color: rgba(45, 212, 191, 0.98);
          border-left-color: rgba(234, 179, 8, 0.9);
          transform: rotate(-140deg);
          transform-origin: 50% 50%;
          --deg: 0deg;
          mask-image: conic-gradient(
            from 220deg,
            rgba(0, 0, 0, 1) calc(var(--deg)),
            rgba(0, 0, 0, 0.1) calc(var(--deg) + 1deg)
          );
        }
        .ads-quality-ring-center {
          position: absolute;
          inset: 22%;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 10%,
            rgba(248, 250, 252, 0.25),
            rgba(15, 23, 42, 0.98)
          );
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }
        .ads-quality-score {
          font-size: 20px;
          font-weight: 800;
        }
        .ads-quality-score span {
          font-size: 11px;
          opacity: 0.8;
          margin-left: 2px;
        }
        .ads-quality-score-sub {
          font-size: 10px;
          opacity: 0.8;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .ads-quality-metrics {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ads-quality-metric span {
          font-size: 11px;
          opacity: 0.8;
        }
        .ads-quality-metric strong {
          font-size: 14px;
        }

        @media (max-width: 640px) {
          .ads-quality-body {
            grid-template-columns: minmax(0, 1fr);
            justify-items: center;
          }
        }
      `}</style>
    </div>
  )
}

/* ===== Heatmap по часам суток ===== */
function HourHeatmap({ TX, t, series }) {
  const buckets = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      impressions: 0,
      clicks: 0,
    }))
    if (!Array.isArray(series)) return arr
    for (const p of series) {
      const ts = p.ts || p.label
      if (!ts) continue
      let d = null
      const n = Number(ts)
      if (!Number.isNaN(n) && n > 0) {
        const ms = n < 1e12 ? n * 1000 : n
        d = new Date(ms)
      } else {
        const parsed = new Date(String(ts))
        if (!Number.isNaN(parsed.getTime())) d = parsed
      }
      if (!d) continue
      const h = d.getHours()
      const idx = Number.isNaN(h) ? null : h
      if (idx == null || idx < 0 || idx > 23) continue
      arr[idx].impressions += Number(p.impressions || 0)
      arr[idx].clicks += Number(p.clicks || 0)
    }
    return arr
  }, [series])

  const maxImp = buckets.reduce(
    (m, b) => (b.impressions > m ? b.impressions : m),
    0
  )

  return (
    <div className="ads-heatmap">
      <div className="ads-heatmap-header">
        <span className="ads-heatmap-title">
          {TX(t, 'ads_heatmap_title', 'Активность по часам')}
        </span>
        <span className="ads-heatmap-sub">
          {TX(
            t,
            'ads_heatmap_sub',
            'Локальное время пользователя, ярче — больше показов'
          )}
        </span>
      </div>

      <div className="ads-heatmap-grid">
        {buckets.map((b) => {
          const ratio = maxImp > 0 ? b.impressions / maxImp : 0
          const intensity = Math.round(ratio * 100)
          const label = `${String(b.hour).padStart(2, '0')}:00`
          const ctr =
            b.impressions > 0
              ? ((b.clicks / b.impressions) * 100).toFixed(1) + '%'
              : '—'
          return (
            <div
              key={b.hour}
              className="ads-heatmap-cell"
              title={`${label} — ${b.impressions} imp / ${b.clicks} clicks (CTR ${ctr})`}
            >
              <div
                className="ads-heatmap-pill"
                style={{ '--intensity': `${intensity}` }}
              />
              <span className="ads-heatmap-hour">{label}</span>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .ads-heatmap {
          border-radius: 16px;
          padding: 10px 12px;
          background:
            radial-gradient(
              circle at 0 0,
              rgba(56, 189, 248, 0.16),
              transparent 55%
            ),
            linear-gradient(
              145deg,
              rgba(15, 23, 42, 0.98),
              rgba(15, 23, 42, 0.92)
            );
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ads-heatmap-header {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: baseline;
        }
        .ads-heatmap-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.85;
        }
        .ads-heatmap-sub {
          font-size: 11px;
          opacity: 0.75;
        }
        .ads-heatmap-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 4px;
        }
        .ads-heatmap-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 9px;
        }
        .ads-heatmap-pill {
          width: 100%;
          height: 14px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(30, 64, 175, 0.5),
            rgba(56, 189, 248, 0.9)
          );
          opacity: calc(0.2 + (var(--intensity) / 100) * 0.8);
          box-shadow:
            0 0 8px rgba(56, 189, 248, 0.4),
            0 0 0 1px rgba(15, 23, 42, 0.9);
        }
        .ads-heatmap-hour {
          opacity: 0.8;
        }

        @media (max-width: 960px) {
          .ads-heatmap-grid {
            grid-template-columns: repeat(8, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .ads-heatmap-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
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
  const [geoSort, setGeoSort] = useState({
    field: 'impressions',
    direction: 'desc',
  })

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

  const geoRaw = Array.isArray(analytics?.geo) ? analytics.geo : []

  const geo = useMemo(() => {
    const copy = [...geoRaw]
    const { field, direction } = geoSort
    const dir = direction === 'asc' ? 1 : -1

    copy.sort((a, b) => {
      const av = a[field]
      const bv = b[field]

      if (field === 'impressions' || field === 'clicks') {
        const an = Number(av || 0)
        const bn = Number(bv || 0)
        if (an === bn) return 0
        return an > bn ? dir : -dir
      }

      const astr = (av || '').toString().toLowerCase()
      const bstr = (bv || '').toString().toLowerCase()
      if (astr === bstr) return 0
      return astr > bstr ? dir : -dir
    })

    return copy
  }, [geoRaw, geoSort])

  const uniqueCountries = useMemo(
    () => new Set(geoRaw.map((g) => g.country || 'ZZ')).size,
    [geoRaw]
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

  const nonZeroImpIntervals = series.filter(
    (p) => Number(p.impressions || 0) > 0
  ).length

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
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.9);
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
    (selectedCampaign.endsAt ? formatDate(selectedCampaign.endsAt) : '—')

  const handleGeoHeaderClick = (field) => {
    setGeoSort((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return { field, direction: 'desc' }
    })
  }

  const totalImpHint = TX(
    t,
    'ads_analytics_hint_total_imp',
    'Всего показов за выбранный период'
  )

  const btn24 = TX(t, 'ads_analytics_range_24h', '24h')
  const btn7d = TX(t, 'ads_analytics_range_7d', '7d')
  const btn30d = TX(t, 'ads_analytics_range_30d', '30d')
  const btnAll = TX(t, 'ads_analytics_range_all', 'ALL')

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
            {btn24}
          </button>
          <button
            type="button"
            className={range === '7d' ? 'on' : ''}
            onClick={() => setRange('7d')}
          >
            {btn7d}
          </button>
          <button
            type="button"
            className={range === '30d' ? 'on' : ''}
            onClick={() => setRange('30d')}
          >
            {btn30d}
          </button>
          <button
            type="button"
            className={range === 'all' ? 'on' : ''}
            onClick={() => setRange('all')}
          >
            {btnAll}
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
          {/* Метрики и два графика — все блоки столбиком */}
          <div className="ads-analytics-grid">
            {/* Ряд метрик-бочонков */}
            <div className="ads-analytics-metrics">
              <MetricPill
                label={TX(
                  t,
                  'ads_analytics_summary_impressions',
                  'Показов'
                )}
                value={totalImp}
                secondary={TX(
                  t,
                  'ads_analytics_avg_per_day',
                  'в среднем / день'
                )}
                hint={totalImpHint}
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
              <MetricPill
                label={TX(
                  t,
                  'ads_analytics_intervals_imp',
                  'Интервалы с показами'
                )}
                value={nonZeroImpIntervals}
                secondary={TX(
                  t,
                  'ads_analytics_intervals_total',
                  'по временной серии'
                )}
              />
            </div>

            {/* График показов на всю ширину */}
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
                groupBy={groupBy}
                height={230}
              />
            </div>

            {/* График кликов на всю ширину, под показами */}
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
                groupBy={groupBy}
                height={230}
              />
            </div>
          </div>

          {/* Качество трафика + heatmap */}
          <div className="ads-advanced-row">
            <TrafficQualityCard
              TX={TX}
              t={t}
              ctrTotal={ctrTotal}
              avgImpPerDay={avgImpPerDay}
              avgClicksPerDay={avgClicksPerDay}
            />
            <HourHeatmap TX={TX} t={t} series={series} />
          </div>

          {/* GEO-аналитика: сначала таблица на всю ширину, потом карта на всю ширину */}
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
                        <th
                          className={
                            'sortable ' +
                            (geoSort.field === 'country'
                              ? 'on ' + geoSort.direction
                              : '')
                          }
                          onClick={() => handleGeoHeaderClick('country')}
                        >
                          {TX(t, 'ads_geo_country', 'Страна')}
                        </th>
                        <th
                          className={
                            'sortable ' +
                            (geoSort.field === 'region'
                              ? 'on ' + geoSort.direction
                              : '')
                          }
                          onClick={() => handleGeoHeaderClick('region')}
                        >
                          {TX(t, 'ads_geo_region', 'Регион')}
                        </th>
                        <th
                          className={
                            'sortable ' +
                            (geoSort.field === 'city'
                              ? 'on ' + geoSort.direction
                              : '')
                          }
                          onClick={() => handleGeoHeaderClick('city')}
                        >
                          {TX(t, 'ads_geo_city', 'Город')}
                        </th>
                        <th
                          className={
                            'sortable numeric ' +
                            (geoSort.field === 'impressions'
                              ? 'on ' + geoSort.direction
                              : '')
                          }
                          onClick={() => handleGeoHeaderClick('impressions')}
                        >
                          {TX(
                            t,
                            'ads_geo_impressions',
                            'Импрессии'
                          )}
                        </th>
                        <th
                          className={
                            'sortable numeric ' +
                            (geoSort.field === 'clicks'
                              ? 'on ' + geoSort.direction
                              : '')
                          }
                          onClick={() => handleGeoHeaderClick('clicks')}
                        >
                          {TX(t, 'ads_geo_clicks', 'Клики')}
                        </th>
                        <th>{TX(t, 'ads_geo_ctr', 'CTR')}</th>
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
                            <td className="num">{imp}</td>
                            <td className="num">{clicks}</td>
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
          border-radius: 18px;
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
            0 16px 40px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          padding: 14px 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ads-analytics-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .ads-analytics-header-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ads-analytics-title {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: 0.03em;
        }
        .ads-analytics-sub {
          font-size: 12px;
          opacity: 0.8;
        }
        .ads-analytics-dates {
          font-size: 11px;
          opacity: 0.75;
        }
        .ads-analytics-status {
          font-size: 11px;
          opacity: 0.9;
        }
        .ads-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 9px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.16);
          border: 1px solid rgba(34, 197, 94, 0.9);
          font-size: 11px;
        }

        .ads-analytics-preview {
          width: 150px;
          height: 86px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.9);
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
          opacity: 0.8;
        }
        .ads-select-group button {
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(157, 220, 255, 0.4);
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
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
        }
        .ads-analytics-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
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
        }

        /* Качество + heatmap */
        .ads-advanced-row {
          margin-top: 4px;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.2fr);
          gap: 12px;
          align-items: stretch;
        }

        /* GEO: список + фокус по гео — строго друг под другом, на всю ширину */
        .ads-geo-row {
          margin-top: 6px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
        }
        .ads-geo-table-wrap {
          margin-top: 4px;
          max-height: 260px;
          overflow-y: auto;
          overflow-x: hidden;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: rgba(15, 23, 42, 0.97);
        }
        .ads-geo-table {
          width: 100%;
          min-width: 0;
          border-collapse: collapse;
          font-size: 12px;
          table-layout: fixed;
        }
        .ads-geo-table thead {
          background: rgba(30, 64, 175, 0.55);
        }
        .ads-geo-table th,
        .ads-geo-table td {
          padding: 4px 6px;
          border-bottom: 1px solid rgba(30, 64, 175, 0.35);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ads-geo-table th {
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: default;
          position: relative;
          user-select: none;
        }
        .ads-geo-table th.sortable {
          cursor: pointer;
        }
        .ads-geo-table th.sortable::after {
          content: '';
          position: absolute;
          right: 6px;
          top: 50%;
          margin-top: -4px;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 6px solid rgba(226, 232, 240, 0.4);
          opacity: 0.5;
        }
        .ads-geo-table th.sortable.on.asc::after {
          border-top: none;
          border-bottom: 6px solid rgba(226, 232, 240, 0.9);
          margin-top: -2px;
          opacity: 1;
        }
        .ads-geo-table th.sortable.on.desc::after {
          border-top: 6px solid rgba(226, 232, 240, 0.9);
          opacity: 1;
        }
        .ads-geo-table td.num {
          text-align: right;
        }
        .ads-geo-table tbody tr:nth-child(even) {
          background: rgba(15, 23, 42, 0.92);
        }
        .ads-geo-table tbody tr {
          cursor: pointer;
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
          .ads-advanced-row {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 640px) {
          .ads-analytics-header {
            flex-direction: column;
          }
          .ads-analytics-preview {
            width: 120px;
            height: 70px;
          }
        }
      `}</style>
    </div>
  )
}

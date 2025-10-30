// app/tma/auto/page.jsx
'use client'

import { useEffect, useState } from 'react'

// если у тебя есть alias "@", этот импорт верный.
// если алиаса нет — замени на: import { useI18n } from '../../components/i18n'
import { useI18n } from '@/components/i18n'

export default function TmaAutoPage() {
  const { t } = useI18n()

  const [msg, setMsg] = useState(t('tma_authorizing'))  // "Authorizing…"

  useEffect(() => {
    (async () => {
      try {
        const raw = window?.Telegram?.WebApp?.initData
        if (!raw || typeof raw !== 'string' || !raw.includes('hash=')) {
          setMsg(t('tma_no_init')) // "Open inside Telegram Mini App"
          return
        }

        try { window.Telegram.WebApp.ready?.() } catch {}

        const ret = new URL(window.location.href).searchParams.get('return') || '/forum'
        const res = await fetch('/api/tma/auto?return=' + encodeURIComponent(ret), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: raw })
        })

        const j = await res.json().catch(() => ({}))
        if (!j.ok) {
          setMsg((t('tma_auth_failed') + ': ' + (j.error || 'unknown')).trim())
          return
        }

        try {
          localStorage.setItem('ql7_uid', String(j.accountId))
          window.__AUTH_ACCOUNT__ = String(j.accountId)
          window.dispatchEvent(new CustomEvent('auth:ok', {
            detail: { accountId: String(j.accountId), provider: 'tg' }
          }))
        } catch {}

        window.location.replace(j.return || ret)
      } catch (e) {
        setMsg(t('tma_network_error') + ': ' + (e?.message || e))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasInit = typeof window !== 'undefined' && !!window?.Telegram?.WebApp?.initData

  return (
    <div className="tma-wrap">
      {/* ——— Геро-блок с анимацией ——— */}
      <div className="hero">
        <div className="shine" aria-hidden />
        <div className="stars" aria-hidden />

        <div className="title">
          <span className="logo">L7</span>
          <span className="qx">{t('tma_welcome_title')}</span>
        </div>

        <div className="sub">{t('tma_welcome_sub')}</div>

        <ul className="features" aria-label="features">
          <li>🌐 {t('tma_feat_forum')}</li>
          <li>🤖 {t('tma_feat_ai')}</li>
          <li>💹 {t('tma_feat_trading')}</li>
          <li>🛰️ {t('tma_feat_news')}</li>
          <li>💬 {t('tma_feat_chat')}</li>
        </ul>

        <div className="mining">
          <span className="coin" aria-hidden>🪙</span>
          <span className="coin" aria-hidden>🪙</span>
          <span className="coin" aria-hidden>🪙</span>
          <span className="note">{t('tma_mining_note')}</span>
        </div>
      </div>

      {/* ——— Технический статус авторизации ——— */}
      <div className="status" role="status" aria-live="polite">
        <b>{msg}</b>
        <small className="init">
          {hasInit ? t('tma_init_present') : t('tma_init_absent')}
        </small>
      </div>

      {/* ——— Стили (scoped) ——— */}
      <style jsx>{`
        .tma-wrap{
          --c1:#00c2ff; --c2:#9d7bff; --c3:#ffd54f;
          --bg:#05070e; --fg:#e6f0ff;
          min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:24px; background: radial-gradient(120% 120% at 10% 10%, rgba(0,194,255,.12), transparent 52%),
                          radial-gradient(140% 140% at 88% 22%, rgba(157,123,255,.10), transparent 60%),
                          var(--bg);
          color:var(--fg);
          overflow:hidden;
        }
        .hero{ position:relative; width:min(860px, 96vw); text-align:center; padding:28px 20px 22px; }
        .shine{
          position:absolute; inset:-12% -18% -8% -18%; z-index:0;
          background:
            radial-gradient(circle at 50% 0%, rgba(0,194,255,.20), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(255,213,79,.10), transparent 55%),
            radial-gradient(circle at 100% 100%, rgba(157,123,255,.12), transparent 55%);
          filter: blur(24px);
          animation: glow 3.2s ease-in-out infinite alternate;
        }
        .stars{
          position:absolute; inset:0; z-index:0; pointer-events:none;
          background-image:
            radial-gradient(2px 2px at 20% 30%, #fff6, transparent 30%),
            radial-gradient(2px 2px at 60% 20%, #fff6, transparent 30%),
            radial-gradient(2px 2px at 80% 70%, #fff6, transparent 30%),
            radial-gradient(2px 2px at 35% 80%, #fff6, transparent 30%);
          background-repeat:no-repeat;
          animation: twinkle 4.8s linear infinite;
        }

        .title{ position:relative; z-index:1; display:flex; gap:.6rem; align-items:center; justify-content:center; flex-wrap:wrap }
        .title .logo{
          display:inline-grid; place-items:center;
          width:56px; height:56px; border-radius:14px;
          font-weight:900; font-size:26px; letter-spacing:.02em;
          color:#00121f; background: linear-gradient(135deg, var(--c3), #ffb300);
          box-shadow: 0 10px 24px rgba(0,0,0,.35), 0 0 26px rgba(255,213,79,.25);
          text-shadow:none;
          transform: translateZ(0);
          animation: pop .55s ease-out both;
        }
        .title .qx{
          font-size: clamp(22px, 2.4vw + 18px, 42px);
          font-weight: 900;
          letter-spacing: .02em;
          background: linear-gradient(90deg, #aee9ff, #ffffff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 42px rgba(0,194,255,.25);
          animation: float .9s ease-out both;
        }

        .sub{
          margin-top: 10px;
          font-size: clamp(14px, 1.2vw + 10px, 18px);
          opacity:.92;
        }

        .features{
          margin: 14px auto 4px;
          display:flex; gap:.5rem .8rem; flex-wrap:wrap; justify-content:center;
          padding:0; list-style:none;
        }
        .features li{
          padding:.45rem .7rem; border-radius:999px;
          background: rgba(0,194,255,.10);
          border:1px solid rgba(0,194,255,.25);
          box-shadow: 0 8px 18px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.05);
          font-weight:700; letter-spacing:.01em;
        }

        .mining{ margin-top: 10px; display:flex; gap:.5rem; align-items:center; justify-content:center; flex-wrap:wrap }
        .mining .coin{
          font-size:20px; filter: drop-shadow(0 0 10px rgba(255,215,0,.35));
          animation: fall 1.6s linear infinite;
        }
        .mining .coin:nth-child(2){ animation-delay:.25s }
        .mining .coin:nth-child(3){ animation-delay:.5s }
        .mining .note{
          font-weight:800; color:#ffeaa7;
          text-shadow: 0 0 16px rgba(255,215,0,.28);
        }

        .status{
          position:relative; z-index:2; margin-top: 20px; text-align:center;
          color:#cfe7ff; opacity:.95;
        }
        .status .init{ display:block; margin-top:6px; opacity:.8 }

        @keyframes glow { from{ opacity:.85 } to{ opacity:1 } }
        @keyframes twinkle { 0%,100%{ opacity:.7 } 50%{ opacity:1 } }
        @keyframes pop { from{ transform:scale(.92); opacity:.6 } to{ transform:scale(1); opacity:1 } }
        @keyframes float { from{ transform:translateY(6px); opacity:.8 } to{ transform:translateY(0); opacity:1 } }
        @keyframes fall {
          0%{ transform: translateY(-12vh) rotate(0deg); opacity:0 }
          15%{ opacity:1 }
          100%{ transform: translateY(12vh) rotate(720deg); opacity:0 }
        }
        @media (prefers-reduced-motion: reduce){
          .shine,.stars,.title .logo,.title .qx,.mining .coin{ animation:none }
        }
      `}</style>
    </div>
  )
}

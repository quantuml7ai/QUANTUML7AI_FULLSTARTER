'use client'
import { useEffect } from 'react'
import { useI18n } from '../components/i18n' // путь поправь, если у тебя иной

export default function UnlimitModal({ open, onClose, onPay }) {
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const onKey = (e) => (e.key === 'Escape' ? onClose?.() : 0)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="unlimit-overlay" role="dialog" aria-modal="true" aria-labelledby="unlimit-title">
      <div className="unlimit-modal">
        <h3 id="unlimit-title">{t('ai_unlimit_title')}</h3>
        <p className="muted">{t('ai_unlimit_price')}</p>
        <p className="desc">{t('ai_unlimit_desc')}</p>

        <ul className="benefits">
          {(t('ai_unlimit_benefits') || []).map((x, i) => <li key={i}>{x}</li>)}
        </ul>

        <div className="row">
          <button className="btn primary" onClick={onPay}>{t('ai_unlimit_pay_now')}</button>
          <button className="btn ghost" onClick={onClose}>{t('ai_unlimit_cancel')}</button>
        </div>

        <style jsx>{`
          .unlimit-overlay{
            position: fixed; inset: 0; background: rgba(0,0,0,.55);
            display: grid; place-items: center; z-index: 1000;
          }
          .unlimit-modal{
            width: min(720px, calc(100% - 24px));
            background: rgba(10,10,12,.96);
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 14px; padding: 16px;
            box-shadow: 0 12px 40px rgba(0,0,0,.45);
          }
          h3{ margin: 0 0 4px 0; }
          .muted{ opacity: .8; margin: 0 0 10px 0; }
          .desc{ opacity: .9; }
          .benefits{ margin: 10px 0 14px 20px; }
          .row{ display:flex; gap:10px; }
          .btn{
            padding:10px 14px; border-radius:10px; cursor:pointer;
            border:1px solid rgba(255,255,255,.18); background:#0f1116; color:#eaf6ff;
            font-weight:700;
          }
          .btn.primary{
            border-color:#00d2ff; color:#baf1ff;
            box-shadow: 0 0 0 1px rgba(0,210,255,.22), inset 0 0 18px rgba(0,210,255,.18);
          }
          .btn.ghost{ background:transparent; }
        `}</style>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { readAuthorizedAccountId, runAuthorizedClientAction } from '../lib/authActionGateClient.js'
import { QL7_SUPPORT_ID } from '../lib/ql7-support/systemActor.js'
import { useI18n } from './i18n.js'
import { getRestrictionPortalCopy } from '../lib/account-restrictions/portalLexicon.js'
import { logoutStoredWalletSession } from '../lib/walletSessionClient.js'

const SUPPORT_QUERY = `/forum?ql7SupportOpen=1&inbox=messages&dmUser=${QL7_SUPPORT_ID}`
const SUPPORT_PENDING_KEY = 'ql7_support_open_after_forum'

const STYLE = `
.ql7SupportAuthPopoverLayer{position:fixed;inset:0;z-index:2147483000;display:grid;grid-template-columns:minmax(0,1fr);place-items:center;padding:18px;background:rgba(2,7,15,.62);backdrop-filter:blur(7px);overscroll-behavior:contain;touch-action:none}
.ql7SupportAuthPopoverLayer>.ql7SupportAuthPopover{position:relative!important;display:block!important;box-sizing:border-box!important;inline-size:calc(100vw - 28px)!important;width:calc(100vw - 28px)!important;max-inline-size:350px!important;max-width:350px!important;min-inline-size:0!important;min-width:0!important;flex:0 0 auto!important;align-self:center!important;justify-self:center!important;margin:0 auto!important;border:1px solid rgba(112,226,255,.38);border-radius:18px;background:linear-gradient(145deg,rgba(9,24,45,.98),rgba(5,12,24,.98));box-shadow:0 28px 80px rgba(0,0,0,.46),0 0 42px rgba(72,206,255,.14);padding:18px;color:#fff;text-align:center}
.ql7SupportAuthPopover h2{margin:0;color:#fff;font-size:clamp(18px,4.8vw,22px);line-height:1.2;letter-spacing:0;font-weight:900}
.ql7SupportAuthPopoverRail{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin:13px 0}
.ql7SupportAuthPopoverRail i{height:1px;border-radius:99px;background:linear-gradient(90deg,transparent,#70e9ff)}
.ql7SupportAuthPopoverRail i:last-child{background:linear-gradient(90deg,#ffd96a,transparent)}
.ql7SupportAuthPopoverRail span{width:8px;height:8px;border-radius:50%;background:#ffd96a;box-shadow:0 0 16px rgba(255,217,106,.78)}
.ql7SupportAuthPopover p{margin:0 auto 16px;max-width:32ch;color:#e8fbff;font-size:14px;line-height:1.5;font-weight:650}
.ql7SupportAuthPopover button{min-width:132px;min-height:40px;border:1px solid rgba(255,225,111,.7);border-radius:12px;background:linear-gradient(135deg,#7fefff,#ffe27a);color:#07111f;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 12px 26px rgba(0,0,0,.25)}
.ql7SupportAuthPopover button:focus-visible{outline:2px solid #fff;outline-offset:3px}
@media(max-width:520px){.ql7SupportAuthPopoverLayer{padding:14px}.ql7SupportAuthPopover{border-radius:16px;padding:16px}.ql7SupportAuthPopover p{font-size:13px}.ql7SupportAuthPopover button{width:100%}}
.ql7RestrictionLayer{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:18px;background:rgba(2,7,15,.78);backdrop-filter:blur(10px);overscroll-behavior:contain;touch-action:none}
.ql7RestrictionPanel{box-sizing:border-box;width:min(430px,calc(100vw - 28px));border:1px solid rgba(255,202,94,.62);border-radius:20px;background:linear-gradient(145deg,rgba(20,18,29,.99),rgba(5,12,24,.99));box-shadow:0 30px 90px rgba(0,0,0,.62);padding:22px;color:#fff;text-align:center}
.ql7RestrictionPanel h2{margin:0 0 12px;font-size:22px;line-height:1.2}.ql7RestrictionPanel p{margin:0 0 14px;line-height:1.55;color:#edf8ff}.ql7RestrictionTimer{font-variant-numeric:tabular-nums;font-weight:900;font-size:18px;margin:12px 0 18px}.ql7RestrictionActions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.ql7RestrictionActions button{min-height:40px;border-radius:12px;padding:0 14px;border:1px solid rgba(126,235,255,.55);background:#10243c;color:#fff;font-weight:800;cursor:pointer}
`

function i18nText(t, key, fallback) {
  const value = typeof t === 'function' ? String(t(key) || '').trim() : ''
  return value && value !== key ? value : fallback
}

function shouldHandleSupportLink(target) {
  const anchor = target?.closest?.('a[href]')
  if (!anchor) return null
  const href = String(anchor.getAttribute('href') || '').trim()
  const text = String(anchor.textContent || '').trim().toLowerCase()
  const tagged = anchor.classList?.contains('ql7-footer-support-link') || anchor.dataset?.ql7SupportEntry === '1'
  const supportDeepLink = href.includes('ql7SupportOpen=1') && href.includes(QL7_SUPPORT_ID)
  const supportish = /(?:support|поддерж|підтрим|soporte|destek|الدعم|支持|תמיכה)/iu.test(text)
  if (tagged || supportDeepLink || (href === '/contact' && supportish)) return anchor
  return null
}

function openSupportForumThread() {
  try { window.sessionStorage?.setItem(SUPPORT_PENDING_KEY, '1') } catch {}
  const isForum = String(window.location?.pathname || '').replace(/\/+$/u, '') === '/forum'
  if (isForum) {
    try { window.history?.pushState?.({}, '', SUPPORT_QUERY) } catch {}
    try { window.dispatchEvent(new CustomEvent('inbox:open-dm', { detail: { userId: QL7_SUPPORT_ID, source: 'global_footer_support_bridge' } })) } catch {}
    try { window.dispatchEvent(new CustomEvent('ql7-support:open-thread', { detail: { source: 'global_footer_support_bridge' } })) } catch {}
    return
  }
  window.location.assign(SUPPORT_QUERY)
}

export default function Ql7SupportRuntimeBridge() {
  const { t } = useI18n()
  const [blocked, setBlocked] = useState(false)
  const [restrictionState, setRestrictionState] = useState(null)
  const [restrictionNow, setRestrictionNow] = useState(Date.now())
  const copy = useMemo(() => ({
    title: i18nText(t, 'ql7_support_auth_popover_title', 'Attention'),
    body: i18nText(t, 'ql7_support_auth_popover_body', 'Authorization is required to contact QL 7 Support.'),
    ok: i18nText(t, 'ql7_support_auth_popover_ok', 'Understood'),
  }), [t])
  const restrictionCopy = getRestrictionPortalCopy(typeof document !== 'undefined' ? document.documentElement?.lang : 'en')

  useEffect(() => {
    if (!blocked) return undefined
    const previousOverflow = document.body?.style?.overflow || ''
    try { document.body.style.overflow = 'hidden' } catch {}
    const stop = (event) => { event.preventDefault(); event.stopPropagation() }
    const blockKeys = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'])
    const onKeyDown = (event) => { if (blockKeys.has(event.key)) stop(event) }
    document.addEventListener('wheel', stop, { passive: false, capture: true })
    document.addEventListener('touchmove', stop, { passive: false, capture: true })
    document.addEventListener('keydown', onKeyDown, { capture: true })
    return () => {
      try { document.body.style.overflow = previousOverflow } catch {}
      document.removeEventListener('wheel', stop, { capture: true })
      document.removeEventListener('touchmove', stop, { capture: true })
      document.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [blocked])

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      const accountId = readAuthorizedAccountId()
      if (!accountId) { if (!cancelled) setRestrictionState(null); return }
      try {
        const response = await fetch('/api/account-restrictions/status', { headers: { 'x-forum-user-id': String(accountId) }, cache: 'no-store' })
        const data = await response.json().catch(() => null)
        if (!cancelled) {
          const quarantine = data?.quarantine?.active ? data.quarantine : null
          setRestrictionState(quarantine)
          setRestrictionNow(Date.parse(data?.serverNow || '') || Date.now())
        }
      } catch {}
    }
    void refresh()
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('auth:ok', refresh)
    return () => {
      cancelled = true
      window.clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('auth:ok', refresh)
    }
  }, [])

  // A 1 Hz React clock is required only while the blocking restriction portal is
  // actually visible. Normal pages must not pay for a global once-per-second render.
  useEffect(() => {
    if (!restrictionState?.active) return undefined
    const interval = window.setInterval(() => {
      setRestrictionNow((value) => value + 1000)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [restrictionState?.active, restrictionState?.expiresAt])

  useEffect(() => {
    if (!restrictionState?.active) return undefined
    const previousOverflow = document.body?.style?.overflow || ''
    try { document.body.style.overflow = 'hidden' } catch {}
    const stop = (event) => { event.preventDefault(); event.stopPropagation() }
    const onKeyDown = (event) => { if (event.key === 'Escape' || [' ','PageUp','PageDown','Home','End','ArrowUp','ArrowDown'].includes(event.key)) stop(event) }
    document.addEventListener('wheel', stop, { passive:false, capture:true })
    document.addEventListener('touchmove', stop, { passive:false, capture:true })
    document.addEventListener('keydown', onKeyDown, { capture:true })
    return () => { try { document.body.style.overflow = previousOverflow } catch {}; document.removeEventListener('wheel', stop, { capture:true }); document.removeEventListener('touchmove', stop, { capture:true }); document.removeEventListener('keydown', onKeyDown, { capture:true }) }
  }, [restrictionState?.active])

  const runSupportEntry = useCallback(async () => {
    setBlocked(false)
    const before = readAuthorizedAccountId()
    const result = await runAuthorizedClientAction({
      actionKey: 'ql7-support-global-entry',
      source: 'ql7-support-global-entry',
      timeoutMs: 120000,
      action: async () => openSupportForumThread(),
    })
    if (result?.ok) return
    if (!before) setBlocked(true)
  }, [])

  useEffect(() => {
    const onClick = (event) => {
      const anchor = shouldHandleSupportLink(event.target)
      if (!anchor) return
      event.preventDefault()
      event.stopPropagation()
      void runSupportEntry()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [runSupportEntry])

  const authPopover = blocked ? (
    <div
      className="ql7SupportAuthPopoverLayer"
      role="presentation"
      data-ql7-support-auth-popover-layer="true"
      data-ql7-support-auth-portal="body"
      onClick={(event) => { event.preventDefault(); event.stopPropagation() }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="ql7SupportAuthPopover" role="alertdialog" aria-modal="true" aria-labelledby="ql7-support-auth-title" data-ql7-support-auth-panel="bounded-350">
        <h2 id="ql7-support-auth-title">{copy.title}</h2>
        <div className="ql7SupportAuthPopoverRail" aria-hidden="true"><i /><span /><i /></div>
        <p>{copy.body}</p>
        <button type="button" onClick={() => setBlocked(false)} autoFocus>{copy.ok}</button>
      </div>
    </div>
  ) : null

  const remainingMs = restrictionState?.active ? Math.max(0, Date.parse(restrictionState.expiresAt || '') - restrictionNow) : 0
  const remainingText = remainingMs > 0
    ? `${Math.floor(remainingMs / 3600000)}:${String(Math.floor((remainingMs % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}`
    : '0:00:00'
  const restrictionPortal = restrictionState?.active ? (
    <div className="ql7RestrictionLayer" role="presentation" data-ql7-restriction-portal="true" onClick={(event)=>{event.preventDefault();event.stopPropagation()}} onPointerDown={(event)=>event.stopPropagation()}>
      <div className="ql7RestrictionPanel" role="alertdialog" aria-modal="true" aria-labelledby="ql7-restriction-title">
        <h2 id="ql7-restriction-title">{restrictionCopy.title}</h2>
        <p>{restrictionCopy.body}</p>
        <div className="ql7RestrictionTimer" aria-live="polite"><span>{restrictionCopy.remaining}: </span>{remainingText}</div>
        <div className="ql7RestrictionActions">
          <button type="button" onClick={()=>openSupportForumThread()} autoFocus>{restrictionCopy.support}</button>
          <button type="button" onClick={()=>{ try { window.sessionStorage?.setItem('ql7_support_appeal_after_forum','1') } catch {}; openSupportForumThread() }}>{restrictionCopy.appeal}</button>
          <button type="button" onClick={()=>window.location.assign('/privacy')}>{restrictionCopy.privacy}</button>
          <button type="button" onClick={async()=>{ try { await logoutStoredWalletSession() } finally { try { window.dispatchEvent(new CustomEvent('auth:logout',{detail:{reason:'restriction_portal_logout'}})) } catch {}; window.location.assign('/') } }}>{restrictionCopy.logout}</button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      {authPopover && typeof document !== 'undefined' ? createPortal(authPopover, document.body) : null}
      {restrictionPortal && typeof document !== 'undefined' ? createPortal(restrictionPortal, document.body) : null}
    </>
  )
}

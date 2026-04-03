// app/exchange/BattleCoin.jsx
'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Image from 'next/image' 
import { useI18n } from '../../components/i18n'

// ----------------- i18n helper -----------------
function tf(t, key, fallback) {
  const v = t(key)
  // если перевода нет и вернулся сам ключ – используем fallback
  if (!v || v === key) return fallback
  return v
}

// ----------------- auth helpers (как в AuthNavClient) -----------------
function readCookie(name) {
  try {
    const m = document.cookie.match(
      new RegExp(
        '(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'
      )
    )
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}

function readAccountId() {
  try {
    if (typeof window === 'undefined') return null
    if (window.__AUTH_ACCOUNT__) return String(window.__AUTH_ACCOUNT__)
    const a1 = localStorage.getItem('asherId')
    const a2 = localStorage.getItem('ql7_uid')
    const a3 =
      localStorage.getItem('ql7_account') ||
      localStorage.getItem('account') ||
      localStorage.getItem('wallet')
    const c1 = readCookie('asherId')
    return (a1 || a2 || a3 || c1) ? String(a1 || a2 || a3 || c1) : null
  } catch {
    return null
  }
}

function waitForAuth(timeoutMs = 15000) {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') return resolve(null)
      const existing = readAccountId()
      if (existing) return resolve(existing)

      let done = false
      const timer = setTimeout(() => {
        if (done) return
        done = true
        cleanup()
        resolve(readAccountId())
      }, timeoutMs)

      const onAuthOk = (ev) => {
        if (done) return
        done = true
        cleanup()
        try {
          const acc =
            (ev && ev.detail && ev.detail.accountId) || readAccountId() || null
          resolve(acc)
        } catch {
          resolve(readAccountId())
        }
      }

      const onLogout = () => {
        if (done) return
        done = true
        cleanup()
        resolve(null)
      }

      const cleanup = () => {
        try {
          clearTimeout(timer)
        } catch {}
        try {
          window.removeEventListener('auth:ok', onAuthOk)
        } catch {}
        try {
          window.removeEventListener('auth:logout', onLogout)
        } catch {}
      }

      window.addEventListener('auth:ok', onAuthOk)
      window.addEventListener('auth:logout', onLogout)

      try {
        window.dispatchEvent(new Event('open-auth'))
      } catch {}
    } catch {
      resolve(readAccountId())
    }
  })
}

async function ensureAuthorized() {
  const acc0 = readAccountId()
  if (acc0) return acc0
  const acc = await waitForAuth(20000)
  if (acc) {
    try {
      window.__AUTH_ACCOUNT__ = acc
    } catch {}
  }
  return acc
}

function showToast(message, kind = 'info') {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { kind, message } })
      )
    }
  } catch {}
}


// --- VIP helpers (как на Subscribe/Academy) ---
async function fetchVipStatusForAccount(accountId) {
  if (!accountId) return false
  try {
    const res = await fetch('/api/subscription/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    })
    const j = await res.json().catch(() => null)
    if (!j || !j.ok) return false
    return !!j.isVip
  } catch {
    return false
  }
}

async function createVipInvoice(accountId) {
  const res = await fetch('/api/pay/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // если у тебя в Subscribe/Academy есть ещё поле (plan/kind/sku),
    // просто добавь его сюда один в один
    body: JSON.stringify({ accountId }),
  })
  const j = await res.json().catch(() => null)
  if (!j || !j.ok || !j.url) {
    throw new Error(j?.error || 'vip_invoice_failed')
  }
  return j.url
}

function openPaymentWindow(url) {
  try {
    if (!url) return
    // можно через window.open, но на проде вы чаще юзаете прямой redirect
    window.location.href = url
  } catch {
    // запасной вариант
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {}
  }
}

// ----------------- utils -----------------
const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50, 100]

function formatNumber(x, decimals = 2) {
  const n = Number(x)
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatTimer(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// ===================== COMPONENT =====================
export default function BattleCoin() {
  const { t } = useI18n()

  const [loading, setLoading] = useState(true)
  const [lightLoading, setLightLoading] = useState(false)
  const [error, setError] = useState(null)

  const [auth, setAuth] = useState(false)
  const [isVip, setIsVip] = useState(false)
  const [balance, setBalance] = useState(null)

  const [symbols, setSymbols] = useState([])
  const [orders, setOrders] = useState([])
  const [activeOrder, setActiveOrder] = useState(null)

  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')
  const [stakeInput, setStakeInput] = useState('')
  const [selectedLeverage, setSelectedLeverage] = useState(1)

  const [filterTab, setFilterTab] = useState('all')

  const [nowTs, setNowTs] = useState(Date.now())
  const settleRequestedRef = useRef(false)

  const hasActiveOrder = !!(activeOrder && activeOrder.status === 'OPEN')

  // --- timer tick ---
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

const fetchState = useCallback(
  async (scope = 'full') => {
    try {
      const qs = scope === 'light' ? '?scope=light' : ''
      const accountId =
        typeof window !== 'undefined' ? readAccountId() : null

      const headers = {}
      if (accountId) {
        headers['x-forum-user-id'] = accountId
        headers['x-auth-account-id'] = accountId
      }

      const res = await fetch(`/api/battlecoin/state${qs}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      })
      const j = await res.json().catch(() => null)
      if (!j || !j.ok) {
        throw new Error(j?.error || 'BattleCoin state error')
      }
      setAuth(!!j.auth)
      if (scope === 'full') setAuth(!!j.auth)
      // VIP: обновляем ТОЛЬКО на full, чтобы light-поллинг не моргал
      if (scope === 'full') setIsVip(!!j.isVip)

      // баланс обновляем и на full, и на light
      if (typeof j.balance !== 'undefined') {
        setBalance(
          typeof j.balance === 'number' ? j.balance : j.balance || 0
        )
      }

      // историю берём только на full, чтобы light-пуллинг её не затирал
      if (scope === 'full') {
        if (Array.isArray(j.orders)) {
          setOrders(j.orders)
        } else {
          setOrders([])
        }
      }

      setSymbols(Array.isArray(j.symbols) ? j.symbols : [])
      setActiveOrder(j.order || null)

      // 🔧 ВАЖНО: теперь автосмена символа только для full-апдейта
      if (scope === 'full' && !hasActiveOrder) {
        if (j.order && j.order.symbol) {
          setSelectedSymbol(j.order.symbol)
        } else if (Array.isArray(j.symbols) && j.symbols.length) {
          setSelectedSymbol(j.symbols[0].symbol || 'BTCUSDT')
        }
      }

      setError(null)
    } catch (e) {
      console.error('BattleCoin state error', e)
      setError(String(e?.message || e) || 'BattleCoin error')
    } finally {
      if (scope === 'full') setLoading(false)
      if (scope === 'light') setLightLoading(false)
    }
  },
  [hasActiveOrder]
)

  useEffect(() => {
    fetchState('full')
  }, [fetchState])
 // ✅ ВАЖНО: после авторизации сразу подгружаем FULL (история, баланс, ордера)
 useEffect(() => {
   const onAuthOk = () => {
     // auth появился → нужен полный state, иначе история не загрузится никогда
     fetchState('full')
   }
   const onLogout = () => {
     setAuth(false)
     setIsVip(false)
     setBalance(null)
     setOrders([])        // можно оставить историю пустой для гостя
     setActiveOrder(null)
   }

   try {
     window.addEventListener('auth:ok', onAuthOk)
     window.addEventListener('auth:logout', onLogout)
   } catch {}

   return () => {
     try { window.removeEventListener('auth:ok', onAuthOk) } catch {}
     try { window.removeEventListener('auth:logout', onLogout) } catch {}
   }
 }, [fetchState])
  // --- lightweight polling for prices/PnL ---
  useEffect(() => {
    const id = setInterval(() => {
      setLightLoading(true)
      fetchState('light')
    }, 2500)
    return () => clearInterval(id)
  }, [fetchState])

  // --- timers & auto-settle ---
  const timeLeftSec = useMemo(() => {
    if (!activeOrder || activeOrder.status !== 'OPEN') return 0
    const left = (activeOrder.expiresAt || 0) - nowTs
    return Math.max(0, Math.floor(left / 1000))
  }, [activeOrder, nowTs])

  useEffect(() => {
    if (!activeOrder || activeOrder.status !== 'OPEN') {
      settleRequestedRef.current = false
      return
    }
    if (timeLeftSec <= 0 && !settleRequestedRef.current) {
      settleRequestedRef.current = true
      handleSettle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftSec, activeOrder])

  const stakeNumber = useMemo(() => {
    const n = parseFloat((stakeInput || '').replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }, [stakeInput])

  const effectiveBalance = typeof balance === 'number' ? balance : 0
  const maxLeverage = isVip ? 100 : 5

  const leverageValid =
    Number.isFinite(selectedLeverage) &&
    selectedLeverage > 0 &&
    selectedLeverage <= maxLeverage

  const canEditControls = auth && !hasActiveOrder
  const canChangeSymbol = !hasActiveOrder

  const stakeValid =
    stakeNumber > 0 && stakeNumber <= (effectiveBalance || 0 + 1e-9)

  const longShortDisabled =
    !auth || !stakeValid || !leverageValid || hasActiveOrder

const filteredOrders = useMemo(() => {
  if (!Array.isArray(orders)) return []

  let base = orders

  // если есть активный ордер OPEN и его нет в списке — добавим
  if (activeOrder && activeOrder.status === 'OPEN') {
    const exists = base.some((o) => o.orderId === activeOrder.orderId)
    if (!exists) {
      base = [activeOrder, ...base]
    }
  }

  if (filterTab === 'active') {
    return base.filter((o) => o.status === 'OPEN')
  }
  if (filterTab === 'closed') {
    return base.filter((o) => o.status === 'SETTLED')
  }
  return base
}, [orders, filterTab, activeOrder])

  const timerPulsing = timeLeftSec > 0 && timeLeftSec <= 10
  const handleVipClick = async () => {
    try {
      const acc = await ensureAuthorized()
      if (!acc) {
        showToast(tf(t, 'battlecoin_auth_required', 'Auth required'))
        return
      }

      const url = await createVipInvoice(acc)
      openPaymentWindow(url)

      // После успешной оплаты через несколько секунд
      // шлём глобальный vip:refresh — его ловит эффект выше
      setTimeout(() => {
        try {
          window.dispatchEvent(new Event('vip:refresh'))
        } catch {}
      }, 5000)
    } catch (e) {
      console.error('BattleCoin VIP pay error', e)
      const msg =
        e?.message === 'vip_invoice_failed'
          ? tf(t, 'vip_invoice_failed', 'Cannot create VIP invoice')
          : tf(t, 'vip_invoice_generic', 'VIP payment failed')
      showToast(msg, 'error')
    }
  }

  const handleStakeMax = () => {
    if (!canEditControls) return
    const v = effectiveBalance
    if (!Number.isFinite(v) || v <= 0) return
    const rounded = Math.floor(v * 100) / 100
    setStakeInput(String(rounded))
  }

  const handleLeverageClick = (lev) => {
    if (!canEditControls) return
    if (!isVip && lev > 5) {
      showToast(tf(t, 'battlecoin_vip_only_leverage', 'VIP only'))
      return
    }
    setSelectedLeverage(lev)
  }

  const handleSymbolClick = (symbol) => {
    if (!canChangeSymbol) return
    setSelectedSymbol(symbol)
  }

  const handleAuthClick = async () => {
    const acc = await ensureAuthorized()
    if (!acc) {
      showToast(tf(t, 'battlecoin_auth_required', 'Auth required'))
      return
    }
    await fetchState('full')
  }

  const handleOpenSide = async (side) => {
    if (!auth) {
      await handleAuthClick()
      return
    }
    if (longShortDisabled) return

    try {
      const accountId = readAccountId()
      const body = {
        op: 'open',
        side,
        symbol: selectedSymbol,
        stake: stakeNumber,
        leverage: selectedLeverage,
        accountId,
      }
      const res = await fetch('/api/battlecoin/order', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forum-vip': isVip ? '1' : '0',
        },
        body: JSON.stringify(body),
      })

      const j = await res.json().catch(() => null)
      if (!j || !j.ok) {
        const err = j?.error || 'battlecoin_err_open_failed'
        showToast(tf(t, err, 'Order open failed'), 'error')
        return
      }
      setBalance(
        typeof j.balance === 'number' ? j.balance : j.balance || 0
      )
      setActiveOrder(j.order || null)
      showToast(tf(t, 'battlecoin_toast_open_ok', 'Order opened'), 'success')
    } catch (e) {
      console.error('BattleCoin open error', e)
      showToast(tf(t, 'battlecoin_err_open_failed', 'Order open failed'), 'error')
    }
  }

  async function handleSettle() {
    try {
      const accountId = readAccountId()
      const body = {
        op: 'settle',
        accountId,
      }
      const res = await fetch('/api/battlecoin/order', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forum-vip': isVip ? '1' : '0',
        },
        body: JSON.stringify(body),
      })

      const j = await res.json().catch(() => null)
      if (!j || !j.ok) {
        const err = j?.error || 'battlecoin_err_settle_failed'
        showToast(tf(t, err, 'Order settle failed'), 'error')
        settleRequestedRef.current = false
        return
      }

      setBalance(
        typeof j.balance === 'number' ? j.balance : j.balance || 0
      )
      setActiveOrder(j.order || null)
      fetchState('full')

      const pnl = Number(j.order?.pnl || 0)
      if (pnl > 0) {
        showToast(tf(t, 'battlecoin_toast_win', 'You win'), 'success')
      } else if (pnl < 0) {
        if (Math.abs(pnl + j.order.stake) < 1e-6) {
          showToast(tf(t, 'battlecoin_toast_loss', 'You lose'), 'error')
        } else {
          showToast(tf(t, 'battlecoin_toast_loss', 'You lose'), 'error')
        }
      } else {
        showToast(tf(t, 'battlecoin_toast_break_even', 'Break-even'), 'info')
      }
    } catch (e) {
      console.error('BattleCoin settle error', e)
      showToast(tf(t, 'battlecoin_err_settle_failed', 'Order settle failed'), 'error')
      settleRequestedRef.current = false
    }
  }

  // ================== RENDER ==================
  const title = tf(t, 'battlecoin_title', 'BattleCoin')
  const subtitle =
    tf(
      t,
      'battlecoin_subtitle',
      'Bet real QCOIN with up to x100 leverage in 10-minute battles.'
    )

  const notAuthedText = tf(
    t,
    'battlecoin_auth_required',
    'Sign in to trade BattleCoin'
  )

  const balanceLabel = tf(t, 'battlecoin_balance_label', 'Available balance')

  return (
    <section className="panel battlecoin-panel">
      {/* ---------------- Header ---------------- */}
      <header className="battlecoin-header">
        <div className="battlecoin-header-left">
          <div className="battlecoin-logo-wrap">
            <div className="battlecoin-logo-orbit">
<Image
  src="/coins/battlecoin/logo.png"
  alt="BattleCoin"
  className="battlecoin-logo"
  width={160}
  height={160}
  priority
/>

              <div className="battlecoin-logo-glow" />
            </div>
          </div>

          <div className="battlecoin-titles">
            <div className="battlecoin-title-row">
              <h2 className="battlecoin-title">{title}</h2>
              <span className="battlecoin-tag"> • Quantum Futures • </span>
            </div>
            <p className="battlecoin-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="battlecoin-header-right">
          <div className="battlecoin-balance-block">
            <div className="battlecoin-balance-label">{balanceLabel}</div>
            <div className="battlecoin-balance-value">
              <span className="battlecoin-balance-number">
                {formatNumber(effectiveBalance, 4)}
              </span>
              <span className="battlecoin-balance-asset">QCOIN</span>
            </div>
          </div>

          <div className="battlecoin-header-divider" />

<div className="battlecoin-vip-block">
  {isVip ? (
    <div className="battlecoin-vip-pill">
      <span className="vip-spark" />
      {/* золотой перелив, как ты просил */}
      <span className="qcoinLabel">VIP</span>
      <span className="vip-val">x100</span>
    </div>
  ) : (
<button
  type="button"
  className="battlecoin-vip-cta"
  onClick={handleVipClick}
>
  {tf(t, 'battlecoin_vip_cta', 'Unlock VIP x100')}
</button>

  )}
</div>

        </div>
      </header>

      {/* ---------------- Main layout ---------------- */}
      <div className="battlecoin-layout">
        {/* Left: controls + active order */}
        <div className="battlecoin-left">
          {/* Control panel */}
          <div className="battlecoin-card battlecoin-control-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  {tf(t, 'battlecoin_leverage_label', 'Position setup')}
                </h3>
     <span className="card-subtitle">
       {tf(
         t,
         'battlecoin_control_subtitle',
         'Stake • Leverage • Direction'
       )}
     </span>
              </div>
              <div className="card-status-dot">
                <span className={`live-dot ${lightLoading ? 'is-pinging' : ''}`} />
     <span className="live-dot-label">
       {tf(t, 'battlecoin_live_market_label', 'Live market')}
     </span>
              </div>
            </div>

            {!auth ? (
              <div className="battlecoin-auth-warning">
                <div className="auth-text">{notAuthedText}</div>
                <button
                  type="button"
                  className="battlecoin-auth-btn"
                  onClick={handleAuthClick}
                >
                  {tf(t, 'auth_signin', 'Sign in')}
                </button>
              </div>
            ) : null}

            {/* leverage */}
            <div className="control-section">
              <div className="control-section-header">
                <span className="control-label">
                  {tf(t, 'battlecoin_leverage_label', 'Leverage')}
                </span>
   <span className="control-extra">
     {isVip
       ? tf(t, 'battlecoin_leverage_extra_vip', 'Up to x100')
       : tf(
           t,
           'battlecoin_leverage_extra_basic',
           'Up to x5 • VIP for more'
         )}
   </span>
              </div>
              <div className="battlecoin-leverage-grid">
                {LEVERAGE_OPTIONS.map((lev) => {
                  const vipOnly = lev > 5
                  const disabled =
                    !canEditControls || (!isVip && vipOnly)
                  const active = selectedLeverage === lev
                  return (
                    <button
                      key={lev}
                      type="button"
                      className={[
                        'lever-btn',
                        active ? 'is-active' : '',
                        disabled ? 'is-disabled' : '',
                        vipOnly ? 'is-vip-only' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleLeverageClick(lev)}
                    >
                      <span className="lever-val">x{lev}</span>
                      {vipOnly && <span className="lever-vip-tag">VIP</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* stake */}
            <div className="control-section two-cols">
              <div className="control-field">
                <div className="control-section-header">
                  <span className="control-label">
                    {tf(t, 'battlecoin_stake_label', 'Stake')}
                  </span>
                  <span className="control-extra">QCOIN</span>
                </div>
                <div className="stake-input-row">
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={stakeInput}
                    disabled={!canEditControls}
                    onChange={(e) => setStakeInput(e.target.value)}
                    className="stake-input"
                    placeholder="0.0000"
                  />
                  <button
                    type="button"
                    className="stake-max-btn"
                    onClick={handleStakeMax}
                    disabled={!canEditControls}
                  >
                    {tf(t, 'battlecoin_stake_max', 'MAX')}
                  </button>
                </div>
                <div className="balance-line">
                  <span className="balance-caption">
                    {balanceLabel}:
                  </span>
                  <span className="balance-num">
                    {formatNumber(effectiveBalance, 4)} QCOIN
                  </span>
                </div>
              </div>

              {/* symbol select */}
              <div className="control-field">
                <div className="control-section-header">
                  <span className="control-label">
                    {tf(t, 'battlecoin_col_symbol', 'Symbol')}
                  </span>
   <span className="control-extra">
     {tf(t, 'battlecoin_symbol_extra', 'Perpetual vs USDT')}
   </span>
                </div>
                <div className="symbol-select-row">
                  <div className="symbol-pill">


                    <span className="symbol-pill-text">
                      {selectedSymbol}
                    </span>
                  </div>
                  <select
                    value={selectedSymbol}
                    disabled={!canChangeSymbol}
                    onChange={(e) => handleSymbolClick(e.target.value)}
                    className="symbol-select"
                  >
                    {symbols.map((s) => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* long / short buttons */}
            <div className="control-section">
              <div className="control-section-header">


              </div>
              <div className="longshort-row">
                <button
                  type="button"
                  className="ls-btn ls-long"
                  disabled={longShortDisabled}
                  onClick={() => handleOpenSide('LONG')}
                >
                  <span className="ls-label">
                    {auth
                      ? tf(t, 'battlecoin_side_long', 'Long')
                      : notAuthedText}
                  </span>
     <span className="ls-sub">
       {tf(t, 'battlecoin_long_buy', 'Buy')}{' '}
       {selectedSymbol}
       {' • '}
       {tf(t, 'battlecoin_long_bullish', 'Bullish')}
     </span>
                  <span className="ls-glow" />
                </button>
                <button
                  type="button"
                  className="ls-btn ls-short"
                  disabled={longShortDisabled}
                  onClick={() => handleOpenSide('SHORT')}
                >
                  <span className="ls-label">
                    {auth
                      ? tf(t, 'battlecoin_side_short', 'Short')
                      : notAuthedText}
                  </span>
     <span className="ls-sub">
       {tf(t, 'battlecoin_short_sell', 'Sell')}{' '}
       {selectedSymbol}
       {' • '}
       {tf(t, 'battlecoin_short_bearish', 'Bearish')}
     </span>
                  <span className="ls-glow" />
                </button>
              </div>
            </div>
          </div>

          {/* Active order */}
          <div className="battlecoin-card battlecoin-active-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  {tf(
                    t,
                    'battlecoin_order_active_title',
                    'Active BattleCoin order'
                  )}
                </h3>
     <span className="card-subtitle">
       {tf(
         t,
         'battlecoin_active_subtitle',
         '10-minute fixed duration • auto-settle'
       )}
     </span>
              </div>
            </div>

            {!activeOrder || activeOrder.status !== 'OPEN' ? (
              <div className="empty-active">
                <div className="empty-pill">
                  {tf(
                    t,
                    'battlecoin_no_active_order',
                    'No active BattleCoin orders'
                  )}
                </div>
     <p className="empty-text">
       {tf(
         t,
         'battlecoin_empty_active_hint',
         'Configure stake and leverage, choose direction and fire your first battle.'
       )}
     </p>
              </div>
            ) : (
              <div className="active-grid">
                <div className="active-info">
                  <div className="info-row first">
         <span className="info-label">
           {tf(t, 'battlecoin_order_id_label', 'Order #')}
         </span>
          
                    <span className="info-value">
                      {activeOrder.orderId}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(t, 'battlecoin_col_symbol', 'Symbol')}
                    </span>
<div className="info-symbol">
  <Image
    src={`/coins/${activeOrder.symbol}.png`}
    alt={activeOrder.symbol}
    width={16}
    height={16}
  />
  <span>{activeOrder.symbol}</span>
</div>

                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(t, 'battlecoin_orders_col_side', 'Side')}
                    </span>
                    <span
                      className={[
                        'info-side',
                        activeOrder.side === 'LONG'
                          ? 'is-long'
                          : 'is-short',
                      ].join(' ')}
                    >
                      {activeOrder.side}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(
                        t,
                        'battlecoin_orders_col_leverage',
                        'Leverage'
                      )}
                    </span>
                    <span className="info-value">x{activeOrder.leverage}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(
                        t,
                        'battlecoin_orders_col_stake',
                        'Stake'
                      )}
                    </span>
                    <span className="info-value">
                      {formatNumber(activeOrder.stake, 4)} QCOIN
                    </span>
                  </div>
                </div>

                <div className="active-prices">
                  <div className="info-row">
                    <span className="info-label">
                      {tf(
                        t,
                        'battlecoin_orders_col_entry',
                        'Entry price'
                      )}
                    </span>
                    <span className="info-value">
                      {formatNumber(activeOrder.entryPrice, 6)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(t, 'battlecoin_col_price', 'Mark price')}
                    </span>
                    <span className="info-value">
                      {formatNumber(
                        activeOrder.markPrice ?? activeOrder.entryPrice,
                        6
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(
                        t,
                        'battlecoin_orders_col_change',
                        'Change'
                      )}
                    </span>
                    <span
                      className={[
                        'info-value',
                        (activeOrder.changePct || 0) >= 0
                          ? 'is-pos'
                          : 'is-neg',
                        'value-glow',
                      ].join(' ')}
                    >
                      {formatNumber(activeOrder.changePct || 0, 2)}%
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(t, 'battlecoin_orders_col_pnl', 'PnL')}
                    </span>
                    <span
                      className={[
                        'info-value',
                        (activeOrder.pnl || 0) >= 0 ? 'is-pos' : 'is-neg',
                        'value-glow',
                      ].join(' ')}
                    >
                      {formatNumber(activeOrder.pnl || 0, 4)} QCOIN
                    </span>
                  </div>
                </div>

                <div className="active-timer">
                  <div className="timer-label">
                    {tf(t, 'battlecoin_timer_label', 'Time left')}
                  </div>
                  <div
                    className={[
                      'timer-value',
                      timerPulsing ? 'is-pulsing' : '',
                    ].join(' ')}
                  >
                    {formatTimer(timeLeftSec)}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: market + history */}
        <div className="battlecoin-right">
          {/* Market list */}
          <div className="battlecoin-card market-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  {tf(
                    t,
                    'battlecoin_market_list_title',
                    'Battle market'
                  )}
                </h3>
     <span className="card-subtitle">
       {tf(
         t,
         'battlecoin_market_subtitle',
         'Realtime prices • click to target symbol'
       )}
     </span>
              </div>
            </div>
            <div className="market-table">
              <div className="market-head">
                <div className="mh-col idx">
                  {tf(t, 'battlecoin_col_index', '#')}
                </div>
                <div className="mh-col symbol">
                  {tf(t, 'battlecoin_col_symbol', 'Symbol')}
                </div>
                <div className="mh-col price">
                  {tf(t, 'battlecoin_col_price', 'Price')}
                </div>
                <div className="mh-col change">
                  {tf(
                    t,
                    'battlecoin_col_change24h',
                    '24h %'
                  )}
                </div>
              </div>
              <div className="market-body">
                {symbols.map((s, i) => {
                  const ch = Number(s.change24h || 0)
                  const isSelected = selectedSymbol === s.symbol
                  return (
                    <button
                      key={s.symbol}
                      type="button"
                      className={[
                        'market-row',
                        isSelected ? 'is-selected' : '',
                      ].join(' ')}
                      onClick={() => handleSymbolClick(s.symbol)}
                      disabled={!canChangeSymbol}
                    >
                      <div className="mb-col idx">{i + 1}</div>
                      <div className="mb-col symbol">
<Image
  src={`/coins/${s.symbol}.png`}
  alt={s.symbol}
  className="market-icon"
  width={50}
  height={50}
/>

                        <span className="symbol-text">{s.symbol}</span>
                      </div>
                      <div className="mb-col price">
                        {formatNumber(s.price, 6)}
                      </div>
                      <div
                        className={[
                          'mb-col change',
                          ch > 0 ? 'is-pos' : '',
                          ch < 0 ? 'is-neg' : '',
                          'value-glow',
                        ].join(' ')}
                      >
                        {formatNumber(ch, 2)}%
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="battlecoin-card history-card">
            <div className="card-header history-header">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  {tf(
                    t,
                    'battlecoin_orders_title',
                    'Battle history'
                  )}
                </h3>
     <span className="card-subtitle">
       {tf(
         t,
         'battlecoin_orders_subtitle',
         'Last 100 BattleCoin orders for this account'
       )}
     </span>
              </div>
              <div className="history-tabs">
                <button
                  type="button"
                  className={[
                    'history-tab',
                    filterTab === 'all' ? 'is-active' : '',
                  ].join(' ')}
                  onClick={() => setFilterTab('all')}
                >
                  {tf(t, 'battlecoin_filter_all', 'All')}
                </button>
                <button
                  type="button"
                  className={[
                    'history-tab',
                    filterTab === 'active' ? 'is-active' : '',
                  ].join(' ')}
                  onClick={() => setFilterTab('active')}
                >
                  {tf(t, 'battlecoin_filter_active', 'Active')}
                </button>
                <button
                  type="button"
                  className={[
                    'history-tab',
                    filterTab === 'closed' ? 'is-active' : '',
                  ].join(' ')}
                  onClick={() => setFilterTab('closed')}
                >
                  {tf(t, 'battlecoin_filter_closed', 'Closed')}
                </button>
              </div>
            </div>

            {!filteredOrders.length ? (
              <div className="no-history">
                {tf(
                  t,
                  'battlecoin_no_orders',
                  'No BattleCoin orders yet. Your first battle will appear here.'
                )}
              </div>
            ) : (
              <div className="history-table">
                <div className="history-head">
                  <div className="hh-col idx">
                    {tf(t, 'battlecoin_orders_col_index', '#')}
                  </div>
                  <div className="hh-col symbol">
                    {tf(
                      t,
                      'battlecoin_orders_col_symbol',
                      'Symbol'
                    )}
                  </div>
                  <div className="hh-col side">
                    {tf(
                      t,
                      'battlecoin_orders_col_side',
                      'Side'
                    )}
                  </div>
                  <div className="hh-col lev">
                    {tf(
                      t,
                      'battlecoin_orders_col_leverage',
                      'Lev'
                    )}
                  </div>
                  <div className="hh-col stake">
                    {tf(
                      t,
                      'battlecoin_orders_col_stake',
                      'Stake'
                    )}
                  </div>
                  <div className="hh-col entry">
                    {tf(
                      t,
                      'battlecoin_orders_col_entry',
                      'Entry'
                    )}
                  </div>
                  <div className="hh-col change">
                    {tf(
                      t,
                      'battlecoin_orders_col_change',
                      'Change'
                    )}
                  </div>
                  <div className="hh-col pnl">
                    {tf(t, 'battlecoin_orders_col_pnl', 'PnL')}
                  </div>
                  <div className="hh-col status">
                    {tf(
                      t,
                      'battlecoin_orders_col_status',
                      'Status'
                    )}
                  </div>
                </div>
                <div className="history-body">
                  {filteredOrders.map((o, idx) => {
                    const ch = Number(o.changePct || 0)
                    const pnl = Number(o.pnl || 0)
                    const isActive = o.status === 'OPEN'
                    return (
                      <div
                        key={`${o.orderId}-${idx}`}
                        className={[
                          'history-row',
                          isActive ? 'is-active' : '',
                        ].join(' ')}
                      >
                        <div className="hb-col idx">
                          {o.orderId || idx + 1}
                        </div>
                        <div className="hb-col symbol">
                          {o.symbol}
                        </div>
                        <div
                          className={[
                            'hb-col side',
                            o.side === 'LONG'
                              ? 'is-long'
                              : 'is-short',
                          ].join(' ')}
                        >
                          {o.side}
                        </div>
                        <div className="hb-col lev">x{o.leverage}</div>
                        <div className="hb-col stake">
                          {formatNumber(o.stake, 4)}
                        </div>
                        <div className="hb-col entry">
                          {formatNumber(o.entryPrice, 6)}
                        </div>
                        <div
                          className={[
                            'hb-col change',
                            ch > 0 ? 'is-pos' : '',
                            ch < 0 ? 'is-neg' : '',
                          ].join(' ')}
                        >
                          {formatNumber(ch, 2)}%
                        </div>
                        <div
                          className={[
                            'hb-col pnl',
                            pnl > 0 ? 'is-pos' : '',
                            pnl < 0 ? 'is-neg' : '',
                          ].join(' ')}
                        >
                          {formatNumber(pnl, 4)}
                        </div>
                        <div className="hb-col status">{o.status}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="battlecoin-loading-overlay">
          <div className="battlecoin-spinner" />
        </div>
      )}
      {error && !loading && (
        <div className="battlecoin-error">
          {String(error || '')}
        </div>
      )}

      {/* ============ scoped styles ============ */}
      <style jsx>{`
        .battlecoin-panel {
          position: relative;
          margin-top: 32px;
          padding: 18px 20px 22px;
          border-radius: 20px;
          background: radial-gradient(
              circle at top left,
              rgba(0, 255, 195, 0.11),
              transparent 55%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(255, 120, 0, 0.12),
              transparent 60%
            ),
            rgba(5, 10, 35, 0.9);
          backdrop-filter: blur(22px);
          box-shadow: 0 0 0 1px rgba(134, 151, 255, 0.12),
            0 26px 60px rgba(0, 0, 0, 0.75);
          overflow: hidden;
        }

        .battlecoin-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 22px;
        }

        .battlecoin-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        .battlecoin-logo-wrap {
          position: relative;
          width: 150px;
          height: 150px;
          flex-shrink: 0;
        }

        .battlecoin-logo-orbit {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 10%,
            rgba(255, 255, 255, 0.3),
            transparent 55%
          );
          box-shadow: 0 0 0 1px rgba(124, 172, 255, 0),
            0 0 40px rgba(0, 255, 255, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .battlecoin-logo {
          width: 160px;
          height: 160px;
          object-fit: contain;
          z-index: 2;
        }

        .battlecoin-logo-glow {
          position: absolute;
          inset: -30%;
          background: conic-gradient(
            from 0deg,
            rgba(0, 255, 255, 0.1),
            transparent,
            rgba(255, 187, 0, 0.18),
            transparent,
            rgba(0, 255, 255, 0.09)
          );
          mix-blend-mode: screen;
          animation: bc-orbit 10s linear infinite;
        }

        .battlecoin-titles {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .battlecoin-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .battlecoin-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #f8fbff;
          text-shadow: 0 0 26px rgba(0, 255, 255, 0.35);
        }

        .battlecoin-tag {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(200, 215, 255, 0.9);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(116, 151, 255, 0.4);
          background: radial-gradient(
            circle at top left,
            rgba(114, 197, 255, 0.25),
            rgba(15, 23, 66, 0.9)
          );
        }

        .battlecoin-subtitle {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(220, 231, 255, 0.85);
          max-width: 520px;
        }

        .battlecoin-header-right {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-shrink: 0;
        }

        .battlecoin-balance-block {
          min-width: 165px;
          padding: 10px 12px;
          border-radius: 16px;
          background: linear-gradient(
              135deg,
              rgba(40, 205, 255, 0.12),
              rgba(17, 24, 80, 0.95)
            ),
            rgba(6, 10, 32, 0.95);
          box-shadow: 0 0 0 1px rgba(138, 201, 255, 0.35),
            0 10px 28px rgba(0, 0, 0, 0.7);
        }

        .battlecoin-balance-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(189, 209, 255, 0.8);
          margin-bottom: 4px;
        }

        .battlecoin-balance-value {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .battlecoin-balance-number {
          font-size: 18px;
          font-weight: 700;
          color: #eaffff;
        }

        .battlecoin-balance-asset {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(252, 206, 4, 0.9);
        }

        .battlecoin-header-divider {
          height: 40px;
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(133, 164, 255, 0.8),
            transparent
          );
          opacity: 0.65;
        }

        .battlecoin-vip-block {
          display: flex;
          align-items: center;
        }

        .battlecoin-vip-pill {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px 6px 10px;
          border-radius: 999px;
          background: radial-gradient(
              circle at 0% 0%,
              rgba(255, 230, 143, 0.5),
              transparent 55%
            ),
            linear-gradient(
              135deg,
              rgba(23, 15, 3, 1),
              rgba(89, 69, 37, 1),
              rgba(255, 215, 114, 0.95)
            );
          box-shadow: 0 0 0 1px rgba(255, 244, 181, 0.9),
            0 0 26px rgba(255, 214, 102, 0.8);
        }

        .vip-spark {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 20%,
            #fffbe8,
            #ffb91a 55%,
            transparent 70%
          );
          box-shadow: 0 0 18px rgba(255, 222, 135, 0.95);
          animation: vip-pulse 1.4s ease-in-out infinite;
        }

        .vip-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #201200;
        }

        .vip-val {
          font-size: 11px;
          font-weight: 700;
          color: #2b1800;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(255, 248, 215, 0.9);
        }

        .battlecoin-vip-cta {
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid rgba(131, 180, 255, 0.8);
          color: #dfe7ff;
          background: linear-gradient(
            135deg,
            rgba(20, 30, 80, 0.9),
            rgba(54, 87, 179, 0.9)
          );
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.7);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.12s ease-out,
            box-shadow 0.12s ease-out, border-color 0.12s ease-out;
        }

        .battlecoin-vip-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.08),
            transparent 50%,
            rgba(128, 187, 255, 0.4)
          );
          opacity: 0;
          transform: translateX(-30%);
          transition: opacity 0.2s ease-out, transform 0.4s ease-out;
        }

        .battlecoin-vip-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.8);
          border-color: rgba(168, 211, 255, 1);
        }

        .battlecoin-vip-cta:hover::before {
          opacity: 1;
          transform: translateX(0%);
        }

        /* ----------- main layout grid ----------- */
        .battlecoin-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.05fr);
          gap: 18px;
        }

        .battlecoin-left,
        .battlecoin-right {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }

        .battlecoin-card {
          position: relative;
          border-radius: 18px;
          padding: 14px 14px 12px;
          background: radial-gradient(
              circle at top left,
              rgba(80, 111, 255, 0.16),
              transparent 55%
            ),
            rgba(8, 13, 41, 0.98);
          box-shadow: 0 0 0 1px rgba(111, 140, 255, 0.38),
            0 16px 40px rgba(0, 0, 0, 0.78);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .card-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .card-title {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #dde6ff;
        }

        .card-subtitle {
          font-size: 11px;
          color: rgba(180, 199, 255, 0.88);
        }

        .card-status-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(173, 196, 255, 0.9);
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: radial-gradient(circle, #24ff95, #0ba65d);
          box-shadow: 0 0 16px rgba(46, 255, 163, 0.9);
        }

        .live-dot.is-pinging {
          animation: live-ping 1.2s ease-out infinite;
        }

        .battlecoin-auth-warning {
          margin-bottom: 12px;
          padding: 10px 11px;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            rgba(255, 214, 80, 0.1),
            rgba(68, 54, 0, 0.95)
          );
          border: 1px solid rgba(255, 241, 156, 0.9);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .auth-text {
          font-size: 12px;
          color: #fff5d6;
        }

        .battlecoin-auth-btn {
          flex-shrink: 0;
          padding: 6px 10px;
          border-radius: 999px;
          border: none;
          background: radial-gradient(
            circle at 30% 0%,
            #ffffff,
            #ffe68a
          );
          color: #221400;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.85);
          transition: transform 0.12s ease-out, box-shadow 0.12s ease-out;
        }

        .battlecoin-auth-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.95);
        }

        .control-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(68, 89, 167, 0.85);
        }

        .control-section.two-cols {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          gap: 10px;
        }

        .control-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 6px;
        }

        .control-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(190, 207, 255, 0.96);
        }

        .control-extra {
          font-size: 11px;
          color: rgba(149, 173, 255, 0.9);
        }

        .battlecoin-leverage-grid {
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 4px;
        }

        .lever-btn {
          position: relative;
          border-radius: 10px;
          padding: 6px 4px;
          font-size: 11px;
          border: 1px solid rgba(81, 109, 190, 0.7);
          background: radial-gradient(
            circle at top,
            rgba(75, 118, 255, 0.3),
            rgba(12, 19, 58, 1)
          );
          color: #caddff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: border-color 0.1s ease-out,
            box-shadow 0.1s ease-out, transform 0.1s ease-out,
            background 0.1s ease-out;
        }

        .lever-val {
          font-weight: 600;
        }

        .lever-vip-tag {
          font-size: 9px;
          padding: 0 4px;
          border-radius: 999px;
          background: rgba(255, 215, 120, 0.15);
          color: rgba(255, 230, 170, 0.98);
        }

        .lever-btn.is-active {
          border-color: rgba(122, 255, 214, 0.95);
          box-shadow: 0 0 0 1px rgba(100, 255, 219, 0.8),
            0 0 24px rgba(25, 255, 200, 0.65);
          transform: translateY(-1px);
          background: radial-gradient(
            circle at top,
            rgba(40, 255, 200, 0.36),
            rgba(12, 19, 58, 1)
          );
        }

        .lever-btn.is-disabled {
          opacity: 0.45;
          cursor: default;
        }

        .control-field {
          min-width: 0;
        }

        .stake-input-row {
          display: flex;
          align-items: stretch;
          gap: 6px;
        }

        .stake-input {
          flex: 1;
          border-radius: 10px;
          padding: 7px 9px;
          border: 1px solid rgba(57, 79, 157, 0.9);
          background: rgba(0, 0, 0, 0.45);
          color: #e7eeff;
          font-size: 13px;
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(4, 7, 22, 0.4);
        }

        .stake-input:focus {
          border-color: rgba(145, 227, 255, 0.95);
          box-shadow: 0 0 0 1px rgba(53, 193, 255, 0.9);
        }

        .stake-max-btn {
          border-radius: 10px;
          padding: 6px 10px;
          border: 1px solid rgba(106, 149, 255, 0.9);
          background: radial-gradient(
            circle at 0 0,
            rgba(147, 201, 255, 0.3),
            rgba(26, 43, 104, 0.95)
          );
          color: #edf3ff;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.85);
          transition: transform 0.1s ease-out,
            box-shadow 0.1s ease-out, border-color 0.1s ease-out;
        }

        .stake-max-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(164, 206, 255, 1);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.9);
        }

        .stake-max-btn:disabled {
          opacity: 0.45;
          cursor: default;
          box-shadow: none;
        }

        .balance-line {
          margin-top: 4px;
          font-size: 11px;
          color: rgba(171, 192, 255, 0.92);
        }

        .balance-caption {
          opacity: 0.85;
        }

        .balance-num {
          margin-left: 4px;
          font-weight: 500;
        }

        .symbol-select-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .symbol-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 12px;
          background: radial-gradient(
            circle at top,
            rgba(143, 184, 255, 0.7),
            rgba(12, 18, 61, 1)
          );
          box-shadow: 0 0 0 1px rgba(135, 177, 255, 0.9);
        }

        .symbol-pill-icon {
          width: 30px;
          height: 30px;
          border-radius: 999px;
        }

.symbol-pill-text {

  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #eaf2ff;
}

        .symbol-select {
          flex: 1;
          border-radius: 10px;
          padding: 6px 8px;
          border: 1px solid rgba(62, 90, 173, 0.9);
          background: rgba(1, 6, 24, 0.95);
          color: #dbe5ff;
          font-size: 12px;
        }

        .longshort-row {
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .ls-btn {
          position: relative;
          border-radius: 13px;
          padding: 10px 10px 11px;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85);
          transform-origin: center;
          transition: transform 0.12s ease-out, box-shadow 0.12s ease-out,
            opacity 0.12s ease-out;
        }

        .ls-btn:disabled {
          opacity: 0.45;
          cursor: default;
          box-shadow: none;
        }

        .ls-label {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #050b14;
        }

        .ls-sub {
          font-size: 11px;
          color: rgba(6, 12, 20, 0.75);
        }

        .ls-glow {
          position: absolute;
          inset: -40%;
          opacity: 0.55;
          mix-blend-mode: screen;
          pointer-events: none;
          animation: ls-flow 6s linear infinite;
        }

        .ls-long {
          background: radial-gradient(
              circle at 0 0,
              rgba(255, 255, 255, 0.7),
              transparent 55%
            ),
            linear-gradient(135deg, #00ffb0, #00c574, #027d4b);
        }

        .ls-long .ls-glow {
          background: conic-gradient(
            from 0deg,
            rgba(0, 255, 195, 0.6),
            transparent 35%,
            rgba(255, 255, 255, 0.4),
            transparent 70%,
            rgba(0, 255, 195, 0.6)
          );
        }

        .ls-short {
          background: radial-gradient(
              circle at 0 0,
              rgba(255, 255, 255, 0.7),
              transparent 55%
            ),
            linear-gradient(135deg, #ff4b6a, #c41a45, #7d0225);
        }

        .ls-short .ls-glow {
          background: conic-gradient(
            from 0deg,
            rgba(255, 77, 122, 0.7),
            transparent 35%,
            rgba(255, 255, 255, 0.4),
            transparent 70%,
            rgba(255, 77, 122, 0.7)
          );
        }

        .ls-btn:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.01);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.95);
        }

        /* ---------- active order ---------- */
        .active-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.1fr) 0.9fr;
          gap: 12px;
          margin-top: 8px;
        }

        .active-info,
        .active-prices {
          border-radius: 12px;
          padding: 9px 10px;
          background: radial-gradient(
            circle at top,
            rgba(103, 139, 255, 0.25),
            rgba(10, 16, 53, 1)
          );
          box-shadow: inset 0 0 0 1px rgba(88, 112, 194, 0.9);
        }

        .active-prices {
          background: radial-gradient(
            circle at top,
            rgba(0, 240, 180, 0.25),
            rgba(6, 22, 40, 1)
          );
          box-shadow: inset 0 0 0 1px rgba(83, 190, 178, 0.9);
        }

        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          color: rgba(192, 208, 255, 0.9);
        }

        .info-row + .info-row {
          margin-top: 5px;
        }

        .info-label {
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 10px;
          opacity: 0.75;
        }

        .info-value {
          font-weight: 600;
          color: #eff4ff;
        }

        .info-symbol {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .info-symbol img {
          width: 16px;
          height: 16px;
          border-radius: 999px;
        }

        .info-side {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .info-side.is-long {
          background: rgba(0, 255, 175, 0.12);
          color: #5affc0;
          border: 1px solid rgba(60, 252, 184, 0.9);
        }

        .info-side.is-short {
          background: rgba(255, 87, 119, 0.14);
          color: #ff85ae;
          border: 1px solid rgba(255, 111, 145, 0.95);
        }

        .value-glow.is-pos {
          color: #6fffcd;
          text-shadow: 0 0 16px rgba(72, 255, 207, 0.9);
        }

        .value-glow.is-neg {
          color: #ff7d9d;
          text-shadow: 0 0 16px rgba(255, 119, 164, 0.9);
        }

        .active-timer {
          border-radius: 12px;
          padding: 9px 10px;
          background: radial-gradient(
            circle at top,
            rgba(255, 199, 92, 0.23),
            rgba(26, 18, 0, 1)
          );
          box-shadow: inset 0 0 0 1px rgba(255, 214, 126, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .timer-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(255, 239, 198, 0.9);
        }

        .timer-value {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #fffbdd;
        }

        .timer-value.is-pulsing {
          animation: timer-pulse 0.8s ease-in-out infinite;
        }

        .timer-settle-btn {
          margin-top: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          border: none;
          background: rgba(26, 20, 8, 0.92);
          color: rgba(255, 229, 176, 0.98);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .empty-active {
          padding: 10px;
          border-radius: 12px;
          background: rgba(2, 8, 28, 0.9);
          border: 1px dashed rgba(79, 117, 189, 0.8);
        }

        .empty-pill {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(104, 143, 219, 0.9);
          font-size: 11px;
          color: rgba(200, 217, 255, 0.98);
        }

        .empty-text {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(156, 180, 242, 0.9);
        }

        /* ---------- market ---------- */
        .market-card {
          max-height: 360px;
          min-height: 360px;
        }

        .market-table {
          margin-top: 4px;
        }

        .market-head {
          display: grid;
          grid-template-columns: 32px minmax(0, 1.5fr) 1fr 1fr;
          padding: 5px 6px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(167, 189, 255, 0.9);
          border-radius: 10px;
          background: rgba(0, 0, 0, 1);
        }

        .market-body {
          margin-top: 4px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .market-row {
          width: 100%;
          border: none;
          background: transparent;
          padding: 4px 6px;
          margin-bottom: 1px;
          border-radius: 9px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1.5fr) 1fr 1fr;
          align-items: center;
          font-size: 11px;
          color: rgba(207, 220, 255, 0.96);
          cursor: pointer;
          transition: background 0.08s ease-out,
            transform 0.08s ease-out, box-shadow 0.08s ease-out;
        }

        .market-row:hover:not(:disabled) {
          background: rgba(36, 54, 109, 0.85);
          transform: translateY(-0.5px);
        }

        .market-row.is-selected {
          background: rgba(68, 104, 205, 0.95);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.85);
        }

        .market-row:disabled {
          cursor: default;
          opacity: 0.5;
        }

        .mb-col.idx,
        .mh-col.idx {
          text-align: left;
        }

        .mb-col.price,
        .mh-col.price,
        .mb-col.change,
        .mh-col.change {
          text-align: right;
        }

        .mb-col.symbol {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .market-icon {
          width: 50px;
          height: 50px;
          border-radius: 999px;
        }

        .symbol-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mb-col.change.is-pos,
        .hb-col.change.is-pos {
          color: #62ffb9;
        }

        .mb-col.change.is-neg,
        .hb-col.change.is-neg {
          color: #ff869f;
        }

        /* ---------- history ---------- */
        .history-card {
          max-height: 370px;
        }

        .history-header {
          align-items: flex-end;
        }

        .history-tabs {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.95);
          box-shadow: inset 0 0 0 1px rgba(6, 29, 32, 0.9);
          gap: 3px;
        }

        .history-tab {
          border: none;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(186, 205, 255, 0.85);
          background: transparent;
          cursor: pointer;
          transition: background 0.1s ease-out,
            color 0.1s ease-out, transform 0.1s ease-out;
        }

        .history-tab.is-active {
          background: linear-gradient(
            135deg,
            rgba(117, 170, 255, 1),
            rgba(78, 123, 255, 1)
          );
          color: #050a1c;
          transform: translateY(-0.5px);
        }

        .no-history {
          margin-top: 10px;
          font-size: 11px;
          color: rgba(168, 191, 255, 0.9);
        }

        .history-table {
          margin-top: 6px;
        }

        .history-head {
          display: grid;
          grid-template-columns:
            32px minmax(0, 1.3fr) 0.9fr 0.7fr 0.9fr 1fr 0.9fr 0.9fr 0.9fr;
          padding: 5px 6px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.95);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(171, 193, 255, 0.9);
        }

        .history-body {
          margin-top: 3px;
          max-height: 130px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .history-row {
          display: grid;
          grid-template-columns:
            32px minmax(0, 1.3fr) 0.9fr 0.7fr 0.9fr 1fr 0.9fr 0.9fr 0.9fr;
          padding: 4px 6px;
          font-size: 11px;
          color: rgba(205, 218, 255, 0.96);
          border-radius: 9px;
          margin-bottom: 1px;
          background: transparent;
          transition: background 0.08s ease-out,
            box-shadow 0.08s ease-out, transform 0.08s ease-out;
        }

        .history-row.is-active {
          background: rgba(52, 92, 195, 0.9);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.9);
        }

        .history-row:hover {
          background: rgba(37, 59, 132, 0.9);
          transform: translateY(-0.5px);
        }

        .hb-col.side.is-long {
          color: #77ffd0;
        }

        .hb-col.side.is-short {
          color: #ff8bac;
        }

        .hb-col.idx,
        .hh-col.idx {
          text-align: left;
        }

        .hb-col.price,
        .hb-col.change,
        .hb-col.pnl,
        .hh-col.price,
        .hh-col.change,
        .hh-col.pnl {
          text-align: right;
        }

        /* ---------- scrollbars ---------- */
        .market-body::-webkit-scrollbar,
        .history-body::-webkit-scrollbar {
          width: 5px;
        }
        .market-body::-webkit-scrollbar-track,
        .history-body::-webkit-scrollbar-track {
          background: rgba(6, 10, 36, 0.9);
        }
        .market-body::-webkit-scrollbar-thumb,
        .history-body::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(126, 164, 255, 0.9),
            rgba(46, 89, 194, 0.9)
          );
          border-radius: 999px;
        }

        /* ---------- loading & error ---------- */
        .battlecoin-loading-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              circle at top,
              rgba(10, 22, 61, 0.96),
              rgba(4, 6, 20, 0.96)
            );
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }

        .battlecoin-spinner {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 3px solid rgba(70, 110, 205, 0.25);
          border-top-color: rgba(109, 189, 255, 0.95);
          animation: spin 0.7s linear infinite;
        }

        .battlecoin-error {
          margin-top: 10px;
          font-size: 11px;
          color: #ffc6d3;
        }
  /* --- MOBILE: history table = единый горизонтальный скролл --- */

  /* Горизонтальный скролл одной лентой: шапка + строки вместе */
  .battlecoin-card.history-card {
    overflow-x: auto;
  }

  /* Общая ширина таблицы истории */
  .history-table {
    min-width: 720px; /* при желании можно поменять число */
  }

  /* Вертикальный скролл только у списка, без второй горизонтальной полосы */
  .history-body {
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Агрессивный перенос текста, чтобы подписи/значения держались в своих колонках */
  .history-head .hh-col,
  .history-body .hb-col {
    white-space: normal;
    word-break: break-all;
  }

        /* ---------- animations ---------- */
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bc-orbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes vip-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.16);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes live-ping {
          0% {
            box-shadow: 0 0 0 0 rgba(71, 255, 181, 0.85);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(71, 255, 181, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(71, 255, 181, 0);
          }
        }

        @keyframes ls-flow {
          0% {
            transform: translate(-5%, -5%) rotate(0deg);
          }
          100% {
            transform: translate(5%, 5%) rotate(360deg);
          }
        }

        @keyframes timer-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.09);
          }
          100% {
            transform: scale(1);
          }
        }
        /* Золотая надпись с переливом и свечением для VIP */
        .qcoinLabel{
          font-size:1.6em;
          font-weight:900;
          letter-spacing:.4px;
          background:
            linear-gradient(135deg,
              #7a5c00 0%,
              #ffd700 18%,
              #fff4b3 32%,
              #ffd700 46%,
              #ffea80 60%,
              #b38400 74%,
              #ffd700 88%,
              #7a5c00 100%);
          background-size:200% 100%;
          -webkit-background-clip:text;
          background-clip:text;
          color:transparent;
          animation:qcoinShine 6s linear infinite,
                   qcoinGlow 2.8s ease-in-out infinite;
          text-shadow:
            0 0 .3rem rgba(255,215,0,.35),
            0 0 .1rem rgba(255,255,180,.35);
        }

        @keyframes qcoinShine{
          0%  { background-position:0% 50%; }
          100%{ background-position:200% 50%; }
        }

        @keyframes qcoinGlow{
          0%{
            text-shadow:
              0 0 .3rem rgba(255,215,0,.35),
              0 0 .1rem rgba(255,255,180,.35);
          }
          50%{
            text-shadow:
              0 0 .9rem rgba(255,215,0,.55),
              0 0 .25rem rgba(255,255,190,.55);
          }
          100%{
            text-shadow:
              0 0 .3rem rgba(255,215,0,.35),
              0 0 .1rem rgba(255,255,180,.35);
          }
        }

         /* ---------- responsive ---------- */
        @media (max-width: 1100px) {
          .battlecoin-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .battlecoin-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .battlecoin-header-right {
            align-self: stretch;
            justify-content: flex-start;
          }

          .battlecoin-header-divider {
            display: none;
          }

          .battlecoin-right .battlecoin-card {
            max-height: none;
          }

          .market-card,
          .history-card {
            max-height: none;
          }
//      }  

// @media (max-width: 1768px) {
  .battlecoin-panel {
    margin-top: 18px;
    padding: 14px 12px 16px;
    border-radius: 18px;
  }

  .battlecoin-header-left {
    align-items: flex-start;
  }

  .battlecoin-logo-wrap {
    width: 110px;
    height: 110px;
  }

  .battlecoin-title {
    font-size: 18px;
  }

  .battlecoin-subtitle {
    font-size: 12px;
  }

  .active-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .battlecoin-card {
    padding: 11px 10px 10px;
  }

  .battlecoin-leverage-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .control-section.two-cols {
    grid-template-columns: minmax(0, 1fr);
  }

  .timer-value {
    font-size: 24px;
  }

  .ls-btn {
    padding: 9px 9px 10px;
  }

  /* --- MOBILE: history table = единый горизонтальный скролл --- */

  /* Горизонтальный скролл одной лентой: шапка + строки вместе */
  .battlecoin-card.history-card {
    overflow-x: auto;
  }

  /* Общая ширина таблицы истории */
  .history-table {
    min-width: 720px; /* при желании можно поменять число */
  }

  /* Вертикальный скролл только у списка, без второй горизонтальной полосы */
  .history-body {
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Агрессивный перенос текста, чтобы подписи/значения держались в своих колонках */
  .history-head .hh-col,
  .history-body .hb-col {
    white-space: normal;
    word-break: break-all;
  }
}



        @media (max-width: 520px) {
          .battlecoin-header-right {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .battlecoin-balance-block {
            width: 100%;
          }

          .battlecoin-vip-block {
            width: 100%;
            justify-content: flex-start;
          }

          .battlecoin-vip-cta {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .longshort-row {
            grid-template-columns: minmax(0, 1fr);
          }

          .timer-value {
            font-size: 26px;
          }

          .battlecoin-card.history-card {
            max-height: 320px;
          }
        }
      `}</style>
    </section>
  )
}

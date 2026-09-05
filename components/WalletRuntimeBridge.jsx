'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal, defaultWagmiConfig, useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react'
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi'
import { mainnet, polygon, arbitrum, base, bsc, optimism, avalanche } from 'wagmi/chains'
import {
  createWalletSession,
  getStoredWalletSession,
  logoutStoredWalletSession,
  verifyStoredWalletSession,
  clearWalletRuntimeCache,
} from '../lib/walletSessionClient'

const RUNTIME_KEY = '__ql7_wallet_runtime_v20__'
const chainsArr = [mainnet, polygon, arbitrum, base, bsc, optimism, avalanche]
const MOBILE_OAUTH_GRACE_KEY = 'ql7_wallet_mobile_oauth_grace_until'
const MOBILE_OAUTH_GRACE_MS = 15000
const MOBILE_OAUTH_RECHECK_MS = 900
const RUNTIME_OPEN_DELAY_MS = 180
const ACCOUNT_RESTORE_VISIBLE_TIMEOUT_MS = 3500
const ACCOUNT_RESTORE_POLL_MS = 50
const MODAL_OPEN_BOOTSTRAP_TIMEOUT_MS = 12000
const MODAL_CLOSE_CONFIRM_MS = 500
const ACCOUNT_RESTORE_REOPEN_SETTLE_MS = 120
const RUNTIME_PREPARE_IDLE_TIMEOUT_MS = 700
const ACCOUNT_PROVIDER_RESTORE_WAIT_MS = 5000
const HOST_DISCONNECT_CONFIRM_MS = 700
const WALLET_SESSION_WATCHDOG_MS = 60 * 1000
const WALLET_RESTORE_HIDDEN_ATTR = 'data-ql7-wallet-restore-hidden'
const WALLET_RESTORE_HIDDEN_STYLE_ID = 'ql7-wallet-restore-hidden-style'
const QL7_AUTH_LOGOUT_REASONS = new Set([
  'logout',
  'verify_failed',
  'bad_token',
  'bad_wallet_address',
  'not_found',
  'inactive',
  'expired',
  'wallet_mismatch',
  'stale_session',
  'logged_out',
  'restriction_portal_logout',
  'account_deleted',
])

function isMobileOAuthBrowser() {
  try {
    const ua = String(navigator?.userAgent || '').toLowerCase()
    return /android|iphone|ipad|ipod|mobile|crios|fxios|edgios/.test(ua)
  } catch {
    return false
  }
}

function isSafariOAuthBrowser() {
  try {
    const ua = String(navigator?.userAgent || '')
    if (!/Safari/i.test(ua) || !/AppleWebKit/i.test(ua)) return false
    return !/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPiOS|Android)/i.test(ua)
  } catch {
    return false
  }
}

function markMobileOAuthGrace(ms = MOBILE_OAUTH_GRACE_MS) {
  try {
    if (!isMobileOAuthBrowser()) return 0
    const until = Date.now() + Math.max(1000, Number(ms) || MOBILE_OAUTH_GRACE_MS)
    window.sessionStorage?.setItem(MOBILE_OAUTH_GRACE_KEY, String(until))
    return until
  } catch {
    return 0
  }
}

function getMobileOAuthGraceUntil() {
  try {
    return Number(window.sessionStorage?.getItem(MOBILE_OAUTH_GRACE_KEY) || 0) || 0
  } catch {
    return 0
  }
}

function isMobileOAuthGraceActive() {
  return getMobileOAuthGraceUntil() > Date.now()
}

function clearMobileOAuthGrace() {
  try { window.sessionStorage?.removeItem(MOBILE_OAUTH_GRACE_KEY) } catch {}
}

function setWalletRestoreHidden(hidden) {
  try {
    const root = document?.documentElement
    if (!root) return

    if (hidden) {
      root.setAttribute(WALLET_RESTORE_HIDDEN_ATTR, '1')

      if (!document.getElementById(WALLET_RESTORE_HIDDEN_STYLE_ID)) {
        const style = document.createElement('style')
        style.id = WALLET_RESTORE_HIDDEN_STYLE_ID
        style.textContent = `html[${WALLET_RESTORE_HIDDEN_ATTR}="1"] w3m-modal{visibility:hidden!important;opacity:0!important;pointer-events:none!important;transition:none!important}`
        document.head?.appendChild(style)
      }
      return
    }

    root.removeAttribute(WALLET_RESTORE_HIDDEN_ATTR)
    document.getElementById(WALLET_RESTORE_HIDDEN_STYLE_ID)?.remove()
  } catch {}
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    if (typeof window?.requestAnimationFrame !== 'function') {
      setTimeout(resolve, 0)
      return
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))
  })
}

function getRuntimeSingleton() {
  if (typeof window === 'undefined') return null
  if (!window[RUNTIME_KEY]) {
    window[RUNTIME_KEY] = {
      modalCreated: false,
      config: null,
      queryClient: null,
    }
  }
  return window[RUNTIME_KEY]
}

function getConnectorName(connector) {
  return String(connector?.name || connector?.id || 'wallet').trim() || 'wallet'
}

function ensureRuntimeReady() {
  const singleton = getRuntimeSingleton()
  if (!singleton) return null
  if (singleton.config) return singleton

  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''
  if (!projectId) console.warn('[QL7 wallet] NEXT_PUBLIC_WC_PROJECT_ID is empty')

  const origin = window.location.origin
  const metadata = {
    name: 'Quantum L7 AI',
    description: 'Signals, research, multi-chain',
    url: origin,
    icons: [`${origin}/branding/ql7-logo-512.png`],
    redirect: {
      native: 'quantuml7ai://wc',
      universal: `${origin}/`,
    },
  }

  singleton.config = defaultWagmiConfig({
    projectId,
    chains: chainsArr,
    metadata,
  })

  singleton.queryClient = singleton.queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

  if (!singleton.modalCreated) {
    createWeb3Modal({
      wagmiConfig: singleton.config,
      projectId,
      chains: chainsArr,
      themeMode: 'dark',
      enableAnalytics: false,
      enableExplorer: true,
      explorerRecommendedWalletIds: 'NONE',
      featuredWalletIds: [
        'metaMask',
        'phantom',
        'trust',
        'okx',
        'coinbaseWallet',
        'brave',
      ],
    })
    singleton.modalCreated = true
  }

  return singleton
}

function updateStatus(extra = {}) {
  try {
    const prev = window.__QL7_WALLET_RUNTIME_LAST_STATUS__ || {}
    window.__QL7_WALLET_RUNTIME_LAST_STATUS__ = { ...prev, ...extra }
  } catch {}
}

function isQl7AuthLogoutEvent(event) {
  const reason = String(event?.detail?.reason || '').trim()
  return QL7_AUTH_LOGOUT_REASONS.has(reason)
}

function isTelegramMiniAppRuntime() {
  try {
    const tg = window?.Telegram?.WebApp
    if (tg?.initData && String(tg.initData).includes('hash=')) return true
    const hash = String(window?.location?.hash || '').toLowerCase()
    return hash.includes('tgwebappdata=')
  } catch {
    return false
  }
}

function hasStoredWalletIdentity() {
  try {
    const stored = getStoredWalletSession()
    const accountId = String(stored?.accountId || stored?.walletAddress || '').trim()
    const expiresAt = Number(stored?.expiresAt || 0)
    if (!stored?.token || !accountId) return false
    if (expiresAt > 0 && expiresAt <= Date.now()) return false
    return true
  } catch {
    return false
  }
}

function RuntimeAccountProbe() {
  const { address, isConnected, connector, chainId, status: accountStatus } = useAccount()
  const wasConnectedRef = useRef(false)
  const disconnectConfirmTimerRef = useRef(0)
  const disconnectLogoutInFlightRef = useRef(false)

  useEffect(() => {
    const singleton = getRuntimeSingleton()
    const account = {
      isConnected: !!isConnected,
      address: address || '',
      status: accountStatus || 'disconnected',
      connectorName: getConnectorName(connector),
      chainId: chainId || null,
    }

    if (singleton) singleton.hostAccount = account

    updateStatus({
      walletHostMounted: true,
      walletHostConnected: account.isConnected,
      walletHostAddress: account.address || null,
      walletHostStatus: account.status,
      walletHostConnector: account.connectorName,
      walletHostChainId: account.chainId,
    })
  }, [accountStatus, address, chainId, connector, isConnected])

  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true
      if (disconnectConfirmTimerRef.current) {
        window.clearTimeout(disconnectConfirmTimerRef.current)
        disconnectConfirmTimerRef.current = 0
      }
      updateStatus({ walletDisconnectPending: false })
      return
    }

    if (!wasConnectedRef.current) return
    if (String(accountStatus || '').trim().toLowerCase() !== 'disconnected') return
    if (disconnectConfirmTimerRef.current || disconnectLogoutInFlightRef.current) return

    const stored = getStoredWalletSession()
    if (!stored?.token) {
      wasConnectedRef.current = false
      return
    }

    updateStatus({
      walletDisconnectPending: true,
      lastDoneReason: 'wallet_disconnect_pending',
    })

    disconnectConfirmTimerRef.current = window.setTimeout(() => {
      disconnectConfirmTimerRef.current = 0

      const latest = getRuntimeSingleton()?.hostAccount || {}
      const latestStatus = String(latest?.status || '').trim().toLowerCase()

      // AppKit/modal close is not logout. Only a stable provider-level
      // connected -> disconnected transition is allowed to tear down auth.
      if (latest?.isConnected || latestStatus !== 'disconnected') {
        updateStatus({
          walletDisconnectPending: false,
          lastDoneReason: 'wallet_disconnect_cancelled',
        })
        return
      }

      const currentStored = getStoredWalletSession()
      if (!currentStored?.token) {
        wasConnectedRef.current = false
        updateStatus({ walletDisconnectPending: false })
        return
      }

      wasConnectedRef.current = false
      disconnectLogoutInFlightRef.current = true

      const run = async () => {
        try {
          clearMobileOAuthGrace()
          updateStatus({
            walletDisconnectPending: false,
            lastDoneReason: 'confirmed_wallet_disconnect',
            lastError: null,
          })
          await logoutStoredWalletSession()
        } catch (err) {
          updateStatus({
            walletDisconnectPending: false,
            lastDoneReason: 'wallet_disconnect_logout_failed',
            lastError: err?.message || String(err),
          })
        } finally {
          disconnectLogoutInFlightRef.current = false
        }
      }

      void run()
    }, HOST_DISCONNECT_CONFIRM_MS)
  }, [accountStatus, isConnected])

  useEffect(() => () => {
    if (disconnectConfirmTimerRef.current) {
      window.clearTimeout(disconnectConfirmTimerRef.current)
      disconnectConfirmTimerRef.current = 0
    }
  }, [])

  return null
}

function RuntimeController({ request, finish }) {
  const { open, close } = useWeb3Modal()
  const modalState = useWeb3ModalState()
  const { address, isConnected, connector, chainId, status: accountStatus } = useAccount()
  const { disconnectAsync } = useDisconnect()
  const openedRef = useRef(false)
  const accountViewOpenedRef = useRef(false)
  const creatingRef = useRef(false)
  const finishedRef = useRef(false)
  const openAttemptedRef = useRef(false)
  const modalWasOpenRef = useRef(false)
  const openStartedAtRef = useRef(0)
  const accountRestorePrimingRef = useRef(false)
  const accountRestoreReopeningRef = useRef(false)
  const latestModalOpenRef = useRef(false)
  const latestAccountRef = useRef({
    isConnected: !!isConnected,
    address: address || '',
    status: accountStatus || 'disconnected',
  })
  const [oauthGraceTick, setOauthGraceTick] = useState(0)

  const mode = request?.mode || 'connect'
  const connectorName = getConnectorName(connector)
  const modalOpen = !!modalState?.open
  latestModalOpenRef.current = modalOpen

  useEffect(() => {
    latestAccountRef.current = {
      isConnected: !!isConnected,
      address: address || '',
      status: accountStatus || 'disconnected',
    }
  }, [accountStatus, address, isConnected])

  useEffect(() => {
    if (!modalOpen) return
    modalWasOpenRef.current = true
    updateStatus({
      runtimeOpening: false,
      modalWasOpen: true,
      lastDoneReason: 'modal_open',
    })
  }, [modalOpen])

  useEffect(() => {
    updateStatus({
      runtimeMounted: true,
      runtimeActive: true,
      reactProvidersMounted: true,
      modalCreated: true,
      modalOpen,
      requestMode: mode,
      isConnected: !!isConnected,
      address: address || null,
      chainId: chainId || null,
      connectorName,
      accountStatus: accountStatus || null,
    })
  }, [accountStatus, address, chainId, connectorName, isConnected, modalOpen, mode])

  useEffect(() => {
    if (openedRef.current) return
    const run = async () => {
      try {
        if (typeof open !== 'function') {
          updateStatus({ lastError: 'wallet_open_unavailable', lastDoneReason: 'open_failed' })
          return
        }
        const openView = async (params) => {
          openAttemptedRef.current = true
          updateStatus({ openAttempted: true })
          await open(params)
        }
        if (mode === 'account') {
          let alreadyRestored = latestAccountRef.current || {}

          if (!alreadyRestored.isConnected || !alreadyRestored.address) {
            const restoreStartedAt = Date.now()
            updateStatus({
              accountRestorePending: true,
              accountRestoreHidden: false,
              accountRestoreSource: 'persistent_wagmi_provider',
              lastDoneReason: 'account_restore_wait_provider',
            })

            while (!finishedRef.current && Date.now() - restoreStartedAt < ACCOUNT_PROVIDER_RESTORE_WAIT_MS) {
              const latest = latestAccountRef.current || {}
              if (latest.isConnected && latest.address) {
                alreadyRestored = latest
                break
              }
              await waitMs(ACCOUNT_RESTORE_POLL_MS)
            }
          }

          if (alreadyRestored.isConnected && alreadyRestored.address) {
            accountViewOpenedRef.current = true
            updateStatus({
              accountRestorePending: false,
              accountRestoreHidden: false,
              accountRestoreSource: 'persistent_wagmi_provider',
              lastDoneReason: 'account_restored',
            })
            await waitForNextPaint()
            await openView()
            return
          }

          // Safety fallback for browsers/connectors that only finish their own
          // hydration after the first ordinary AppKit open. This stays hidden and
          // never forces the Account view.
          // On a hard reload Reown can finish restoring the persisted connector
          // only after its first ordinary open() has bootstrapped the modal state.
          // Prime that first open invisibly, then reopen visibly only after Wagmi
          // reports a real connected account. Never force the Account view.
          const restoreStartedAt = Date.now()
          accountRestorePrimingRef.current = true
          setWalletRestoreHidden(true)
          updateStatus({
            accountRestorePending: true,
            accountRestoreHidden: true,
            lastDoneReason: 'account_restore_hidden_open',
          })

          try {
            await openView()

            while (!finishedRef.current) {
              const latest = latestAccountRef.current || {}
              const elapsed = Date.now() - restoreStartedAt

              if (latest.isConnected && latest.address) {
                accountRestorePrimingRef.current = false
                accountRestoreReopeningRef.current = true
                accountViewOpenedRef.current = true

                updateStatus({
                  accountRestorePending: false,
                  accountRestoreHidden: true,
                  accountRestoreMs: elapsed,
                  lastDoneReason: 'account_restore_hydrated_hidden',
                })

                try { await close?.() } catch {}

                const closeWaitStartedAt = Date.now()
                while (
                  latestModalOpenRef.current
                  && Date.now() - closeWaitStartedAt < MODAL_CLOSE_CONFIRM_MS + 700
                ) {
                  await waitMs(ACCOUNT_RESTORE_POLL_MS)
                }

                setWalletRestoreHidden(false)
                updateStatus({
                  accountRestoreHidden: false,
                  lastDoneReason: 'account_restore_reopen',
                })

                await waitForNextPaint()
                await waitMs(ACCOUNT_RESTORE_REOPEN_SETTLE_MS)
                await openView()

                const reopenWaitStartedAt = Date.now()
                while (
                  !latestModalOpenRef.current
                  && Date.now() - reopenWaitStartedAt < MODAL_OPEN_BOOTSTRAP_TIMEOUT_MS
                ) {
                  await waitMs(ACCOUNT_RESTORE_POLL_MS)
                }

                accountRestoreReopeningRef.current = false
                updateStatus({
                  accountRestorePending: false,
                  accountRestoreHidden: false,
                  accountRestoreMs: Date.now() - restoreStartedAt,
                  lastDoneReason: 'account_restored',
                })
                return
              }

              if (elapsed >= ACCOUNT_RESTORE_VISIBLE_TIMEOUT_MS) break
              await waitMs(ACCOUNT_RESTORE_POLL_MS)
            }

            if (finishedRef.current) return

            // No persisted browser connector was restored. The first ordinary
            // open() is already on the truthful Connect/Login surface, so simply
            // reveal it instead of closing/reopening or forcing a view.
            accountRestorePrimingRef.current = false
            setWalletRestoreHidden(false)
            updateStatus({
              accountRestorePending: false,
              accountRestoreHidden: false,
              accountRestoreFailed: true,
              accountStatus: latestAccountRef.current?.status || null,
              accountRestoreMs: Date.now() - restoreStartedAt,
              lastDoneReason: 'account_restore_unavailable',
            })
            return
          } catch (err) {
            accountRestorePrimingRef.current = false
            accountRestoreReopeningRef.current = false
            setWalletRestoreHidden(false)
            throw err
          }
        }
        if (isConnected && address) return
        const graceUntil = markMobileOAuthGrace()
        if (graceUntil) {
          updateStatus({
            mobileOAuthGrace: true,
            mobileOAuthGraceUntil: graceUntil,
            lastDoneReason: 'connect_opened_oauth_grace',
          })
        }
        await openView({ view: 'Connect' })
      } catch (err) {
        updateStatus({ lastError: err?.message || String(err), lastDoneReason: 'open_failed' })
      }
    }
    openStartedAtRef.current = Date.now()
    updateStatus({
      runtimeOpening: true,
      openAttempted: false,
      modalWasOpen: false,
    })
    const id = setTimeout(() => {
      if (openedRef.current) return
      openedRef.current = true
      void run()
    }, RUNTIME_OPEN_DELAY_MS)
    return () => clearTimeout(id)
  }, [address, close, isConnected, mode, open])

  useEffect(() => {
    if (mode !== 'connect') return undefined
    const bumpGrace = () => {
      if (finishedRef.current) return
      if (latestAccountRef.current?.isConnected && latestAccountRef.current?.address) return
      if (!isMobileOAuthBrowser()) return
      const until = markMobileOAuthGrace(6500)
      if (until) {
        updateStatus({
          mobileOAuthGrace: true,
          mobileOAuthGraceUntil: until,
          lastDoneReason: 'oauth_return_grace',
        })
        setOauthGraceTick((value) => value + 1)
      }
    }

    window.addEventListener('focus', bumpGrace)
    window.addEventListener('pageshow', bumpGrace)
    document.addEventListener('visibilitychange', bumpGrace)
    return () => {
      window.removeEventListener('focus', bumpGrace)
      window.removeEventListener('pageshow', bumpGrace)
      document.removeEventListener('visibilitychange', bumpGrace)
    }
  }, [mode])

  useEffect(() => {
    if (mode !== 'account') return
    if (finishedRef.current) return
    if (accountViewOpenedRef.current) return
    if (accountRestorePrimingRef.current || accountRestoreReopeningRef.current) return
    if (!isConnected || !address) return

    const id = setTimeout(() => {
      if (finishedRef.current || accountViewOpenedRef.current) return
      if (!modalWasOpenRef.current) return
      accountViewOpenedRef.current = true
      try { void open?.() } catch {}
    }, 120)

    return () => clearTimeout(id)
  }, [address, isConnected, mode, open])

  useEffect(() => {
    if (finishedRef.current) return
    if (!isConnected || !address || creatingRef.current) return

    if (mode === 'account') return

    creatingRef.current = true
    const run = async () => {
      try {
        const session = await createWalletSession({
          walletAddress: address,
          accountId: address,
          provider: connectorName,
        })
        clearMobileOAuthGrace()
        updateStatus({
          lastDoneReason: 'session_created',
          lastError: null,
          address,
          chainId: chainId || null,
          connectorName,
          tokenCreated: !!session?.token,
        })
        try { await close?.() } catch {}
        finishedRef.current = true
        setTimeout(() => finish('session_created'), 120)
      } catch (err) {
        updateStatus({ lastError: err?.message || String(err), lastDoneReason: 'session_create_failed' })
      } finally {
        creatingRef.current = false
      }
    }
    void run()
  }, [address, chainId, close, connectorName, finish, isConnected, mode])

  useEffect(() => {
    if (finishedRef.current) return
    if (modalOpen) return
    if (!openedRef.current) return
    if (!openAttemptedRef.current) return
    if (creatingRef.current) return

    if (mode === 'account' && accountRestoreReopeningRef.current) {
      updateStatus({
        accountRestoreHidden: true,
        lastDoneReason: 'account_restore_reopening',
        modalOpen: false,
      })
      return
    }

    if (mode === 'connect' && !isConnected && !address && isMobileOAuthGraceActive()) {
      const remaining = Math.max(0, getMobileOAuthGraceUntil() - Date.now())
      updateStatus({
        mobileOAuthGrace: true,
        mobileOAuthGraceRemainingMs: remaining,
        lastDoneReason: 'awaiting_oauth_return',
        modalOpen: false,
      })
      const id = setTimeout(() => {
        setOauthGraceTick((value) => value + 1)
      }, Math.min(Math.max(remaining, MOBILE_OAUTH_RECHECK_MS), MOBILE_OAUTH_RECHECK_MS))
      return () => clearTimeout(id)
    }

    if (!modalWasOpenRef.current) {
      const elapsed = Date.now() - openStartedAtRef.current
      if (elapsed < MODAL_OPEN_BOOTSTRAP_TIMEOUT_MS) {
        updateStatus({
          lastDoneReason: 'awaiting_modal_open',
          modalOpen: false,
          modalOpenBootstrapRemainingMs: MODAL_OPEN_BOOTSTRAP_TIMEOUT_MS - elapsed,
        })
        const id = setTimeout(() => {
          setOauthGraceTick((value) => value + 1)
        }, Math.min(MOBILE_OAUTH_RECHECK_MS, MODAL_OPEN_BOOTSTRAP_TIMEOUT_MS - elapsed))
        return () => clearTimeout(id)
      }
      finishedRef.current = true
      updateStatus({
        runtimeOpening: false,
        lastDoneReason: 'modal_open_timeout',
        modalOpen: false,
        mobileOAuthGrace: false,
      })
      finish('modal_open_timeout')
      return undefined
    }

    const id = setTimeout(() => {
      if (finishedRef.current || creatingRef.current) return
      if (mode === 'connect' && !isConnected && !address && isMobileOAuthGraceActive()) {
        setOauthGraceTick((value) => value + 1)
        return
      }
      clearMobileOAuthGrace()
      finishedRef.current = true
      updateStatus({
        runtimeOpening: false,
        lastDoneReason: 'modal_closed',
        modalOpen: false,
        mobileOAuthGrace: false,
      })
      finish('modal_closed')
    }, MODAL_CLOSE_CONFIRM_MS)
    return () => clearTimeout(id)
  }, [address, finish, isConnected, modalOpen, mode, oauthGraceTick])

  useEffect(() => () => {
    accountRestorePrimingRef.current = false
    accountRestoreReopeningRef.current = false
    setWalletRestoreHidden(false)
  }, [])

  useEffect(() => {
    const onLogout = () => {
      const run = async () => {
        clearMobileOAuthGrace()
        try { await disconnectAsync?.() } catch {}
        await logoutStoredWalletSession()
        try { await close?.() } catch {}
        finishedRef.current = true
        finish('forced_logout')
      }
      void run()
    }
    window.addEventListener('ql7:wallet-runtime:logout', onLogout)
    return () => window.removeEventListener('ql7:wallet-runtime:logout', onLogout)
  }, [close, disconnectAsync, finish])

  return null
}

function WalletRuntimeHost({ singleton, request, finish }) {
  if (!singleton?.config || !singleton?.queryClient) return null

  return (
    <WagmiProvider config={singleton.config} reconnectOnMount={hasStoredWalletIdentity()}>
      <QueryClientProvider client={singleton.queryClient}>
        <RuntimeAccountProbe />
        {request ? (
          <RuntimeController
            key={request.nonce}
            request={request}
            finish={finish}
          />
        ) : null}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default function WalletRuntimeBridge() {
  const [request, setRequest] = useState(null)
  const [hostSingleton, setHostSingleton] = useState(null)
  const requestRef = useRef(null)
  const sessionWatchdogInFlightRef = useRef(false)
  const sessionWatchdogLastRunAtRef = useRef(Date.now())

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    let disposed = false

    const verifyCurrentSession = async () => {
      if (disposed || sessionWatchdogInFlightRef.current) return
      if (isTelegramMiniAppRuntime()) return

      const stored = getStoredWalletSession()
      if (!stored?.token) return

      sessionWatchdogInFlightRef.current = true
      sessionWatchdogLastRunAtRef.current = Date.now()
      try {
        // Canonical fail-closed verifier: authoritative invalid session
        // clears auth/runtime storage, emits auth:logout and schedules hard reload.
        await verifyStoredWalletSession()
      } finally {
        sessionWatchdogInFlightRef.current = false
      }
    }

    const runIfDue = () => {
      if (Date.now() - sessionWatchdogLastRunAtRef.current < WALLET_SESSION_WATCHDOG_MS) return
      void verifyCurrentSession()
    }

    const intervalId = window.setInterval(() => {
      void verifyCurrentSession()
    }, WALLET_SESSION_WATCHDOG_MS)

    const onPageShow = () => runIfDue()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') runIfDue()
    }

    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    requestRef.current = request
  }, [request])

  const finish = useCallback((reason) => {
    try { delete window.__QL7_WALLET_PENDING_MODE__ } catch {}
    updateStatus({
      runtimeMounted: false,
      runtimeActive: false,
      reactProvidersMounted: false,
      modalOpen: false,
      requestMode: null,
      lastDoneReason: reason || 'done',
    })
    setRequest(null)
  }, [])

  const mountRuntime = useCallback((mode = 'connect') => {
    const nextMode = mode === 'account' ? 'account' : 'connect'
    try {
      const ready = ensureRuntimeReady()
      if (ready) setHostSingleton((prev) => prev || ready)
    } catch (err) {
      updateStatus({
        lastError: err?.message || String(err),
        lastDoneReason: 'runtime_init_failed',
      })
      return
    }
    try { delete window.__QL7_WALLET_PENDING_MODE__ } catch {}
    updateStatus({
      runtimeMounted: true,
      runtimeActive: true,
      reactProvidersMounted: false,
      requestMode: nextMode,
      lastError: null,
      lastDoneReason: 'mount_requested',
    })
    setRequest((prev) => {
      if (!prev) return { mode: nextMode, nonce: Date.now() }
      if (prev.mode === nextMode) return { mode: nextMode, nonce: Date.now() }
      return { mode: nextMode, nonce: Date.now() }
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    window.__QL7_OPEN_WALLET_RUNTIME__ = (mode = 'connect') => mountRuntime(mode)
    window.__QL7_WALLET_RUNTIME_STATUS__ = () => ({
      runtimeMounted: !!requestRef.current,
      runtimeActive: !!requestRef.current,
      reactProvidersMounted: !!hostSingleton,
      walletHostMounted: !!hostSingleton,
      modalCreated: !!getRuntimeSingleton()?.modalCreated,
      modalOpen: false,
      requestMode: requestRef.current?.mode || null,
      ...(window.__QL7_WALLET_RUNTIME_LAST_STATUS__ || {}),
    })

    const onMount = (event) => {
      const mode = event?.detail?.mode || window.__QL7_WALLET_PENDING_MODE__ || 'connect'
      try { delete window.__QL7_WALLET_PENDING_MODE__ } catch {}
      mountRuntime(mode)
    }

    window.addEventListener('ql7:wallet-runtime:mount', onMount)
    window.addEventListener('open-auth', onMount)

    const pending = window.__QL7_WALLET_PENDING_MODE__
    if (pending && !requestRef.current) {
      try { delete window.__QL7_WALLET_PENDING_MODE__ } catch {}
      setTimeout(() => mountRuntime(pending), 0)
    }

    return () => {
      window.removeEventListener('ql7:wallet-runtime:mount', onMount)
      window.removeEventListener('open-auth', onMount)
      try { delete window.__QL7_OPEN_WALLET_RUNTIME__ } catch {}
      try { delete window.__QL7_WALLET_RUNTIME_STATUS__ } catch {}
    }
  }, [hostSingleton, mountRuntime])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    // Safari social OAuth is intentionally lazy for a guest. Keeping AppKit/Wagmi
    // alive from idle before the user starts OAuth can strand Safari on the
    // provider's authorized return page. Existing authenticated sessions keep
    // the persistent host; only the first guest OAuth flow restores intent mount.
    if (isSafariOAuthBrowser() && !hasStoredWalletIdentity()) {
      updateStatus({
        runtimePrepareScheduled: false,
        runtimePrepared: false,
        walletHostMounted: false,
        safariGuestLazyRuntime: true,
        lastDoneReason: 'safari_guest_lazy_runtime',
      })
      return undefined
    }

    const singleton = getRuntimeSingleton()
    if (!singleton || singleton.prepareScheduled || singleton.prepared) return undefined

    singleton.prepareScheduled = true
    updateStatus({
      runtimePrepareScheduled: true,
      runtimePrepared: !!singleton.prepared,
    })

    let idleId = 0
    let timeoutId = 0
    let started = false

    const prepare = () => {
      started = true
      singleton.prepareScheduled = false
      try {
        const ready = ensureRuntimeReady()
        if (!ready) return
        ready.prepared = true
        setHostSingleton((prev) => prev || ready)
        updateStatus({
          runtimePrepareScheduled: false,
          runtimePrepared: true,
          runtimeMounted: false,
          runtimeActive: false,
          reactProvidersMounted: true,
          walletHostMounted: true,
          modalCreated: !!ready.modalCreated,
          modalOpen: false,
          requestMode: null,
          lastError: null,
          lastDoneReason: 'runtime_prepared',
        })
      } catch (err) {
        updateStatus({
          runtimePrepareScheduled: false,
          runtimePrepared: false,
          lastError: err?.message || String(err),
          lastDoneReason: 'runtime_prepare_failed',
        })
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(prepare, { timeout: RUNTIME_PREPARE_IDLE_TIMEOUT_MS })
    } else {
      timeoutId = window.setTimeout(prepare, 0)
    }

    return () => {
      if (idleId) window.cancelIdleCallback?.(idleId)
      if (timeoutId) window.clearTimeout(timeoutId)
      if (!started) singleton.prepareScheduled = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onAuthLogout = (event) => {
      if (!isQl7AuthLogoutEvent(event)) {
        updateStatus({
          ignoredExternalAuthLogout: true,
          ignoredExternalAuthLogoutReason: event?.detail?.reason || null,
          lastDoneReason: 'external_auth_logout_ignored',
        })
        return
      }
      clearWalletRuntimeCache()
      setHostSingleton(null)
      finish('auth_logout')
    }
    window.addEventListener('auth:logout', onAuthLogout)
    return () => window.removeEventListener('auth:logout', onAuthLogout)
  }, [finish])

  if (!hostSingleton) return null
  return (
    <WalletRuntimeHost
      singleton={hostSingleton}
      request={request}
      finish={finish}
    />
  )
}

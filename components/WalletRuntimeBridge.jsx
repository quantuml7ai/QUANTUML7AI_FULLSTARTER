'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal, defaultWagmiConfig, useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react'
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi'
import { mainnet, polygon, arbitrum, base, bsc, optimism, avalanche } from 'wagmi/chains'
import {
  createWalletSession,
  logoutStoredWalletSession,
  clearWalletRuntimeCache,
} from '../lib/walletSessionClient'

const RUNTIME_KEY = '__ql7_wallet_runtime_v20__'
const chainsArr = [mainnet, polygon, arbitrum, base, bsc, optimism, avalanche]
const MOBILE_OAUTH_GRACE_KEY = 'ql7_wallet_mobile_oauth_grace_until'
const MOBILE_OAUTH_GRACE_MS = 15000
const MOBILE_OAUTH_RECHECK_MS = 900

function isMobileOAuthBrowser() {
  try {
    const ua = String(navigator?.userAgent || '').toLowerCase()
    return /android|iphone|ipad|ipod|mobile|crios|fxios|edgios/.test(ua)
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

function RuntimeController({ request, finish }) {
  const { open, close } = useWeb3Modal()
  const modalState = useWeb3ModalState()
  const { address, isConnected, connector, chainId } = useAccount()
  const { disconnectAsync } = useDisconnect()
  const openedRef = useRef(false)
  const accountViewOpenedRef = useRef(false)
  const hadConnectedRef = useRef(false)
  const creatingRef = useRef(false)
  const finishedRef = useRef(false)
  const latestAccountRef = useRef({ isConnected: false, address: '' })
  const [oauthGraceTick, setOauthGraceTick] = useState(0)

  const mode = request?.mode || 'connect'
  const connectorName = getConnectorName(connector)
  const modalOpen = !!modalState?.open

  useEffect(() => {
    latestAccountRef.current = { isConnected: !!isConnected, address: address || '' }
  }, [address, isConnected])

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
    })
  }, [address, chainId, connectorName, isConnected, modalOpen, mode])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    const run = async () => {
      try {
        if (mode === 'account') {
          // Reown throws "w3m-account-view: No account provided" when Account
          // is opened before wagmi has restored the connector. Wait briefly,
          // then choose the correct view from the actual restored state.
          await new Promise((resolve) => setTimeout(resolve, 900))
          const latest = latestAccountRef.current || {}
          if (latest.isConnected && latest.address) {
            accountViewOpenedRef.current = true
            try {
              await open?.({ view: 'Account' })
            } catch {
              await open?.()
            }
            return
          }

          // Server session can be valid while the wallet connector cache is gone.
          // In that case show Connect instead of crashing the Account widget.
          await open?.({ view: 'Connect' })
          return
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
        await open?.({ view: 'Connect' })
      } catch (err) {
        updateStatus({ lastError: err?.message || String(err), lastDoneReason: 'open_failed' })
      }
    }
    setTimeout(() => { void run() }, 0)
  }, [address, isConnected, mode, open])

  useEffect(() => {
    if (isConnected) hadConnectedRef.current = true
  }, [isConnected])

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
    if (!isConnected || !address) return

    const id = setTimeout(() => {
      if (finishedRef.current || accountViewOpenedRef.current) return
      accountViewOpenedRef.current = true
      try {
        void open?.({ view: 'Account' })
      } catch {
        try { void open?.() } catch {}
      }
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
    if (isConnected || !hadConnectedRef.current) return
    const run = async () => {
      try {
        clearMobileOAuthGrace()
        await logoutStoredWalletSession()
        updateStatus({ lastDoneReason: 'disconnect_logout', lastError: null })
      } finally {
        finishedRef.current = true
        setTimeout(() => finish('disconnect_logout'), 120)
      }
    }
    void run()
  }, [finish, isConnected])

  useEffect(() => {
    if (finishedRef.current) return
    if (modalOpen) return
    if (!openedRef.current) return
    if (creatingRef.current) return

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

    const id = setTimeout(() => {
      if (finishedRef.current || creatingRef.current) return
      if (mode === 'connect' && !isConnected && !address && isMobileOAuthGraceActive()) {
        setOauthGraceTick((value) => value + 1)
        return
      }
      clearMobileOAuthGrace()
      finishedRef.current = true
      updateStatus({ lastDoneReason: 'modal_closed', modalOpen: false, mobileOAuthGrace: false })
      finish('modal_closed')
    }, 500)
    return () => clearTimeout(id)
  }, [address, finish, isConnected, modalOpen, mode, oauthGraceTick])

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

function WalletRuntimeMounted({ request, finish }) {
  const [singleton, setSingleton] = useState(null)

  useEffect(() => {
    try {
      setSingleton(ensureRuntimeReady())
    } catch (err) {
      updateStatus({ lastError: err?.message || String(err), lastDoneReason: 'runtime_init_failed' })
      finish('runtime_init_failed')
    }
  }, [finish])

  if (!singleton?.config || !singleton?.queryClient) return null

  return (
    <WagmiProvider config={singleton.config} reconnectOnMount={request?.mode === 'account'}>
      <QueryClientProvider client={singleton.queryClient}>
        <RuntimeController request={request} finish={finish} />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default function WalletRuntimeBridge() {
  const [request, setRequest] = useState(null)

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
    try { delete window.__QL7_WALLET_PENDING_MODE__ } catch {}
    updateStatus({
      runtimeMounted: true,
      runtimeActive: true,
      reactProvidersMounted: false,
      requestMode: nextMode,
      lastError: null,
      lastDoneReason: 'mount_requested',
    })
    setRequest((prev) => prev || { mode: nextMode, nonce: Date.now() })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    window.__QL7_OPEN_WALLET_RUNTIME__ = (mode = 'connect') => mountRuntime(mode)
    window.__QL7_WALLET_RUNTIME_STATUS__ = () => ({
      runtimeMounted: !!request,
      runtimeActive: !!request,
      reactProvidersMounted: !!request,
      modalCreated: !!getRuntimeSingleton()?.modalCreated,
      modalOpen: false,
      requestMode: request?.mode || null,
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
    if (pending && !request) {
      try { delete window.__QL7_WALLET_PENDING_MODE__ } catch {}
      setTimeout(() => mountRuntime(pending), 0)
    }

    return () => {
      window.removeEventListener('ql7:wallet-runtime:mount', onMount)
      window.removeEventListener('open-auth', onMount)
      try { delete window.__QL7_OPEN_WALLET_RUNTIME__ } catch {}
      try { delete window.__QL7_WALLET_RUNTIME_STATUS__ } catch {}
    }
  }, [mountRuntime, request])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onAuthLogout = () => {
      clearWalletRuntimeCache()
      finish('auth_logout')
    }
    window.addEventListener('auth:logout', onAuthLogout)
    return () => window.removeEventListener('auth:logout', onAuthLogout)
  }, [finish])

  if (!request) return null
  return <WalletRuntimeMounted key={request.nonce} request={request} finish={finish} />
}
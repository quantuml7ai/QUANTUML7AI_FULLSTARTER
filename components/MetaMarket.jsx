'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from './i18n'
import {
  getMetaMarketCollection,
  getMetaMarketItem,
  listMetaMarketCollections,
  listMetaMarketItems,
} from './MetaMarketCatalog'
import {
  MetaMarketBackIcon,
  MetaMarketCloseIcon,
  MetaMarketHistoryIcon,
  MetaMarketSparkIcon,
} from './MetaMarketIcons'
import MetaMarketTitle from './MetaMarketTitle'
import AvatarEmoji from '../app/forum/features/profile/components/AvatarEmoji'
import VipFlipBadge from '../app/forum/features/profile/components/VipFlipBadge'
import { metaMarketT, metaMarketTitle } from './metamarket/metaMarketI18n'
import {
  formatMetaMarketButtonQcoin,
  formatMetaMarketCompactNumber,
  formatMetaMarketExactQcoin,
  makeMetaMarketIdempotencyKey,
} from './metamarket/metaMarketFormat'

export const METAMARKET_Z_INDEX = 2147482500

const DEFAULT_LIMIT = 50
const CURRENCY = 'QCoin'
const ANONYMOUS_AVATAR_URL = '/anonymous/anonymous.png'
const HISTORY_LIMIT = 30
const INFO_PREVIEW_MOTION_VARIANTS = 10

function seenGiftStorageKey(viewerId) {
  return `metamarket:seen-gifts:${String(viewerId || 'guest').trim() || 'guest'}`
}

function readSeenGiftAt(viewerId) {
  if (typeof window === 'undefined') return 0
  try {
    const localSeenAt = Math.max(0, Number(window.localStorage.getItem(seenGiftStorageKey(viewerId)) || 0))
    const storedReadAt = JSON.parse(window.localStorage.getItem('ql7_notification_read_at_v1') || '{}')
    const serverSeenAt = Math.max(
      0,
      Number(window.__QL7_NOTIFICATION_STATE__?.readAt?.metamarket_gifts || 0),
      Number(storedReadAt?.metamarket_gifts || 0),
    )
    return Math.max(localSeenAt, serverSeenAt)
  } catch {
    return 0
  }
}

function writeSeenGiftAt(viewerId, value = Date.now()) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(seenGiftStorageKey(viewerId), String(Math.max(0, Number(value || Date.now()))))
  } catch {}
}

function normalizeMode(mode) {
  return mode === 'collections' ? 'collections' : 'market'
}

function hashText(input) {
  const value = String(input || '')
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function chooseStablePreview(collectionId, viewerId, openedAt, sessionSeed, items) {
  const list = Array.isArray(items) ? items.filter((item) => item?.imagePath) : []
  if (!list.length) return null
  const index = hashText(`${collectionId}:${viewerId || 'guest'}:${openedAt || Date.now()}:${sessionSeed || ''}`) % list.length
  return list[index] || list[0]
}

function isAbortError(error) {
  return error?.name === 'AbortError' || String(error?.message || '').toLowerCase().includes('abort')
}

function coerceCount(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function clampTransactionQuantity(value, max = 1) {
  const limit = Math.max(1, coerceCount(max || 1))
  const n = Math.floor(Number(value || 1))
  return Math.max(1, Math.min(limit, Number.isFinite(n) ? n : 1))
}

function isMetaMarketCloseLocked(transaction) {
  return transaction?.status === 'submitting'
}

function optimisticQuoteForQuantity(quote, action, quantity) {
  if (!quote) return quote
  const previousQuantity = Math.max(1, coerceCount(quote.quantity || 1))
  const nextQuantity = Math.max(1, coerceCount(quantity || 1))
  const ratio = nextQuantity / previousQuantity
  const scaleQcoin = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n * ratio : value
  }
  const next = {
    ...quote,
    quantity: nextQuantity,
    canProceed: false,
  }
  if (action === 'buy') {
    next.totalPriceQcoin = scaleQcoin(quote.totalPriceQcoin ?? quote.priceQcoin)
    next.totalPriceMicro = scaleQcoin(quote.totalPriceMicro ?? quote.priceMicro)
    const balance = Number(next.balanceQcoin || 0)
    const total = Number(next.totalPriceQcoin || 0)
    if (Number.isFinite(balance) && Number.isFinite(total)) next.missingQcoin = Math.max(0, total - balance)
  }
  if (action === 'sell') {
    next.sellTotalQcoin = scaleQcoin(quote.sellTotalQcoin ?? quote.sellPriceQcoin)
    next.sellTotalMicro = scaleQcoin(quote.sellTotalMicro)
    next.sellFeeQcoin = scaleQcoin(quote.sellFeeQcoin)
    next.sellFeeMicro = scaleQcoin(quote.sellFeeMicro)
    next.sellGrossTotalQcoin = scaleQcoin(quote.sellGrossTotalQcoin)
    next.sellGrossTotalMicro = scaleQcoin(quote.sellGrossTotalMicro)
  }
  return next
}

function formatHistoryDate(value) {
  const ts = Number(value || 0)
  if (!Number.isFinite(ts) || ts <= 0) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts))
  } catch {
    return new Date(ts).toLocaleString()
  }
}

function splitMetaMarketDetailsText(value) {
  return String(value || '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/u)
    .map((part) => part.replace(/\n+/gu, ' ').trim())
    .filter(Boolean)
}

function apiHeaders(viewerId, vipActive) {
  const headers = {
    'content-type': 'application/json',
  }
  const uid = String(viewerId || '').trim()
  if (uid) {
    headers['x-forum-user-id'] = uid
    headers['x-forum-user'] = uid
  }
  if (vipActive) headers['x-forum-vip'] = '1'
  return headers
}

function buildQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

function useAbortRegistry() {
  const controllersRef = useRef(new Set())
  const abortAll = useCallback(() => {
    controllersRef.current.forEach((controller) => {
      try { controller.abort() } catch {}
    })
    controllersRef.current.clear()
  }, [])

  const nextSignal = useCallback(() => {
    const controller = new AbortController()
    controllersRef.current.add(controller)
    return {
      signal: controller.signal,
      done: () => controllersRef.current.delete(controller),
    }
  }, [])

  useEffect(() => abortAll, [abortAll])

  return { abortAll, nextSignal }
}

function useMetaMarketApi({ viewerId, vipActive, nextSignal }) {
  const request = useCallback(async (path, { method = 'GET', params, body } = {}) => {
    const { signal, done } = nextSignal()
    try {
      const res = await fetch(`${path}${buildQuery(params)}`, {
        method,
        headers: apiHeaders(viewerId, vipActive),
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal,
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        const error = new Error(json?.error || `HTTP ${res.status}`)
        error.code = json?.error || 'network_error'
        error.payload = json
        throw error
      }
      return json
    } finally {
      done()
    }
  }, [nextSignal, viewerId, vipActive])

  return request
}

function MetaMarketImage({ item, alt, className = '', width = 256, height = 256 }) {
  const [failed, setFailed] = useState(false)
  const imageSrc = item?.thumbPath || item?.imagePath
  const [currentSrc, setCurrentSrc] = useState(imageSrc || '')

  useEffect(() => {
    setCurrentSrc(imageSrc || '')
    setFailed(false)
  }, [imageSrc])

  if (!currentSrc || failed) {
    return (
      <span className={`mmImageFallback ${className}`} aria-label={alt} role="img">
        <MetaMarketSparkIcon />
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- MetaMarket assets are catalog-driven and may be animated GIF/WebP/AVIF, so they must bypass next/image optimization warnings.
    <img
      className={className}
      src={currentSrc}
      alt={alt || ''}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (item?.imagePath && currentSrc !== item.imagePath) {
          setCurrentSrc(item.imagePath)
          return
        }
        setFailed(true)
      }}
    />
  )
}

function MetaMarketSkeleton({ label }) {
  return (
    <div className="mmSkeleton" aria-live="polite">
      <span>{label}</span>
      <i aria-hidden="true" />
      <i aria-hidden="true" />
      <i aria-hidden="true" />
    </div>
  )
}

function MetaMarketEmptyState({ text, button, onClick }) {
  return (
    <div className="mmEmptyState">
      <MetaMarketSparkIcon />
      <span>{text}</span>
      {button && (
        <button type="button" className="mmButton mmButtonPrimary" onClick={onClick}>
          {button}
        </button>
      )}
    </div>
  )
}

function isAuthRequiredError(code) {
  const normalized = String(code || '').trim().toLowerCase()
  return normalized === 'missing_user_id' || normalized === 'unauthorized'
}

function MetaMarketErrorState({ title, text, retry, onRetry, actionAria, buttonClassName = 'mmButtonSecondary' }) {
  return (
    <div className="mmErrorState" aria-live="polite">
      <strong>{title}</strong>
      {!!text && <span>{text}</span>}
      {onRetry && (
        <button
          type="button"
          className={`mmButton ${buttonClassName}`}
          aria-label={actionAria || retry}
          onClick={onRetry}
        >
          {retry}
        </button>
      )}
    </div>
  )
}

export default function MetaMarket({
  onClose,
  source = 'dev',
  initialMode = 'market',
  giftFlow = false,
  recipient = null,
  viewerId = '',
  vipActive = false,
  openedAt = Date.now(),
}) {
  const { t } = useI18n()
  const shellRef = useRef(null)
  const closeRef = useRef(null)
  const lastFocusRef = useRef(null)
  const mountedRef = useRef(false)
  const transactionQuoteSeqRef = useRef(0)
  const previewSeedRef = useRef(`${openedAt || Date.now()}:${Math.random().toString(36).slice(2)}`)
  const [portalReady, setPortalReady] = useState(false)
  const [mode, setMode] = useState(normalizeMode(initialMode))
  const [giftFlowActive, setGiftFlowActive] = useState(!!giftFlow)
  const [stateStatus, setStateStatus] = useState('loading')
  const [stateError, setStateError] = useState('')
  const [marketState, setMarketState] = useState(null)
  const [recipientState, setRecipientState] = useState(recipient)
  const [selectedCollectionId, setSelectedCollectionId] = useState('')
  const [collectionStatus, setCollectionStatus] = useState('idle')
  const [collectionError, setCollectionError] = useState('')
  const [collectionItems, setCollectionItems] = useState([])
  const [collectionCursor, setCollectionCursor] = useState(null)
  const [collectionHasMore, setCollectionHasMore] = useState(false)
  const [collectionLoadingMore, setCollectionLoadingMore] = useState(false)
  const [ownedStatus, setOwnedStatus] = useState('idle')
  const [ownedError, setOwnedError] = useState('')
  const [ownedItems, setOwnedItems] = useState([])
  const [ownedUniqueCount, setOwnedUniqueCount] = useState(0)
  const [ownedCursor, setOwnedCursor] = useState(null)
  const [ownedHasMore, setOwnedHasMore] = useState(false)
  const [ownedLoadingMore, setOwnedLoadingMore] = useState(false)
  const [ownersItemId, setOwnersItemId] = useState('')
  const [ownersStatus, setOwnersStatus] = useState('idle')
  const [ownersError, setOwnersError] = useState('')
  const [ownersUsers, setOwnersUsers] = useState([])
  const [ownersCursor, setOwnersCursor] = useState(null)
  const [ownersHasMore, setOwnersHasMore] = useState(false)
  const [ownersLoadingMore, setOwnersLoadingMore] = useState(false)
  const [ownersTotals, setOwnersTotals] = useState({ totalOwners: 0, totalOwnedByUsers: 0 })
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyStatus, setHistoryStatus] = useState('idle')
  const [historyError, setHistoryError] = useState('')
  const [historyEvents, setHistoryEvents] = useState([])
  const [historyCursor, setHistoryCursor] = useState(null)
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false)
  const [unseenGiftCount, setUnseenGiftCount] = useState(0)
  const [unseenGiftItemIds, setUnseenGiftItemIds] = useState(() => new Set())
  const [transaction, setTransaction] = useState(null)
  const [infoOverlay, setInfoOverlay] = useState(null)
  const [viewportTop, setViewportTop] = useState(0)
  const { abortAll, nextSignal } = useAbortRegistry()
  const request = useMetaMarketApi({ viewerId, vipActive, nextSignal })
  const transactionCloseLocked = isMetaMarketCloseLocked(transaction)

  const tx = useCallback((key, vars = {}) => metaMarketT(t, key, vars), [t])
  const itemTitle = useCallback((item) => metaMarketTitle(t, item?.titleKey, item?.fallbackTitle), [t])
  const collectionTitle = useCallback((collection) => metaMarketTitle(t, collection?.titleKey, collection?.fallbackTitle), [t])
  const itemCollectionTitle = useCallback((item) => collectionTitle(getMetaMarketCollection(item?.collectionId)), [collectionTitle])
  const userDisplayName = useCallback((user) => {
    const nickname = String(user?.nickname || '').trim()
    return nickname || tx('metamarket_anonymous_user')
  }, [tx])

  const collections = useMemo(() => listMetaMarketCollections(), [])
  const collectionPreviewMap = useMemo(() => {
    const out = new Map()
    collections.forEach((collection) => {
      out.set(collection.id, chooseStablePreview(collection.id, viewerId, openedAt, previewSeedRef.current, listMetaMarketItems(collection.id)))
    })
    return out
  }, [collections, openedAt, viewerId])

  const activeCollection = selectedCollectionId ? getMetaMarketCollection(selectedCollectionId) : null
  const ownersItem = ownersItemId ? getMetaMarketItem(ownersItemId) : null

  const closeMetaMarket = useCallback(() => {
    if (transactionCloseLocked) return false
    abortAll()
    setTransaction(null)
    setInfoOverlay(null)
    onClose?.()
    return true
  }, [abortAll, onClose, transactionCloseLocked])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const previousClose = window.__QL7_CLOSE_METAMARKET__
    const runtimeClose = () => closeMetaMarket()
    window.__QL7_CLOSE_METAMARKET__ = runtimeClose
    return () => {
      if (window.__QL7_CLOSE_METAMARKET__ === runtimeClose) {
        if (typeof previousClose === 'function') {
          window.__QL7_CLOSE_METAMARKET__ = previousClose
        } else {
          try { delete window.__QL7_CLOSE_METAMARKET__ } catch { window.__QL7_CLOSE_METAMARKET__ = undefined }
        }
      }
    }
  }, [closeMetaMarket])

  const closeInfoOverlay = useCallback(() => {
    setInfoOverlay(null)
  }, [])

  const openAuthorization = useCallback(() => {
    const closed = closeMetaMarket()
    if (typeof window === 'undefined') return
    window.setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('open-auth', { detail: { source: 'metamarket' } }))
      } catch {
        try { window.dispatchEvent(new Event('open-auth')) } catch {}
      }
    }, closed ? 0 : 0)
  }, [closeMetaMarket])

  const refreshState = useCallback(async () => {
    setStateStatus('loading')
    setStateError('')
    try {
      const json = await request('/api/metamarket/state', {
        params: {
          recipientId: giftFlowActive ? (recipient?.userId || '') : '',
          includeMarket: '1',
          includeOwned: '1',
        },
      })
      setMarketState(json)
      if (giftFlowActive && json?.recipient) setRecipientState(json.recipient)
      setOwnedItems(Array.isArray(json?.ownedSummary?.items) ? json.ownedSummary.items : [])
      setOwnedUniqueCount(coerceCount(json?.ownedSummary?.totalUniqueItems))
      setStateStatus('ready')
    } catch (error) {
      if (isAbortError(error)) return
      setStateError(error?.code || error?.message || 'network_error')
      setStateStatus('error')
    }
  }, [giftFlowActive, recipient?.userId, request])

  const loadCollection = useCallback(async (collectionId, { append = false, cursor = '' } = {}) => {
    const cid = String(collectionId || '').trim()
    if (!cid) return
    setCollectionStatus(append ? 'ready' : 'loading')
    setCollectionLoadingMore(!!append)
    setCollectionError('')
    try {
      const json = await request('/api/metamarket/collection', {
        params: { collectionId: cid, limit: DEFAULT_LIMIT, cursor },
      })
      const nextItems = Array.isArray(json?.items) ? json.items : []
      setCollectionItems((prev) => (append ? [...prev, ...nextItems] : nextItems))
      setCollectionCursor(json?.nextCursor || null)
      setCollectionHasMore(!!json?.hasMore)
      setCollectionStatus('ready')
    } catch (error) {
      if (isAbortError(error)) return
      setCollectionError(error?.code || error?.message || 'network_error')
      setCollectionStatus('error')
    } finally {
      setCollectionLoadingMore(false)
    }
  }, [request])

  const loadOwned = useCallback(async ({ append = false, cursor = '' } = {}) => {
    setOwnedStatus(append ? 'ready' : 'loading')
    setOwnedLoadingMore(!!append)
    setOwnedError('')
    try {
      const json = await request('/api/metamarket/my-collection', {
        params: { limit: DEFAULT_LIMIT, cursor },
      })
      const nextItems = Array.isArray(json?.items) ? json.items : []
      setOwnedItems((prev) => (append ? [...prev, ...nextItems] : nextItems))
      setOwnedUniqueCount(coerceCount(json?.totalUniqueItems ?? nextItems.length))
      setOwnedCursor(json?.nextCursor || null)
      setOwnedHasMore(!!json?.hasMore)
      setOwnedStatus('ready')
    } catch (error) {
      if (isAbortError(error)) return
      setOwnedError(error?.code || error?.message || 'network_error')
      setOwnedStatus('error')
    } finally {
      setOwnedLoadingMore(false)
    }
  }, [request])

  const loadOwners = useCallback(async (itemId, { append = false, cursor = '' } = {}) => {
    const id = String(itemId || '').trim()
    if (!id) return
    setOwnersStatus(append ? 'ready' : 'loading')
    setOwnersLoadingMore(!!append)
    setOwnersError('')
    try {
      const json = await request('/api/metamarket/owners', {
        params: { itemId: id, limit: DEFAULT_LIMIT, cursor },
      })
      const users = Array.isArray(json?.users) ? json.users : []
      setOwnersUsers((prev) => (append ? [...prev, ...users] : users))
      setOwnersCursor(json?.nextCursor || null)
      setOwnersHasMore(!!json?.hasMore)
      setOwnersTotals({
        totalOwners: coerceCount(json?.totalOwners),
        totalOwnedByUsers: coerceCount(json?.totalOwnedByUsers),
      })
      setOwnersStatus('ready')
    } catch (error) {
      if (isAbortError(error)) return
      setOwnersError(error?.code || error?.message || 'network_error')
      setOwnersStatus('error')
    } finally {
      setOwnersLoadingMore(false)
    }
  }, [request])

  const loadHistory = useCallback(async ({ append = false, cursor = '' } = {}) => {
    setHistoryStatus(append ? 'ready' : 'loading')
    setHistoryLoadingMore(!!append)
    setHistoryError('')
    try {
      const json = await request('/api/metamarket/token-history', {
        params: { limit: HISTORY_LIMIT, cursor },
      })
      const events = Array.isArray(json?.events) ? json.events : []
      setHistoryEvents((prev) => (append ? [...prev, ...events] : events))
      setHistoryCursor(json?.nextCursor || null)
      setHistoryHasMore(!!json?.hasMore)
      setHistoryStatus('ready')

      if (!append) {
        const seenAt = readSeenGiftAt(viewerId)
        const incoming = events.filter((event) => (
          String(event?.action || '').toLowerCase() === 'receive'
          && Number(event?.createdAt || 0) > seenAt
        ))
        setUnseenGiftCount(incoming.length)
        setUnseenGiftItemIds(new Set(incoming.map((event) => String(event?.itemId || '').trim()).filter(Boolean)))
      }
    } catch (error) {
      if (isAbortError(error)) return
      setHistoryError(error?.code || error?.message || 'network_error')
      setHistoryStatus('error')
    } finally {
      setHistoryLoadingMore(false)
    }
  }, [request, viewerId])

  useEffect(() => {
    mountedRef.current = true
    setPortalReady(typeof document !== 'undefined')
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!portalReady || typeof document === 'undefined') return undefined
    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const bodyOverflow = document.body.style.overflow
    const htmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => {
      try { shellRef.current?.focus?.() } catch {}
    }, 0)
    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = htmlOverflow
      const previous = lastFocusRef.current
      lastFocusRef.current = null
      if (previous && typeof previous.focus === 'function') {
        try { previous.focus() } catch {}
      }
    }
  }, [portalReady])

  useEffect(() => {
    if (!portalReady || typeof document === 'undefined') return undefined
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      if (transactionCloseLocked) return
      if (infoOverlay) {
        closeInfoOverlay()
        return
      }
      closeMetaMarket()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [closeInfoOverlay, closeMetaMarket, infoOverlay, portalReady, transactionCloseLocked])

  useEffect(() => {
    if (!portalReady || typeof window === 'undefined') return undefined
    const update = () => {
      try {
        setViewportTop(Number(window.visualViewport?.offsetTop || 0))
      } catch {
        setViewportTop(0)
      }
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    try { window.visualViewport?.addEventListener?.('resize', update, { passive: true }) } catch {}
    try { window.visualViewport?.addEventListener?.('scroll', update, { passive: true }) } catch {}
    return () => {
      window.removeEventListener('resize', update)
      try { window.visualViewport?.removeEventListener?.('resize', update) } catch {}
      try { window.visualViewport?.removeEventListener?.('scroll', update) } catch {}
    }
  }, [portalReady])

  useEffect(() => {
    if (!portalReady) return
    refreshState()
    loadHistory({ append: false, cursor: '' })
  }, [loadHistory, portalReady, refreshState])

  useEffect(() => {
    if (mode === 'collections') loadOwned({ append: false, cursor: '' })
  }, [loadOwned, mode])

  useEffect(() => {
    if (mode !== 'collections' || ownedStatus !== 'ready' || unseenGiftCount <= 0) return undefined
    const timer = window.setTimeout(() => {
      writeSeenGiftAt(viewerId)
      setUnseenGiftCount(0)
      setUnseenGiftItemIds(new Set())
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [mode, ownedStatus, unseenGiftCount, viewerId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('ql7:notification-count', {
      detail: {
        source: 'metamarket_gifts',
        count: Math.max(0, Number(unseenGiftCount) || 0),
      },
    }))
  }, [unseenGiftCount])

  useEffect(() => {
    if (selectedCollectionId) loadCollection(selectedCollectionId, { append: false, cursor: '' })
  }, [loadCollection, selectedCollectionId])

  useEffect(() => {
    if (ownersItemId) loadOwners(ownersItemId, { append: false, cursor: '' })
  }, [loadOwners, ownersItemId])

  const canGoBack = !!infoOverlay || !!transaction || historyOpen || !!ownersItemId || !!selectedCollectionId
  const backDisabled = !canGoBack || transactionCloseLocked

  const handleBack = useCallback(() => {
    if (transactionCloseLocked) return
    if (infoOverlay) {
      setInfoOverlay(null)
      return
    }
    if (transaction) {
      setTransaction(null)
      return
    }
    if (historyOpen) {
      setHistoryOpen(false)
      return
    }
    if (ownersItemId) {
      setOwnersItemId('')
      setOwnersUsers([])
      setOwnersCursor(null)
      setOwnersHasMore(false)
      return
    }
    if (selectedCollectionId) {
      setSelectedCollectionId('')
      setCollectionItems([])
      setCollectionCursor(null)
      setCollectionHasMore(false)
    }
  }, [historyOpen, infoOverlay, ownersItemId, selectedCollectionId, transaction, transactionCloseLocked])

  const switchMode = useCallback((nextMode) => {
    if (transactionCloseLocked) return
    setMode(normalizeMode(nextMode))
    setSelectedCollectionId('')
    setOwnersItemId('')
    setHistoryOpen(false)
    setTransaction(null)
    setInfoOverlay(null)
  }, [transactionCloseLocked])

  const cancelGiftFlow = useCallback(() => {
    if (transactionCloseLocked) return
    setGiftFlowActive(false)
    setRecipientState(null)
    setMode('market')
    setSelectedCollectionId('')
    setOwnersItemId('')
    setHistoryOpen(false)
    setTransaction(null)
    setInfoOverlay(null)
  }, [transactionCloseLocked])

  const openHistory = useCallback(() => {
    if (transactionCloseLocked) return
    setHistoryOpen(true)
    setSelectedCollectionId('')
    setOwnersItemId('')
    setTransaction(null)
    setInfoOverlay(null)
    loadHistory({ append: false, cursor: '' })
  }, [loadHistory, transactionCloseLocked])

  const openWalletDeposit = useCallback((event) => {
    event?.stopPropagation?.()
    if (transactionCloseLocked) return
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('quantum-wallet:open', {
            detail: {
              source: 'metamarket-deposit',
              userKey: viewerId,
              accountId: viewerId,
              vipActive,
            },
          }))
        } catch {}
      }, 0)
    }
    closeMetaMarket()
  }, [closeMetaMarket, transactionCloseLocked, viewerId, vipActive])

  const openOwners = useCallback((itemId) => {
    if (transactionCloseLocked) return
    const id = String(itemId || '').trim()
    if (!id) return
    setOwnersItemId(id)
    setTransaction(null)
    setInfoOverlay(null)
  }, [transactionCloseLocked])

  const openCollectionInfo = useCallback((collection, event) => {
    event?.stopPropagation?.()
    if (transactionCloseLocked) return
    const id = String(collection?.id || '').trim()
    if (!id) return
    setTransaction(null)
    setInfoOverlay({ type: 'collection', id })
  }, [transactionCloseLocked])

  const openItemInfo = useCallback((item, event) => {
    event?.stopPropagation?.()
    if (transactionCloseLocked) return
    const id = String(item?.itemId || '').trim()
    if (!id) return
    setTransaction(null)
    setInfoOverlay({
      type: 'item',
      id,
      motion: Math.floor(Math.random() * INFO_PREVIEW_MOTION_VARIANTS),
      motionKey: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
    })
  }, [transactionCloseLocked])

  const openUserInfoFromOwner = useCallback((user, event) => {
    const userId = String(user?.userId || '').trim()
    if (!userId || typeof window === 'undefined') return
    try {
      window.dispatchEvent(new CustomEvent('forum:user-info-open', {
        detail: {
          userId,
          anchor: event?.currentTarget || null,
          userPreview: {
            userId,
            nickname: user?.nickname || '',
            icon: user?.icon || '',
            avatar: user?.icon || '',
            vipActive: !!user?.vipActive,
            sourceKind: 'metamarket-owner',
            sourceId: ownersItemId,
          },
        },
      }))
    } catch {}
  }, [ownersItemId])

  const openUserInfoFromHistory = useCallback((user, sourceId, event) => {
    const userId = String(user?.userId || '').trim()
    if (!userId || typeof window === 'undefined') return
    try {
      window.dispatchEvent(new CustomEvent('forum:user-info-open', {
        detail: {
          userId,
          anchor: event?.currentTarget || null,
          userPreview: {
            userId,
            nickname: user?.nickname || '',
            icon: user?.icon || user?.avatar || '',
            avatar: user?.avatar || user?.icon || '',
            vipActive: !!user?.vipActive,
            sourceKind: 'metamarket-history',
            sourceId,
          },
        },
      }))
    } catch {}
  }, [])

  const loadTransactionQuote = useCallback(async ({ action, item, idempotencyKey, quantity = 1 }) => {
    const quoteSeq = ++transactionQuoteSeqRef.current
    const safeQuantity = Math.max(1, Math.floor(Number(quantity || 1)))
    const json = await request('/api/metamarket/quote', {
      params: {
        action,
        itemId: item.itemId,
        quantity: safeQuantity,
        recipientId: action === 'gift' && giftFlowActive ? recipientState?.userId : '',
      },
    })
    if (quoteSeq !== transactionQuoteSeqRef.current) return
    setTransaction((prev) => {
      if (!prev || prev.idempotencyKey !== idempotencyKey) return prev
      return {
        ...prev,
        quantity: clampTransactionQuantity(json?.quantity ?? safeQuantity, json?.maxQuantity ?? safeQuantity),
        status: json?.canProceed ? 'confirm' : 'error',
        quote: json,
        quotePending: false,
        quoteConfirmed: !!json?.canProceed,
        errorCode: json?.canProceed ? '' : (json?.reason || 'transaction_failed'),
      }
    })
  }, [giftFlowActive, recipientState?.userId, request])

  const openTransaction = useCallback(async (action, rawItem) => {
    if (transactionCloseLocked) return
    const item = getMetaMarketItem(rawItem?.itemId || rawItem?.id || rawItem?.itemId)
      || getMetaMarketItem(rawItem?.itemId)
      || rawItem
    if (!item?.itemId) return
    const idempotencyKey = makeMetaMarketIdempotencyKey(action, item.itemId)
    setTransaction({
      action,
      item,
      status: 'loadingQuote',
      quote: null,
      errorCode: '',
      result: null,
      quantity: 1,
      quotePending: true,
      quoteConfirmed: false,
      idempotencyKey,
    })
    setInfoOverlay(null)
    try {
      await loadTransactionQuote({ action, item, idempotencyKey, quantity: 1 })
    } catch (error) {
      if (isAbortError(error)) return
      setTransaction((prev) => {
        if (!prev || prev.idempotencyKey !== idempotencyKey) return prev
        return {
          ...prev,
          status: 'error',
          quotePending: false,
          quoteConfirmed: false,
          errorCode: error?.code || error?.message || 'network_error',
        }
      })
    }
  }, [loadTransactionQuote, transactionCloseLocked])

  const updateTransactionQuantity = useCallback(async (nextQuantity) => {
    const current = transaction
    if (!current?.action || !current?.item?.itemId || !current?.idempotencyKey) return
    const maxQuantity = Math.max(1, coerceCount(current.quote?.maxQuantity || current.quote?.available || current.quantity || 1))
    const quantity = clampTransactionQuantity(nextQuantity, maxQuantity)
    if (quantity === coerceCount(current.quantity || 1) || current.status === 'submitting') return
    setTransaction((prev) => prev && prev.idempotencyKey === current.idempotencyKey
      ? {
          ...prev,
          quantity,
          quote: optimisticQuoteForQuantity(prev.quote, current.action, quantity),
          quotePending: true,
          quoteConfirmed: false,
          errorCode: '',
        }
      : prev)
    try {
      await loadTransactionQuote({
        action: current.action,
        item: current.item,
        idempotencyKey: current.idempotencyKey,
        quantity,
      })
    } catch (error) {
      if (isAbortError(error)) return
      setTransaction((prev) => prev && prev.idempotencyKey === current.idempotencyKey
        ? { ...prev, quantity, quotePending: false, quoteConfirmed: false, status: 'error', errorCode: error?.code || error?.message || 'network_error' }
        : prev)
    }
  }, [loadTransactionQuote, transaction])

  const submitTransaction = useCallback(async () => {
    if (!transaction?.action || !transaction?.item?.itemId || transaction.status !== 'confirm' || transaction.quotePending || transaction.quoteConfirmed === false || !transaction.quote?.canProceed) return
    const { action, item, idempotencyKey } = transaction
    setTransaction((prev) => prev ? { ...prev, status: 'submitting', errorCode: '' } : prev)
    try {
      const body = {
        itemId: item.itemId,
        quantity: Math.max(1, coerceCount(transaction.quantity || 1)),
        idempotencyKey,
        source,
      }
      if (action === 'gift') body.recipientId = giftFlowActive ? (recipientState?.userId || '') : ''
      const json = await request(`/api/metamarket/${action}`, {
        method: 'POST',
        body,
      })
      if ((action === 'buy' || action === 'sell') && json?.balanceQcoin != null && typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('qcoin:balance-changed', {
            detail: {
              balance: Number(json.balanceQcoin || 0),
              reason: action === 'buy' ? 'metamarket-buy' : 'metamarket-sell',
              txId: json.txId || '',
            },
          }))
        } catch {}
      }
      await Promise.allSettled([
        refreshState(),
        mode === 'collections' ? loadOwned({ append: false, cursor: '' }) : Promise.resolve(),
        selectedCollectionId ? loadCollection(selectedCollectionId, { append: false, cursor: '' }) : Promise.resolve(),
        ownersItemId ? loadOwners(ownersItemId, { append: false, cursor: '' }) : Promise.resolve(),
        loadHistory({ append: false, cursor: '' }),
      ])
      setTransaction((prev) => prev ? { ...prev, status: 'success', result: json } : prev)
    } catch (error) {
      if (isAbortError(error)) return
      setTransaction((prev) => prev ? {
        ...prev,
        status: 'error',
        errorCode: error?.code || error?.message || 'transaction_failed',
      } : prev)
    }
  }, [giftFlowActive, loadCollection, loadHistory, loadOwned, loadOwners, mode, ownersItemId, recipientState?.userId, refreshState, request, selectedCollectionId, source, transaction])

  const totalCollectionCount = (marketState?.collections || collections).length
  const ownersTotalCount = ownersTotals.totalOwners
  const contextMetaText = useMemo(() => {
    if (ownersItem) return formatMetaMarketCompactNumber(ownersTotalCount)
    if (historyOpen || activeCollection || (giftFlowActive && recipientState?.userId)) return ''
    if (mode === 'collections') {
      return formatMetaMarketCompactNumber(ownedUniqueCount || ownedItems.length)
    }
    if (mode === 'market') {
      return tx('metamarket_context_total_collections', { count: totalCollectionCount })
    }
    return ''
  }, [activeCollection, giftFlowActive, historyOpen, mode, ownersItem, ownersTotalCount, ownedItems.length, ownedUniqueCount, recipientState?.userId, totalCollectionCount, tx])

  const contextText = useMemo(() => {
    if (historyOpen) return tx('metamarket_history_context')
    if (giftFlowActive && recipientState?.userId) {
      const nickname = userDisplayName(recipientState)
      return tx('metamarket_context_gift_to', { nickname })
    }
    if (ownersItem) {
      return tx('metamarket_context_owners_label')
    }
    if (activeCollection) {
      const count = collectionItems.length || listMetaMarketItems(activeCollection.id).length
      return `${collectionTitle(activeCollection)} · ${tx('metamarket_context_collection_items_count', { count })}`
    }
    if (mode === 'collections') return tx('metamarket_context_owned_unique_label')
    return tx('metamarket_context_choose_collection')
  }, [activeCollection, collectionItems.length, collectionTitle, giftFlowActive, historyOpen, mode, ownersItem, recipientState, tx, userDisplayName])
  const showContextStrip = !(mode === 'market' && activeCollection && !ownersItem && !historyOpen && !(giftFlowActive && recipientState?.userId))

  if (!portalReady) return null

  const title = tx('metamarket_title')
  const marketCollections = marketState?.collections || collections
  const balance = formatMetaMarketExactQcoin(marketState?.balanceQcoin || 0)
  const renderLoadMoreLabel = (loading) => (
    <>
      <span>{loading ? tx('metamarket_loading_more') : tx('metamarket_owners_load_more')}</span>
      {loading && <span className="mmLoadingDots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>}
    </>
  )
  let infoEntity = null
  if (infoOverlay?.type === 'collection') {
    infoEntity = getMetaMarketCollection(infoOverlay.id)
  } else if (infoOverlay?.type === 'item') {
    infoEntity = getMetaMarketItem(infoOverlay.id)
  }
  const infoCollection = infoOverlay?.type === 'item'
    ? getMetaMarketCollection(infoEntity?.collectionId)
    : infoEntity
  const infoPreview = infoOverlay?.type === 'collection'
    ? collectionPreviewMap.get(infoEntity?.id)
    : infoEntity
  const infoName = infoOverlay?.type === 'collection'
    ? collectionTitle(infoEntity)
    : itemTitle(infoEntity)
  const infoCollectionName = infoCollection ? collectionTitle(infoCollection) : ''
  const infoVars = {
    itemName: infoName,
    collectionName: infoCollectionName || infoName,
  }
  const infoDetailsKey = infoEntity?.infoDetailsKey || ''

  return createPortal(
    <div
      className="mmOverlay"
      role="presentation"
      style={{ '--mm-z': METAMARKET_Z_INDEX, '--mm-vv-top': `${viewportTop}px` }}
    >
      <section
        ref={shellRef}
        className="mmShell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metamarket-title"
        tabIndex={-1}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="mmChrome" aria-hidden="true" />
        <div className="mmGrid" aria-hidden="true" />
        <div className="mmScan" aria-hidden="true" />

        <header className="mmHeader">
          <div className="mmTopbar">
            <button
              type="button"
              className={`mmRound mmBack ${backDisabled ? 'isDisabled' : 'isLive'}`}
              aria-label={tx('metamarket_back_aria')}
              title={tx('metamarket_back_title')}
              aria-disabled={backDisabled}
              disabled={backDisabled}
              onClick={handleBack}
            >
              <MetaMarketBackIcon />
            </button>
            <span className="mmBalancePill" title={`${balance} ${CURRENCY}`}>
              <span className="mmBalanceTextStack">
                <span className="mmBalanceLabel">{tx('metamarket_qcoin_balance_label')}</span>
                <span className="mmBalanceRail" aria-hidden="true" />
                <span className="mmBalanceValue" translate="no">{balance}</span>
              </span>
              <button
                type="button"
                className="mmDepositButton"
                aria-label={tx('metamarket_deposit_aria')}
                title={tx('metamarket_deposit_title')}
                onClick={openWalletDeposit}
              >
                {tx('metamarket_deposit')}
              </button>
            </span>
            <button
              type="button"
              className={`mmRound mmHistory ${historyOpen ? 'isLive' : ''}`}
              aria-label={tx('metamarket_history_aria')}
              title={tx('metamarket_history')}
              onClick={openHistory}
            >
              <MetaMarketHistoryIcon />
            </button>
            <button
              ref={closeRef}
              type="button"
              className={`mmRound mmClose ${transactionCloseLocked ? 'isDisabled' : ''}`}
              aria-label={tx('metamarket_close_aria')}
              title={tx('metamarket_close_title')}
              aria-disabled={transactionCloseLocked}
              disabled={transactionCloseLocked}
              onClick={closeMetaMarket}
            >
              <MetaMarketCloseIcon />
            </button>
          </div>

          <div id="metamarket-title" className="mmTitleWrap">
            <MetaMarketTitle label={title} />
          </div>

          <div className="mmRail mmRailTop" aria-hidden="true" />
          <div className="mmTabs" role="tablist" aria-label={tx('metamarket_open_aria')}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'market'}
              className={`mmTab ${mode === 'market' ? 'isActive' : ''}`}
              onClick={() => switchMode('market')}
            >
              {tx('metamarket_tab_market')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'collections'}
              className={`mmTab ${mode === 'collections' ? 'isActive' : ''}`}
              onClick={() => switchMode('collections')}
            >
              <span>{tx('metamarket_tab_collections')}</span>
              {unseenGiftCount > 0 && (
                <span className="mmTabGiftBadge" aria-label={tx('metamarket_new_gifts_badge_aria', { count: unseenGiftCount })} translate="no">
                  {formatMetaMarketCompactNumber(unseenGiftCount)}
                </span>
              )}
            </button>
          </div>
          <div className="mmRail mmRailBottom" aria-hidden="true" />

          {showContextStrip && <div className="mmContextStrip">
            {giftFlowActive && recipientState?.userId && (
              <span className="mmRecipientAvatar">
                {recipientState?.icon || recipientState?.avatar ? (
                  <AvatarEmoji userId={recipientState.userId} pIcon={recipientState.icon || recipientState.avatar} className="mmRecipientAvatarImg" />
                ) : (
                  <span className="mmAnonymousAvatar" style={{ backgroundImage: `url("${ANONYMOUS_AVATAR_URL}")` }} aria-hidden="true" />
                )}
              </span>
            )}
            <span className="mmContextText">
              <span className="mmContextPrimary">{contextText}</span>
              {!!contextMetaText && (
                <>
                  <span className="mmContextDivider" aria-hidden="true" />
                  <span className="mmContextMeta">{contextMetaText}</span>
                </>
              )}
            </span>
            {giftFlowActive && recipientState?.vipActive && <VipFlipBadge className="mmContextVip" />}
            {giftFlowActive && recipientState?.userId && (
              <button
                type="button"
                className="mmContextCancelGift"
                aria-label={tx('metamarket_cancel_gift_flow_aria')}
                title={tx('metamarket_cancel_gift_flow_title')}
                onClick={cancelGiftFlow}
              >
                <MetaMarketCloseIcon />
              </button>
            )}
          </div>}
        </header>

        <main className="mmBody">
          {stateStatus === 'loading' && <MetaMarketSkeleton label={tx('metamarket_loading')} />}
          {stateStatus === 'error' && (
            <MetaMarketErrorState
              title={isAuthRequiredError(stateError) ? tx('metamarket_auth_required_title') : tx('metamarket_error_title')}
              text={isAuthRequiredError(stateError) ? '' : tx(`metamarket_error_${stateError}`)}
              retry={isAuthRequiredError(stateError) ? tx('metamarket_authorize') : tx('metamarket_retry')}
              actionAria={isAuthRequiredError(stateError) ? tx('metamarket_authorize_aria') : undefined}
              buttonClassName={isAuthRequiredError(stateError) ? 'mmButtonPrimary mmAuthButton' : 'mmButtonSecondary'}
              onRetry={isAuthRequiredError(stateError) ? openAuthorization : refreshState}
            />
          )}
          {stateStatus !== 'loading' && stateStatus !== 'error' && historyOpen && (
            <div className="mmHistoryPane">
              {historyStatus === 'loading' && <MetaMarketSkeleton label={tx('metamarket_loading')} />}
              {historyStatus === 'error' && (
                <MetaMarketErrorState
                  title={tx('metamarket_error_title')}
                  text={tx(`metamarket_error_${historyError}`)}
                  retry={tx('metamarket_retry')}
                  onRetry={() => loadHistory({ append: false, cursor: '' })}
                />
              )}
              {historyStatus !== 'loading' && historyStatus !== 'error' && !historyEvents.length && (
                <MetaMarketEmptyState text={tx('metamarket_history_empty')} />
              )}
              {historyStatus !== 'loading' && historyStatus !== 'error' && historyEvents.map((event) => {
                const item = event.item || getMetaMarketItem(event.itemId)
                const titleText = itemTitle(item)
                const collectionName = itemCollectionTitle(item)
                const action = String(event.action || 'event')
                const counterparty = event.counterparty
                const counterpartyName = counterparty?.userId ? userDisplayName(counterparty) : tx('metamarket_history_market_counterparty')
                const eventQuantity = Math.max(1, coerceCount(event.quantity || 1))
                return (
                  <article key={event.txId} className={`mmHistoryRow mmHistory-${action}`}>
                    <span className="mmHistoryPreview">
                      {item ? <MetaMarketImage item={item} alt={titleText} width={78} height={78} /> : <MetaMarketSparkIcon />}
                      <span className="mmHistoryActionBadge">{tx(`metamarket_history_action_${action}`)}</span>
                      {eventQuantity > 1 && (
                        <span className="mmHistoryQuantityBadge" translate="no">
                          x{formatMetaMarketCompactNumber(eventQuantity)}
                        </span>
                      )}
                    </span>
                    <span className="mmHistoryMain">
                      {!!collectionName && <span className="mmHistoryCollection">{collectionName}</span>}
                      <strong>{titleText}</strong>
                      <span className="mmHistoryMeta">
                        <span translate="no">{event.serial || event.tokenId || event.txId}</span>
                        {!!event.createdAt && <span>{formatHistoryDate(event.createdAt)}</span>}
                      </span>
                      <span className="mmHistoryMeta">
                        <span>{tx('metamarket_history_price_label')}: {formatMetaMarketExactQcoin(event.priceQcoin)} {CURRENCY}</span>
                      </span>
                    </span>
                    {counterparty?.userId ? (
                      <button
                        type="button"
                        className="mmHistoryUser"
                        onClick={(clickEvent) => openUserInfoFromHistory(counterparty, event.txId, clickEvent)}
                      >
                        <span className="mmOwnerAvatar">
                          {counterparty.icon || counterparty.avatar ? (
                            <AvatarEmoji userId={counterparty.userId} pIcon={counterparty.icon || counterparty.avatar} className="mmOwnerAvatarImg" />
                          ) : (
                            <span className="mmAnonymousAvatar" style={{ backgroundImage: `url("${ANONYMOUS_AVATAR_URL}")` }} aria-hidden="true" />
                          )}
                        </span>
                        <span className="mmHistoryUserName">
                          <span className={`nick-badge nick-animate ${counterparty.vipActive ? 'vipNick' : ''}`} translate="no">
                            <span className="nick-text">{counterpartyName}</span>
                          </span>
                          {counterparty.vipActive && <VipFlipBadge className="mmOwnerVip" />}
                        </span>
                      </button>
                    ) : (
                      <span className="mmHistoryMarket" translate="no">{counterpartyName}</span>
                    )}
                  </article>
                )
              })}
              {historyHasMore && (
                <button
                  type="button"
                  className="mmButton mmButtonSecondary mmWideButton"
                  disabled={historyLoadingMore}
                  aria-busy={historyLoadingMore ? 'true' : undefined}
                  onClick={() => loadHistory({ append: true, cursor: historyCursor || '' })}
                >
                  {renderLoadMoreLabel(historyLoadingMore)}
                </button>
              )}
            </div>
          )}
          {stateStatus !== 'loading' && stateStatus !== 'error' && !historyOpen && mode === 'market' && !selectedCollectionId && !ownersItemId && (
            <div className="mmCollectionList">
              {marketCollections.length ? marketCollections.map((collectionLike) => {
                const collection = getMetaMarketCollection(collectionLike.id) || collectionLike
                const preview = collectionPreviewMap.get(collection.id)
                const count = coerceCount(collectionLike.itemCount || collectionLike.count || listMetaMarketItems(collection.id).length)
                const titleText = collectionTitle(collection)
                const previewTitle = preview ? itemTitle(preview) : titleText
                return (
                  <article key={collection.id} className={`mmCollectionCard mmTheme-${collection.theme || 'cyan'}`}>
                    <button
                      type="button"
                      className="mmInfoButton mmCollectionInfoButton"
                      aria-label={tx('metamarket_collection_info_aria', { collectionName: titleText })}
                      title={tx('metamarket_info_open_title')}
                      onClick={(event) => openCollectionInfo(collection, event)}
                    >
                      <span aria-hidden="true">i</span>
                    </button>
                    <button
                      type="button"
                      className="mmCollectionOpenButton"
                      aria-label={tx('metamarket_collection_open_aria', { collectionName: titleText })}
                      onClick={() => setSelectedCollectionId(collection.id)}
                    >
                      <span className="mmCardRail" aria-hidden="true" />
                      <span className="mmCollectionPreview">
                        <MetaMarketImage item={preview} alt={tx('metamarket_image_missing_aria')} width={180} height={180} />
                        <span className="mmPreviewBadge" title={previewTitle}>{previewTitle}</span>
                      </span>
                      <span className="mmCollectionMain">
                        <span className="mmCollectionTopline">
                          <span className="mmTinyRail" aria-hidden="true" />
                          <span className="mmCodeBadge" translate="no">{collection.code}</span>
                          <span className="mmTinyRail" aria-hidden="true" />
                        </span>
                        <span className="mmCollectionTitle">{titleText}</span>
                        <span className="mmCardDivider" aria-hidden="true" />
                        <span className="mmCollectionMeta">
                          <span className="mmCountBadge">{tx('metamarket_collection_items_count', { count: formatMetaMarketCompactNumber(count) })}</span>
                        </span>
                      </span>
                    </button>
                  </article>
                )
              }) : (
                <MetaMarketEmptyState text={tx('metamarket_empty_market')} />
              )}
            </div>
          )}

          {stateStatus !== 'loading' && stateStatus !== 'error' && !historyOpen && mode === 'market' && selectedCollectionId && !ownersItemId && (
            <div className="mmItemGrid">
              {collectionStatus === 'loading' && <MetaMarketSkeleton label={tx('metamarket_loading')} />}
              {collectionStatus === 'error' && (
                <MetaMarketErrorState
                  title={tx('metamarket_error_title')}
                  text={tx(`metamarket_error_${collectionError}`)}
                  retry={tx('metamarket_retry')}
                  onRetry={() => loadCollection(selectedCollectionId, { append: false, cursor: '' })}
                />
              )}
              {collectionStatus !== 'loading' && collectionStatus !== 'error' && !collectionItems.length && (
                <MetaMarketEmptyState text={tx('metamarket_empty_collection')} />
              )}
              {collectionStatus !== 'loading' && collectionStatus !== 'error' && collectionItems.map((item) => {
                const canonical = getMetaMarketItem(item.itemId) || item
                const titleText = itemTitle(canonical)
                const collectionName = itemCollectionTitle(canonical)
                const total = coerceCount(item.totalSupply ?? canonical.supply)
                const available = coerceCount(item.marketAvailable ?? canonical.supply)
                const soldOut = available <= 0
                return (
                  <article key={canonical.itemId} className={`mmItemCard mmRarity-${canonical.rarity || 'common'}`}>
                    <div className="mmItemTopControls">
                      <button
                        type="button"
                        className="mmSupplyBadge mmItemSupplyTopBadge"
                        aria-label={tx('metamarket_supply_badge_aria', { total, available, itemName: titleText })}
                        onClick={() => openOwners(canonical.itemId)}
                      >
                        <span translate="no">{formatMetaMarketCompactNumber(total)} / {formatMetaMarketCompactNumber(available)}</span>
                      </button>
                      <button
                        type="button"
                        className="mmInfoButton mmItemInfoButton"
                        aria-label={tx('metamarket_item_info_aria', { itemName: titleText })}
                        title={tx('metamarket_info_open_title')}
                        onClick={(event) => openItemInfo(canonical, event)}
                      >
                        <span aria-hidden="true">i</span>
                      </button>
                    </div>
                    <div className="mmItemMedia">
                      {!!collectionName && <span className="mmCollectionChip">{collectionName}</span>}
                      {!!collectionName && <span className="mmItemMediaTopRail" aria-hidden="true" />}
                      <div className="mmItemImageStage">
                        <MetaMarketImage item={canonical} alt={titleText} />
                      </div>
                    </div>
                    <div className="mmItemInfo">
                      <span className="mmCardDivider" aria-hidden="true" />
                      <h3>{titleText}</h3>
                      <span className="mmCardDivider mmCardDividerShort" aria-hidden="true" />
                    </div>
                    <button
                      type="button"
                      className="mmButton mmButtonPrimary"
                      aria-label={tx('metamarket_buy_button_aria', { itemName: titleText, price: formatMetaMarketExactQcoin(item.priceQcoin ?? canonical.priceQcoin) })}
                      disabled={soldOut || !canonical.buyEnabled}
                      onClick={() => openTransaction('buy', canonical)}
                    >
                      {soldOut ? tx('metamarket_sold_out') : `${formatMetaMarketButtonQcoin(item.priceQcoin ?? canonical.priceQcoin)} ${CURRENCY}`}
                    </button>
                  </article>
                )
              })}
              {collectionHasMore && (
                <button
                  type="button"
                  className="mmButton mmButtonSecondary mmWideButton"
                  disabled={collectionLoadingMore}
                  aria-busy={collectionLoadingMore ? 'true' : undefined}
                  onClick={() => loadCollection(selectedCollectionId, { append: true, cursor: collectionCursor || '' })}
                >
                  {renderLoadMoreLabel(collectionLoadingMore)}
                </button>
              )}
            </div>
          )}

          {stateStatus !== 'loading' && stateStatus !== 'error' && !historyOpen && mode === 'market' && ownersItemId && (
            <div className="mmOwnersPane">
              {ownersItem && (
                <div className="mmOwnersHero">
                  <span className="mmOwnersHeroImage">
                    <MetaMarketImage item={ownersItem} alt={itemTitle(ownersItem)} width={96} height={96} />
                  </span>
                  <span>
                    <strong>{tx('metamarket_owners_title')}</strong>
                    <em>{itemTitle(ownersItem)}</em>
                  </span>
                </div>
              )}
              {ownersStatus === 'loading' && <MetaMarketSkeleton label={tx('metamarket_loading')} />}
              {ownersStatus === 'error' && (
                <MetaMarketErrorState
                  title={tx('metamarket_error_title')}
                  text={tx(`metamarket_error_${ownersError}`)}
                  retry={tx('metamarket_retry')}
                  onRetry={() => loadOwners(ownersItemId, { append: false, cursor: '' })}
                />
              )}
              {ownersStatus !== 'loading' && ownersStatus !== 'error' && !ownersUsers.length && (
                <MetaMarketEmptyState text={tx('metamarket_owners_empty')} />
              )}
              {!!ownersUsers.length && (
                <div className="mmOwnersList">
                  {ownersUsers.map((user) => {
                    const nickname = userDisplayName(user)
                    const since = formatHistoryDate(user.ownedSince || user.updatedAt)
                    return (
                      <button
                        key={user.userId}
                        type="button"
                        className="mmOwnerRow"
                        onClick={(event) => openUserInfoFromOwner(user, event)}
                      >
                        <span className="mmOwnerAvatar avaMini">
                          {user.icon || user.avatar ? (
                            <AvatarEmoji userId={user.userId} pIcon={user.icon || user.avatar} className="mmOwnerAvatarImg" />
                          ) : (
                            <span className="mmAnonymousAvatar" style={{ backgroundImage: `url("${ANONYMOUS_AVATAR_URL}")` }} aria-hidden="true" />
                          )}
                        </span>
                        <span className="mmOwnerNickWrap">
                          <span className="mmOwnerNickLine">
                            <span className={`nick-badge nick-animate ${user.vipActive ? 'vipNick' : ''}`} translate="no">
                              <span className="nick-text">{nickname}</span>
                            </span>
                            {user.vipActive && <VipFlipBadge className="mmOwnerVip" />}
                          </span>
                          {!!since && <span className="mmOwnerSince">{tx('metamarket_owner_since_label')}: {since}</span>}
                        </span>
                        <span className="mmOwnerCountBadge" aria-label={tx('metamarket_owner_count_aria', { nickname, count: coerceCount(user.count) })} translate="no">
                          x{formatMetaMarketCompactNumber(user.count)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              {ownersHasMore && (
                <button
                  type="button"
                  className="mmButton mmButtonSecondary mmWideButton"
                  disabled={ownersLoadingMore}
                  aria-busy={ownersLoadingMore ? 'true' : undefined}
                  onClick={() => loadOwners(ownersItemId, { append: true, cursor: ownersCursor || '' })}
                >
                  {renderLoadMoreLabel(ownersLoadingMore)}
                </button>
              )}
            </div>
          )}

          {stateStatus !== 'loading' && stateStatus !== 'error' && !historyOpen && mode === 'collections' && (
            <div className="mmOwnedList">
              {ownedStatus === 'loading' && <MetaMarketSkeleton label={tx('metamarket_loading')} />}
              {ownedStatus === 'error' && !isAuthRequiredError(ownedError) && (
                <MetaMarketErrorState
                  title={tx('metamarket_error_title')}
                  text={tx(`metamarket_error_${ownedError}`)}
                  retry={tx('metamarket_retry')}
                  onRetry={() => loadOwned({ append: false, cursor: '' })}
                />
              )}
              {ownedStatus !== 'loading' && ownedStatus !== 'error' && !ownedItems.length && (
                <MetaMarketEmptyState
                  text={tx('metamarket_empty_own_collection')}
                  button={tx('metamarket_open_market')}
                  onClick={() => switchMode('market')}
                />
              )}
              {ownedStatus !== 'loading' && ownedStatus !== 'error' && ownedItems.map((owned) => {
                const canonical = getMetaMarketItem(owned.itemId) || owned
                const titleText = itemTitle(canonical)
                const collectionName = itemCollectionTitle(canonical)
                const count = coerceCount(owned.count)
                const isNewGift = unseenGiftItemIds.has(String(owned.itemId || '').trim())
                return (
                  <article key={owned.itemId} className={`mmOwnedCard mmRarity-${canonical.rarity || 'common'} ${isNewGift ? 'isNewGift' : ''}`}>
                    {isNewGift && <span className="mmNewGiftBadge">{tx('metamarket_new_gift_badge')}</span>}
                    <button
                      type="button"
                      className="mmInfoButton mmOwnedInfoButton"
                      aria-label={tx('metamarket_item_info_aria', { itemName: titleText })}
                      title={tx('metamarket_info_open_title')}
                      onClick={(event) => openItemInfo(canonical, event)}
                    >
                      <span aria-hidden="true">i</span>
                    </button>
                    <div className="mmOwnedMedia">
                      {!!collectionName && <span className="mmCollectionChip">{collectionName}</span>}
                      {!!collectionName && <span className="mmItemMediaTopRail mmOwnedMediaTopRail" aria-hidden="true" />}
                      <div className="mmOwnedImageStage">
                        <span className="mmCountBadge mmOwnedImageCountBadge" translate="no">x{formatMetaMarketCompactNumber(count)}</span>
                        <MetaMarketImage item={canonical} alt={titleText} width={148} height={148} />
                      </div>
                    </div>
                    <div className="mmOwnedMain">
                      <h3>{titleText}</h3>
                      <span className="mmOwnedActionRail" aria-hidden="true" />
                    </div>
                    {giftFlowActive ? (
                      <button
                        type="button"
                        className="mmButton mmButtonPrimary"
                        disabled={!owned.canGift || !recipientState?.userId}
                        onClick={() => openTransaction('gift', canonical)}
                      >
                        {tx('metamarket_gift')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mmButton mmButtonSecondary"
                        disabled={!owned.canSell}
                        onClick={() => openTransaction('sell', canonical)}
                      >
                        {tx('metamarket_sell')}
                      </button>
                    )}
                  </article>
                )
              })}
              {ownedHasMore && (
                <button
                  type="button"
                  className="mmButton mmButtonSecondary mmWideButton"
                  disabled={ownedLoadingMore}
                  aria-busy={ownedLoadingMore ? 'true' : undefined}
                  onClick={() => loadOwned({ append: true, cursor: ownedCursor || '' })}
                >
                  {renderLoadMoreLabel(ownedLoadingMore)}
                </button>
              )}
            </div>
          )}
        </main>

        {infoOverlay && infoEntity && (
          <div
            className="mmInfoLayer"
            role="presentation"
          >
            <section
              className={`mmInfoPopover mmInfo-${infoOverlay.type}`}
              role="dialog"
              aria-modal="false"
              aria-labelledby="metamarket-info-title"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <span className="mmInfoGlow" aria-hidden="true" />
              <header className="mmInfoHeader">
                {infoOverlay.type === 'item' ? (
                  <>
                    <button
                      type="button"
                      className="mmRound mmInfoClose mmInfoCloseFloating"
                      aria-label={tx('metamarket_info_close_aria')}
                      title={tx('metamarket_info_close_title')}
                      onClick={closeInfoOverlay}
                    >
                      <MetaMarketCloseIcon />
                    </button>
                    <span className="mmInfoItemBadges">
                      <em>{tx('metamarket_info_item_type')}</em>
                      {!!infoCollectionName && <span aria-hidden="true">•</span>}
                      {!!infoCollectionName && <b>{infoCollectionName}</b>}
                    </span>
                    <span
                      key={`mm-info-preview-${infoOverlay.id}-${infoOverlay.motionKey || 'motion'}`}
                      className={`mmInfoPreview mmInfoLivingPreview mmInfoLiving-${Number(infoOverlay.motion || 0)}`}
                    >
                      <span className="mmLivingBackdrop" aria-hidden="true" />
                      <span className="mmLivingOrbit mmLivingOrbitA" aria-hidden="true" />
                      <span className="mmLivingOrbit mmLivingOrbitB" aria-hidden="true" />
                      <span className="mmLivingParticles" aria-hidden="true" />
                      <span className="mmLivingScan" aria-hidden="true" />
                      <span className="mmLivingCore" aria-hidden="true" />
                      {infoPreview ? (
                        <MetaMarketImage item={infoPreview} alt={infoName} width={512} height={512} />
                      ) : (
                        <MetaMarketSparkIcon />
                      )}
                    </span>
                    <span className="mmInfoItemTitleRail">
                      <span className="mmInfoTitleRailLine" aria-hidden="true" />
                      <strong id="metamarket-info-title">{infoName}</strong>
                      <span className="mmInfoTitleRailLine" aria-hidden="true" />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="mmInfoPreview">
                      {infoPreview ? (
                        <MetaMarketImage item={infoPreview} alt={infoName} width={118} height={118} />
                      ) : (
                        <MetaMarketSparkIcon />
                      )}
                    </span>
                    <span className="mmInfoHeading">
                      <em>{tx('metamarket_info_collection_type')}</em>
                      <strong id="metamarket-info-title">{infoName}</strong>
                    </span>
                    <button
                      type="button"
                      className="mmRound mmInfoClose"
                      aria-label={tx('metamarket_info_close_aria')}
                      title={tx('metamarket_info_close_title')}
                      onClick={closeInfoOverlay}
                    >
                      <MetaMarketCloseIcon />
                    </button>
                  </>
                )}
              </header>
              <div className="mmInfoBody">
                <span className="mmInfoRail" aria-hidden="true" />
                <section className="mmInfoStats" aria-label={tx('metamarket_info_stats_aria')}>
                  {infoOverlay.type === 'collection' ? (
                    <>
                      <span>
                        <b>{tx('metamarket_info_code_label')}</b>
                        <strong translate="no">{infoEntity.code}</strong>
                      </span>
                      <span>
                        <b>{tx('metamarket_info_item_count_label')}</b>
                        <strong translate="no">{formatMetaMarketCompactNumber(infoEntity.itemCount)}</strong>
                      </span>
                      <span>
                        <b>{tx('metamarket_info_status_label')}</b>
                        <strong>{tx(infoEntity.active ? 'metamarket_info_status_active' : 'metamarket_info_status_paused')}</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        <b>{tx('metamarket_info_rarity_label')}</b>
                        <strong>{tx(`metamarket_rarity_${infoEntity.rarity || 'common'}`)}</strong>
                      </span>
                      <span>
                        <b>{tx('metamarket_info_supply_label')}</b>
                        <strong translate="no">{formatMetaMarketCompactNumber(infoEntity.supply)}</strong>
                      </span>
                      <span>
                        <b>{tx('metamarket_info_price_label')}</b>
                        <strong translate="no">{formatMetaMarketExactQcoin(infoEntity.priceQcoin)} {CURRENCY}</strong>
                      </span>
                    </>
                  )}
                </section>
                {!!infoDetailsKey && (
                  <section className="mmInfoSection mmInfoDetailsSection">
                    <span className="mmInfoSectionTitle">{tx('metamarket_info_details_label')}</span>
                    <span className="mmInfoDetailsRail" aria-hidden="true" />
                    <div className="mmInfoDetailsScroll">
                      {splitMetaMarketDetailsText(tx(infoDetailsKey, infoVars)).map((paragraph, index) => (
                        <p key={`${infoDetailsKey}-${index}`}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </section>
          </div>
        )}

        {transaction && (
          <div className="mmTransactionLayer" role="presentation">
            <div className="mmTransactionModal" role="alertdialog" aria-live="polite">
              {transaction.item && (
                <div className="mmTransactionAsset">
                  <span className="mmTransactionAssetImage">
                    <MetaMarketImage item={transaction.item} alt={itemTitle(transaction.item)} width={118} height={118} />
                  </span>
                  <span className="mmTransactionAssetInfo">
                    <span className="mmTransactionCollection">{itemCollectionTitle(transaction.item)}</span>
                    <strong>{itemTitle(transaction.item)}</strong>
                    <em>{tx(`metamarket_transaction_action_${transaction.action}`)}</em>
                    {transaction.action === 'gift' && recipientState?.userId && (
                      <span className="mmTransactionTarget">
                        <span className="mmTransactionTargetAvatar">
                          {recipientState?.icon || recipientState?.avatar ? (
                            <AvatarEmoji userId={recipientState.userId} pIcon={recipientState.icon || recipientState.avatar} className="mmTransactionTargetAvatarImg" />
                          ) : (
                            <span className="mmAnonymousAvatar" style={{ backgroundImage: `url("${ANONYMOUS_AVATAR_URL}")` }} aria-hidden="true" />
                          )}
                        </span>
                        <span>{tx('metamarket_transaction_gift_target', { nickname: userDisplayName(recipientState) })}</span>
                        {recipientState?.vipActive && <VipFlipBadge className="mmTransactionVip" />}
                      </span>
                    )}
                  </span>
                </div>
              )}
              {transaction.status === 'loadingQuote' && (
                <>
                  <span className="mmSpinner" aria-hidden="true" />
                  <h2>{tx('metamarket_transaction_loading_quote')}</h2>
                </>
              )}
              {transaction.status === 'submitting' && (
                <>
                  <span className="mmSpinner" aria-hidden="true" />
                  <h2>{tx('metamarket_transaction_submitting')}</h2>
                </>
              )}
              {transaction.status === 'confirm' && (
                <>
                  <h2>{tx(`metamarket_${transaction.action}_confirm_title`)}</h2>
                  <p>
                    {transaction.action === 'buy' && tx('metamarket_buy_confirm_body', {
                      itemName: itemTitle(transaction.item),
                      price: formatMetaMarketExactQcoin(transaction.quote?.priceQcoin ?? transaction.quote?.totalPriceQcoin),
                      unitPrice: formatMetaMarketExactQcoin(transaction.quote?.priceQcoin ?? transaction.quote?.totalPriceQcoin),
                      currency: CURRENCY,
                    })}
                    {transaction.action === 'sell' && tx('metamarket_sell_confirm_body', {
                      itemName: itemTitle(transaction.item),
                      sellPrice: formatMetaMarketExactQcoin(transaction.quote?.sellTotalQcoin ?? transaction.quote?.sellPriceQcoin),
                      unitPrice: formatMetaMarketExactQcoin(transaction.quote?.sellPriceQcoin ?? transaction.quote?.sellTotalQcoin),
                      currency: CURRENCY,
                    })}
                    {transaction.action === 'gift' && tx('metamarket_gift_confirm_body', {
                      itemName: itemTitle(transaction.item),
                      nickname: userDisplayName(recipientState),
                    })}
                  </p>
                  {transaction.quote && (
                    <div className={`mmQuantityControl ${transaction.quotePending ? 'isSyncing' : ''}`}>
                      <button
                        type="button"
                        className="mmQuantityButton"
                        aria-label={tx('metamarket_quantity_decrease_aria')}
                        disabled={coerceCount(transaction.quantity || 1) <= 1}
                        onClick={() => updateTransactionQuantity(coerceCount(transaction.quantity || 1) - 1)}
                      >
                        <span aria-hidden="true">-</span>
                      </button>
                      <label className="mmQuantityValue">
                        <span>{tx('metamarket_quantity_label')}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={String(Math.max(1, coerceCount(transaction.quantity || 1)))}
                          aria-label={tx('metamarket_quantity_label')}
                          onChange={(event) => {
                            const value = String(event.target.value || '').replace(/[^\d]/g, '')
                            updateTransactionQuantity(value || 1)
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="mmQuantityButton"
                        aria-label={tx('metamarket_quantity_increase_aria')}
                        disabled={coerceCount(transaction.quantity || 1) >= Math.max(1, coerceCount(transaction.quote?.maxQuantity || 1))}
                        onClick={() => updateTransactionQuantity(coerceCount(transaction.quantity || 1) + 1)}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  )}
                  {transaction.quote && (
                    <>
                      <div className="mmQuoteRows mmQuoteGrid">
                        {transaction.action !== 'gift' && (
                          <span>{tx(transaction.action === 'sell' ? 'metamarket_sell_quote_label' : 'metamarket_total_label')}: {formatMetaMarketExactQcoin(transaction.action === 'sell' ? (transaction.quote?.sellTotalQcoin ?? transaction.quote?.sellPriceQcoin) : (transaction.quote?.totalPriceQcoin ?? transaction.quote?.priceQcoin))} {CURRENCY}</span>
                        )}
                        {transaction.action !== 'gift' && transaction.quote?.balanceQcoin != null && (
                          <span>{tx('metamarket_balance_label')}: {formatMetaMarketExactQcoin(transaction.quote?.balanceQcoin)} {CURRENCY}</span>
                        )}
                        {transaction.quote?.ownedCount != null && (
                          <span>{tx('metamarket_owned_count_label')}: x{formatMetaMarketCompactNumber(transaction.quote?.ownedCount)}</span>
                        )}
                        {transaction.action === 'buy' && transaction.quote?.available != null && (
                          <span>{tx('metamarket_market_available_label')}: x{formatMetaMarketCompactNumber(transaction.quote?.available)}</span>
                        )}
                      </div>
                      {transaction.action === 'sell' && (
                        <div className="mmQuoteFeeRow">
                          <span>{tx('metamarket_sell_fee_label')}: {formatMetaMarketExactQcoin(transaction.quote?.sellFeeQcoin)} {CURRENCY}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="mmTransactionActions">
                    <button type="button" className="mmButton mmButtonSecondary" onClick={() => setTransaction(null)}>
                      {tx('metamarket_decline')}
                    </button>
                    <button
                      type="button"
                      className="mmButton mmButtonPrimary"
                      disabled={!!transaction.quotePending || transaction.quoteConfirmed === false || !transaction.quote?.canProceed}
                      onClick={submitTransaction}
                    >
                      {transaction.action === 'buy' ? tx('metamarket_pay') : transaction.action === 'gift' ? tx('metamarket_gift_confirm_button') : tx('metamarket_confirm')}
                    </button>
                  </div>
                </>
              )}
              {transaction.status === 'success' && (
                <>
                  <MetaMarketSparkIcon />
                  <h2>{tx(`metamarket_${transaction.action}_success`)}</h2>
                  <button type="button" className="mmButton mmButtonPrimary" onClick={() => setTransaction(null)}>
                    {tx('metamarket_close_action')}
                  </button>
                </>
              )}
              {transaction.status === 'error' && (
                <>
                  <h2>{transaction.errorCode === 'insufficient_funds' ? tx('metamarket_insufficient_funds_title') : tx('metamarket_error_title')}</h2>
                  {transaction.errorCode !== 'insufficient_funds' && (
                    <p>{tx(`metamarket_error_${transaction.errorCode || 'transaction_failed'}`)}</p>
                  )}
                  {transaction.errorCode === 'insufficient_funds' && (
                    <>
                      <span className="mmInsufficientRail" aria-hidden="true" />
                      <div className="mmQuoteRows mmInsufficientQuoteRows">
                        <span>{tx('metamarket_balance_label')}: {formatMetaMarketExactQcoin(transaction.quote?.balanceQcoin)} {CURRENCY}</span>
                        <span>{tx('metamarket_required_label')}: {formatMetaMarketExactQcoin(transaction.quote?.totalPriceQcoin ?? transaction.quote?.priceQcoin)} {CURRENCY}</span>
                        <span>{tx('metamarket_missing_label')}: {formatMetaMarketExactQcoin(transaction.quote?.missingQcoin)} {CURRENCY}</span>
                      </div>
                    </>
                  )}
                  <div className={`mmTransactionActions ${transaction.errorCode === 'insufficient_funds' ? 'mmTransactionActionsPlain' : ''}`}>
                    <button type="button" className="mmButton mmButtonSecondary" onClick={() => setTransaction(null)}>
                      {tx('metamarket_close')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <style jsx global>{`
          .mmOverlay {
            position: fixed;
            inset: 0;
            z-index: var(--mm-z);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom));
            background:
              radial-gradient(circle at 50% 12%, rgba(80, 231, 255, .18), transparent 34%),
              radial-gradient(circle at 80% 18%, rgba(250, 204, 21, .12), transparent 26%),
              radial-gradient(circle at 16% 82%, rgba(168, 85, 247, .14), transparent 32%),
              rgba(1, 5, 14, .78);
            overflow: hidden;
            transform: translateY(var(--mm-vv-top));
          }
          .mmOverlay::before {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              radial-gradient(circle, rgba(255,255,255,.28) 0 1px, transparent 1px),
              radial-gradient(circle, rgba(103,232,249,.22) 0 1px, transparent 1px);
            background-size: 88px 88px, 132px 132px;
            opacity: .26;
          }
          .mmShell {
            position: relative;
            width: min(620px, calc(100vw - 32px));
            height: min(760px, calc(100vh - 48px));
            max-height: calc(100dvh - 24px);
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            border-radius: 30px;
            overflow: hidden;
            color: rgba(236, 254, 255, .96);
            background:
              linear-gradient(145deg, rgba(7, 13, 28, .94), rgba(3, 8, 18, .98)),
              radial-gradient(circle at 50% 0%, rgba(103,232,249,.18), transparent 42%);
            border: 1px solid rgba(125, 211, 252, .34);
            box-shadow:
              0 30px 90px rgba(0, 0, 0, .68),
              0 0 42px rgba(34, 211, 238, .14),
              inset 0 0 0 1px rgba(255,255,255,.06);
            outline: none;
            isolation: isolate;
          }
          .mmChrome,
          .mmGrid,
          .mmScan {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
          }
          .mmChrome {
            background:
              linear-gradient(90deg, rgba(103,232,249,.38), transparent 14%, transparent 86%, rgba(250,204,21,.28)),
              radial-gradient(circle at 12% 8%, rgba(103,232,249,.16), transparent 24%),
              radial-gradient(circle at 92% 6%, rgba(250,204,21,.14), transparent 22%);
            opacity: .85;
          }
          .mmGrid {
            background-image:
              linear-gradient(rgba(103,232,249,.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(103,232,249,.04) 1px, transparent 1px);
            background-size: 34px 34px;
            mask-image: radial-gradient(circle at center, black, transparent 86%);
          }
          .mmScan {
            background: linear-gradient(180deg, transparent, rgba(103,232,249,.09), transparent);
            height: 34%;
            animation: mmScan 12s linear infinite;
            opacity: .32;
          }
          .mmHeader,
          .mmBody {
            position: relative;
            z-index: 1;
          }
          .mmHeader {
            padding: 14px 16px 0;
            display: grid;
            gap: 8px;
          }
          .mmTopbar {
            display: grid;
            grid-template-columns: 46px minmax(0, 1fr) 46px;
            align-items: center;
            gap: 10px;
          }
          .mmRound {
            width: 46px;
            height: 46px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(125,211,252,.34);
            background: linear-gradient(145deg, rgba(12, 23, 42, .82), rgba(34, 211, 238, .12));
            color: rgba(236,254,255,.96);
            box-shadow: 0 0 20px rgba(34,211,238,.18), inset 0 0 0 1px rgba(255,255,255,.04);
            transition: transform .14s ease, filter .16s ease, opacity .16s ease;
          }
          .mmRound svg {
            width: 22px;
            height: 22px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2.2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .mmRound:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
          .mmRound:active:not(:disabled) { transform: translateY(0) scale(.98); }
          .mmRound.isDisabled {
            opacity: .38;
            box-shadow: none;
          }
          .mmBalancePill {
            min-width: 0;
            justify-self: center;
            max-width: 100%;
            padding: 9px 14px;
            border-radius: 999px;
            border: 1px solid rgba(250,204,21,.32);
            background: rgba(9, 16, 30, .76);
            color: rgba(255, 244, 191, .96);
            font-size: 12px;
            font-weight: 900;
            line-height: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            box-shadow: 0 0 18px rgba(250,204,21,.12);
          }
          .mmTitleWrap {
            height: 74px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .mmTitleSvg {
            width: min(92%, 430px);
            height: 74px;
          }
          .mmTitleText {
            font: 1000 38px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            letter-spacing: 0;
            paint-order: stroke fill;
          }
          .mmTitleTextBack {
            fill: rgba(255,255,255,.08);
            stroke: rgba(103,232,249,.28);
            stroke-width: 2.8;
          }
          .mmTitleTextMain {
            stroke-width: .85;
            filter: drop-shadow(0 0 6px rgba(103,232,249,.42));
          }
          .mmTitleComet {
            stroke-dasharray: 42 168;
            animation: mmComet 6s ease-in-out infinite;
            opacity: .75;
          }
          .mmTitleSweep {
            animation: mmTitleSweep 5.8s ease-in-out infinite;
            opacity: .72;
          }
          .mmRail {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.72), rgba(250,204,21,.52), transparent);
            box-shadow: 0 0 14px rgba(103,232,249,.24);
          }
          .mmTabs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .mmTab {
            min-height: 42px;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.24);
            background: rgba(9, 16, 30, .62);
            color: rgba(203, 213, 225, .88);
            font-weight: 900;
            font-size: 13px;
            line-height: 1;
            transition: background .16s ease, border-color .16s ease, color .16s ease, transform .14s ease;
          }
          .mmTab.isActive {
            color: rgba(255,255,255,.98);
            border-color: rgba(250,204,21,.44);
            background: linear-gradient(120deg, rgba(34,211,238,.18), rgba(250,204,21,.14), rgba(168,85,247,.16));
            box-shadow: 0 0 20px rgba(34,211,238,.12);
          }
          .mmTab:hover { transform: translateY(-1px); }
          .mmContextStrip {
            min-height: 48px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 16px 16px 0 0;
            border: 1px solid rgba(125,211,252,.18);
            border-bottom: 0;
            background: rgba(5, 12, 24, .5);
          }
          .mmContextText {
            min-width: 0;
            color: rgba(226, 246, 255, .92);
            font-size: 13px;
            font-weight: 800;
            line-height: 1.25;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmRecipientAvatar,
          .mmOwnerAvatar {
            position: relative;
            flex: 0 0 auto;
            width: 34px;
            height: 34px;
            border-radius: 999px;
            overflow: hidden;
            border: 1px solid rgba(125,211,252,.32);
            background: rgba(15,23,42,.86);
          }
          .mmRecipientAvatarImg,
          .mmOwnerAvatarImg,
          .mmAnonymousAvatar {
            width: 100%;
            height: 100%;
            display: block;
            background-position: center;
            background-size: cover;
            background-repeat: no-repeat;
          }
          .mmBody {
            overflow: auto;
            padding: 12px 16px 16px;
            overscroll-behavior: contain;
          }
          .mmCollectionList,
          .mmOwnedList,
          .mmOwnersPane {
            display: grid;
            gap: 12px;
          }
          .mmCollectionCard {
            position: relative;
            min-height: 132px;
            display: grid;
            grid-template-columns: 108px minmax(0, 1fr);
            align-items: center;
            gap: 14px;
            padding: 14px;
            border-radius: 24px;
            overflow: hidden;
            text-align: left;
            border: 1px solid rgba(125,211,252,.22);
            background:
              radial-gradient(circle at 9% 20%, rgba(103,232,249,.22), transparent 35%),
              linear-gradient(145deg, rgba(10, 18, 34, .86), rgba(3, 9, 20, .88));
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.04), 0 14px 32px rgba(0,0,0,.24);
            color: inherit;
            transition: transform .16s ease, border-color .2s ease, box-shadow .2s ease;
          }
          .mmCollectionCard:hover,
          .mmItemCard:hover,
          .mmOwnedCard:hover {
            transform: translateY(-1px);
            border-color: rgba(250,204,21,.44);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 18px 38px rgba(0,0,0,.3), 0 0 24px rgba(34,211,238,.12);
          }
          .mmCollectionCard:focus-visible,
          .mmTab:focus-visible,
          .mmButton:focus-visible,
          .mmRound:focus-visible,
          .mmInfoButton:focus-visible,
          .mmSupplyBadge:focus-visible,
          .mmOwnerRow:focus-visible {
            outline: 2px solid rgba(250,204,21,.78);
            outline-offset: 3px;
          }
          .mmCardRail {
            position: absolute;
            inset: 0 auto 0 0;
            width: 3px;
            background: linear-gradient(180deg, rgba(103,232,249,.9), rgba(250,204,21,.8), rgba(168,85,247,.76));
            box-shadow: 0 0 14px rgba(103,232,249,.32);
          }
          .mmCollectionPreview,
          .mmItemImageStage,
          .mmOwnedImageStage,
          .mmOwnersHeroImage {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 20px;
            background:
              radial-gradient(circle at 50% 46%, rgba(103,232,249,.28), transparent 54%),
              rgba(3, 9, 20, .62);
            min-width: 0;
            overflow: hidden;
          }
          .mmCollectionPreview {
            width: 104px;
            height: 104px;
          }
          .mmCollectionPreview img,
          .mmItemImageStage img,
          .mmOwnedImageStage img,
          .mmOwnersHeroImage img,
          .mmImageFallback {
            width: 82%;
            height: 82%;
            object-fit: contain;
          }
          .mmImageFallback {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: rgba(125,211,252,.84);
          }
          .mmImageFallback svg {
            width: 42%;
            height: 42%;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.7;
          }
          .mmCollectionMain {
            min-width: 0;
            display: grid;
            gap: 12px;
          }
          .mmCollectionTitle {
            color: rgba(248,250,252,.98);
            font-size: 19px;
            font-weight: 1000;
            line-height: 1.05;
            overflow-wrap: anywhere;
          }
          .mmCollectionMeta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .mmCountBadge,
          .mmCodeBadge,
          .mmRarityBadge,
          .mmOwnerCountBadge,
          .mmOwnedMiniBadge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.24);
            background: rgba(9, 16, 30, .7);
            color: rgba(226, 246, 255, .92);
            font-size: 11px;
            font-weight: 900;
            line-height: 1;
            padding: 7px 9px;
            white-space: nowrap;
          }
          .mmCodeBadge,
          .mmOwnerCountBadge {
            border-color: rgba(250,204,21,.34);
            color: rgba(255, 244, 191, .96);
          }
          .mmItemGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .mmItemCard,
          .mmOwnedCard {
            position: relative;
            border-radius: 22px;
            border: 1px solid rgba(125,211,252,.2);
            background:
              radial-gradient(circle at 50% 14%, rgba(103,232,249,.14), transparent 38%),
              linear-gradient(155deg, rgba(10, 18, 34, .86), rgba(4, 10, 22, .94));
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.035), 0 10px 28px rgba(0,0,0,.22);
            overflow: hidden;
            transition: transform .16s ease, border-color .2s ease, box-shadow .2s ease;
          }
          .mmItemCard {
            min-height: 300px;
            display: grid;
            grid-template-rows: 148px minmax(68px, auto) 44px;
            gap: 10px;
            padding: 12px;
          }
          .mmItemImageStage {
            width: 100%;
            aspect-ratio: 1 / 1;
            align-self: start;
          }
          .mmSupplyBadge {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 2;
            border: 1px solid rgba(250,204,21,.32);
            background: rgba(5, 12, 24, .84);
            color: rgba(255, 244, 191, .96);
            border-radius: 999px;
            padding: 6px 8px;
            font-size: 11px;
            font-weight: 1000;
            line-height: 1;
          }
          .mmOwnedMiniBadge {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 2;
          }
          .mmItemInfo,
          .mmOwnedMain {
            min-width: 0;
            display: grid;
            align-content: start;
            gap: 7px;
          }
          .mmItemInfo h3,
          .mmOwnedMain h3 {
            margin: 0;
            color: rgba(248,250,252,.98);
            font-size: 14px;
            font-weight: 1000;
            line-height: 1.18;
            overflow-wrap: anywhere;
          }
          .mmButton {
            min-height: 42px;
            max-width: 100%;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.28);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 14px;
            color: rgba(248,250,252,.96);
            font-size: clamp(10px, 2.15vw, 12px);
            font-weight: 1000;
            line-height: 1;
            font-variant-numeric: tabular-nums;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            transition: transform .14s ease, filter .16s ease, opacity .16s ease;
          }
          .mmButton:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); }
          .mmButton:disabled {
            opacity: .48;
            cursor: default;
          }
          .mmButtonPrimary {
            border-color: rgba(250,204,21,.46);
            background: linear-gradient(120deg, rgba(34,211,238,.28), rgba(250,204,21,.24), rgba(168,85,247,.22));
            box-shadow: 0 0 20px rgba(250,204,21,.13), inset 0 0 0 1px rgba(255,255,255,.05);
          }
          .mmButtonSecondary {
            background: linear-gradient(120deg, rgba(15,23,42,.86), rgba(34,211,238,.12));
          }
          .mmAuthButton {
            min-width: min(210px, 100%);
            letter-spacing: .015em;
            text-shadow: 0 0 14px rgba(255,255,255,.35);
            border-color: rgba(250,204,21,.68);
            background:
              linear-gradient(120deg, rgba(34,211,238,.32), rgba(250,204,21,.32), rgba(168,85,247,.28)),
              radial-gradient(circle at 22% 18%, rgba(255,255,255,.22), transparent 34%);
            box-shadow:
              0 0 22px rgba(34,211,238,.16),
              0 0 26px rgba(250,204,21,.18),
              inset 0 0 0 1px rgba(255,255,255,.08);
          }
          .mmWideButton {
            grid-column: 1 / -1;
            width: 100%;
          }
          .mmWideButton[aria-busy="true"] {
            opacity: .88;
            cursor: wait;
          }
          .mmLoadingDots {
            width: 18px;
            display: inline-flex;
            align-items: center;
            justify-content: flex-start;
            gap: 1px;
            margin-left: -3px;
          }
          .mmLoadingDots span {
            display: inline-block;
            animation: mmLoadDot 1.05s ease-in-out infinite;
          }
          .mmLoadingDots span:nth-child(2) { animation-delay: .14s; }
          .mmLoadingDots span:nth-child(3) { animation-delay: .28s; }
          @keyframes mmLoadDot {
            0%, 100% { opacity: .25; transform: translateY(0); }
            45% { opacity: 1; transform: translateY(-1px); }
          }
          .mmOwnedCard {
            min-height: 148px;
            display: grid;
            grid-template-columns: 112px minmax(0, 1fr);
            grid-template-rows: 1fr auto;
            gap: 12px;
            padding: 14px;
          }
          .mmOwnedImageStage {
            grid-row: 1 / 3;
            width: 112px;
            height: 112px;
          }
          .mmOwnedCard .mmButton {
            justify-self: start;
            min-width: min(180px, 100%);
          }
          .mmOwnedCountBadge {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 2;
          }
          .mmOwnersHero {
            display: grid;
            grid-template-columns: 84px minmax(0, 1fr);
            gap: 14px;
            align-items: center;
            padding: 12px;
            border-radius: 20px;
            border: 1px solid rgba(125,211,252,.2);
            background: rgba(9,16,30,.58);
          }
          .mmOwnersHeroImage {
            width: 84px;
            height: 84px;
          }
          .mmOwnersHero strong,
          .mmOwnersHero em {
            display: block;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .mmOwnersHero strong {
            color: rgba(248,250,252,.98);
            font-size: 16px;
            font-style: normal;
          }
          .mmOwnersHero em {
            margin-top: 5px;
            color: rgba(203,213,225,.76);
            font-style: normal;
            font-size: 13px;
          }
          .mmOwnersList {
            display: grid;
            gap: 8px;
          }
          .mmOwnerRow {
            min-height: 58px;
            display: grid;
            grid-template-columns: 40px minmax(0, 1fr) auto;
            align-items: center;
            gap: 10px;
            padding: 9px 10px;
            border-radius: 16px;
            border: 1px solid rgba(125,211,252,.18);
            background: rgba(9, 16, 30, .58);
            color: inherit;
            text-align: left;
          }
          .mmOwnerAvatar {
            width: 40px;
            height: 40px;
          }
          .mmOwnerNickWrap {
            min-width: 0;
            display: inline-flex;
            align-items: center;
            gap: 7px;
          }
          .mmOwnerNickWrap .nick-badge {
            min-width: 0;
          }
          .mmOwnerNickWrap .nick-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmSkeleton,
          .mmEmptyState,
          .mmErrorState {
            grid-column: 1 / -1;
            min-height: 220px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            text-align: center;
            border-radius: 22px;
            border: 1px solid rgba(125,211,252,.18);
            background: rgba(9, 16, 30, .48);
            color: rgba(226, 246, 255, .9);
            padding: 22px;
          }
          .mmSkeleton i {
            width: min(260px, 70%);
            height: 10px;
            border-radius: 999px;
            background: linear-gradient(90deg, rgba(103,232,249,.08), rgba(103,232,249,.24), rgba(250,204,21,.14), rgba(103,232,249,.08));
            background-size: 220% 100%;
            animation: mmShimmer 1.8s linear infinite;
          }
          .mmEmptyState svg,
          .mmErrorState svg,
          .mmTransactionModal > svg {
            width: 42px;
            height: 42px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.6;
            color: rgba(250,204,21,.88);
          }
          .mmErrorState strong {
            color: rgba(255,244,191,.96);
          }
          .mmTransactionLayer {
            position: absolute;
            inset: 0;
            z-index: 5;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(1, 5, 14, .62);
            overflow-y: auto;
            overscroll-behavior: contain;
          }
          .mmTransactionModal {
            width: min(420px, 100%);
            max-height: min(650px, calc(100dvh - 32px));
            overflow: visible;
            display: grid;
            gap: 16px;
            justify-items: center;
            text-align: center;
            padding: 22px;
            border-radius: 24px;
            border: 1px solid rgba(250,204,21,.32);
            background:
              radial-gradient(circle at 50% 0%, rgba(250,204,21,.16), transparent 38%),
              linear-gradient(145deg, rgba(9,16,30,.98), rgba(2,7,18,.98));
            box-shadow: 0 24px 70px rgba(0,0,0,.52), 0 0 28px rgba(250,204,21,.12);
          }
          .mmTransactionModal h2 {
            margin: 0;
            color: rgba(248,250,252,.98);
            font-size: 18px;
            font-weight: 1000;
            line-height: 1.2;
          }
          .mmTransactionModal p {
            margin: 0;
            color: rgba(226,246,255,.88);
            line-height: 1.45;
            font-size: 14px;
          }
          .mmTransactionActions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            width: 100%;
          }
          .mmQuoteRows {
            display: grid;
            gap: 7px;
            width: 100%;
            color: rgba(226,246,255,.86);
            font-size: 12px;
            font-weight: 800;
          }
          .mmSpinner {
            width: 42px;
            height: 42px;
            border-radius: 999px;
            border: 2px solid rgba(103,232,249,.18);
            border-top-color: rgba(250,204,21,.92);
            border-right-color: rgba(103,232,249,.72);
            animation: mmSpin 1.1s linear infinite;
          }
          .mmRarity-common { --mm-rarity: rgba(103,232,249,.42); }
          .mmRarity-rare { --mm-rarity: rgba(129,140,248,.48); }
          .mmRarity-epic { --mm-rarity: rgba(192,132,252,.48); }
          .mmRarity-legendary { --mm-rarity: rgba(250,204,21,.54); }
          .mmRarity-mythic { --mm-rarity: rgba(244,114,182,.48); }
          .mmRarity-quantum { --mm-rarity: rgba(255,255,255,.56); }
          .mmItemCard::before,
          .mmOwnedCard::before {
            content: '';
            position: absolute;
            inset: -1px;
            pointer-events: none;
            border-radius: inherit;
            background: radial-gradient(circle at 50% 0%, var(--mm-rarity, rgba(103,232,249,.28)), transparent 46%);
            opacity: .72;
          }
          .mmItemCard > *,
          .mmOwnedCard > * {
            position: relative;
            z-index: 1;
          }
          @keyframes mmScan {
            0% { transform: translateY(-120%); }
            100% { transform: translateY(320%); }
          }
          @keyframes mmComet {
            0%, 100% { stroke-dashoffset: 120; opacity: .34; }
            50% { stroke-dashoffset: -90; opacity: .82; }
          }
          @keyframes mmTitleSweep {
            0%, 100% { transform: translateX(-30%); opacity: .08; }
            50% { transform: translateX(30%); opacity: .8; }
          }
          @keyframes mmShimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 220% 50%; }
          }
          @keyframes mmSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes mmLifeFrameBreathe {
            0%, 100% { transform: translateZ(0) scale(1); }
            50% { transform: translateZ(0) scale(1.012); }
          }
          @keyframes mmLifeImageBreathe {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            48% { transform: translate3d(0, -2.5%, 0) scale(1.035); }
          }
          @keyframes mmLifeAuraDrift {
            0%, 100% { transform: rotate(0deg) scale(1); opacity: .54; }
            50% { transform: rotate(18deg) scale(1.08); opacity: .86; }
          }
          @keyframes mmLifeImageFloat {
            0%, 100% { transform: translate3d(-1.2%, 1%, 0) rotate(-.7deg) scale(1.01); }
            50% { transform: translate3d(1.4%, -2.2%, 0) rotate(.8deg) scale(1.035); }
          }
          @keyframes mmLifeOrbitSlow {
            from { transform: rotate(0deg) scale(1.04); opacity: .46; }
            to { transform: rotate(360deg) scale(1.04); opacity: .46; }
          }
          @keyframes mmLifeScanner {
            0%, 100% { background-position: -120% 0, 0 0; opacity: .24; }
            50% { background-position: 160% 0, 14px 0; opacity: .54; }
          }
          @keyframes mmLifeImageTilt {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(-1deg) scale(1.018); }
            45% { transform: translate3d(1%, -1.8%, 0) rotate(1.4deg) scale(1.04); }
            70% { transform: translate3d(-.8%, .6%, 0) rotate(.35deg) scale(1.02); }
          }
          @keyframes mmLifePrism {
            0%, 100% { transform: translate3d(-4%, -3%, 0) rotate(-9deg) scale(1.02); opacity: .36; }
            50% { transform: translate3d(5%, 4%, 0) rotate(12deg) scale(1.10); opacity: .78; }
          }
          @keyframes mmLifeImageHover {
            0%, 100% { transform: translate3d(0, 1.4%, 0) scale(1.01); }
            55% { transform: translate3d(0, -2.8%, 0) scale(1.032); }
          }
          @keyframes mmLifeSignalGrid {
            0%, 100% { transform: translate3d(-2%, 0, 0); background-position: 0 0, 0 0; opacity: .26; }
            50% { transform: translate3d(2%, 0, 0); background-position: 160% 0, 22px 0; opacity: .58; }
          }
          @keyframes mmLifeImagePulse {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .98; }
            42% { transform: translate3d(0, -1%, 0) scale(1.045); opacity: 1; }
            64% { transform: translate3d(0, .6%, 0) scale(1.018); opacity: .99; }
          }
          @keyframes mmLifeCorePulse {
            0%, 100% { transform: scale(.98) rotate(0deg); opacity: .36; }
            50% { transform: scale(1.13) rotate(24deg); opacity: .78; }
          }
          @keyframes mmLifeImageLens {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1.012); }
            38% { transform: translate3d(-1.5%, -1.2%, 0) scale(1.04); }
            72% { transform: translate3d(1.2%, .8%, 0) scale(1.024); }
          }
          @keyframes mmLifeLensSweep {
            0%, 100% { transform: translate3d(-24%, -4%, 0) rotate(-12deg); opacity: .18; }
            50% { transform: translate3d(26%, 5%, 0) rotate(12deg); opacity: .58; }
          }
          @keyframes mmLifeImagePhase {
            0%, 100% { transform: translate3d(-.8%, 0, 0) scale(1.008); }
            34% { transform: translate3d(1.4%, -1.7%, 0) scale(1.032); }
            68% { transform: translate3d(-1.1%, 1%, 0) scale(1.018); }
          }
          @keyframes mmLifeNebula {
            0%, 100% { transform: rotate(-10deg) scale(1.02); opacity: .34; }
            45% { transform: rotate(16deg) scale(1.14); opacity: .72; }
          }
          @keyframes mmLifeImageStasis {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1.015); }
            25% { transform: translate3d(.8%, -.7%, 0) scale(1.025); }
            50% { transform: translate3d(-.6%, .8%, 0) scale(1.018); }
            75% { transform: translate3d(.4%, -.4%, 0) scale(1.03); }
          }
          @keyframes mmLifeStasisLines {
            0%, 100% { background-position: -80% 0, 0 0; opacity: .22; }
            50% { background-position: 120% 0, 18px 0; opacity: .62; }
          }
          @keyframes mmLifeImageComet {
            0%, 100% { transform: translate3d(0, .6%, 0) rotate(.3deg) scale(1.01); }
            48% { transform: translate3d(1.8%, -2%, 0) rotate(-.8deg) scale(1.04); }
          }
          @keyframes mmLifeCometArc {
            0%, 100% { transform: rotate(-20deg) scale(.98); opacity: .28; }
            50% { transform: rotate(38deg) scale(1.12); opacity: .82; }
          }
          @keyframes mmLifeImageQuantum {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1.012) rotate(0deg); }
            33% { transform: translate3d(-1.2%, -1%, 0) scale(1.036) rotate(-.6deg); }
            66% { transform: translate3d(1%, .9%, 0) scale(1.026) rotate(.7deg); }
          }
          @keyframes mmLifeQuantumField {
            0%, 100% { transform: rotate(0deg) scale(1); opacity: .42; }
            50% { transform: rotate(180deg) scale(1.11); opacity: .76; }
          }
          @keyframes mmLivingCreatureRise {
            0%, 100% { transform: translate3d(0, 1.2%, 0) scale(1.012); filter: drop-shadow(0 0 16px rgba(34,211,238,.30)); }
            44% { transform: translate3d(0, -3.6%, 0) scale(1.072); filter: drop-shadow(0 0 22px rgba(34,211,238,.44)) drop-shadow(0 0 18px rgba(250,204,21,.18)); }
            68% { transform: translate3d(.8%, -1.2%, 0) scale(1.032); }
          }
          @keyframes mmLivingPlasmaBloom {
            0%, 100% { transform: scale(.96); opacity: .48; }
            50% { transform: scale(1.18); opacity: .86; }
          }
          @keyframes mmLivingOrbitA {
            from { transform: translate(-50%, -50%) rotate(0deg) scaleX(1.18); }
            to { transform: translate(-50%, -50%) rotate(360deg) scaleX(1.18); }
          }
          @keyframes mmLivingOrbitB {
            from { transform: translate(-50%, -50%) rotate(0deg) scaleX(1.06); }
            to { transform: translate(-50%, -50%) rotate(-360deg) scaleX(1.06); }
          }
          @keyframes mmLivingScanSweep {
            0%, 16% { transform: translateX(-118%) skewX(-10deg); opacity: 0; }
            42% { opacity: .54; }
            70%, 100% { transform: translateX(118%) skewX(-10deg); opacity: 0; }
          }
          @keyframes mmLivingZeroGravity {
            0%, 100% { transform: translate3d(-1.1%, 1%, 0) rotate(-.8deg) scale(1.018); }
            38% { transform: translate3d(1.8%, -3.2%, 0) rotate(.9deg) scale(1.062); }
            72% { transform: translate3d(.6%, -.6%, 0) rotate(.2deg) scale(1.034); }
          }
          @keyframes mmLivingSparkDrift {
            0%, 100% { transform: translate3d(-3%, 2%, 0) scale(1); opacity: .34; }
            45% { transform: translate3d(4%, -4%, 0) scale(1.18); opacity: .82; }
          }
          @keyframes mmLivingHoloTilt {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(-1.1deg) scale(1.024); }
            35% { transform: translate3d(1.8%, -1.8%, 0) rotate(1.8deg) scale(1.064); }
            67% { transform: translate3d(-1.2%, .8%, 0) rotate(.4deg) scale(1.038); }
          }
          @keyframes mmLivingGridSweep {
            0%, 100% { background-position: -120% 0, 0 0, 0 0; opacity: .20; }
            50% { background-position: 160% 0, 0 0, 36px 0; opacity: .58; }
          }
          @keyframes mmLivingCoreSurge {
            0%, 100% { transform: translate(-50%, -50%) scale(.84); opacity: .30; }
            48% { transform: translate(-50%, -50%) scale(1.24); opacity: .80; }
          }
          @keyframes mmLivingRelicPulse {
            0%, 100% { transform: translate3d(0, .6%, 0) scale(1.018); }
            28% { transform: translate3d(-.9%, -1.6%, 0) scale(1.042); }
            58% { transform: translate3d(1.2%, -.4%, 0) scale(1.07); }
          }
          @keyframes mmLivingNebulaTide {
            0%, 100% { transform: translate3d(-3%, 2%, 0) scale(1.02); opacity: .46; }
            50% { transform: translate3d(4%, -3%, 0) scale(1.22); opacity: .86; }
          }
          @keyframes mmLivingPrismPhase {
            0%, 100% { transform: translate3d(-.6%, .4%, 0) rotate(.25deg) scale(1.018); filter: drop-shadow(0 0 15px rgba(34,211,238,.30)); }
            30% { transform: translate3d(1.2%, -1.8%, 0) rotate(-.75deg) scale(1.055); filter: drop-shadow(-4px 0 10px rgba(34,211,238,.28)) drop-shadow(4px 0 10px rgba(250,204,21,.18)); }
            63% { transform: translate3d(-1.4%, -.5%, 0) rotate(.85deg) scale(1.068); filter: drop-shadow(4px 0 10px rgba(168,85,247,.24)) drop-shadow(-3px 0 10px rgba(34,211,238,.24)); }
          }
          @keyframes mmLivingAuraFlash {
            0%, 100% { transform: scale(.94); opacity: .30; }
            45% { transform: scale(1.20); opacity: .82; }
          }
          @keyframes mmLivingPortalPull {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1.02); }
            46% { transform: translate3d(0, -2.2%, 0) scale(1.085); }
          }
          @keyframes mmLivingCorePortal {
            0%, 100% { transform: translate(-50%, -50%) scale(.72); opacity: .28; }
            46% { transform: translate(-50%, -50%) scale(1.32); opacity: .76; }
          }
          @keyframes mmLivingParticleOrbit {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: .36; }
            50% { transform: translate3d(2%, -3%, 0) rotate(8deg); opacity: .78; }
          }
          @keyframes mmLivingAuroraFloat {
            0%, 100% { transform: translate3d(0, 1%, 0) rotate(-.35deg) scale(1.018); }
            52% { transform: translate3d(-1.2%, -3%, 0) rotate(.55deg) scale(1.062); }
          }
          @keyframes mmLivingAuroraWave {
            0%, 100% { transform: translate3d(-5%, 0, 0) scale(1.02); opacity: .44; }
            50% { transform: translate3d(5%, -2%, 0) scale(1.18); opacity: .84; }
          }
          @keyframes mmLivingStasisLock {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1.022); }
            22% { transform: translate3d(.7%, -.6%, 0) scale(1.032); }
            24% { transform: translate3d(-.3%, .2%, 0) scale(1.045); }
            52% { transform: translate3d(-.8%, .8%, 0) scale(1.026); }
            78% { transform: translate3d(.5%, -.5%, 0) scale(1.052); }
          }
          @keyframes mmLivingStasisScan {
            0%, 20% { transform: translateX(-112%) skewX(-8deg); opacity: 0; }
            46% { opacity: .62; }
            76%, 100% { transform: translateX(112%) skewX(-8deg); opacity: 0; }
          }
          @keyframes mmLivingCometWake {
            0%, 100% { transform: translate3d(-.6%, .8%, 0) rotate(.4deg) scale(1.018); }
            47% { transform: translate3d(2.4%, -3.1%, 0) rotate(-1deg) scale(1.072); }
          }
          @keyframes mmLivingSparkBurst {
            0%, 100% { transform: translate3d(-4%, 4%, 0) scale(.96); opacity: .24; }
            40% { transform: translate3d(5%, -5%, 0) scale(1.28); opacity: .84; }
          }
          @keyframes mmLivingCometLight {
            0%, 100% { transform: translate3d(-8%, 5%, 0) scale(.92); opacity: .24; }
            45% { transform: translate3d(7%, -6%, 0) scale(1.18); opacity: .78; }
          }
          @keyframes mmLivingQuantumRift {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1.018); }
            32% { transform: translate3d(-1.8%, -1.6%, 0) scale(1.064); }
            64% { transform: translate3d(1.4%, .9%, 0) scale(1.045); }
          }
          @keyframes mmLivingQuantumField {
            0%, 100% { transform: translate3d(-2%, 2%, 0) scale(.96); opacity: .40; }
            50% { transform: translate3d(2%, -2%, 0) scale(1.24); opacity: .88; }
          }
          @keyframes mmLivingOrbitPulse {
            0%, 100% { opacity: .36; transform: translate(-50%, -50%) scaleX(1.05) rotate(0deg); }
            50% { opacity: .72; transform: translate(-50%, -50%) scaleX(1.22) rotate(180deg); }
          }
          @media (max-width: 760px) {
            .mmShell {
              width: min(94vw, 620px);
              height: min(780px, calc(100vh - 32px));
            }
          }
          @media (max-width: 640px) {
            .mmOverlay {
              --mm-mobile-top-offset: 115px;
              align-items: flex-start !important;
              overflow: hidden !important;
              padding:
                max(var(--mm-mobile-top-offset), calc(env(safe-area-inset-top) + var(--mm-mobile-top-offset)))
                8px
                max(14px, env(safe-area-inset-bottom))
                !important;
            }
            .mmShell {
              width: calc(100vw - 16px);
              height: min(720px, calc(100vh - var(--mm-mobile-top-offset, 56px) - 20px));
              height: min(720px, calc(100dvh - var(--mm-mobile-top-offset, 56px) - 20px));
              min-height: min(720px, calc(100dvh - var(--mm-mobile-top-offset, 56px) - 20px));
              max-height: min(720px, calc(100dvh - var(--mm-mobile-top-offset, 56px) - 20px));
              border-radius: 22px;
            }
            .mmHeader {
              padding: 10px 10px 0;
            }
            .mmBody {
              padding: 10px;
            }
            .mmInfoLayer {
              padding: 8px;
            }
            .mmInfoPopover {
              width: calc(100% - 4px);
              max-height: calc(100% - 4px);
              border-radius: 22px;
            }
            .mmInfoHeader {
              grid-template-columns: 72px minmax(0, 1fr) 38px;
              gap: 9px;
              padding: 11px;
            }
            .mmInfoPreview {
              width: 70px;
              height: 70px;
              border-radius: 17px;
            }
            .mmInfo-item .mmInfoHeader {
              grid-template-columns: minmax(0, 1fr);
              gap: 10px;
              padding: 14px 48px 12px;
            }
            .mmInfo-item .mmInfoPreview {
              width: clamp(190px, 56vw, 264px);
              height: clamp(190px, 56vw, 264px);
              border-radius: 28px;
            }
            .mmInfoCloseFloating {
              top: 10px;
              right: 10px;
            }
            .mmInfoItemBadges {
              padding: 0 34px;
              gap: 6px;
            }
            .mmInfoItemBadges em,
            .mmInfoItemBadges b {
              font-size: 9px;
            }
            .mmInfoItemBadges {
              padding-top: 5px;
              padding-bottom: 5px;
            }
            .mmInfoItemBadges span {
              font-size: 13px;
            }
            .mmInfoItemTitleRail {
              gap: 8px;
            }
            .mmInfoItemTitleRail strong {
              font-size: clamp(16px, 4.8vw, 23px);
            }
            .mmInfoBody {
              padding: 11px;
            }
            .mmTopbar {
              grid-template-columns: 42px minmax(0, 1fr) 42px;
            }
            .mmRound {
              width: 42px;
              height: 42px;
            }
            .mmTitleWrap,
            .mmTitleSvg {
              height: 62px;
            }
            .mmTitleText {
              font-size: 32px;
            }
            .mmItemGrid {
              gap: 10px;
            }
            .mmItemCard {
              min-height: 282px;
              grid-template-rows: 132px minmax(66px, auto) 42px;
              padding: 10px;
            }
            .mmCollectionCard {
              grid-template-columns: 92px minmax(0, 1fr);
              min-height: 116px;
            }
            .mmCollectionPreview {
              width: 88px;
              height: 88px;
            }
            .mmOwnedCard {
              grid-template-columns: 92px minmax(0, 1fr);
            }
            .mmOwnedImageStage {
              width: 92px;
              height: 92px;
            }
            .mmContextText {
              font-size: 12px;
            }
          }
          @media (max-width: 380px) {
            .mmItemGrid {
              grid-template-columns: 1fr;
            }
            .mmBalancePill {
              font-size: 11px;
              padding-inline: 9px;
            }
          }
          .mmOverlay {
            padding: calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom));
            background:
              radial-gradient(circle at 50% 10%, rgba(34,211,238,.18), transparent 34%),
              radial-gradient(circle at 62% 18%, rgba(250,204,21,.13), transparent 23%),
              radial-gradient(circle at 28% 80%, rgba(168,85,247,.16), transparent 34%),
              linear-gradient(180deg, rgba(1,5,14,.88), rgba(2,6,18,.92));
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
          }
          .mmShell {
            width: calc(100vw - 32px);
            max-width: 620px;
            height: min(760px, calc(100dvh - 48px));
            max-height: 90vh;
            border-radius: 26px;
            background:
              radial-gradient(circle at 20% 0%, rgba(34,211,238,.20), transparent 32%),
              radial-gradient(circle at 92% 6%, rgba(250,204,21,.16), transparent 30%),
              linear-gradient(155deg, rgba(7, 13, 29, .98), rgba(2, 6, 17, .985) 62%, rgba(8, 12, 24, .98));
            border: 1px solid rgba(125,211,252,.28);
            box-shadow:
              0 34px 92px rgba(0,0,0,.72),
              0 0 0 1px rgba(255,255,255,.05) inset,
              0 0 42px rgba(34,211,238,.13),
              0 0 70px rgba(250,204,21,.08);
          }
          .mmShell::before {
            content: '';
            position: absolute;
            inset: 1px;
            border-radius: inherit;
            pointer-events: none;
            background:
              linear-gradient(90deg, rgba(103,232,249,.20), transparent 22%, transparent 78%, rgba(250,204,21,.16)),
              linear-gradient(180deg, rgba(255,255,255,.075), transparent 24%);
            mix-blend-mode: screen;
            opacity: .78;
            z-index: 0;
          }
          .mmHeader {
            padding: 12px 14px 0;
            gap: 8px;
          }
          .mmTopbar {
            grid-template-columns: 42px minmax(0, 1fr) 42px 42px;
            gap: 8px;
          }
          .mmRound {
            width: 42px;
            height: 42px;
            border-color: rgba(125,211,252,.34);
            background:
              radial-gradient(circle at 30% 20%, rgba(125,211,252,.26), transparent 46%),
              rgba(7,14,29,.78);
          }
          .mmHistory.isLive,
          .mmRound:hover:not(:disabled) {
            border-color: rgba(250,204,21,.58);
            box-shadow: 0 0 20px rgba(34,211,238,.20), 0 0 18px rgba(250,204,21,.11), inset 0 0 0 1px rgba(255,255,255,.06);
          }
          .mmBalancePill {
            justify-self: center;
            width: min(100%, 270px);
            min-height: 42px;
            display: grid;
            grid-template-columns: minmax(0, auto) minmax(0, 1fr);
            align-items: center;
            gap: 8px;
            padding: 5px 11px;
            border: 1px solid rgba(250,204,21,.38);
            background:
              radial-gradient(circle at 14% 10%, rgba(250,204,21,.24), transparent 42%),
              linear-gradient(120deg, rgba(7,14,29,.88), rgba(20,26,45,.82));
            box-shadow:
              0 0 22px rgba(250,204,21,.13),
              0 0 18px rgba(34,211,238,.10),
              inset 0 0 0 1px rgba(255,255,255,.055);
          }
          .mmBalanceLabel {
            min-width: 0;
            color: rgba(148, 232, 255, .82);
            font-size: 9px;
            font-weight: 900;
            line-height: 1;
            text-transform: uppercase;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmBalanceValue {
            min-width: 0;
            color: rgba(255,244,191,.98);
            font-size: clamp(11px, 2.3vw, 13px);
            font-weight: 1000;
            line-height: 1;
            font-variant-numeric: tabular-nums;
            text-align: right;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmTitleWrap {
            height: 86px;
            margin-top: -2px;
          }
          .mmTitleSvg {
            width: min(96%, 458px);
            height: 86px;
            filter: drop-shadow(0 0 16px rgba(34,211,238,.24));
          }
          .mmTitleText {
            font-size: 40px;
            letter-spacing: .01em;
          }
          .mmTitleTextBack {
            fill: rgba(8,15,33,.55);
            stroke: rgba(34,211,238,.42);
            stroke-width: 3.8;
          }
          .mmTitleTextMain {
            stroke-width: .55;
            filter: drop-shadow(0 0 7px rgba(250,204,21,.22));
          }
          .mmTitleOrbit {
            stroke-dasharray: 8 12;
            opacity: .38;
            animation: mmOrbitPulse 7.8s ease-in-out infinite;
          }
          .mmTitleOrbitB {
            animation-delay: -2.4s;
          }
          .mmTitleCircuit {
            stroke-dasharray: 80 180;
            animation: mmCircuitRun 6.4s ease-in-out infinite;
            opacity: .7;
          }
          .mmTabs {
            gap: 7px;
            padding: 3px;
            border-radius: 999px;
            background: rgba(2,8,20,.54);
            border: 1px solid rgba(125,211,252,.14);
          }
          .mmTab {
            position: relative;
            min-height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 0 12px;
            border-radius: 999px;
            font-size: 12px;
            overflow: hidden;
          }
          .mmTabGiftBadge,
          .mmPreviewBadge,
          .mmSupplyBadge,
          .mmCountBadge,
          .mmCodeBadge,
          .mmRarityBadge,
          .mmOwnerCountBadge,
          .mmOwnedMiniBadge,
          .mmNewGiftBadge,
          .mmHistoryQuantityBadge,
          .mmHistoryActionBadge {
            min-width: 0;
            min-height: 20px;
            padding: 4px 7px;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.28);
            background:
              radial-gradient(circle at 20% 0%, rgba(125,211,252,.18), transparent 48%),
              rgba(4,10,23,.82);
            color: rgba(236,254,255,.94);
            font-size: clamp(9px, 2.2vw, 11px);
            font-weight: 1000;
            line-height: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.035);
          }
          .mmTabGiftBadge,
          .mmNewGiftBadge {
            border-color: rgba(250,204,21,.50);
            color: rgba(255,244,191,.98);
            background: linear-gradient(120deg, rgba(250,204,21,.22), rgba(168,85,247,.18), rgba(34,211,238,.16));
          }
          .mmContextStrip {
            min-height: 42px;
            border-radius: 18px;
            border: 1px solid rgba(125,211,252,.18);
            background:
              linear-gradient(90deg, rgba(34,211,238,.11), rgba(168,85,247,.06), rgba(250,204,21,.09)),
              rgba(3,10,23,.64);
          }
          .mmBody {
            padding: 11px 14px 14px;
            scrollbar-width: thin;
            scrollbar-color: rgba(125,211,252,.45) transparent;
          }
          .mmCollectionList,
          .mmOwnedList,
          .mmHistoryPane,
          .mmOwnersPane {
            display: grid;
            gap: 12px;
          }
          .mmItemGrid,
          .mmOwnedList {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .mmCollectionCard {
            min-height: 156px;
            grid-template-columns: 136px minmax(0, 1fr);
            border-radius: 22px;
            padding: 13px;
            background:
              radial-gradient(circle at 18% 18%, rgba(34,211,238,.24), transparent 40%),
              linear-gradient(140deg, rgba(10,19,39,.90), rgba(3,9,23,.95));
          }
          .mmCollectionPreview,
          .mmItemImageStage,
          .mmOwnedImageStage,
          .mmHistoryPreview,
          .mmTransactionAssetImage {
            position: relative;
            border-radius: 20px;
            background:
              radial-gradient(circle at 50% 42%, rgba(34,211,238,.30), transparent 56%),
              radial-gradient(circle at 50% 80%, rgba(250,204,21,.12), transparent 46%),
              rgba(2,8,20,.80);
            border: 1px solid rgba(125,211,252,.18);
            box-shadow: inset 0 0 24px rgba(34,211,238,.06);
          }
          .mmCollectionPreview {
            width: 126px;
            height: 126px;
          }
          .mmPreviewBadge {
            position: absolute;
            left: 8px;
            right: 8px;
            bottom: 8px;
            justify-content: center;
            text-align: center;
            border-color: rgba(250,204,21,.36);
          }
          .mmCollectionMain,
          .mmItemInfo,
          .mmOwnedMain {
            justify-items: center;
            text-align: center;
          }
          .mmCollectionTitle {
            font-size: 18px;
            text-align: center;
          }
          .mmCollectionMeta {
            justify-content: center;
          }
          .mmItemCard,
          .mmOwnedCard {
            min-width: 0;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(54px, auto) auto;
            gap: 9px;
            padding: 11px;
            border-radius: 22px;
            background:
              radial-gradient(circle at 50% 0%, var(--mm-rarity, rgba(34,211,238,.20)), transparent 42%),
              linear-gradient(160deg, rgba(8,17,35,.94), rgba(2,8,21,.98));
          }
          .mmItemCard {
            min-height: 292px;
          }
          .mmOwnedCard {
            min-height: 286px;
            grid-template-rows: auto minmax(34px, auto) 40px;
            gap: 5px;
          }
          .mmItemImageStage,
          .mmOwnedImageStage {
            width: 100%;
            height: 152px;
            grid-row: auto;
            align-self: start;
          }
          .mmItemImageStage img,
          .mmOwnedImageStage img,
          .mmCollectionPreview img,
          .mmHistoryPreview img,
          .mmTransactionAssetImage img {
            width: 78%;
            height: 78%;
            object-fit: contain;
            filter: drop-shadow(0 0 14px rgba(34,211,238,.20));
          }
          .mmSupplyBadge {
            top: 9px;
            left: 9px;
            max-width: calc(100% - 18px);
            border-color: rgba(250,204,21,.38);
          }
          .mmOwnedMiniBadge,
          .mmOwnedCountBadge {
            top: 9px;
            right: 9px;
            max-width: calc(100% - 18px);
          }
          .mmItemInfo h3,
          .mmOwnedMain h3 {
            font-size: clamp(12px, 2.55vw, 14px);
            line-height: 1.16;
            text-align: center;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .mmRarityBadge {
            max-width: 100%;
            justify-self: center;
            color: rgba(255,244,191,.95);
            border-color: rgba(250,204,21,.30);
          }
          .mmButton {
            min-height: 38px;
            max-width: 100%;
            padding: 0 12px;
            font-size: clamp(11px, 2.4vw, 12px);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmOwnedCard .mmButton {
            justify-self: stretch;
            min-width: 0;
          }
          .mmOwnedCard.isNewGift {
            border-color: rgba(250,204,21,.58);
            box-shadow: 0 0 30px rgba(250,204,21,.16), 0 0 22px rgba(34,211,238,.13), inset 0 0 0 1px rgba(255,255,255,.07);
            animation: mmNewGiftGlow 1.8s ease-in-out infinite;
          }
          .mmNewGiftBadge {
            position: absolute;
            left: 9px;
            top: 9px;
            z-index: 3;
          }
          .mmOwnersHero,
          .mmHistoryRow {
            border-radius: 20px;
            border: 1px solid rgba(125,211,252,.20);
            background:
              linear-gradient(120deg, rgba(34,211,238,.12), rgba(168,85,247,.08), rgba(250,204,21,.08)),
              rgba(4,10,23,.72);
          }
          .mmHistoryRow {
            min-width: 0;
            display: grid;
            grid-template-columns: 86px minmax(0, 1fr);
            gap: 11px;
            padding: 10px;
          }
          .mmHistoryPreview {
            width: 78px;
            height: 78px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .mmHistoryActionBadge {
            position: absolute;
            left: 6px;
            right: 6px;
            bottom: 5px;
            text-align: center;
          }
          .mmHistoryQuantityBadge {
            position: absolute;
            top: -8px;
            right: -8px;
            z-index: 2;
            min-width: 28px;
            text-align: center;
            border-color: rgba(250,204,21,.50);
            color: rgba(255,244,191,.98);
            box-shadow: 0 0 14px rgba(250,204,21,.16), inset 0 0 0 1px rgba(255,255,255,.04);
          }
          .mmHistoryMain {
            min-width: 0;
            display: grid;
            align-content: center;
            gap: 5px;
          }
          .mmHistoryMain strong {
            color: rgba(248,250,252,.98);
            font-size: 13px;
            line-height: 1.15;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmHistoryMeta {
            min-width: 0;
            display: flex;
            gap: 7px;
            flex-wrap: wrap;
            color: rgba(203,213,225,.78);
            font-size: 10px;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
          }
          .mmHistoryUser,
          .mmHistoryMarket {
            grid-column: 1 / -1;
            min-width: 0;
            min-height: 38px;
            display: grid;
            grid-template-columns: 32px minmax(0, 1fr);
            align-items: center;
            gap: 8px;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.18);
            background: rgba(2,8,20,.54);
            color: inherit;
            padding: 5px 8px;
          }
          .mmHistoryMarket {
            display: inline-flex;
            justify-content: center;
            color: rgba(255,244,191,.88);
            font-weight: 1000;
          }
          .mmHistoryUser .mmOwnerAvatar {
            width: 32px;
            height: 32px;
          }
          .mmHistoryUserName {
            min-width: 0;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .mmHistoryUserName .nick-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmInfoLayer {
            position: absolute;
            inset: 0;
            z-index: 8;
            display: grid;
            place-items: center;
            padding: clamp(10px, 3vw, 18px);
            background:
              radial-gradient(circle at 50% 32%, rgba(34,211,238,.18), transparent 34%),
              radial-gradient(circle at 72% 22%, rgba(250,204,21,.11), transparent 28%),
              rgba(1,5,14,.68);
            -webkit-backdrop-filter: blur(7px);
            backdrop-filter: blur(7px);
          }
          .mmInfoPopover {
            position: relative;
            width: min(470px, calc(100% - 12px));
            max-height: min(590px, calc(100% - 12px));
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            overflow: hidden;
            border-radius: 26px;
            border: 1px solid rgba(125,211,252,.28);
            background:
              radial-gradient(circle at 16% 0%, rgba(34,211,238,.18), transparent 38%),
              radial-gradient(circle at 96% 8%, rgba(250,204,21,.15), transparent 34%),
              linear-gradient(155deg, rgba(7,16,35,.98), rgba(2,7,18,.99));
            box-shadow:
              0 28px 74px rgba(0,0,0,.58),
              0 0 34px rgba(34,211,238,.12),
              inset 0 0 0 1px rgba(255,255,255,.045);
          }
          .mmInfoGlow {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              linear-gradient(90deg, rgba(103,232,249,.20), transparent 22%, transparent 76%, rgba(250,204,21,.18)),
              repeating-linear-gradient(90deg, rgba(125,211,252,.055) 0 1px, transparent 1px 38px);
            opacity: .55;
          }
          .mmInfoHeader {
            position: relative;
            z-index: 1;
            min-width: 0;
            display: grid;
            grid-template-columns: 88px minmax(0, 1fr) 40px;
            gap: 12px;
            align-items: center;
            padding: 14px;
            border-bottom: 1px solid rgba(125,211,252,.16);
          }
          .mmInfoPreview {
            width: 86px;
            height: 86px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 20px;
            border: 1px solid rgba(125,211,252,.22);
            background:
              radial-gradient(circle at 50% 40%, rgba(34,211,238,.26), transparent 56%),
              rgba(2,8,20,.72);
            overflow: hidden;
          }
          .mmInfoPreview img {
            width: 78%;
            height: 78%;
            object-fit: contain;
            filter: drop-shadow(0 0 14px rgba(34,211,238,.18));
          }
          .mmInfo-item {
            width: min(620px, calc(100% - 12px));
            max-height: min(760px, calc(100% - 12px));
          }
          .mmInfo-item .mmInfoHeader {
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
            justify-items: center;
            align-items: center;
            padding: 18px 58px 16px;
          }
          .mmInfo-item .mmInfoPreview {
            width: clamp(224px, 38vw, 312px);
            height: clamp(224px, 38vw, 312px);
            border-radius: 34px;
            background:
              radial-gradient(circle at 50% 48%, rgba(34,211,238,.42), transparent 58%),
              radial-gradient(circle at 52% 52%, rgba(250,204,21,.16), transparent 68%),
              linear-gradient(145deg, rgba(2,8,20,.90), rgba(6,16,36,.78));
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.045),
              0 0 42px rgba(34,211,238,.18),
              0 0 56px rgba(250,204,21,.08);
          }
          .mmInfo-item .mmInfoPreview img {
            width: 92%;
            height: 92%;
            filter:
              drop-shadow(0 0 18px rgba(34,211,238,.26))
              drop-shadow(0 0 22px rgba(250,204,21,.10));
          }
          .mmInfoLivingPreview {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            transform: translateZ(0);
            background:
              radial-gradient(circle at 50% 48%, rgba(187,247,255,.22), transparent 28%),
              radial-gradient(circle at 50% 52%, rgba(34,211,238,.28), transparent 54%),
              radial-gradient(circle at 20% 16%, rgba(168,85,247,.18), transparent 42%),
              radial-gradient(circle at 80% 80%, rgba(250,204,21,.14), transparent 44%),
              linear-gradient(145deg, rgba(2,8,20,.96), rgba(5,16,38,.84));
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.07),
              inset 0 0 42px rgba(34,211,238,.11),
              0 0 48px rgba(34,211,238,.18),
              0 0 78px rgba(168,85,247,.10);
          }
          .mmInfoLivingPreview::before,
          .mmInfoLivingPreview::after {
            content: '';
            position: absolute;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            border-radius: inherit;
            mix-blend-mode: screen;
            will-change: transform, opacity, background-position;
          }
          .mmInfoLivingPreview::before {
            inset: -18%;
            opacity: .62;
            background:
              radial-gradient(circle at 50% 48%, rgba(255,255,255,.16), transparent 8%),
              radial-gradient(circle at 36% 34%, rgba(34,211,238,.24), transparent 24%),
              radial-gradient(circle at 68% 66%, rgba(250,204,21,.18), transparent 28%),
              radial-gradient(circle at 50% 50%, transparent 44%, rgba(34,211,238,.14) 45%, transparent 58%);
          }
          .mmInfoLivingPreview::after {
            inset: 10px;
            border: 1px solid rgba(125,211,252,.12);
            background:
              linear-gradient(115deg, transparent 0 40%, rgba(255,255,255,.18) 47%, transparent 56% 100%),
              linear-gradient(0deg, transparent 0 47%, rgba(125,211,252,.10) 48% 50%, transparent 51% 100%),
              repeating-linear-gradient(90deg, transparent 0 19px, rgba(125,211,252,.07) 20px, transparent 21px 42px);
            opacity: .34;
          }
          .mmLivingBackdrop,
          .mmLivingOrbit,
          .mmLivingParticles,
          .mmLivingScan,
          .mmLivingCore {
            position: absolute;
            pointer-events: none;
            z-index: 1;
          }
          .mmLivingBackdrop {
            inset: -6%;
            border-radius: inherit;
            background:
              radial-gradient(circle at 48% 50%, rgba(34,211,238,.30), transparent 26%),
              radial-gradient(circle at 42% 58%, rgba(168,85,247,.22), transparent 34%),
              radial-gradient(circle at 58% 43%, rgba(250,204,21,.16), transparent 32%);
            opacity: .78;
            mix-blend-mode: screen;
            will-change: transform, opacity;
          }
          .mmLivingOrbit {
            left: 50%;
            top: 50%;
            width: 74%;
            height: 74%;
            border-radius: 999px;
            border: 1px solid transparent;
            border-top-color: rgba(125,211,252,.42);
            border-right-color: rgba(250,204,21,.24);
            border-bottom-color: rgba(168,85,247,.22);
            transform: translate(-50%, -50%);
            opacity: .62;
            mix-blend-mode: screen;
            will-change: transform, opacity;
          }
          .mmLivingOrbitB {
            width: 91%;
            height: 56%;
            border-top-color: rgba(250,204,21,.20);
            border-right-color: rgba(125,211,252,.32);
            border-bottom-color: rgba(125,211,252,.10);
            opacity: .42;
          }
          .mmLivingParticles {
            inset: 10%;
            border-radius: inherit;
            background:
              radial-gradient(circle at 18% 24%, rgba(255,255,255,.82) 0 1px, transparent 2px),
              radial-gradient(circle at 78% 28%, rgba(34,211,238,.82) 0 1.3px, transparent 2.5px),
              radial-gradient(circle at 68% 78%, rgba(250,204,21,.72) 0 1.2px, transparent 2.3px),
              radial-gradient(circle at 30% 72%, rgba(168,85,247,.76) 0 1.1px, transparent 2.2px),
              radial-gradient(circle at 54% 18%, rgba(255,255,255,.72) 0 1px, transparent 2px);
            opacity: .48;
            mix-blend-mode: screen;
            will-change: transform, opacity;
          }
          .mmLivingScan {
            inset: 5%;
            z-index: 4;
            border-radius: inherit;
            background:
              linear-gradient(100deg, transparent 0 34%, rgba(190,242,255,.22) 44%, rgba(250,204,21,.14) 50%, transparent 62% 100%);
            opacity: .30;
            mix-blend-mode: screen;
            transform: translateX(-110%) skewX(-10deg);
            will-change: transform, opacity;
          }
          .mmLivingCore {
            left: 50%;
            top: 50%;
            width: 58%;
            height: 58%;
            border-radius: 50%;
            background:
              radial-gradient(circle, rgba(255,255,255,.20), rgba(34,211,238,.18) 24%, rgba(168,85,247,.08) 48%, transparent 72%);
            opacity: .55;
            transform: translate(-50%, -50%);
            mix-blend-mode: screen;
            will-change: transform, opacity;
          }
          .mmInfoLivingPreview img {
            position: relative;
            z-index: 3;
            will-change: transform, filter, opacity;
            transform-origin: center;
          }
          .mmInfoLiving-0 img { animation: mmLivingCreatureRise 6.2s ease-in-out infinite; }
          .mmInfoLiving-0 .mmLivingBackdrop { animation: mmLivingPlasmaBloom 6.2s ease-in-out infinite; }
          .mmInfoLiving-0 .mmLivingOrbitA { animation: mmLivingOrbitA 11s linear infinite; }
          .mmInfoLiving-0 .mmLivingScan { animation: mmLivingScanSweep 4.8s ease-in-out infinite; }
          .mmInfoLiving-1 img { animation: mmLivingZeroGravity 7.6s ease-in-out infinite; }
          .mmInfoLiving-1 .mmLivingOrbitB { animation: mmLivingOrbitB 9.4s linear infinite; }
          .mmInfoLiving-1 .mmLivingParticles { animation: mmLivingSparkDrift 5.6s ease-in-out infinite; }
          .mmInfoLiving-2 img { animation: mmLivingHoloTilt 6.8s ease-in-out infinite; }
          .mmInfoLiving-2::after { animation: mmLivingGridSweep 4.7s ease-in-out infinite; }
          .mmInfoLiving-2 .mmLivingCore { animation: mmLivingCoreSurge 6.8s ease-in-out infinite; }
          .mmInfoLiving-3 img { animation: mmLivingRelicPulse 8.2s ease-in-out infinite; }
          .mmInfoLiving-3 .mmLivingBackdrop { animation: mmLivingNebulaTide 8.2s ease-in-out infinite; }
          .mmInfoLiving-3 .mmLivingScan { animation: mmLivingScanSweep 5.2s ease-in-out infinite reverse; }
          .mmInfoLiving-4 img { animation: mmLivingPrismPhase 6.4s ease-in-out infinite; }
          .mmInfoLiving-4::before { animation: mmLivingAuraFlash 6.4s ease-in-out infinite; }
          .mmInfoLiving-4 .mmLivingOrbitA { animation: mmLivingOrbitA 7.8s linear infinite reverse; }
          .mmInfoLiving-5 img { animation: mmLivingPortalPull 7.1s ease-in-out infinite; }
          .mmInfoLiving-5 .mmLivingCore { animation: mmLivingCorePortal 7.1s ease-in-out infinite; }
          .mmInfoLiving-5 .mmLivingParticles { animation: mmLivingParticleOrbit 7.1s ease-in-out infinite; }
          .mmInfoLiving-6 img { animation: mmLivingAuroraFloat 8.6s ease-in-out infinite; }
          .mmInfoLiving-6 .mmLivingBackdrop { animation: mmLivingAuroraWave 8.6s ease-in-out infinite; }
          .mmInfoLiving-6::after { animation: mmLivingGridSweep 5.8s ease-in-out infinite reverse; }
          .mmInfoLiving-7 img { animation: mmLivingStasisLock 5.9s ease-in-out infinite; }
          .mmInfoLiving-7 .mmLivingScan { animation: mmLivingStasisScan 3.6s ease-in-out infinite; }
          .mmInfoLiving-7 .mmLivingOrbitB { animation: mmLivingOrbitB 8.4s linear infinite; }
          .mmInfoLiving-8 img { animation: mmLivingCometWake 6.9s ease-in-out infinite; }
          .mmInfoLiving-8 .mmLivingParticles { animation: mmLivingSparkBurst 4.8s ease-in-out infinite; }
          .mmInfoLiving-8::before { animation: mmLivingCometLight 6.9s ease-in-out infinite; }
          .mmInfoLiving-9 img { animation: mmLivingQuantumRift 7.4s ease-in-out infinite; }
          .mmInfoLiving-9 .mmLivingBackdrop { animation: mmLivingQuantumField 7.4s ease-in-out infinite; }
          .mmInfoLiving-9 .mmLivingOrbitA,
          .mmInfoLiving-9 .mmLivingOrbitB { animation: mmLivingOrbitPulse 7.4s ease-in-out infinite; }
          .mmInfoCloseFloating {
            position: absolute;
            top: 14px;
            right: 14px;
            z-index: 4;
          }
          .mmInfoItemBadges {
            min-width: 0;
            max-width: 100%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 0 42px;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.34);
            padding: 6px 12px;
            color: rgba(190,242,255,.94);
            background:
              linear-gradient(120deg, rgba(34,211,238,.20), rgba(6,16,36,.76)),
              rgba(2,8,20,.70);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.04), 0 0 14px rgba(34,211,238,.12);
            overflow: hidden;
          }
          .mmInfoItemBadges em,
          .mmInfoItemBadges b,
          .mmInfoItemBadges span {
            min-width: 0;
            max-width: 100%;
            font-style: normal;
            font-size: 10px;
            font-weight: 1000;
            line-height: 1;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .mmInfoItemBadges em,
          .mmInfoItemBadges b {
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .mmInfoItemBadges span {
            flex: 0 0 auto;
            color: rgba(250,204,21,.94);
            font-size: 15px;
            line-height: .75;
            text-shadow: 0 0 12px rgba(250,204,21,.28);
          }
          .mmInfoItemTitleRail {
            min-width: 0;
            width: min(100%, 460px);
            display: grid;
            grid-template-columns: minmax(24px, 1fr) minmax(0, auto) minmax(24px, 1fr);
            align-items: center;
            gap: 10px;
            text-align: center;
          }
          .mmInfoItemTitleRail strong {
            min-width: 0;
            color: rgba(248,250,252,.98);
            font-size: clamp(18px, 3.4vw, 28px);
            font-weight: 1000;
            line-height: 1.02;
            overflow-wrap: anywhere;
            text-shadow:
              0 0 20px rgba(34,211,238,.22),
              0 0 18px rgba(250,204,21,.10);
          }
          .mmInfoTitleRailLine {
            display: block;
            height: 1px;
            background:
              linear-gradient(90deg, transparent, rgba(125,211,252,.54), rgba(250,204,21,.32), transparent);
            box-shadow: 0 0 12px rgba(34,211,238,.14);
          }
          .mmInfoHeading {
            min-width: 0;
            display: grid;
            gap: 6px;
          }
          .mmInfoHeading em {
            justify-self: start;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.30);
            padding: 4px 9px;
            color: rgba(190,242,255,.92);
            background: rgba(2,8,20,.62);
            font-style: normal;
            font-size: 10px;
            font-weight: 1000;
            text-transform: uppercase;
          }
          .mmInfoHeading strong {
            min-width: 0;
            color: rgba(248,250,252,.98);
            font-size: clamp(16px, 3.8vw, 22px);
            font-weight: 1000;
            line-height: 1.05;
            overflow-wrap: anywhere;
            text-shadow: 0 0 18px rgba(34,211,238,.16);
          }
          .mmInfoHeading span {
            color: rgba(203,213,225,.76);
            font-size: 12px;
            font-weight: 900;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmInfoClose {
            width: 40px;
            height: 40px;
            justify-self: end;
          }
          .mmInfoBody {
            position: relative;
            z-index: 1;
            min-height: 0;
            overflow: auto;
            display: grid;
            gap: 12px;
            padding: 14px;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: rgba(125,211,252,.46) transparent;
          }
          .mmInfoRail {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(125,211,252,.52), rgba(250,204,21,.30), transparent);
            box-shadow: 0 0 12px rgba(34,211,238,.14);
          }
          .mmInfoSection,
          .mmInfoStats {
            min-width: 0;
            border-radius: 18px;
            border: 1px solid rgba(125,211,252,.17);
            background:
              linear-gradient(120deg, rgba(34,211,238,.08), rgba(168,85,247,.055), rgba(250,204,21,.06)),
              rgba(2,8,20,.50);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.035);
          }
          .mmInfoSection {
            display: grid;
            gap: 8px;
            padding: 11px;
          }
          .mmInfoSectionTitle {
            color: rgba(148,232,255,.88);
            font-size: 10px;
            font-weight: 1000;
            line-height: 1;
            text-transform: uppercase;
            letter-spacing: .02em;
          }
          .mmInfoSection p {
            margin: 0;
            color: rgba(226,246,255,.90);
            font-size: 12px;
            font-weight: 800;
            line-height: 1.45;
            overflow-wrap: anywhere;
          }
          .mmInfoDetailsSection {
            overflow: hidden;
          }
          .mmInfoDetailsRail {
            display: block;
            height: 1px;
            background:
              linear-gradient(90deg, transparent, rgba(125,211,252,.58), rgba(250,204,21,.34), transparent);
            box-shadow: 0 0 12px rgba(34,211,238,.16);
          }
          .mmInfoDetailsScroll {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: clamp(130px, 30vh, 250px);
            padding-right: 3px;
            overflow: auto;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: rgba(125,211,252,.46) transparent;
          }
          .mmInfoDetailsScroll p {
            position: relative;
            padding: 0 0 10px;
            color: rgba(230,248,255,.92);
            font-size: clamp(11px, 1.85vw, 12.5px);
            line-height: 1.58;
            letter-spacing: 0;
            text-wrap: pretty;
            overflow-wrap: anywhere;
          }
          .mmInfoDetailsScroll p:not(:last-child)::after {
            content: '';
            position: absolute;
            left: 0;
            right: 8px;
            bottom: 0;
            height: 1px;
            background:
              linear-gradient(90deg, rgba(34,211,238,.06), rgba(125,211,252,.38), rgba(250,204,21,.24), transparent);
            box-shadow: 0 0 10px rgba(34,211,238,.12);
          }
          .mmInfoStats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0;
            overflow: hidden;
          }
          .mmInfoStats span {
            position: relative;
            min-width: 0;
            display: grid;
            align-content: center;
            justify-items: center;
            gap: 5px;
            padding: 10px clamp(6px, 1.7vw, 11px);
            background: rgba(1,5,14,.28);
          }
          .mmInfoStats span + span::before {
            content: "";
            position: absolute;
            left: 0;
            top: 10px;
            bottom: 10px;
            width: 1px;
            background:
              linear-gradient(180deg, transparent, rgba(125,211,252,.56), rgba(250,204,21,.28), transparent);
            box-shadow: 0 0 10px rgba(34,211,238,.16);
          }
          .mmInfoStats b {
            min-width: 0;
            max-width: 100%;
            color: rgba(148,232,255,.78);
            font-size: clamp(7px, 1.65vw, 9px);
            font-weight: 1000;
            line-height: 1;
            text-align: center;
            text-transform: uppercase;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmInfoStats strong {
            min-width: 0;
            max-width: 100%;
            color: rgba(255,244,191,.96);
            font-size: clamp(9px, 2.15vw, 12px);
            font-weight: 1000;
            line-height: 1.1;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmTransactionLayer {
            background:
              radial-gradient(circle at 50% 30%, rgba(34,211,238,.16), transparent 36%),
              rgba(1,5,14,.72);
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
          }
          .mmTransactionModal {
            width: min(430px, calc(100% - 18px));
            border-radius: 26px;
            padding: 18px;
            gap: 13px;
            background:
              radial-gradient(circle at 50% 0%, rgba(250,204,21,.18), transparent 38%),
              radial-gradient(circle at 12% 18%, rgba(34,211,238,.16), transparent 38%),
              linear-gradient(155deg, rgba(8,17,35,.99), rgba(2,7,18,.99));
          }
          .mmTransactionAsset {
            width: 100%;
            display: grid;
            grid-template-columns: 92px minmax(0, 1fr);
            gap: 12px;
            align-items: center;
            padding: 10px;
            border-radius: 20px;
            border: 1px solid rgba(125,211,252,.18);
            background: rgba(2,8,20,.44);
          }
          .mmTransactionAssetImage {
            width: 84px;
            height: 84px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .mmTransactionAssetInfo {
            min-width: 0;
            display: grid;
            gap: 5px;
            text-align: left;
          }
          .mmTransactionAssetInfo strong {
            color: rgba(248,250,252,.98);
            font-size: 14px;
            line-height: 1.16;
          }
          .mmTransactionAssetInfo em {
            justify-self: start;
            border-radius: 999px;
            border: 1px solid rgba(250,204,21,.30);
            padding: 4px 8px;
            color: rgba(255,244,191,.92);
            font-style: normal;
            font-size: 10px;
            font-weight: 1000;
          }
          .mmQuoteGrid {
            grid-template-columns: minmax(0, 1fr);
          }
          .mmQuoteRows span {
            min-width: 0;
            border-radius: 14px;
            border: 1px solid rgba(125,211,252,.16);
            background: rgba(2,8,20,.46);
            padding: 8px 9px;
            font-variant-numeric: tabular-nums;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmDepositButton {
            min-width: 0;
            min-height: 28px;
            border: 1px solid rgba(250,204,21,.45);
            border-radius: 999px;
            padding: 0 9px;
            background:
              radial-gradient(circle at 20% 0%, rgba(250,204,21,.28), transparent 44%),
              linear-gradient(120deg, rgba(34,211,238,.18), rgba(168,85,247,.16));
            color: rgba(255,244,191,.98);
            font-size: 10px;
            font-weight: 1000;
            line-height: 1;
            text-transform: uppercase;
            white-space: nowrap;
            box-shadow: 0 0 14px rgba(250,204,21,.12), inset 0 0 0 1px rgba(255,255,255,.045);
          }
          .mmBalancePill {
            width: min(100%, 330px);
            grid-template-columns: minmax(0, .82fr) minmax(0, 1fr) auto;
          }
          .mmDepositButton:hover {
            filter: brightness(1.12);
          }
          .mmItemMedia,
          .mmOwnedMedia {
            min-width: 0;
            display: grid;
            gap: 6px;
          }
          .mmCollectionChip,
          .mmHistoryCollection,
          .mmTransactionCollection {
            position: relative;
            z-index: 2;
            justify-self: center;
            max-width: 100%;
            min-height: 21px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 9px;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.30);
            background:
              linear-gradient(120deg, rgba(34,211,238,.16), rgba(2,8,20,.86)),
              rgba(2,8,20,.72);
            color: rgba(190,242,255,.92);
            font-size: 10px;
            font-weight: 1000;
            line-height: 1;
            text-transform: uppercase;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.035);
          }
          .mmOwnedImageCountBadge {
            position: absolute;
            top: 8px;
            left: 8px;
            z-index: 3;
            min-width: 34px;
            width: 34px;
            height: 34px;
            padding: 0 4px;
            border-radius: 999px;
            border-color: rgba(250,204,21,.54);
            background:
              radial-gradient(circle at 35% 20%, rgba(255,255,255,.18), transparent 36%),
              linear-gradient(145deg, rgba(250,204,21,.22), rgba(34,211,238,.16), rgba(4,10,23,.92));
            color: rgba(255,244,191,.98);
            font-size: clamp(8px, 2.1vw, 11px);
            text-align: center;
            letter-spacing: 0;
            box-shadow: 0 0 16px rgba(250,204,21,.15);
          }
          .mmPreviewBadge {
            left: 50%;
            right: auto;
            bottom: 7px;
            width: max-content;
            max-width: calc(100% - 10px);
            transform: translateX(-50%);
            padding: 5px 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: clamp(9px, 2vw, 10px);
            letter-spacing: 0;
          }
          .mmSupplyBadge {
            min-width: 78px;
            justify-content: center;
            background:
              radial-gradient(circle at 20% 0%, rgba(250,204,21,.25), transparent 42%),
              rgba(3,10,23,.88);
            box-shadow: 0 0 16px rgba(250,204,21,.11), inset 0 0 0 1px rgba(255,255,255,.04);
          }
          .mmHistoryRow {
            grid-template-columns: 92px minmax(0, 1fr);
            gap: 12px;
            padding: 12px;
            border-radius: 22px;
            background:
              radial-gradient(circle at 12% 20%, rgba(34,211,238,.18), transparent 40%),
              linear-gradient(120deg, rgba(10,19,39,.92), rgba(8,12,26,.88));
          }
          .mmHistoryPreview {
            width: 84px;
            height: 84px;
            overflow: visible;
          }
          .mmHistoryActionBadge {
            left: 50%;
            right: auto;
            bottom: -7px;
            width: max-content;
            max-width: 128px;
            transform: translateX(-50%);
            padding: 5px 8px;
            overflow: visible;
            text-overflow: clip;
            font-size: 9px;
            border-color: rgba(250,204,21,.42);
            color: rgba(255,244,191,.98);
          }
          .mmHistoryQuantityBadge {
            top: -6px;
            right: -6px;
          }
          .mmHistoryCollection {
            justify-self: start;
            max-width: 100%;
            font-size: 9px;
            color: rgba(148,232,255,.9);
          }
          .mmHistoryMain strong {
            font-size: 14px;
            line-height: 1.14;
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .mmHistoryMeta {
            font-size: 10px;
          }
          .mmHistoryUser,
          .mmHistoryMarket {
            min-height: 44px;
            border-color: rgba(125,211,252,.24);
            background:
              linear-gradient(90deg, rgba(34,211,238,.08), rgba(168,85,247,.07), rgba(250,204,21,.06)),
              rgba(2,8,20,.68);
          }
          .mmHistoryUserName .nick-badge {
            max-width: 100%;
          }
          .mmOwnerRow {
            grid-template-columns: 44px minmax(0, 1fr) auto;
            min-height: 64px;
            border-radius: 18px;
            background:
              linear-gradient(90deg, rgba(34,211,238,.10), rgba(168,85,247,.06), rgba(250,204,21,.05)),
              rgba(3,10,23,.70);
          }
          .mmOwnerNickWrap {
            display: grid;
            gap: 4px;
          }
          .mmOwnerNickLine {
            min-width: 0;
            display: inline-flex;
            align-items: center;
            gap: 7px;
          }
          .mmOwnerSince {
            color: rgba(203,213,225,.76);
            font-size: 10px;
            font-weight: 800;
            line-height: 1.15;
          }
          .mmTransactionCollection {
            justify-self: start;
            color: rgba(148,232,255,.9);
          }
          @keyframes mmOrbitPulse {
            0%, 100% { opacity: .28; stroke-dashoffset: 0; }
            50% { opacity: .66; stroke-dashoffset: -34; }
          }
          @keyframes mmCircuitRun {
            0%, 100% { stroke-dashoffset: 180; opacity: .34; }
            50% { stroke-dashoffset: -90; opacity: .9; }
          }
          @keyframes mmNewGiftGlow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.13); }
          }
          @media (min-width: 641px) {
            .mmShell {
              width: calc(100vw - 32px) !important;
              max-width: 620px !important;
            }
          }
          @media (max-width: 640px) {
            .mmOverlay {
              --mm-mobile-top-offset: 115px;
              align-items: flex-start !important;
              overflow: hidden !important;
              padding:
                max(var(--mm-mobile-top-offset), calc(env(safe-area-inset-top) + var(--mm-mobile-top-offset)))
                8px
                max(14px, env(safe-area-inset-bottom))
                !important;
            }
            .mmShell {
              width: calc(100vw - 16px) !important;
              max-width: none !important;
              height: min(720px, calc(100vh - var(--mm-mobile-top-offset, 56px) - 20px));
              height: min(720px, calc(100dvh - var(--mm-mobile-top-offset, 56px) - 20px));
              min-height: min(720px, calc(100dvh - var(--mm-mobile-top-offset, 56px) - 20px));
              max-height: min(720px, calc(100dvh - var(--mm-mobile-top-offset, 56px) - 20px));
              border-radius: 22px;
            }
            .mmHeader {
              padding: 10px 10px 0;
            }
            .mmInfoLayer {
              padding: 8px;
            }
            .mmInfoPopover {
              width: calc(100% - 4px);
              max-height: calc(100% - 4px);
              border-radius: 22px;
            }
            .mmInfoHeader {
              grid-template-columns: 72px minmax(0, 1fr) 38px;
              gap: 9px;
              padding: 11px;
            }
            .mmInfoPreview {
              width: 70px;
              height: 70px;
              border-radius: 17px;
            }
            .mmInfo-item .mmInfoHeader {
              grid-template-columns: minmax(0, 1fr);
              gap: 10px;
              padding: 14px 48px 12px;
            }
            .mmInfo-item .mmInfoPreview {
              width: clamp(190px, 56vw, 264px);
              height: clamp(190px, 56vw, 264px);
              border-radius: 28px;
            }
            .mmInfoCloseFloating {
              top: 10px;
              right: 10px;
            }
            .mmInfoItemBadges {
              padding: 0 34px;
              gap: 6px;
            }
            .mmInfoItemBadges em,
            .mmInfoItemBadges b {
              font-size: 9px;
            }
            .mmInfoItemBadges {
              padding-top: 5px;
              padding-bottom: 5px;
            }
            .mmInfoItemBadges span {
              font-size: 13px;
            }
            .mmInfoItemTitleRail {
              gap: 8px;
            }
            .mmInfoItemTitleRail strong {
              font-size: clamp(16px, 4.8vw, 23px);
            }
            .mmInfoBody {
              padding: 11px;
            }
            .mmTopbar {
              grid-template-columns: 40px minmax(0, 1fr) 40px 40px;
              gap: 6px;
            }
            .mmRound {
              width: 40px;
              height: 40px;
            }
            .mmBalancePill {
              width: 100%;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 3px 6px;
              padding: 5px 9px;
            }
            .mmBalanceLabel {
              grid-column: 1 / -1;
              text-align: center;
            }
            .mmBalanceValue {
              text-align: center;
            }
            .mmDepositButton {
              min-height: 24px;
              padding-inline: 7px;
              font-size: 9px;
            }
            .mmTitleWrap,
            .mmTitleSvg {
              height: 70px;
            }
            .mmTitleText {
              font-size: 34px;
            }
            .mmBody {
              padding: 10px;
            }
            .mmCollectionCard {
              grid-template-columns: 112px minmax(0, 1fr);
              min-height: 136px;
            }
            .mmCollectionPreview {
              width: 104px;
              height: 104px;
            }
            .mmItemGrid,
            .mmOwnedList {
              gap: 10px;
            }
            .mmItemImageStage,
            .mmOwnedImageStage {
              height: 132px;
            }
            .mmItemCard,
            .mmOwnedCard {
              min-height: 266px;
              padding: 10px;
            }
          }
          @media (max-width: 390px) {
            .mmItemGrid,
            .mmOwnedList {
              grid-template-columns: 1fr;
            }
            .mmItemImageStage,
            .mmOwnedImageStage {
              height: 154px;
            }
            .mmCollectionCard {
              grid-template-columns: 1fr;
              justify-items: center;
              text-align: center;
            }
          }
          .mmBalancePill {
            width: min(100%, 372px);
            min-height: 56px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: stretch;
            gap: 10px;
            padding: 7px 8px 7px 14px;
            border-color: rgba(250,204,21,.52);
            background:
              radial-gradient(circle at 16% 0%, rgba(34,211,238,.18), transparent 42%),
              radial-gradient(circle at 90% 100%, rgba(250,204,21,.18), transparent 46%),
              linear-gradient(120deg, rgba(22,30,24,.92), rgba(4,9,23,.94) 48%, rgba(15,12,35,.92));
            box-shadow:
              0 0 0 1px rgba(255,255,255,.035) inset,
              0 0 24px rgba(250,204,21,.13),
              0 0 18px rgba(34,211,238,.08);
            white-space: nowrap;
          }
          .mmBalanceTextStack {
            min-width: 0;
            display: grid;
            grid-template-rows: auto 1px auto;
            align-content: center;
            gap: 5px;
          }
          .mmBalanceLabel {
            display: block;
            min-width: 0;
            text-align: center;
            color: rgba(148,232,255,.92);
            font-size: 9px;
            font-weight: 1000;
            line-height: 1;
            text-transform: uppercase;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmBalanceRail {
            display: block;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.72), rgba(250,204,21,.74), transparent);
            box-shadow: 0 0 10px rgba(103,232,249,.24);
          }
          .mmBalanceValue {
            min-width: 0;
            display: block;
            text-align: center;
            color: rgba(255,244,191,.98);
            font-size: clamp(11px, 2vw, 14px);
            font-weight: 1000;
            line-height: 1.05;
            font-variant-numeric: tabular-nums;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            letter-spacing: 0;
          }
          .mmDepositButton {
            align-self: stretch;
            min-height: 42px;
            min-width: 76px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 13px;
            border-color: rgba(250,204,21,.58);
            background:
              radial-gradient(circle at 20% 0%, rgba(255,255,255,.18), transparent 32%),
              linear-gradient(150deg, rgba(250,204,21,.24), rgba(34,211,238,.14), rgba(168,85,247,.20));
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.06),
              0 0 18px rgba(250,204,21,.18);
          }
          .mmContextStrip {
            position: relative;
            min-height: 46px;
            padding: 9px 12px;
            border-radius: 18px;
            border-bottom: 1px solid rgba(125,211,252,.18);
            background:
              radial-gradient(circle at 9% 50%, rgba(103,232,249,.16), transparent 31%),
              linear-gradient(90deg, rgba(34,211,238,.13), rgba(168,85,247,.07), rgba(250,204,21,.10)),
              rgba(2,8,20,.62);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.055),
              inset 0 -1px 0 rgba(250,204,21,.06),
              0 0 18px rgba(34,211,238,.08);
          }
          .mmContextStrip::after,
          .mmOwnersHero::after,
          .mmTransactionAsset::after {
            content: '';
            position: absolute;
            left: 12px;
            right: 12px;
            bottom: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.28), rgba(250,204,21,.22), transparent);
            pointer-events: none;
          }
          .mmContextCancelGift {
            flex: 0 0 auto;
            width: 28px;
            height: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            border: 1px solid rgba(250,204,21,.34);
            background:
              radial-gradient(circle at 50% 0%, rgba(250,204,21,.22), transparent 42%),
              rgba(2,8,20,.76);
            color: rgba(255,244,191,.94);
            box-shadow: 0 0 12px rgba(250,204,21,.12);
          }
          .mmContextCancelGift svg {
            width: 15px;
            height: 15px;
            stroke: currentColor;
            stroke-width: 2.5;
          }
          .mmContextCancelGift:hover {
            filter: brightness(1.12);
            transform: translateY(-1px);
          }
          .mmOwnersHero {
            position: relative;
            grid-template-columns: 76px minmax(0, 1fr);
            min-height: 112px;
            padding: 14px;
            border-radius: 22px;
            background:
              radial-gradient(circle at 10% 20%, rgba(34,211,238,.18), transparent 40%),
              linear-gradient(120deg, rgba(10,19,39,.92), rgba(11,13,28,.88), rgba(250,204,21,.08));
          }
          .mmOwnersHero span:not(.mmOwnersHeroImage) {
            min-width: 0;
            display: grid;
            gap: 6px;
            align-content: center;
            padding-left: 14px;
            border-left: 1px solid rgba(125,211,252,.18);
          }
          .mmOwnersHeroImage {
            width: 72px;
            height: 72px;
            border-radius: 20px;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.05), 0 0 18px rgba(34,211,238,.10);
          }
          .mmOwnersList {
            display: grid;
            gap: 10px;
          }
          .mmOwnerRow {
            position: relative;
            grid-template-columns: 60px minmax(0, 1fr) auto;
            gap: 14px;
            align-items: center;
            min-height: 78px;
            padding: 9px 12px;
            border: 1px solid rgba(125,211,252,.22);
            border-radius: 20px;
            background:
              radial-gradient(circle at 10% 14%, rgba(34,211,238,.16), transparent 42%),
              linear-gradient(100deg, rgba(7,16,33,.82), rgba(6,11,24,.72), rgba(250,204,21,.07));
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.035),
              0 12px 26px rgba(0,0,0,.20);
          }
          .mmOwnerRow::before {
            content: '';
            position: absolute;
            top: 10px;
            bottom: 10px;
            left: 84px;
            width: 1px;
            background: linear-gradient(180deg, transparent, rgba(103,232,249,.34), rgba(250,204,21,.22), transparent);
            pointer-events: none;
          }
          .mmOwnerRow::after {
            content: '';
            position: absolute;
            left: 14px;
            right: 14px;
            bottom: 8px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.22), rgba(250,204,21,.16), transparent);
            pointer-events: none;
          }
          .mmOwnerRow:hover {
            border-color: rgba(250,204,21,.42);
            transform: translateY(-1px);
          }
          .mmOwnerRow .mmOwnerAvatar {
            width: 60px;
            height: 60px;
            border-radius: 10px;
            border: 1px solid rgba(125,211,252,.34);
            background:
              radial-gradient(circle at 50% 38%, rgba(34,211,238,.18), transparent 56%),
              rgba(2,8,20,.78);
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.05),
              0 0 16px rgba(34,211,238,.12),
              0 8px 18px rgba(0,0,0,.24);
          }
          .mmOwnerNickWrap {
            min-width: 0;
            display: grid;
            gap: 7px;
            align-content: center;
            padding-left: 9px;
          }
          .mmOwnerNickLine .nick-badge {
            max-width: min(100%, 260px);
            font-size: clamp(12px, 2.4vw, 15px);
            line-height: 1;
          }
          .mmOwnerSince {
            justify-self: start;
            max-width: 100%;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.18);
            padding: 4px 8px;
            background: rgba(2,8,20,.44);
            color: rgba(203,213,225,.82);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmOwnerCountBadge {
            min-width: 34px;
            min-height: 26px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(250,204,21,.48);
            background:
              radial-gradient(circle at 30% 0%, rgba(250,204,21,.24), transparent 38%),
              rgba(2,8,20,.74);
            color: rgba(255,244,191,.98);
            font-size: clamp(10px, 2vw, 12px);
            font-weight: 1000;
            line-height: 1;
            padding: 0 8px;
            box-shadow: 0 0 12px rgba(250,204,21,.12);
          }
          .mmTransactionAsset {
            position: relative;
            grid-template-columns: 86px minmax(0, 1fr);
            gap: 14px;
            padding: 12px;
            border-color: rgba(125,211,252,.26);
            background:
              radial-gradient(circle at 11% 20%, rgba(34,211,238,.16), transparent 40%),
              linear-gradient(120deg, rgba(6,15,32,.9), rgba(2,8,20,.7));
          }
          .mmTransactionAssetInfo {
            padding-left: 12px;
            border-left: 1px solid rgba(125,211,252,.18);
          }
          .mmTransactionAssetInfo strong {
            font-size: 15px;
          }
          .mmTransactionAssetInfo em {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmTransactionTarget {
            min-width: 0;
            max-width: 100%;
            display: inline-grid;
            grid-template-columns: 24px minmax(0, auto) auto;
            align-items: center;
            justify-self: start;
            gap: 7px;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.22);
            padding: 4px 8px 4px 4px;
            background: rgba(2,8,20,.55);
            color: rgba(226,246,255,.92);
            font-size: 10px;
            font-weight: 900;
            line-height: 1;
          }
          .mmTransactionTarget > span:not(.mmTransactionTargetAvatar) {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmTransactionTargetAvatar {
            width: 24px;
            height: 24px;
            border-radius: 999px;
            overflow: hidden;
            border: 1px solid rgba(125,211,252,.26);
          }
          .mmTransactionTargetAvatarImg {
            width: 100%;
            height: 100%;
            display: block;
          }
          .mmTransactionVip {
            transform: scale(.78);
            transform-origin: center;
          }
          .mmQuoteRows {
            width: 100%;
            border-radius: 18px;
            border: 1px solid rgba(125,211,252,.14);
            padding: 6px;
            background: rgba(2,8,20,.34);
          }
          .mmQuoteRows span {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 34px;
            font-size: clamp(9px, 2.05vw, 11px);
            font-weight: 900;
            font-variant-numeric: tabular-nums;
          }
          @media (max-width: 640px) {
            .mmBalancePill {
              min-height: 52px;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 7px;
              padding: 6px 7px 6px 10px;
            }
            .mmDepositButton {
              min-width: 62px;
              min-height: 38px;
              padding-inline: 8px;
              font-size: 8px;
            }
            .mmBalanceLabel {
              font-size: 8px;
            }
            .mmBalanceValue {
              font-size: clamp(10px, 3.2vw, 12px);
            }
            .mmOwnersHero {
              grid-template-columns: 66px minmax(0, 1fr);
              min-height: 98px;
              padding: 12px;
            }
            .mmOwnersHeroImage {
              width: 62px;
              height: 62px;
            }
            .mmOwnerRow {
              grid-template-columns: 60px minmax(0, 1fr) auto;
              gap: 12px;
              padding: 9px 10px;
            }
            .mmOwnerRow::before {
              left: 78px;
            }
            .mmOwnerNickLine .nick-badge {
              font-size: 12px;
            }
          }
          .mmCollectionCard {
            display: block;
            padding: 0;
            min-height: 0;
            border-color: rgba(125,211,252,.26);
            background:
              radial-gradient(circle at 12% 18%, rgba(34,211,238,.24), transparent 38%),
              radial-gradient(circle at 92% 18%, rgba(250,204,21,.10), transparent 34%),
              linear-gradient(145deg, rgba(7,17,35,.94), rgba(2,8,20,.98));
          }
          .mmCollectionOpenButton {
            position: relative;
            width: 100%;
            min-height: 162px;
            display: grid;
            grid-template-columns: 132px minmax(0, 1fr);
            align-items: center;
            gap: 14px;
            padding: 14px 48px 14px 14px;
            border: 0;
            border-radius: inherit;
            background: transparent;
            color: inherit;
            text-align: left;
            overflow: hidden;
          }
          .mmCollectionOpenButton::before,
          .mmItemCard::before,
          .mmOwnedCard::before,
          .mmHistoryRow::before,
          .mmTransactionModal::before {
            content: '';
            position: absolute;
            left: 14px;
            right: 14px;
            top: 10px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.34), rgba(250,204,21,.24), transparent);
            pointer-events: none;
          }
          .mmCollectionOpenButton::after,
          .mmItemCard::after,
          .mmOwnedCard::after,
          .mmHistoryRow::after,
          .mmTransactionModal::after {
            content: '';
            position: absolute;
            left: 14px;
            right: 14px;
            bottom: 10px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(168,85,247,.24), rgba(103,232,249,.28), transparent);
            pointer-events: none;
          }
          .mmCollectionOpenButton:focus-visible {
            outline: 2px solid rgba(250,204,21,.78);
            outline-offset: 3px;
          }
          .mmCollectionMain {
            position: relative;
            gap: 9px;
            padding-inline: 6px 0;
          }
          .mmCollectionMain::before {
            content: '';
            position: absolute;
            top: 4px;
            bottom: 4px;
            left: -8px;
            width: 1px;
            background: linear-gradient(180deg, transparent, rgba(103,232,249,.34), rgba(250,204,21,.22), transparent);
            pointer-events: none;
          }
          .mmCollectionTopline {
            width: min(100%, 230px);
            display: grid;
            grid-template-columns: minmax(18px, 1fr) auto minmax(18px, 1fr);
            align-items: center;
            gap: 7px;
            justify-self: center;
          }
          .mmTinyRail,
          .mmCardDivider {
            display: block;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.58), rgba(250,204,21,.34), transparent);
            box-shadow: 0 0 10px rgba(103,232,249,.16);
          }
          .mmCardDivider {
            width: min(100%, 210px);
            justify-self: center;
          }
          .mmCardDividerShort {
            width: min(58%, 110px);
          }
          .mmCollectionMeta {
            width: 100%;
            justify-content: center;
            padding-top: 2px;
          }
          .mmCollectionMeta .mmCountBadge {
            max-width: 100%;
            min-height: 24px;
            padding: 5px 9px;
            border-color: rgba(125,211,252,.30);
            background:
              radial-gradient(circle at 20% 0%, rgba(34,211,238,.20), transparent 42%),
              rgba(2,8,20,.62);
            color: rgba(226,246,255,.94);
            font-size: clamp(9px, 2vw, 11px);
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .mmInfoButton {
            position: absolute;
            z-index: 4;
            width: 29px;
            height: 29px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.34);
            background:
              radial-gradient(circle at 34% 18%, rgba(255,255,255,.18), transparent 34%),
              linear-gradient(145deg, rgba(34,211,238,.18), rgba(4,10,23,.88));
            color: rgba(226,246,255,.84);
            font: 1000 14px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.045),
              0 0 14px rgba(34,211,238,.12);
          }
          .mmInfoButton:disabled {
            opacity: .82;
            cursor: default;
          }
          .mmInfoButton:hover:not(:disabled) {
            border-color: rgba(250,204,21,.52);
            color: rgba(255,244,191,.98);
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.055),
              0 0 18px rgba(34,211,238,.16),
              0 0 16px rgba(250,204,21,.10);
          }
          .mmInfoButton span {
            transform: translateY(-.5px);
          }
          .mmCollectionInfoButton,
          .mmItemInfoButton,
          .mmOwnedInfoButton {
            top: 10px;
            right: 10px;
          }
          .mmItemTopControls {
            position: absolute;
            z-index: 5;
            top: 10px;
            left: 10px;
            right: 10px;
            min-height: 29px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            pointer-events: none;
          }
          .mmItemTopControls > * {
            pointer-events: auto;
          }
          .mmItemTopControls .mmInfoButton,
          .mmItemTopControls .mmSupplyBadge {
            position: static;
            inset: auto;
          }
          .mmItemSupplyTopBadge {
            flex: 0 1 auto;
            max-width: calc(100% - 38px);
            min-height: 29px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .mmItemCard {
            padding-top: 42px;
            grid-template-rows: auto minmax(34px, auto) 40px;
            gap: 5px;
          }
          .mmItemMedia {
            position: relative;
          }
          .mmOwnedMedia::after {
            content: '';
            width: min(100%, 180px);
            height: 1px;
            justify-self: center;
            background: linear-gradient(90deg, transparent, rgba(125,211,252,.40), rgba(250,204,21,.22), transparent);
            box-shadow: 0 0 9px rgba(34,211,238,.10);
          }
          .mmItemInfo {
            gap: 3px;
            padding-top: 0;
            align-content: start;
          }
          .mmOwnedMain {
            gap: 6px;
            padding-top: 0;
            align-content: center;
          }
          .mmOwnedMain h3 {
            padding: 0;
          }
          .mmOwnedActionRail {
            width: min(100%, 170px);
            height: 1px;
            display: block;
            justify-self: center;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.46), rgba(250,204,21,.28), transparent);
            box-shadow: 0 0 9px rgba(103,232,249,.12);
          }
          .mmItemInfo h3,
          .mmOwnedMain h3,
          .mmCollectionTitle {
            text-shadow: 0 0 14px rgba(34,211,238,.12);
          }
          .mmButton {
            position: relative;
            isolation: isolate;
          }
          .mmButton::before {
            content: '';
            position: absolute;
            left: 12px;
            right: 12px;
            top: 7px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
            opacity: .58;
            pointer-events: none;
          }
          .mmContextText {
            flex: 1 1 auto;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            max-width: 100%;
            letter-spacing: .01em;
            text-transform: none;
            color: rgba(240,249,255,.98);
            text-shadow:
              0 0 12px rgba(34,211,238,.20),
              0 0 18px rgba(250,204,21,.08);
          }
          .mmContextPrimary,
          .mmContextMeta {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmContextPrimary {
            flex: 0 1 auto;
            font-weight: 1000;
            letter-spacing: .015em;
          }
          .mmContextMeta {
            flex: 0 0 auto;
            max-width: min(56%, 230px);
            min-width: 30px;
            min-height: 23px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 10px;
            border-radius: 999px;
            border: 1px solid rgba(250,204,21,.34);
            background:
              radial-gradient(circle at 22% 0%, rgba(255,255,255,.18), transparent 38%),
              linear-gradient(120deg, rgba(34,211,238,.14), rgba(168,85,247,.12), rgba(250,204,21,.15)),
              rgba(2,8,20,.70);
            color: rgba(255,244,191,.94);
            font-size: 11px;
            font-weight: 1000;
            line-height: 1;
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.04),
              0 0 14px rgba(250,204,21,.12),
              0 0 16px rgba(34,211,238,.08);
          }
          .mmContextDivider {
            flex: 0 0 auto;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background:
              radial-gradient(circle, rgba(255,255,255,.95) 0 22%, rgba(250,204,21,.92) 38%, rgba(34,211,238,.58) 70%, transparent 72%);
            box-shadow:
              0 0 10px rgba(250,204,21,.44),
              0 0 16px rgba(34,211,238,.22);
          }
          .mmContextCancelGift {
            margin-left: auto;
          }
          .mmRecipientAvatar + .mmContextText {
            padding-left: 2px;
          }
          .mmHistoryMain {
            position: relative;
            padding-left: 12px;
          }
          .mmHistoryMain::before {
            content: '';
            position: absolute;
            top: 3px;
            bottom: 3px;
            left: 0;
            width: 1px;
            background: linear-gradient(180deg, transparent, rgba(103,232,249,.30), rgba(250,204,21,.20), transparent);
          }
          .mmTransactionActions {
            position: relative;
            width: 100%;
            padding-top: 10px;
          }
          .mmTransactionActions::before {
            content: '';
            position: absolute;
            left: 10%;
            right: 10%;
            top: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.34), rgba(250,204,21,.28), transparent);
          }
          .mmTransactionActionsPlain::before {
            content: none;
          }
          .mmInsufficientRail {
            width: min(82%, 320px);
            height: 1px;
            margin: -2px 0 0;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.36), rgba(250,204,21,.30), transparent);
            box-shadow: 0 0 12px rgba(34,211,238,.10);
          }
          .mmQuoteRows {
            position: relative;
          }
          .mmQuoteRows::before {
            content: none;
            position: absolute;
            top: 6px;
            bottom: 6px;
            left: 50%;
            width: 1px;
            background: linear-gradient(180deg, transparent, rgba(125,211,252,.18), rgba(250,204,21,.16), transparent);
            pointer-events: none;
          }
          .mmInsufficientQuoteRows::before {
            content: none;
          }
          .mmQuoteFeeRow {
            position: relative;
            width: 100%;
            padding-top: 12px;
          }
          .mmQuoteFeeRow::before {
            content: '';
            position: absolute;
            left: 9%;
            right: 9%;
            top: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.34), rgba(250,204,21,.28), transparent);
            box-shadow: 0 0 10px rgba(34,211,238,.12);
          }
          .mmQuoteFeeRow span {
            display: block;
            min-width: 0;
            width: 100%;
            border-radius: 14px;
            border: 1px solid rgba(250,204,21,.26);
            background:
              linear-gradient(90deg, rgba(34,211,238,.07), rgba(250,204,21,.10), rgba(168,85,247,.06)),
              rgba(2,8,20,.50);
            color: rgba(255,244,191,.94);
            padding: 8px 10px;
            font-size: clamp(10px, 2.1vw, 12px);
            font-weight: 1000;
            line-height: 1.15;
            font-variant-numeric: tabular-nums;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmQuantityControl {
            width: min(100%, 292px);
            min-height: 46px;
            display: grid;
            grid-template-columns: 42px minmax(0, 1fr) 42px;
            align-items: stretch;
            gap: 8px;
            padding: 6px;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.22);
            background:
              linear-gradient(90deg, rgba(34,211,238,.08), rgba(250,204,21,.08), rgba(168,85,247,.08)),
              rgba(2,8,20,.62);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.035);
          }
          .mmQuantityControl.isSyncing {
            border-color: rgba(250,204,21,.38);
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,.045),
              0 0 18px rgba(250,204,21,.10);
          }
          .mmQuantityButton {
            min-width: 40px;
            min-height: 34px;
            border-radius: 999px;
            border: 1px solid rgba(125,211,252,.28);
            background:
              radial-gradient(circle at 30% 0%, rgba(255,255,255,.16), transparent 36%),
              rgba(5,12,24,.82);
            color: rgba(226,246,255,.96);
            font-size: 18px;
            font-weight: 1000;
            line-height: 1;
            box-shadow: 0 0 12px rgba(34,211,238,.10);
          }
          .mmQuantityButton:not(:disabled):hover {
            border-color: rgba(250,204,21,.46);
            color: rgba(255,244,191,.98);
          }
          .mmQuantityButton:disabled {
            opacity: .38;
            cursor: default;
          }
          .mmQuantityValue {
            min-width: 0;
            display: grid;
            grid-template-rows: auto 1fr;
            align-items: center;
            justify-items: center;
            gap: 3px;
            border-radius: 999px;
            border: 1px solid rgba(250,204,21,.24);
            background: rgba(2,8,20,.58);
            padding: 4px 10px;
          }
          .mmQuantityValue span {
            max-width: 100%;
            color: rgba(148,232,255,.88);
            font-size: 9px;
            font-weight: 1000;
            line-height: 1;
            text-transform: uppercase;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mmQuantityValue input {
            width: 100%;
            min-width: 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: rgba(255,244,191,.98);
            font-size: 14px;
            font-weight: 1000;
            line-height: 1;
            text-align: center;
            font-family: inherit;
            appearance: textfield;
          }
          .mmQuantityValue input::-webkit-outer-spin-button,
          .mmQuantityValue input::-webkit-inner-spin-button {
            margin: 0;
            appearance: none;
          }
          .mmHistoryRow {
            position: relative;
          }
          .mmHistoryRow .mmHistoryCollection {
            position: relative;
          }
          .mmHistoryRow .mmHistoryCollection::after,
          .mmTransactionCollection::after {
            content: '';
            display: block;
            width: 100%;
            height: 1px;
            margin-top: 5px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.42), rgba(250,204,21,.24), transparent);
          }
          .mmHistoryUser,
          .mmHistoryMarket {
            position: relative;
            overflow: hidden;
          }
          .mmHistoryUser::before,
          .mmHistoryMarket::before {
            content: '';
            position: absolute;
            left: 10px;
            right: 10px;
            top: 4px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent);
          }
          .mmTransactionModal {
            position: relative;
          }
          .mmTransactionAssetInfo {
            position: relative;
          }
          .mmTransactionAssetInfo::after {
            content: '';
            width: min(100%, 220px);
            height: 1px;
            display: block;
            background: linear-gradient(90deg, transparent, rgba(125,211,252,.38), rgba(250,204,21,.20), transparent);
          }
          .mmItemCard .mmButton,
          .mmOwnedCard .mmButton {
            margin-top: 2px;
          }
          .mmCollectionPreview,
          .mmItemImageStage {
            isolation: isolate;
          }
          .mmCollectionPreview::after,
          .mmItemImageStage::after {
            display: none;
          }
          .mmItemMediaTopRail {
            width: min(100%, 178px);
            height: 1px;
            justify-self: center;
            display: block;
            position: relative;
            z-index: 1;
            margin: 1px 0 2px;
            background: linear-gradient(90deg, transparent, rgba(103,232,249,.54), rgba(250,204,21,.30), transparent);
            box-shadow: 0 0 10px rgba(103,232,249,.14);
          }
          .mmOwnedMediaTopRail {
            width: min(100%, 164px);
          }
          .mmCollectionPreview::after {
            content: '';
            position: absolute;
            left: 12px;
            right: 12px;
            bottom: 10px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(250,204,21,.24), rgba(103,232,249,.26), transparent);
            pointer-events: none;
            z-index: 1;
          }
          @media (max-width: 640px) {
            .mmItemCard {
              grid-template-rows: auto minmax(32px, auto) 40px;
              gap: 5px;
            }
          }
          @media (max-width: 640px) {
            .mmCollectionOpenButton {
              min-height: 142px;
              grid-template-columns: 116px minmax(0, 1fr);
              gap: 11px;
              padding: 12px 44px 12px 12px;
            }
            .mmCollectionPreview {
              width: 108px;
              height: 108px;
            }
            .mmCollectionTitle {
              font-size: clamp(15px, 4.8vw, 18px);
            }
            .mmCollectionTopline {
              gap: 5px;
            }
            .mmInfoButton {
              width: 27px;
              height: 27px;
              font-size: 13px;
            }
          }
          @media (max-width: 390px) {
            .mmCollectionOpenButton {
              grid-template-columns: 1fr;
              justify-items: center;
              text-align: center;
              padding: 42px 12px 14px;
            }
            .mmCollectionMain::before {
              display: none;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .mmScan,
            .mmTitleComet,
            .mmTitleSweep,
            .mmTitleOrbit,
            .mmTitleCircuit,
            .mmOwnedCard.isNewGift,
            .mmSkeleton i,
            .mmSpinner,
            .mmCollectionCard,
            .mmItemCard,
            .mmOwnedCard,
            .mmInfoLivingPreview,
            .mmInfoLivingPreview::before,
            .mmInfoLivingPreview::after,
            .mmLivingBackdrop,
            .mmLivingOrbit,
            .mmLivingParticles,
            .mmLivingScan,
            .mmLivingCore,
            .mmInfoLivingPreview img,
            .mmButton,
            .mmRound,
            .mmTab {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>
      </section>
    </div>,
    document.body,
  )
}

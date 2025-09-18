'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  // Читаем способ авторизации, чтобы показывать Google/Email/Connected
  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const m1 = localStorage.getItem('w3m-auth-provider') // 'google' | 'email' | ...
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR') // 'walletConnect' | 'injected' | ...
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [mounted, isConnected])

  const authLabel = useMemo(() => {
    if (isConnected && address) return shortAddr(address)

    if (authMethod) {
      // Локализуем подписи способов
      const map = {
        google: t('auth_google') || 'Google',
        email: t('auth_email') || 'Email',
      }
      return map[authMethod] || t('auth_connected') || 'Connected'
    }

    // Локализуем «Войти»; если ключа нет в языке — мягко падаем на английский
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isConnected, address, authMethod, t])

  return (
    <button
      type="button"
      onClick={() => open()}
      className="nav-auth-btn"
      aria-label="Open connect modal"
    >
      {authLabel}
    </button>
  )
}

'use client'

import { useEffect } from 'react'

export default function useForumGlobalPopovers(openOnlyRef) {
  useEffect(() => {
    const closeForumPopoversForWallet = () => openOnlyRef?.current?.(null)
    window.addEventListener('qcoin:open', closeForumPopoversForWallet)
    window.addEventListener('quantum-wallet:open', closeForumPopoversForWallet)
    return () => {
      window.removeEventListener('qcoin:open', closeForumPopoversForWallet)
      window.removeEventListener('quantum-wallet:open', closeForumPopoversForWallet)
    }
  }, [openOnlyRef])

  useEffect(() => {
    const openVip = () => openOnlyRef?.current?.('vip')
    window.addEventListener('vip:open', openVip)
    return () => window.removeEventListener('vip:open', openVip)
  }, [openOnlyRef])
}

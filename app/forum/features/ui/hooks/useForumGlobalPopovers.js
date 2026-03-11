'use client'

import { useEffect } from 'react'

export default function useForumGlobalPopovers(openOnlyRef) {
  useEffect(() => {
    const openQcoin = () => openOnlyRef?.current?.('qcoin')
    window.addEventListener('qcoin:open', openQcoin)
    return () => window.removeEventListener('qcoin:open', openQcoin)
  }, [openOnlyRef])

  useEffect(() => {
    const openVip = () => openOnlyRef?.current?.('vip')
    window.addEventListener('vip:open', openVip)
    return () => window.removeEventListener('vip:open', openVip)
  }, [openOnlyRef])
}

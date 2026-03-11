import { useEffect, useState } from 'react'
import { isBrowser } from '../../../shared/utils/browser'

const ADMIN_KEY = 'ql7_admin'

export default function useAdminFlag() {
  const [isAdmin, setIsAdmin] = useState(
    () => isBrowser() && localStorage.getItem(ADMIN_KEY) === '1'
  )

  useEffect(() => {
    if (!isBrowser()) return
    setIsAdmin(localStorage.getItem(ADMIN_KEY) === '1')
    const onStorage = (e) => {
      if (e.key === ADMIN_KEY) setIsAdmin(e.newValue === '1')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return { isAdmin, setIsAdmin }
}

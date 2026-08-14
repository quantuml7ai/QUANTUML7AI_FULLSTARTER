import React, { useEffect, useState } from 'react'
import { cls } from '../utils/classnames'

export default function useForumToast() {
  const [t, set] = useState(null)

  useEffect(() => {
    if (!t) return
    const id = setTimeout(() => set(null), 6500)
    return () => clearTimeout(id)
  }, [t])

  const show = (kind, m) => {
    const msg = m == null ? '' : String(m)
    set({ kind, msg })
  }

  return {
    view: t ? (
      <div className="qft_toast_wrap">
        <div className={cls('qft_toast', t.kind)}>{t.msg}</div>
      </div>
    ) : null,

    ok: (m) => show('ok', m),
    success: (m) => show('ok', m),
    warn: (m) => show('warn', m),
    err: (m) => show('err', m),
    info: (m) => show('info', m),
  }
}

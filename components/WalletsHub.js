'use client'

import { useI18n } from './i18n'
import { useEffect, useState } from 'react'

export default function WalletsHub(){
  const { t } = useI18n()
  const [evm, setEvm] = useState(false)
  const [tron, setTron] = useState(false)
  const [sol, setSol] = useState(false)

  useEffect(()=>{
    if (typeof window === 'undefined') return
    setEvm(!!window.ethereum)
    setTron(!!window.tronWeb)
    setSol(!!window.solana)
  },[])

  const btns = t('w_btns')
  const lines = t('w_lines') || []

  return (
    <section className="panel panel-narrow">
      <h2>{t('w_title')}</h2>
      <ul className="bullets">
       {lines.map((s,i)=><li key={i}>• {String(s)}</li>)}
      </ul>

      <div className="row">
        <button className="btn" onClick={()=>alert('TON Connect placeholder')}>{btns.ton}</button>
        <button className="btn ghost" disabled={!evm} onClick={()=>alert('EVM connect')}>
          {evm?btns.evm_yes:btns.evm_no}
        </button>
        <button className="btn ghost" disabled={!tron} onClick={()=>alert('Tron connect')}>
          {tron?btns.tron_yes:btns.tron_no}
        </button>
        <button className="btn ghost" disabled={!sol} onClick={()=>alert('Solana connect')}>
          {sol?btns.sol_yes:btns.sol_no}
        </button>
      </div>

      <p className="muted" style={{marginTop:10}}>✅ {t('w_note')}</p>
    </section>
  )
}

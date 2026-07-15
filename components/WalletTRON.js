'use client';
import { useState } from 'react';
export default function WalletTRON(){
  const [addr,setAddr]=useState('');
  async function connect(){
    try{
      if(!window.tronWeb){ alert('Install TronLink'); return; }
      // TronLink modern API
      if (window.tronLink && window.tronLink.request) {
        try { await window.tronLink.request({ method:'tron_requestAccounts' }); } catch(e){}
      }
      const a = (window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58) || '';
      if(!a){ alert('Unlock TronLink'); return; }
      setAddr(a);
    }catch(e){ alert('TRON connect error'); }
   }
  return <button className="btn" onClick={connect}>{addr?addr:'Connect TRON (TronLink)'}</button>;
}

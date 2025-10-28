'use client';
import { useState } from 'react';
export default function WalletTRON(){
  const [addr,setAddr]=useState('');
  async function connect(){
    if(!window.tronWeb){ alert('Install TronLink'); return; }
    const a = window.tronWeb.defaultAddress?.base58;
    if(!a){ alert('Unlock TronLink'); return; }
    setAddr(a);
  }
  return <button className="btn" onClick={connect}>{addr?addr:'Connect TRON (TronLink)'}</button>;
}

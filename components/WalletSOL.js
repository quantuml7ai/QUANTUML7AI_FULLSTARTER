'use client';
import { useState } from 'react';
export default function WalletSOL(){
  const [addr,setAddr]=useState('');
  async function connect(){
    const p = window.solana;
    if(!p || !p.isPhantom){ alert('Install Phantom'); return; }
    const r = await p.connect(); setAddr(r.publicKey?.toString()||'');
  }
  return <button className="btn" onClick={connect}>{addr?addr:'Connect SOL (Phantom)'}</button>;
}

'use client';
import { useState } from 'react';
export default function WalletSOL(){
  const [addr,setAddr]=useState('');
  async function connect(){
    try{
      const p = window.solana;
      if(!p || !p.isPhantom){ alert('Install Phantom'); return; }
      const r = await p.connect(); setAddr((r && r.publicKey && r.publicKey.toString()) || '');
    }catch(e){
      // user rejected / locked — не спамим ошибками
      if (e && e.code === 4001) return;
      alert('Solana connect error');
    }
   }
  return <button className="btn" onClick={connect}>{addr?addr:'Connect SOL (Phantom)'}</button>;
}

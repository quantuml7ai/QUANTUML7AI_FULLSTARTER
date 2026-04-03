'use client';
import { TonConnectUI } from '@tonconnect/ui';
import { useEffect } from 'react';
export default function WalletTON(){
  useEffect(()=>{
    let tcui = null;
    try{
      tcui = new TonConnectUI({ manifestUrl:'/tonconnect-manifest.json', buttonRootId:'ton-btn' });
    }catch(e){ console.debug('[ton] ui init skipped', e); }
    return () => { try{ tcui && tcui.destroy && tcui.destroy(); }catch{} };
  },[]);  return <div id="ton-btn" />;
}

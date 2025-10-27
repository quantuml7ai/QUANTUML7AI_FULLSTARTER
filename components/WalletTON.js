'use client';
import { TonConnectUI } from '@tonconnect/ui';
import { useEffect } from 'react';
export default function WalletTON(){
  useEffect(()=>{ new TonConnectUI({ manifestUrl:'/tonconnect-manifest.json', buttonRootId:'ton-btn' }); },[]);
  return <div id="ton-btn" />;
}

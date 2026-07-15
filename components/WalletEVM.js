'use client';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
export default function WalletEVM(){
  const { address, isConnected, status } = useAccount();
  const { connect, error: connectError, isPending } = useConnect({ connector: injected() });
  const { disconnect } = useDisconnect();
  const labelAddr = address ? `${address.slice(0,6)}…${address.slice(-4)}` : '';
  if (isConnected) {
    return <button className="btn" onClick={()=>disconnect()}>{labelAddr || 'Account'} · Disconnect</button>;
  }
  const disabled = typeof window !== 'undefined' && !window.ethereum;
  return (
    <button className="btn" disabled={isPending} onClick={()=>connect()}>
      {disabled ? 'No EVM provider' : (isPending ? 'Connecting…' : 'Connect EVM (MetaMask/Trust)')}
      {connectError ? ' · Retry' : null}
    </button>
  );
 }

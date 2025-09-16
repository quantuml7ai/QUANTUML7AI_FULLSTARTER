'use client';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
export default function WalletEVM(){
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: injected() });
  const { disconnect } = useDisconnect();
  if (isConnected) return <button className="btn" onClick={()=>disconnect()}>{address.slice(0,6)}…{address.slice(-4)} · Disconnect</button>;
  return <button className="btn" onClick={()=>connect()}>Connect EVM (MetaMask/Trust)</button>;
}

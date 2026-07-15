'use client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, polygon, bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const config = createConfig({
  chains:[mainnet, polygon, bsc],
  transports:{ [mainnet.id]: http(), [polygon.id]: http(), [bsc.id]: http() },
});
const queryClient = new QueryClient();
export default function Web3Provider({children}){
  return (<WagmiProvider config={config}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></WagmiProvider>);
}

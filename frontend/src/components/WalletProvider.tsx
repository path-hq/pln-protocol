'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
// Wallet adapters removed - Wallet Standard auto-detects installed wallets (Phantom, Solflare, etc.)
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // Load RPC endpoint from environment variable
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com", []); 

  // Empty array - Wallet Standard will auto-detect installed wallets
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

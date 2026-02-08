'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

/**
 * Safe wrapper around useWallet that handles SSR/hydration
 */
export function useWalletSafe() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Try to get wallet context, but handle case where it's not available
  try {
    const wallet = useWallet();
    
    if (!mounted) {
      return {
        connected: false,
        publicKey: null,
        disconnect: async () => {},
        sendTransaction: async () => { throw new Error('Not mounted'); },
        signTransaction: async () => { throw new Error('Not mounted'); },
        signAllTransactions: async () => { throw new Error('Not mounted'); },
        signMessage: async () => { throw new Error('Not mounted'); },
      };
    }
    
    return wallet;
  } catch {
    return {
      connected: false,
      publicKey: null,
      disconnect: async () => {},
      sendTransaction: async () => { throw new Error('Wallet not available'); },
      signTransaction: async () => { throw new Error('Wallet not available'); },
      signAllTransactions: async () => { throw new Error('Wallet not available'); },
      signMessage: async () => { throw new Error('Wallet not available'); },
    };
  }
}

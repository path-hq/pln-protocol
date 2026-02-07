import { useMemo } from 'react';
import { Program, Idl, AnchorProvider, Wallet } from '@coral-xyz/anchor'; // Corrected import
import { Connection, PublicKey } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';

import reputationIDL from '../idl/reputation.json';
import creditMarketIDL from '../idl/credit_market.json';
import liquidityRouterIDL from '../idl/liquidity_router.json';

// Program IDs from Fares' instructions
const REPUTATION_PROGRAM_ID = "7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY";
const CREDIT_MARKET_PROGRAM_ID = "6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp";
const LIQUIDITY_ROUTER_PROGRAM_ID = "AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu";
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

interface Programs {
  reputation: Program<Idl> | null;
  creditMarket: Program<Idl> | null;
  liquidityRouter: Program<Idl> | null;
  provider: AnchorProvider | null;
}

export const usePLNPrograms = (): Programs => {
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    return new AnchorProvider(connection, wallet as Wallet, { preflightCommitment: 'confirmed' });
  }, [wallet]);

  const reputationProgram = useMemo(() => {
    if (!provider) return null;
    const programId = new PublicKey(REPUTATION_PROGRAM_ID);
    return new Program(reputationIDL as Idl, programId, provider);
  }, [provider]);

  const creditMarketProgram = useMemo(() => {
    if (!provider) return null;
    const programId = new PublicKey(CREDIT_MARKET_PROGRAM_ID);
    return new Program(creditMarketIDL as Idl, programId, provider);
  }, [provider]);

  const liquidityRouterProgram = useMemo(() => {
    if (!provider) return null;
    const programId = new PublicKey(LIQUIDITY_ROUTER_PROGRAM_ID);
    return new Program(liquidityRouterIDL as Idl, programId, provider);
  }, [provider]);

  return {
    reputation: reputationProgram,
    creditMarket: creditMarketProgram,
    liquidityRouter: liquidityRouterProgram,
    provider,
  };
};
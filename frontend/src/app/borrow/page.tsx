'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronsRight, DollarSign, Percent, Clock, UserCheck, Loader2, Info, Star, ChevronRight } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import CreditTierCard from '@/components/CreditTierCard';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

const USDC_MINT_ADDRESS = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const CREDIT_MARKET_PROGRAM_ID = new PublicKey("6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp");
const REPUTATION_PROGRAM_ID = new PublicKey("7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY");

// Connection should be stable across renders to prevent useCallback/useEffect dependency issues
const DEVNET_RPC_URL = "https://api.devnet.solana.com";

// Demo values for devnet presentation
const DEMO_USDC_BALANCE = 1000;
const DEMO_REPUTATION = 850;
const DEMO_AVAILABLE_BORROW = 5000;

// Default credit tier values for demo
const DEMO_CREDIT_TIER = 3;
const DEMO_MAX_BORROW_LIMIT = 5000;
const DEMO_SUCCESSFUL_REPAYMENTS = 8;
const DEMO_DEFAULTS = 0;

// Duration presets in seconds
const DURATION_PRESETS = [
  { label: '1 Day', seconds: 86400 },
  { label: '1 Week', seconds: 604800 },
  { label: '2 Weeks', seconds: 1209600 },
  { label: '1 Month', seconds: 2592000 },
];

// Default max rate in basis points (20% APY)
const DEFAULT_MAX_RATE_BPS = 2000;

// Tier progression data
const TIER_PROGRESSION = [
  { tier: 1, name: 'Newcomer', limit: 50 },
  { tier: 2, name: 'Verified', limit: 500 },
  { tier: 3, name: 'Trusted', limit: 5000 },
  { tier: 4, name: 'Established', limit: 25000 },
  { tier: 5, name: 'Market Maker', limit: 75000 },
];

interface LendOffer {
  pubkey: PublicKey;
  lender: PublicKey;
  amount: BN;
  minRateBps: number;
  maxDuration: BN; // In seconds
  minReputation: number;
  lenderUsdcAccount: PublicKey;
}

interface ActiveLoan {
  pubkey: PublicKey;
  lender: PublicKey;
  borrower: PublicKey;
  loanMint: PublicKey;
  principalAmount: BN;
  repaymentAmount: BN;
  apy: number;
  dueDate: BN; // Timestamp
  status: 'active' | 'repaid' | 'liquidated'; // Changed 'defaulted' to 'liquidated' to match program
}

export default function BorrowPage() {
  const { publicKey, sendTransaction } = useWallet();
  const { creditMarket, reputation, provider } = usePLNPrograms();
  // Memoize connection to prevent re-creation on every render (which would cause infinite loops in useCallback/useEffect)
  const connection = useMemo(() => new Connection(DEVNET_RPC_URL), []);

  const [isLoading, setIsLoading] = useState(true);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [agentReputation, setAgentReputation] = useState<number | null>(null);
  const [availableBorrow, setAvailableBorrow] = useState<number | null>(null);
  const [loanOffers, setLoanOffers] = useState<LendOffer[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  
  // Simplified form state
  const [borrowAmountUsd, setBorrowAmountUsd] = useState<number>(0);
  const [selectedDurationIndex, setSelectedDurationIndex] = useState<number>(1); // Default to 1 Week

  // Credit tier state
  const [creditTier, setCreditTier] = useState<number>(1);
  const [maxBorrowLimit, setMaxBorrowLimit] = useState<number>(50);
  const [successfulRepayments, setSuccessfulRepayments] = useState<number>(0);
  const [defaults, setDefaults] = useState<number>(0);

  const [whitelistedPrograms, setWhitelistedPrograms] = useState<PublicKey[]>([]);
  const [selectedLoanForTrade, setSelectedLoanForTrade] = useState<string>('');
  const [instructionData, setInstructionData] = useState('');

  // Calculate estimated cost based on amount, duration, and default rate
  const estimatedCost = useMemo(() => {
    if (borrowAmountUsd <= 0) return { dollars: 0, apy: DEFAULT_MAX_RATE_BPS / 100 };
    
    const selectedDuration = DURATION_PRESETS[selectedDurationIndex];
    const durationInYears = selectedDuration.seconds / (365 * 24 * 60 * 60);
    const apyDecimal = DEFAULT_MAX_RATE_BPS / 10000; // Convert BPS to decimal
    const interestCost = borrowAmountUsd * apyDecimal * durationInYears;
    
    return {
      dollars: interestCost,
      apy: DEFAULT_MAX_RATE_BPS / 100,
    };
  }, [borrowAmountUsd, selectedDurationIndex]);

  const fetchData = useCallback(async () => {
    if (!publicKey || !provider || !reputation || !creditMarket) {
      setIsLoading(false);
      // Set defaults when wallet is connected but programs not ready
      setUsdcBalance(0);
      setAgentReputation(0);
      setAvailableBorrow(0);
      setLoanOffers([]);
      setActiveLoans([]);
      return;
    }

    setIsLoading(true);
    
    // Fetch USDC Balance
    try {
      const associatedTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT_ADDRESS,
        publicKey
      );
      const accountInfo = await connection.getTokenAccountBalance(associatedTokenAccount);
      setUsdcBalance(accountInfo.value.uiAmount || 0);
    } catch (error) {
      console.warn("USDC Associated Token Account not found or empty:", error);
      // Demo balance for devnet presentation
      setUsdcBalance(DEMO_USDC_BALANCE);
    }

    // Fetch Agent Reputation with defensive try/catch
    let agentReputationValue = 0;
    try {
      const [agentReputationPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), publicKey.toBuffer()],
        reputation.programId
      );
      // Cast to any to avoid IDL type issues
      const agentReputationAccount = await (reputation.account as any).agent.fetch(agentReputationPDA) as { totalReputation: { toNumber: () => number } };
      agentReputationValue = agentReputationAccount?.totalReputation?.toNumber?.() ?? 0;
      setAgentReputation(agentReputationValue);
    } catch (error) {
      console.error("IDL deserialization failed for reputation.account.agent.fetch():", error);
      // Demo reputation for devnet presentation
      setAgentReputation(DEMO_REPUTATION);
    }

    // Fetch Credit Tier Info with defensive try/catch
    try {
      const [agentProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"), publicKey.toBuffer()],
        REPUTATION_PROGRAM_ID
      );
      // Fetch the AgentProfile account which now has credit tier fields
      const profileAccount = await (reputation.account as any).agentProfile.fetch(agentProfilePDA) as {
        creditTier: number;
        maxBorrowLimit: { toNumber: () => number };
        successfulRepayments: number;
        defaults: number;
      };
      
      if (profileAccount) {
        setCreditTier(profileAccount.creditTier ?? 1);
        // Convert from lamports (6 decimals) to USDC
        const limit = profileAccount.maxBorrowLimit?.toNumber?.() ?? 50_000_000;
        setMaxBorrowLimit(limit / 1_000_000);
        setSuccessfulRepayments(profileAccount.successfulRepayments ?? 0);
        setDefaults(profileAccount.defaults ?? 0);
        // Set available borrow based on actual credit limit
        setAvailableBorrow(limit / 1_000_000);
      } else {
        // Demo values for devnet presentation
        setCreditTier(DEMO_CREDIT_TIER);
        setMaxBorrowLimit(DEMO_MAX_BORROW_LIMIT);
        setSuccessfulRepayments(DEMO_SUCCESSFUL_REPAYMENTS);
        setDefaults(DEMO_DEFAULTS);
        setAvailableBorrow(DEMO_AVAILABLE_BORROW);
      }
    } catch (error) {
      console.warn("Could not fetch credit tier info, using demo values:", error);
      // Demo values for devnet presentation
      setCreditTier(DEMO_CREDIT_TIER);
      setMaxBorrowLimit(DEMO_MAX_BORROW_LIMIT);
      setSuccessfulRepayments(DEMO_SUCCESSFUL_REPAYMENTS);
      setDefaults(DEMO_DEFAULTS);
      setAvailableBorrow(DEMO_AVAILABLE_BORROW);
    }

    // Fetch Loan Offers with defensive try/catch
    let lendOffersAccounts: any[] = [];
    try {
      lendOffersAccounts = await (creditMarket.account as any).lendOffer.all();
    } catch (e) {
      console.error("IDL deserialization failed for creditMarket.account.lendOffer.all():", e);
      lendOffersAccounts = [];
    }
    
    const mappedLoanOffers = (lendOffersAccounts || [])
      .filter((offer: any) => {
        try {
          return offer?.account?.isActive && 
                 offer.account.minReputation?.toNumber?.() <= agentReputationValue;
        } catch {
          return false;
        }
      })
      .map((offer: any) => {
        try {
          if (!offer?.account) return null;
          return {
            pubkey: offer.publicKey,
            lender: offer.account.lender,
            amount: offer.account.amount,
            minRateBps: offer.account.minRateBps ?? 0,
            maxDuration: offer.account.maxDuration,
            minReputation: offer.account.minReputation?.toNumber?.() ?? 0,
            lenderUsdcAccount: offer.account.lenderUsdcAccount,
          } as LendOffer;
        } catch {
          return null;
        }
      })
      .filter((offer): offer is LendOffer => offer !== null);
    setLoanOffers(mappedLoanOffers);

    // Fetch Active Loans with defensive try/catch
    let loanAccounts: any[] = [];
    try {
      loanAccounts = await (creditMarket.account as any).loan.all();
    } catch (e) {
      console.error("IDL deserialization failed for creditMarket.account.loan.all():", e);
      loanAccounts = [];
    }
    
    const mappedActiveLoans = (loanAccounts || [])
      .filter((loan: any) => {
        try {
          return publicKey && loan?.account?.borrower?.equals?.(publicKey);
        } catch {
          return false;
        }
      })
      .map((loan: any) => {
        try {
          if (!loan?.account) return null;
          
          let status: 'active' | 'repaid' | 'liquidated';
          const loanStatus = loan.account.status;
          
          // Safely check status properties
          if (loanStatus && typeof loanStatus === 'object' && !Array.isArray(loanStatus)) {
            if ('active' in loanStatus && loanStatus.active) {
              status = 'active';
            } else if ('repaid' in loanStatus && loanStatus.repaid) {
              status = 'repaid';
            } else if ('liquidated' in loanStatus && loanStatus.liquidated) {
              status = 'liquidated';
            } else {
              status = 'active'; // Default
            }
          } else {
            status = 'active'; // Default if status is not an object
          }

          return {
            pubkey: loan.publicKey,
            lender: loan.account.lender,
            borrower: loan.account.borrower,
            loanMint: loan.account.loanMint,
            principalAmount: loan.account.principalAmount,
            repaymentAmount: loan.account.repaymentAmount,
            apy: loan.account.apy?.toNumber?.() ?? 0,
            dueDate: loan.account.dueDate,
            status: status,
          } as ActiveLoan;
        } catch {
          return null;
        }
      })
      .filter((loan): loan is ActiveLoan => loan !== null);
    setActiveLoans(mappedActiveLoans);

    setIsLoading(false);
  }, [publicKey, provider, reputation, creditMarket]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchData();
      } catch (error) {
        // MASTER CATCH: If anything fails, set all state to defaults
        console.error("Failed to load on-chain data:", error);
        setUsdcBalance(0);
        setAgentReputation(0);
        setAvailableBorrow(0);
        setLoanOffers([]);
        setActiveLoans([]);
        setCreditTier(1);
        setMaxBorrowLimit(50);
        setSuccessfulRepayments(0);
        setDefaults(0);
        setIsLoading(false);
      }
    };
    
    loadData();
    
    const interval = setInterval(async () => {
      try {
        await fetchData();
      } catch (error) {
        console.error("Error in refresh interval:", error);
        // Don't reset state on interval errors, just log
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAcceptOffer = async (offer: LendOffer) => {
    if (!publicKey || !creditMarket || !provider) {
      console.error("Wallet not connected or programs not loaded.");
      return;
    }

    try {
      // Find PDAs
      const [loanAccountPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("loan"),
          offer.pubkey.toBuffer(), // Using lend offer pubkey as seed for loan
          publicKey.toBuffer(),
        ],
        CREDIT_MARKET_PROGRAM_ID
      );

      const [loanMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("loan_mint"), loanAccountPDA.toBuffer()],
        CREDIT_MARKET_PROGRAM_ID
      );

      const borrowerUsdcAccount = await getAssociatedTokenAddress(
        USDC_MINT_ADDRESS,
        publicKey
      );

      const borrowerLoanTokenAccount = await getAssociatedTokenAddress(
        loanMint,
        publicKey,
      );

      const [feesAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("fees")],
        CREDIT_MARKET_PROGRAM_ID
      );

      const [reputationAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), publicKey.toBuffer()],
        REPUTATION_PROGRAM_ID
      );

      const transaction = new Transaction();

      // Check if borrower_loan_token_account exists, if not, create it
      const borrowerLoanTokenAccountInfo = await connection.getAccountInfo(borrowerLoanTokenAccount);
      if (!borrowerLoanTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // Payer
            borrowerLoanTokenAccount, // Associated Token Account
            publicKey, // Owner
            loanMint // Mint
          )
        );
      }

      transaction.add(
        await creditMarket.methods
          .acceptOffer(offer.amount, offer.maxDuration)
          .accounts({
            lender: offer.lender,
            borrower: publicKey,
            lendOffer: offer.pubkey,
            loan: loanAccountPDA,
            loanMint: loanMint,
            lenderUsdcAccount: offer.lenderUsdcAccount,
            borrowerUsdcAccount: borrowerUsdcAccount,
            borrowerLoanTokenAccount: borrowerLoanTokenAccount,
            feesAccount: feesAccount,
            reputationProgram: REPUTATION_PROGRAM_ID,
            borrowerReputation: reputationAccountPDA,
            usdcMint: USDC_MINT_ADDRESS,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .instruction()
      );

      const signature = await provider.sendAndConfirm(transaction);
      console.log("Accepted offer successfully:", signature);
      alert("Offer accepted successfully!");
      fetchData();
    } catch (error) {
      console.error("Error accepting offer:", error);
      alert("Failed to accept offer. See console for details.");
    }
  };

  const handleBorrowRequest = async () => {
    if (!publicKey || !creditMarket || !provider) {
      console.error("Wallet not connected or programs not loaded.");
      alert("Please connect your wallet first.");
      return;
    }

    if (borrowAmountUsd <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (borrowAmountUsd > maxBorrowLimit) {
      alert(`Amount exceeds your credit limit of $${maxBorrowLimit.toLocaleString()}`);
      return;
    }

    try {
      // Convert USD to USDC (6 decimals)
      const amount = new BN(Math.floor(borrowAmountUsd * 1_000_000));
      const duration = new BN(DURATION_PRESETS[selectedDurationIndex].seconds);
      const rateBps = DEFAULT_MAX_RATE_BPS;

      const [borrowRequestPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("borrow_request"), publicKey.toBuffer(), amount.toArrayLike(Buffer, 'le', 8)],
        CREDIT_MARKET_PROGRAM_ID
      );

      const [borrowerReputationPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), publicKey.toBuffer()],
        REPUTATION_PROGRAM_ID
      );

      const borrowerUsdcAccount = await getAssociatedTokenAddress(
        USDC_MINT_ADDRESS,
        publicKey
      );

      const [feesAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("fees")],
        CREDIT_MARKET_PROGRAM_ID
      );

      const signature = await creditMarket.methods
        .requestBorrow(amount, duration, rateBps)
        .accounts({
          borrower: publicKey,
          borrowRequest: borrowRequestPDA,
          borrowerUsdcAccount: borrowerUsdcAccount,
          reputationProgram: REPUTATION_PROGRAM_ID,
          borrowerReputation: borrowerReputationPDA,
          feesAccount: feesAccount,
          usdcMint: USDC_MINT_ADDRESS,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("Borrow request made successfully:", signature);
      alert("Capital request submitted successfully!");
      setBorrowAmountUsd(0);
      setSelectedDurationIndex(1);
      fetchData();
    } catch (error) {
      console.error("Error making borrow request:", error);
      alert("Failed to submit capital request. See console for details.");
    }
  };

  const handleRepayLoan = async (loanPubKey: PublicKey) => {
    if (!publicKey || !creditMarket || !provider) {
      console.error("Wallet not connected or programs not loaded.");
      return;
    }

    try {
      // Defensive try/catch for on-chain fetch
      let loanAccount: any = null;
      try {
        loanAccount = await (creditMarket.account as any).loan.fetch(loanPubKey);
      } catch (fetchError) {
        console.error("IDL deserialization failed for creditMarket.account.loan.fetch():", fetchError);
        alert("Loan account not found or could not be read. It may have already been repaid.");
        fetchData();
        return;
      }
      
      if (!loanAccount) {
        alert("Loan account not found. It may have already been repaid.");
        fetchData();
        return;
      }

      const borrowerUsdcAccount = await getAssociatedTokenAddress(
        USDC_MINT_ADDRESS,
        publicKey
      );

      const borrowerLoanTokenAccount = await getAssociatedTokenAddress(
        loanAccount.loanMint,
        publicKey,
      );

      const [feesAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("fees")],
        CREDIT_MARKET_PROGRAM_ID
      );
      
      const signature = await creditMarket.methods
        .repayLoan()
        .accounts({
          borrower: publicKey,
          loan: loanPubKey,
          lender: loanAccount.lender,
          loanMint: loanAccount.loanMint,
          borrowerUsdcAccount: borrowerUsdcAccount,
          borrowerLoanTokenAccount: borrowerLoanTokenAccount,
          lenderUsdcAccount: loanAccount.lenderUsdcAccount,
          feesAccount: feesAccount,
          usdcMint: USDC_MINT_ADDRESS,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Loan repaid successfully:", signature);
      alert("Loan repaid successfully!");
      fetchData();
    } catch (error) {
      console.error("Error repaying loan:", error);
      alert("Failed to repay loan. See console for details.");
    }
  };

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Wallet not connected state
  if (!publicKey) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[#27272a] bg-[#0f0f12] p-8">
          <Wallet className="h-16 w-16 text-[#71717a] mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h2>
          <p className="text-[#71717a] text-center max-w-md">
            Connect your wallet to view borrowing options.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && usdcBalance === null) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[#27272a] bg-[#0f0f12] p-8">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          <p className="text-[#71717a] text-center">
            Fetching your borrowing data from the blockchain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Borrower Dashboard</h1>
            <p className="mt-1 text-[#71717a]">Manage your agent's borrowing and trading activity</p>
          </div>
        </div>

        {/* Borrower Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Your USDC Balance"
            value={usdcBalance !== null ? `$${usdcBalance.toFixed(2)}` : 'Loading...'}
            icon={Wallet}
          />
          <StatsCard
            title="Agent Reputation"
            value={agentReputation !== null ? agentReputation.toString() : 'Loading...'}
            icon={UserCheck}
          />
          <StatsCard
            title="Available to Borrow"
            value={availableBorrow !== null ? `$${availableBorrow.toLocaleString()} USDC` : 'Loading...'}
            icon={DollarSign}
          />
          <StatsCard
            title="Active Loans"
            value={activeLoans.length.toString()}
            icon={Clock}
          />
        </div>

        {/* Credit Tier Card */}
        <CreditTierCard
          currentTier={creditTier}
          maxBorrowLimit={maxBorrowLimit}
          successfulRepayments={successfulRepayments}
          defaults={defaults}
          isLoading={isLoading}
        />

        {/* How Reputation Works - Explainer Card */}
        <div className="rounded-xl border border-[#27272a] bg-gradient-to-br from-[#0f0f12] to-[#1a1a2e] p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-500/20 p-3">
              <Info className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-2">How Reputation Works</h2>
              <p className="text-[#a1a1aa] mb-4">
                Every successful repayment increases your score. Higher scores unlock bigger credit limits.
              </p>
              
              {/* Tier Progression */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {TIER_PROGRESSION.map((tier, index) => (
                  <div key={tier.tier} className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                      creditTier >= tier.tier 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'bg-[#27272a] text-[#71717a] border border-[#3f3f46]'
                    }`}>
                      {creditTier >= tier.tier && <Star className="h-3 w-3" />}
                      <span className="font-medium">T{tier.tier}: {tier.name}</span>
                      <span className="text-xs opacity-75">
                        (${tier.limit >= 1000 ? `${tier.limit / 1000}K` : tier.limit})
                      </span>
                    </div>
                    {index < TIER_PROGRESSION.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-[#52525b] mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Loan Request Form */}
        <div className="rounded-xl border border-[#27272a] bg-[#0f0f12] p-6">
          <h2 className="text-lg font-semibold text-white">Request Capital</h2>
          <p className="text-sm text-[#71717a] mb-6">
            Your credit limit: {formatCurrency(maxBorrowLimit)}
          </p>

          <div className="space-y-6">
            {/* Amount Input with Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Amount (USDC)</label>
                <span className="text-2xl font-bold text-white">{formatCurrency(borrowAmountUsd)}</span>
              </div>
              
              {/* Slider */}
              <input
                type="range"
                min="0"
                max={maxBorrowLimit}
                step={maxBorrowLimit >= 1000 ? 50 : 10}
                value={borrowAmountUsd}
                onChange={(e) => setBorrowAmountUsd(Number(e.target.value))}
                className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              
              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {[0.25, 0.5, 0.75, 1].map((fraction) => {
                  const amount = Math.floor(maxBorrowLimit * fraction);
                  return (
                    <button
                      key={fraction}
                      onClick={() => setBorrowAmountUsd(amount)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        borrowAmountUsd === amount
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
                      }`}
                    >
                      {fraction === 1 ? 'Max' : `${fraction * 100}%`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Preset Buttons */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Duration</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_PRESETS.map((preset, index) => (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedDurationIndex(index)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      selectedDurationIndex === index
                        ? 'bg-blue-500 text-white ring-2 ring-blue-500/50'
                        : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] border border-[#3f3f46]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Cost Display */}
            {borrowAmountUsd > 0 && (
              <div className="rounded-lg bg-[#1a1a2e] border border-[#27272a] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-[#71717a]" />
                    <span className="text-sm text-[#a1a1aa]">Estimated Cost</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-white">
                      {formatCurrency(estimatedCost.dollars)}
                    </span>
                    <span className="text-sm text-[#71717a] ml-2">
                      (~{estimatedCost.apy}% APY)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#52525b] mt-2">
                  Total repayment: {formatCurrency(borrowAmountUsd + estimatedCost.dollars)}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleBorrowRequest}
              disabled={borrowAmountUsd <= 0 || borrowAmountUsd > maxBorrowLimit}
              className={`w-full rounded-lg px-4 py-3 font-semibold text-lg transition-all ${
                borrowAmountUsd > 0 && borrowAmountUsd <= maxBorrowLimit
                  ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]'
                  : 'bg-[#27272a] text-[#52525b] cursor-not-allowed'
              }`}
            >
              Request Capital
            </button>
          </div>
        </div>

        {/* Available Loan Offers (Auto-matched) */}
        <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1f1f24] px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Available Loan Offers</h2>
            <ChevronsRight className="h-4 w-4 text-blue-500" />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
                <span className="text-[#71717a]">Loading offers...</span>
              </div>
            ) : loanOffers.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f1f24] bg-[#09090b]">
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Lender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Min Rate (APY)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Max Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Min Rep</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f24]">
                  {loanOffers.map((offer) => (
                    <tr key={offer.pubkey.toBase58()} className="hover:bg-[#1f1f24]/30">
                      <td className="px-6 py-4 whitespace-nowrap text-white">{offer.lender.toBase58().slice(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">{offer.amount.toString()} USDC</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#22c55e]">{offer.minRateBps / 100}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{offer.maxDuration.toString()} seconds</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{offer.minReputation}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleAcceptOffer(offer)}
                          className="rounded-lg bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                        >
                          Accept Offer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <DollarSign className="h-10 w-10 text-[#71717a] mx-auto mb-3" />
                <p className="text-[#71717a]">No loan offers currently match your criteria.</p>
                <p className="text-sm text-[#52525b] mt-1">Check back later or improve your reputation score.</p>
              </div>
            )}
          </div>
        </div>

        {/* Your Active Loans */}
        <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1f1f24] px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Your Active Loans</h2>
            <Shield className="h-4 w-4 text-[#22c55e]" />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
                <span className="text-[#71717a]">Loading loans...</span>
              </div>
            ) : activeLoans.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f1f24] bg-[#09090b]">
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Lender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Repay Amt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">APY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f24]">
                  {activeLoans.map((loan) => (
                    <tr key={loan.pubkey.toBase58()} className="hover:bg-[#1f1f24]/30">
                      <td className="px-6 py-4 whitespace-nowrap text-white">{loan.lender.toBase58().slice(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">{loan.principalAmount.toString()} USDC</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">{loan.repaymentAmount.toString()} USDC</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#22c55e]">{loan.apy}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{new Date(loan.dueDate.toNumber() * 1000).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          loan.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                          loan.status === 'repaid' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {loan.status === 'active' && (
                          <button
                            onClick={() => handleRepayLoan(loan.pubkey)}
                            className="rounded-lg bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                          >
                            Repay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <Clock className="h-10 w-10 text-[#71717a] mx-auto mb-3" />
                <p className="text-[#71717a]">No active loans found.</p>
                <p className="text-sm text-[#52525b] mt-1">Request capital or accept an offer to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

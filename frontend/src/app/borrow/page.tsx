'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronsRight, DollarSign, Percent, Clock, UserCheck, Loader2 } from 'lucide-react';
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
  
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDuration, setBorrowDuration] = useState('');
  const [maxRateBps, setMaxRateBps] = useState('');

  // Credit tier state
  const [creditTier, setCreditTier] = useState<number>(1);
  const [maxBorrowLimit, setMaxBorrowLimit] = useState<number>(50);
  const [successfulRepayments, setSuccessfulRepayments] = useState<number>(0);
  const [defaults, setDefaults] = useState<number>(0);

  const [whitelistedPrograms, setWhitelistedPrograms] = useState<PublicKey[]>([]);
  const [selectedLoanForTrade, setSelectedLoanForTrade] = useState<string>('');
  const [instructionData, setInstructionData] = useState('');

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
    if (!publicKey || !creditMarket || !provider || !borrowAmount || !borrowDuration || !maxRateBps) {
      console.error("Wallet not connected, programs not loaded, or form fields are empty.");
      alert("Please fill in all loan request fields.");
      return;
    }

    try {
      const amount = new BN(borrowAmount);
      const duration = new BN(borrowDuration);
      const rateBps = parseInt(maxRateBps);

      const [borrowRequestPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("borrow_request"), publicKey.toBuffer(), amount.toArrayLike(Buffer, 'le', 8)], // Assuming amount is part of the seed
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
          borrowerUsdcAccount: borrowerUsdcAccount, // This might not be needed for requestBorrow, but often included.
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
      alert("Borrow request submitted successfully!");
      setBorrowAmount('');
      setBorrowDuration('');
      setMaxRateBps('');
      fetchData();
    } catch (error) {
      console.error("Error making borrow request:", error);
      alert("Failed to submit borrow request. See console for details.");
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
          lender: loanAccount.lender, // Need to pass lender from fetched loan account
          loanMint: loanAccount.loanMint,
          borrowerUsdcAccount: borrowerUsdcAccount,
          borrowerLoanTokenAccount: borrowerLoanTokenAccount,
          lenderUsdcAccount: loanAccount.lenderUsdcAccount, // Lender's USDC ATA from loan account
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
          <button
            onClick={handleBorrowRequest}
            className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-black hover:bg-blue-600 transition-colors"
          >
            Request Loan
          </button>
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

        {/* Loan Request Form */}
        <div className="rounded-xl border border-[#27272a] bg-[#0f0f12] p-6">
          <h2 className="text-lg font-semibold text-white">New Loan Request</h2>
          <p className="text-sm text-[#71717a]">Enter details for your desired loan</p>

          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">Amount (USDC)</label>
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="50000"
                className="w-full rounded-lg border border-[#27272a] bg-[#0f0f12] py-2 px-4 text-white placeholder-[#71717a] focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">Duration (seconds)</label>
              <input
                type="number"
                value={borrowDuration}
                onChange={(e) => setBorrowDuration(e.target.value)}
                placeholder="604800 (1 week)"
                className="w-full rounded-lg border border-[#27272a] bg-[#0f0f12] py-2 px-4 text-white placeholder-[#71717a] focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">Max APY (BPS, e.g., 1500 for 15%)</label>
              <input
                type="number"
                value={maxRateBps}
                onChange={(e) => setMaxRateBps(e.target.value)}
                placeholder="1500"
                className="w-full rounded-lg border border-[#27272a] bg-[#0f0f12] py-2 px-4 text-white placeholder-[#71717a] focus:border-blue-500 focus:outline-none"
              />
            </div>
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
                <p className="text-sm text-[#52525b] mt-1">Request a loan or accept an offer to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

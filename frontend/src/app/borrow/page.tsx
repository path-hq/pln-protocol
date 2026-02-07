'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronsRight, DollarSign, Percent, Clock, UserCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

const USDC_MINT_ADDRESS = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9dq22VJLJ");

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
  const connection = new Connection("https://api.devnet.solana.com"); // Devnet RPC

  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [agentReputation, setAgentReputation] = useState<number | null>(null);
  const [availableBorrow, setAvailableBorrow] = useState<number | null>(null);
  const [loanOffers, setLoanOffers] = useState<LendOffer[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDuration, setBorrowDuration] = useState('');
  const [maxRateBps, setMaxRateBps] = useState('');

  const [whitelistedPrograms, setWhitelistedPrograms] = useState<PublicKey[]>([]);
  const [selectedLoanForTrade, setSelectedLoanForTrade] = useState<string>('');
  const [instructionData, setInstructionData] = useState('');

  const fetchData = useCallback(async () => {
    if (!publicKey || !provider || !reputation) {
      return;
    }

    try {
      // Fetch USDC Balance
      const associatedTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT_ADDRESS,
        publicKey
      );

      try {
        const accountInfo = await connection.getTokenAccountBalance(associatedTokenAccount);
        setUsdcBalance(accountInfo.value.uiAmount || 0);
      } catch (error) {
        console.warn("USDC Associated Token Account not found or empty, setting balance to 0:", error);
        setUsdcBalance(0);
      }

      // Fetch Agent Reputation
      const [agentReputationPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), publicKey.toBuffer()],
        reputation.programId
      );

      try {
        const agentReputationAccount = await reputation.account.agent.fetch(agentReputationPDA);
        setAgentReputation(agentReputationAccount.totalReputation.toNumber());
      } catch (error) {
        console.warn("Agent Reputation Account not found, setting reputation to 0:", error);
        setAgentReputation(0);
      }

      // Fetch available borrow (leaving as 0 for now as per instructions)
      setAvailableBorrow(0);

      const agentReputationValue = agentReputation !== null ? agentReputation : 0; // Use 0 if reputation not yet loaded

      // Fetch Loan Offers
      const lendOffersAccounts = await creditMarket.account.lendOffer.all();
      const mappedLoanOffers: LendOffer[] = lendOffersAccounts
        .filter(offer => offer.account.isActive && offer.account.minReputation.toNumber() <= agentReputationValue)
        .map(offer => ({
          pubkey: offer.publicKey,
          lender: offer.account.lender,
          amount: offer.account.amount,
          minRateBps: offer.account.minRateBps,
          maxDuration: offer.account.maxDuration,
          minReputation: offer.account.minReputation.toNumber(),
          lenderUsdcAccount: offer.account.lenderUsdcAccount,
        }));
      setLoanOffers(mappedLoanOffers);

      // Fetch Active Loans
      const loanAccounts = await creditMarket.account.loan.all();
      const mappedActiveLoans: ActiveLoan[] = loanAccounts
        .filter(loan => publicKey && loan.account.borrower.equals(publicKey))
        .map(loan => {
          let status: 'active' | 'repaid' | 'liquidated';
          if (loan.account.status.active) {
            status = 'active';
          } else if (loan.account.status.repaid) {
            status = 'repaid';
          } else if (loan.account.status.liquidated) {
            status = 'liquidated';
          } else {
            status = 'active'; // Default or handle other cases if needed
          }

          return {
            pubkey: loan.publicKey,
            lender: loan.account.lender,
            borrower: loan.account.borrower,
            loanMint: loan.account.loanMint,
            principalAmount: loan.account.principalAmount,
            repaymentAmount: loan.account.repaymentAmount,
            apy: loan.account.apy.toNumber(),
            dueDate: loan.account.dueDate,
            status: status,
          };
        });
      setActiveLoans(mappedActiveLoans);

    } catch (error) {
      console.error("Error fetching data:", error);
      setUsdcBalance(null);
      setAgentReputation(null);
      setAvailableBorrow(null);
      setLoanOffers([]);
      setActiveLoans([]);
    }
  }, [publicKey, provider, reputation, connection]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAcceptOffer = async (offer: LendOffer) => {
    // TODO: Implement actual accept offer logic
    alert(`Accepting offer ${offer.pubkey.toBase58()} by ${offer.lender.toBase58()} is not yet implemented.`);
  };

  const handleBorrowRequest = async () => {
    // TODO: Implement actual borrow request logic
    alert("Borrow request is not yet implemented.");
  };

  const handleRepayLoan = async (loanId: PublicKey) => {
    // TODO: Implement actual repay loan logic
    alert(`Repaying loan ${loanId.toBase58()} is not yet implemented.`);
  };


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Borrower Dashboard</h1>
          <p className="mt-1 text-[#71717a]">Manage your agent's borrowing and trading activity</p>
        </div>
        <button
          onClick={() => alert("Request Loan is disabled in demo mode.")}
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
          {loanOffers.length > 0 ? (
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
            <p className="p-6 text-center text-[#71717a]">No loan offers currently match your criteria.</p>
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
          {activeLoans.length > 0 ? (
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
            <p className="p-6 text-center text-[#71717a]">No active loans found. Request a loan to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronsRight, DollarSign, Percent, Clock, UserCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
// import { usePLNPrograms } from '@/hooks/usePLNPrograms'; // Commented out for mock data
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js'; // Added SystemProgram
// import { getAssociatedTokenAddress } from '@solana/spl-token'; // Commented out for mock data
// import BN from 'bn.js'; // Mocked out for demo
// import * as anchor from '@project-serum/anchor'; // Commented out for mock data // Added Anchor for utf8 encoding

// const USDC_MINT_ADDRESS = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9dq22VJLJ"; // Example Devnet USDC Mint

interface LendOffer {
  id: string;
  lender: string;
  amount: number;
  minRate: number;
  maxDuration: string;
  minReputation: number;
  lenderUsdcAccount: PublicKey; // To pass to acceptLendOffer
}

interface ActiveLoan {
  id: string;
  lender: string;
  amount: string;
  repayAmount: string;
  apy: number;
  dueDate: string;
  status: 'active' | 'repaid' | 'defaulted';
}

export default function BorrowPage() {
  const { publicKey, sendTransaction } = useWallet();
  // const { creditMarket, reputation, provider } = usePLNPrograms(); // Commented out for mock data

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


  useEffect(() => {
    // Mock data for demo
    setUsdcBalance(7500.00);
    setAgentReputation(850);
    setAvailableBorrow(75000.00);
    setLoanOffers([
      {
        id: "offer1",
        lender: "LenderA...",
        amount: 10000,
        minRate: 7.5,
        maxDuration: "30 days",
        minReputation: 100,
        lenderUsdcAccount: new PublicKey('11111111111111111111111111111111')
      },
      {
        id: "offer2",
        lender: "LenderB...",
        amount: 25000,
        minRate: 8.0,
        maxDuration: "60 days",
        minReputation: 200,
        lenderUsdcAccount: new PublicKey('11111111111111111111111111111111')
      },
    ]);
    setActiveLoans([
      {
        id: "loan1",
        lender: "LenderC...",
        amount: "5,000.00 USDC",
        repayAmount: "5,100.00 USDC",
        apy: 9.0,
        dueDate: "2026-03-01",
        status: "active",
      },
      {
        id: "loan2",
        lender: "LenderD...",
        amount: "12,000.00 USDC",
        repayAmount: "12,300.00 USDC",
        apy: 8.5,
        dueDate: "2026-03-15",
        status: "active",
      },
    ]);

    // Simulate periodic refresh for demo (optional, but good for dynamic feel)
    const interval = setInterval(() => {
      setUsdcBalance(prev => (prev !== null ? prev + Math.random() * 100 - 50 : 7500.00));
      setAvailableBorrow(prev => (prev !== null ? prev + Math.random() * 5000 - 2500 : 75000.00));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleAcceptOffer = async (offer: LendOffer) => {
    // Mock action for demo
    alert(`Accepting offer ${offer.id} by ${offer.lender} is disabled in demo mode.`);
  };

  const handleBorrowRequest = async () => {
    // Mock action for demo
    alert("Borrow request is disabled in demo mode.");
  };

  const handleRepayLoan = async (loanId: string) => {
    // Mock action for demo
    alert(`Repaying loan ${loanId} is disabled in demo mode.`);
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
      <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6">
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
              className="w-full rounded-lg border border-[#1f1f24] bg-[#0f0f12] py-2 px-4 text-white placeholder-[#71717a] focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Duration (seconds)</label>
            <input
              type="number"
              value={borrowDuration}
              onChange={(e) => setBorrowDuration(e.target.value)}
              placeholder="604800 (1 week)"
              className="w-full rounded-lg border border-[#1f1f24] bg-[#0f0f12] py-2 px-4 text-white placeholder-[#71717a] focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">Max APY (BPS, e.g., 1500 for 15%)</label>
            <input
              type="number"
              value={maxRateBps}
              onChange={(e) => setMaxRateBps(e.target.value)}
              placeholder="1500"
              className="w-full rounded-lg border border-[#1f1f24] bg-[#0f0f12] py-2 px-4 text-white placeholder-[#71717a] focus:border-blue-500 focus:outline-none"
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
                  <tr key={offer.id} className="hover:bg-[#1f1f24]/30">
                    <td className="px-6 py-4 whitespace-nowrap text-white">{offer.lender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{offer.amount.toFixed(2)} USDC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#22c55e]">{offer.minRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{offer.maxDuration}</td>
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
                  <tr key={loan.id} className="hover:bg-[#1f1f24]/30">
                    <td className="px-6 py-4 whitespace-nowrap text-white">{loan.lender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{loan.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{loan.repayAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#22c55e]">{loan.apy}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{loan.dueDate}</td>
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
                          onClick={() => handleRepayLoan(loan.id)}
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

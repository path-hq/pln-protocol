'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronsRight, DollarSign, Percent, Clock, UserCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import BN from 'bn.js';

const USDC_MINT_ADDRESS = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9dq22VJLJ"; // Example Devnet USDC Mint

interface LoanOffer {
  id: string;
  lender: string;
  amount: string;
  rate: number;
  duration: string;
  minReputation: number;
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
  const { creditMarket, reputation, provider } = usePLNPrograms();

  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [agentReputation, setAgentReputation] = useState<number | null>(null);
  const [availableBorrow, setAvailableBorrow] = useState<number | null>(null);
  
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDuration, setBorrowDuration] = useState('');
  const [maxRateBps, setMaxRateBps] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey || !provider || !creditMarket || !reputation) {
        setUsdcBalance(null);
        setAgentReputation(null);
        setAvailableBorrow(null);
        return;
      }

      try {
        // Fetch USDC balance
        const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
        const ata = await getAssociatedTokenAddress(usdcMint, publicKey);
        const accountInfo = await provider.connection.getTokenAccountBalance(ata);
        setUsdcBalance(accountInfo.value.uiAmount || 0);

        // Fetch agent reputation (placeholder for now, will integrate properly later)
        setAgentReputation(750); // Mock value
        setAvailableBorrow(100000); // Mock value

        // Fetch available loan offers from Credit Market (placeholder)

      } catch (error) {
        console.error("Error fetching borrower data:", error);
        setUsdcBalance(null);
        setAgentReputation(null);
        setAvailableBorrow(null);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [publicKey, provider, creditMarket, reputation]);

  const handleBorrowRequest = async () => {
    if (!publicKey || !creditMarket || !provider || !borrowAmount || !borrowDuration || !maxRateBps) {
      alert("Please connect wallet and fill all borrow details.");
      return;
    }

    try {
      const amountBn = new BN(parseFloat(borrowAmount) * (10 ** 6)); // Assuming 6 decimals for USDC
      const durationSecs = new BN(parseInt(borrowDuration));
      const maxRate = parseInt(maxRateBps);

      // PDA for borrow request (placeholder for actual derivation logic)
      const [borrowRequestPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("request"), publicKey.toBuffer(), new BN(Date.now()).toBuffer("le", 8)],
        creditMarket.programId
      );

      const tx = await creditMarket.methods
        .postBorrowRequest(amountBn, maxRate, durationSecs)
        .accounts({
          borrower: publicKey,
          request: borrowRequestPDA,
          systemProgram: PublicKey.findProgramAddressSync([Buffer.from("system")], PublicKey.default)[0], // Mock for SystemProgram.programId
        })
        .rpc();

      alert(`Borrow request posted successfully! Transaction: ${tx}`);
      setBorrowAmount('');
      setBorrowDuration('');
      setMaxRateBps('');
      // Refresh data after successful request
      // fetchData(); 

    } catch (error) {
      console.error("Error posting borrow request:", error);
      alert(`Failed to post borrow request: ${error.message}`);
    }
  };

  const mockOffers: LoanOffer[] = [
    {
      id: 'offer-1',
      lender: 'Lender Charlie',
      amount: '100,000 USDC',
      rate: 10.5,
      duration: '30 days',
      minReputation: 600,
    },
    {
      id: 'offer-2',
      lender: 'Lender David',
      amount: '50,000 USDC',
      rate: 12.0,
      duration: '60 days',
      minReputation: 500,
    },
  ];

  const mockActiveLoans: ActiveLoan[] = [
    {
      id: 'agent-loan-1',
      lender: 'Lender Alice',
      amount: '20,000 USDC',
      repayAmount: '20,150 USDC',
      apy: 10.5,
      dueDate: '2026-02-28',
      status: 'active',
    },
    {
      id: 'agent-loan-2',
      lender: 'Lender Bob',
      amount: '5,000 USDC',
      repayAmount: '5,030 USDC',
      apy: 12.0,
      dueDate: '2026-03-15',
      status: 'active',
    },
  ];

  return (
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
          value={mockActiveLoans.length.toString()}
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
          <ChicronsRight className="h-4 w-4 text-blue-500" />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {mockOffers.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f24] bg-[#09090b]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Lender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Rate (APY)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Min Rep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f24]">
                {mockOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-[#1f1f24]/30">
                    <td className="px-6 py-4 whitespace-nowrap text-white">{offer.lender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{offer.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#22c55e]">{offer.rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{offer.duration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{offer.minReputation}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="rounded-lg bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 transition-colors">
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
          {mockActiveLoans.length > 0 ? (
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
                {mockActiveLoans.map((loan) => (
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
                        <button className="rounded-lg bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 transition-colors">
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

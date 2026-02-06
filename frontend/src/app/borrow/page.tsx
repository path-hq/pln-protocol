'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronsRight, DollarSign, Percent, Clock, UserCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'; // Added SystemProgram
import { getAssociatedTokenAddress } from '@solana/spl-token';
import BN from 'bn.js';
import * as anchor from '@project-serum/anchor'; // Added Anchor for utf8 encoding

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
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDuration, setBorrowDuration] = useState('');
  const [maxRateBps, setMaxRateBps] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey || !provider || !creditMarket || !reputation) {
        setUsdcBalance(null);
        setAgentReputation(null);
        setAvailableBorrow(null);
        setLoanOffers([]);
        setActiveLoans([]);
        return;
      }

      try {
        // Fetch USDC balance
        const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
        const ata = await getAssociatedTokenAddress(usdcMint, publicKey);
        let currentUsdcBalance = 0;
        try {
          const accountInfo = await provider.connection.getTokenAccountBalance(ata);
          currentUsdcBalance = accountInfo.value.uiAmount || 0;
        } catch (e) {
          console.warn("USDC ATA not found or empty for borrower:", e);
          // If ATA not found, balance is 0
        }
        setUsdcBalance(currentUsdcBalance);

        // Fetch agent reputation
        let currentAgentReputation = 0;
        try {
          const [profilePDA] = PublicKey.findProgramAddressSync(
            [anchor.utils.bytes.utf8.encode("profile"), publicKey.toBuffer()],
            reputation.programId
          );
          currentAgentReputation = await reputation.methods.getScore().accounts({ profile: profilePDA }).view();
        } catch (e) {
          console.warn("Agent profile not found for reputation:", e);
          // If profile not found, reputation is 0 or default
          currentAgentReputation = 0;
        }
        setAgentReputation(currentAgentReputation);

        // Simulate available borrow based on reputation
        const maxBorrowCap = 100_000; // Example max cap
        const simulatedAvailableBorrow = (currentAgentReputation / 1000) * maxBorrowCap;
        setAvailableBorrow(simulatedAvailableBorrow);

        // Fetch available loan offers (BorrowRequests)
        const allBorrowRequests = await creditMarket.account.borrowRequest.all();
        const offers: LoanOffer[] = allBorrowRequests
          .filter(req => req.account.isActive && req.account.borrower.equals(publicKey)) // Only show current user's active requests
          .map(req => ({
            id: req.publicKey.toString(), // Use PDA as ID
            lender: "N/A", // Lender is determined when an offer is accepted
            amount: `${req.account.amount.toNumber() / (10 ** 6)} USDC`, // Assuming 6 decimals
            rate: req.account.maxRateBps / 100, // BPS to percentage
            duration: `${req.account.durationSecs.toNumber() / (24 * 60 * 60)} days`, // Seconds to days
            minReputation: req.account.borrower.equals(publicKey) ? currentAgentReputation : 0, // Placeholder
          }));
        setLoanOffers(offers);

        // Fetch active loans
        const allLoans = await creditMarket.account.loan.all();
        const activeLoans: ActiveLoan[] = allLoans
          .filter(loan => loan.account.borrower.equals(publicKey) /* && loan.account.status === 'Active' // Need to map enum */ )
          .map(loan => {
            const principal = loan.account.principal.toNumber() / (10 ** 6);
            const rate = loan.account.rateBps / 100;
            // Simple interest calculation for display
            const interest = principal * (rate / 100) * (loan.account.endTime.toNumber() - loan.account.startTime.toNumber()) / (365.25 * 24 * 60 * 60);
             // TODO: Correct interest calculation for fixed duration loan + principal amount repaid
            const repayAmount = principal + interest;

            const loanStatusMap = ['Active', 'Repaid', 'Defaulted', 'Liquidated'];
            const status = loanStatusMap[loan.account.status.Active !== undefined ? 0 :
                                        loan.account.status.Repaid !== undefined ? 1 :
                                        loan.account.status.Defaulted !== undefined ? 2 : 3];

            return {
              id: loan.publicKey.toString(),
              lender: loan.account.lender.toString().substring(0, 4) + '...',
              amount: `${principal.toFixed(2)} USDC`,
              repayAmount: `${repayAmount.toFixed(2)} USDC`,
              apy: rate,
              dueDate: new Date(loan.account.endTime.toNumber() * 1000).toLocaleDateString(),
              status: status.toLowerCase() as 'active' | 'repaid' | 'defaulted',
            };
          }).filter(loan => loan.status === 'active'); // Filter active loans explicitly for display
        setActiveLoans(activeLoans);

      } catch (error) {
        console.error("Error fetching borrower data:", error);
        setUsdcBalance(null);
        setAgentReputation(null);
        setAvailableBorrow(null);
        setLoanOffers([]);
        setActiveLoans([]);
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
      const maxRate = parseInt(maxRateBps); // BPS

      // PDA for borrow request. Using a timestamp for uniqueness for now.
      const [borrowRequestPDA] = PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode("borrow_request"), publicKey.toBuffer(), new BN(Date.now()).toBuffer("le", 8)],
        creditMarket.programId
      );

      const tx = await creditMarket.methods
        .postBorrowRequest(amountBn, maxRate, durationSecs)
        .accounts({
          borrower: publicKey,
          request: borrowRequestPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      alert(`Borrow request posted successfully! Transaction: ${tx}`);
      setBorrowAmount('');
      setBorrowDuration('');
      setMaxRateBps('');
      fetchData(); // Refresh data after successful request

    } catch (error) {
      console.error("Error posting borrow request:", error);
      alert(`Failed to post borrow request: ${error.message}`);
    }
  };

  const handleRepayLoan = async (loanId: string) => {
    if (!publicKey || !creditMarket || !provider) {
      alert("Please connect wallet.");
      return;
    }

    try {
      // This loanId needs to be converted to PublicKey if it's the account address of the loan.
      // Assuming the loanId passed is the PublicKey string of the Loan account.
      const loanPk = new PublicKey(loanId);

      // Find associated token account for borrower's USDC
      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const borrowerUsdcATA = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );

      // To find the lenderUsdcATA, we first need to fetch the Loan account details.
      // This part requires fetching the loan account to get the lender's public key.
      const loanAccount = await creditMarket.account.loan.fetch(loanPk);
      const lenderUsdcATA = await getAssociatedTokenAddress(
        usdcMint,
        loanAccount.lender
      );

      const tx = await creditMarket.methods
        .repayLoan(new BN(loanAccount.id)) // The repayLoan instruction expects loanId (u64), not loanPk.
        .accounts({
          borrower: publicKey,
          loan: loanPk,
          borrowerUsdc: borrowerUsdcATA,
          lenderUsdc: lenderUsdcATA,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXAbZ5dJDRSRQXNkKQ2"), // SPL Token program ID
        })
        .rpc();

      alert(`Loan repaid successfully! Transaction: ${tx}`);
      fetchData(); // Refresh data after successful repayment

    } catch (error) {
      console.error("Error repaying loan:", error);
      alert(`Failed to repay loan: ${error.message}`);
    }
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Rate (APY)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Min Rep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f24]">
                {loanOffers.map((offer) => (
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

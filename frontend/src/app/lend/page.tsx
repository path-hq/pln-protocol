'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronDown, ChevronUp, DollarSign, Percent, Clock } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { usePLNPrograms } from '@/hooks/usePLNPrograms'; // Re-enabled
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'; // Re-enabled
import { SystemProgram } from '@solana/web3.js';
import BN from 'bn.js'; // Re-enabled
import { Buffer } from 'buffer'; // Re-enabled

const USDC_MINT_ADDRESS = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9dq22VJLJ"; // Example Devnet USDC Mint

interface LoanAccount {
  publicKey: PublicKey; // The PDA of the loan account
  id: BN; // On-chain loan ID
  lender: PublicKey;
  borrower: PublicKey;
  principal: BN; // Amount lent
  rateBps: number; // APY in basis points
  startTime: BN;
  endTime: BN;
  status: { active?: {} }; // Using an enum directly is harder, so checking active field
  vault: PublicKey;
  // collateral: BN; // Collateral is not directly part of the Loan struct. Placeholder for UI.
  healthFactor: number; // Placeholder, derived or fetched from elsewhere
}

interface DisplayLoan {
  id: string; // String version of on-chain ID
  borrower: string;
  amount: string;
  collateral: string; // Placeholder for now
  apy: number;
  startDate: string;
  health: number;
}


interface LenderPositionAccount {
  owner: PublicKey;
  depositedAmount: BN;
  kaminoAmount: BN;
  p2pAmount: BN;
  p2pLoansActive: number;
  minP2PRateBps: number;
  kaminoBufferBps: number;
}

export default function LendPage() {

  const { publicKey } = useWallet();
  const { liquidityRouter, provider, reputation } = usePLNPrograms(); // Re-enabled
  const [activeLoans, setActiveLoans] = useState<DisplayLoan[]>([]);

  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [lenderPositionAccount, setLenderPositionAccount] = useState<LenderPositionAccount | null>(null);
  const [currentAPY, setCurrentAPY] = useState<number | null>(null); // This will need to be fetched from Kamino or oracle

  // Strategy States
  const [minP2PRateBps, setMinP2PRateBps] = useState<number>(0);
  const [kaminoBufferBps, setKaminoBufferBps] = useState<number>(0);

  // Fetch user's USDC balance
  const fetchUsdcBalance = useCallback(async () => {
    if (!publicKey || !provider) {
      setUsdcBalance(null);
      return;
    }
    try {
      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const ata = await getAssociatedTokenAddress(usdcMint, publicKey);
      const accountInfo = await provider.connection.getTokenAccountBalance(ata);
      setUsdcBalance(accountInfo.value.uiAmount || 0);
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      setUsdcBalance(null);
    }
  }, [publicKey, provider]);

  // Fetch lender position from Liquidity Router
  const fetchLenderPosition = useCallback(async () => {
    if (!publicKey || !liquidityRouter) {
      setLenderPositionAccount(null);
      setMinP2PRateBps(0);
      setKaminoBufferBps(0);
      return;
    }
    try {
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("router_config")],
        liquidityRouter.programId
      );
      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const [positionPDA] = PublicKey.findProgramAddressSync(
        [publicKey.toBuffer(), configPDA.toBuffer(), usdcMint.toBuffer()],
        liquidityRouter.programId
      );

      const account = await liquidityRouter.account.lenderPosition.fetch(positionPDA);
      setLenderPositionAccount(account as LenderPositionAccount);
      setMinP2PRateBps(account.minP2PRateBps);
      setKaminoBufferBps(account.kaminoBufferBps);

      // TODO: Fetch Kamino current APY from a real source (oracle/Kamino API)
      setCurrentAPY(12.4); // Mock for now

    } catch (error) {
      console.error("Error fetching lender position:", error);
      setLenderPositionAccount(null);
      setMinP2PRateBps(0);
      setKaminoBufferBps(0);
      setCurrentAPY(null);
    }
  }, [publicKey, liquidityRouter]);

  // Fetch active loans from Credit Market
  const fetchActiveLoans = useCallback(async () => {
    if (!publicKey || !reputation?.program || !liquidityRouter) { // Access program from reputation
      setActiveLoans([]);
      return;
    }
    try {
      // Fetch all loan accounts
      const allLoans = await reputation.program.account.loan.all(); // Use reputation.program
      const USDC_DECIMALS = 6;

      const filteredLoans: DisplayLoan[] = allLoans
        .filter(loan =>
          loan.account.lender.equals(publicKey) &&
          (loan.account.status as any).active !== undefined // Check if status is Active
        )
        .map(loan => {
          const loanAccount = loan.account;
          const principal = loanAccount.principal.toNumber() / (10 ** USDC_DECIMALS);
          const rateApy = loanAccount.rateBps / 100; // Convert BPS to percentage

          // For health factor and collateral, we don't have direct on-chain data in the Loan account
          // Placeholder values for now, this would likely come from an oracle or collateral program
          const healthFactor = 1.0; // Most loans start healthy, needs to be calculated dynamically
          const collateralAmount = principal * 1.5; // Placeholder: assuming 150% collateralized, needs to be dynamic


          // Convert Solana timestamp (seconds) to milliseconds for JavaScript Date
          const startDate = new Date(loanAccount.startTime.toNumber() * 1000).toLocaleDateString();

          return {
            id: loanAccount.id.toString(),
            borrower: loanAccount.borrower.toBase58().substring(0, 8) + '...',
            amount: `${principal.toFixed(2)} USDC`,
            collateral: `${collateralAmount.toFixed(2)} USDC`, // Placeholder
            apy: rateApy,
            startDate: startDate,
            health: healthFactor,
          };
        });
      setActiveLoans(filteredLoans);

    } catch (error) {
      console.error("Error fetching active loans:", error);
      setActiveLoans([]);
    }
  }, [publicKey, reputation, liquidityRouter]); // Added reputation to dependencies

  useEffect(() => {
    fetchUsdcBalance();
    fetchLenderPosition();
    fetchActiveLoans(); // Fetch active loans
    const interval = setInterval(() => {
      fetchUsdcBalance();
      fetchLenderPosition();
      fetchActiveLoans(); // Poll active loans
    }, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [fetchUsdcBalance, fetchLenderPosition]);

  const handleUpdateStrategy = async () => {
    if (!publicKey || !liquidityRouter || !provider) {
      alert("Wallet not connected or program not loaded.");
      return;
    }
    try {
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("router_config")],
        liquidityRouter.programId
      );
      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const [positionPDA] = PublicKey.findProgramAddressSync(
        [publicKey.toBuffer(), configPDA.toBuffer(), usdcMint.toBuffer()],
        liquidityRouter.programId
      );

      const tx = await liquidityRouter.methods
        .updateStrategy(minP2PRateBps, kaminoBufferBps, null) // Assuming null for autoRoute for simplicity for now
        .accounts({
          lender: publicKey,
          position: positionPDA,
          config: configPDA,
        })
        .transaction();

      const signature = await provider.sendAndConfirm(tx);
      alert(`Strategy updated! Transaction: ${signature}`);
      console.log("Strategy updated, transaction:", signature);

      fetchLenderPosition(); // Refresh position after successful update
    } catch (error: any) {
      console.error("Strategy update failed:", error);
      alert(`Strategy update failed: ${error.message}`);
    }
  };

  const handleDeposit = async () => {
    if (!publicKey || !liquidityRouter || !provider) {
      alert("Wallet not connected or program not loaded.");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid deposit amount (greater than 0).");
      return;
    }

    try {
      const USDC_DECIMALS = 6;
      const amountInSmallestUnits = new BN(amount * (10 ** USDC_DECIMALS));

      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const [routerConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("router_config")],
        liquidityRouter.programId
      );
      const [positionPDA] = PublicKey.findProgramAddressSync(
        [publicKey.toBuffer(), routerConfigPDA.toBuffer(), usdcMint.toBuffer()],
        liquidityRouter.programId
      );
      const [routerVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("router_vault"), routerConfigPDA.toBuffer(), usdcMint.toBuffer()],
        liquidityRouter.programId
      );

      const lenderUsdcAta = await getAssociatedTokenAddress(usdcMint, publicKey);

      const transaction = await liquidityRouter.methods
        .deposit(amountInSmallestUnits)
        .accounts({
          lender: publicKey,
          position: positionPDA,
          lenderUsdc: lenderUsdcAta,
          routerVault: routerVaultPDA,
          usdcMint: usdcMint,
          config: routerConfigPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await provider.sendAndConfirm(transaction);
      alert(`Deposit successful! Transaction: ${signature}`);
      console.log("Deposit successful, transaction:", signature);

      fetchUsdcBalance();
      fetchLenderPosition();
    } catch (error: any) {
      console.error("Deposit failed:", error);
      alert(`Deposit failed: ${error.message}`);
    }
  };

  const [depositAmount, setDepositAmount] = useState('');


  const getHealthColor = (health: number) => {
    if (health >= 1.5) return 'text-[#22c55e]';
    if (health >= 1.25) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Lender Dashboard</h1>
          <p className="mt-1 text-[#71717a]">Manage your lending positions and strategies</p>
        </div>
        <button className="rounded-lg bg-[#22c55e] px-4 py-2 font-medium text-black hover:bg-[#16a34a] transition-colors">
          Deposit Capital
        </button>
      </div>

      {/* Position Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Your USDC Balance"
          value={usdcBalance !== null ? `$${usdcBalance.toFixed(2)}` : 'Loading...'}
          icon={Wallet}
        />
        <StatsCard
          title="Total Deposited"
          value={lenderPositionAccount ? `$${(lenderPositionAccount.depositedAmount.toNumber() / (10 ** 6)).toFixed(2)}` : 'Loading...'}
          icon={TrendingUp}
        />
        <StatsCard
          title="Current APY"
          value={currentAPY !== null ? `${currentAPY.toFixed(2)}%` : 'Loading...'}
          icon={Percent}
        />
        <StatsCard
          title="P2P Loans Active"
          value={lenderPositionAccount ? `${lenderPositionAccount.p2pLoansActive}` : 'Loading...'}
          icon={Clock}
        />
      </div>

      {/* Strategy Configuration */}
      <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6">
        <h2 className="text-lg font-semibold text-white">Lending Strategy</h2>
        <p className="text-sm text-[#71717a]">Configure your automatic yield routing strategy</p>

        <div className="mt-6 space-y-4">

          <div className="flex items-center gap-4">
            <label className="w-40 text-sm font-medium text-white">Min P2P Rate (BPS)</label>
            <input
              type="number"
              value={minP2PRateBps}
              onChange={(e) => setMinP2PRateBps(parseInt(e.target.value))}
              className="w-32 rounded-lg border border-[#1f1f24] bg-[#0f0f12] py-2 px-3 text-white focus:border-[#22c55e] focus:outline-none"
              placeholder="e.g., 700 (7%)"
            />
            <p className="text-sm text-[#71717a]">Minimum APY for direct P2P loans (vs. Kamino).</p>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-40 text-sm font-medium text-white">Kamino Buffer (BPS)</label>
            <input
              type="number"
              value={kaminoBufferBps}
              onChange={(e) => setKaminoBufferBps(parseInt(e.target.value))}
              className="w-32 rounded-lg border border-[#1f1f24] bg-[#0f0f12] py-2 px-3 text-white focus:border-[#22c55e] focus:outline-none"
              placeholder="e.g., 100 (1%)"
            />
            <p className="text-sm text-[#71717a]">P2P rate must be X bps higher than Kamino APY.</p>
          </div>

          <button
            onClick={handleUpdateStrategy}
            className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-black hover:bg-blue-600 transition-colors mt-4 mr-2"
          >
            Update Strategy
          </button>


        </div>
      </div>

      {/* Deposit Input */}
      <div className="mt-6 rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6">
        <h2 className="text-lg font-semibold text-white">Deposit Capital</h2>
        <p className="mt-1 text-[#71717a]">Deposit USDC to start earning yield.</p>
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-[#1f1f24] bg-[#0f0f12] py-2 pl-10 pr-4 text-white placeholder-[#71717a] focus:border-[#22c55e] focus:outline-none"
            />
          </div>
          <button
            onClick={handleDeposit}
            className="rounded-lg bg-[#22c55e] px-6 py-2 font-medium text-black hover:bg-[#16a34a] transition-colors"
          >
            Deposit
          </button>
        </div>
      </div>

      {/* Active Loans Table */}
      <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#1f1f24] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Your Active Loans</h2>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#22c55e]" />
            <span className="text-sm text-[#71717a]">All loans healthy</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f24] bg-[#09090b]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">
                  Collateral
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">
                  APY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider">
                  Health
                </th>
              </tr>
            </thead>
            <tbody>
              {activeLoans.map((loan) => (
                <tr key={loan.id.toString()} className="hover:bg-[#1f1f24]/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-[#22c55e]">
                          {loan.borrower.toBase58().charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-white">{loan.borrower.toBase58()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{`${loan.principal.toNumber() / (10 ** 6)} USDC`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{`${(loan.principal.toNumber() * 1.5) / (10 ** 6)} USDC`}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[#22c55e]">{loan.rateBps / 100}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{new Date(loan.startTime.toNumber() * 1000).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={getHealthColor(loan.health)}>{loan.health.toFixed(2)}</span>
                      {loan.health < 1.3 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
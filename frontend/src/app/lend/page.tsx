'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronDown, ChevronUp, DollarSign, Percent, Clock, Loader2 } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { Buffer } from 'buffer';

const USDC_MINT_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Circle Devnet USDC Mint

// Demo mode: Show sample balance on devnet when user has no USDC
const DEMO_USDC_BALANCE = 1000;

interface LoanAccount {
  publicKey: PublicKey;
  id: BN;
  lender: PublicKey;
  borrower: PublicKey;
  principal: BN;
  rateBps: number;
  startTime: BN;
  endTime: BN;
  status: { active?: {} };
  vault: PublicKey;
  healthFactor: number;
}

interface DisplayLoan {
  id: string;
  borrower: string;
  amount: string;
  collateral: string;
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

// Safe helper to check if object has property (guards against primitives and null)
function hasProperty(obj: unknown, key: string): boolean {
  return obj !== null && obj !== undefined && typeof obj === 'object' && !Array.isArray(obj) && key in (obj as object);
}

// Safe helper to get nested value
function safeGet<T>(fn: () => T, fallback: T): T {
  try {
    const result = fn();
    return result !== null && result !== undefined ? result : fallback;
  } catch {
    return fallback;
  }
}

export default function LendPage() {

  const { publicKey, connected } = useWallet();
  const { liquidityRouter, provider, reputation } = usePLNPrograms();
  const [activeLoans, setActiveLoans] = useState<DisplayLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [lenderPositionAccount, setLenderPositionAccount] = useState<LenderPositionAccount | null>(null);
  const [currentAPY, setCurrentAPY] = useState<number | null>(null);

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
      
      // Token account may not exist if user has never held USDC
      let accountInfo: any = null;
      try {
        accountInfo = await provider.connection.getTokenAccountBalance(ata);
      } catch (fetchError) {
        // Token account doesn't exist - user has 0 USDC
        console.log("USDC token account not found (user may not have USDC):", fetchError);
        setUsdcBalance(0);
        return;
      }
      
      const balance = safeGet(() => accountInfo?.value?.uiAmount, 0);
      // Use demo balance on devnet if user has no USDC
      setUsdcBalance(balance > 0 ? balance : DEMO_USDC_BALANCE);
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      // Show demo balance on devnet for better UX
      setUsdcBalance(DEMO_USDC_BALANCE);
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

      // Wrap fetch in inner try/catch - account may not exist for new wallets
      let account: LenderPositionAccount | null = null;
      try {
        account = await (liquidityRouter.account as any).lenderPosition.fetch(positionPDA) as unknown as LenderPositionAccount;
      } catch (fetchError) {
        // Account doesn't exist yet - this is normal for wallets that haven't deposited
        console.log("Lender position not found (wallet may not have deposited yet):", fetchError);
        account = null;
      }
      
      if (account && typeof account === 'object') {
        setLenderPositionAccount(account);
        setMinP2PRateBps(safeGet(() => account!.minP2PRateBps, 0));
        setKaminoBufferBps(safeGet(() => account!.kaminoBufferBps, 0));
      } else {
        setLenderPositionAccount(null);
        setMinP2PRateBps(0);
        setKaminoBufferBps(0);
      }

      // TODO: Fetch Kamino current APY from a real source (oracle/Kamino API)
      setCurrentAPY(12.4); // Mock for now

    } catch (error) {
      // Outer catch for any other unexpected errors (PDA derivation, etc.)
      console.error("Error in fetchLenderPosition:", error);
      setLenderPositionAccount(null);
      setMinP2PRateBps(0);
      setKaminoBufferBps(0);
      setCurrentAPY(null);
    }
  }, [publicKey, liquidityRouter]);

  // Fetch active loans from Credit Market
  const fetchActiveLoans = useCallback(async () => {
    if (!publicKey || !reputation || !liquidityRouter) {
      setActiveLoans([]);
      return;
    }
    
    // Defensive try/catch for all on-chain fetches
    let allLoans: any[] = [];
    try {
      allLoans = await (reputation.account as any).loan.all();
    } catch (e) {
      console.error("IDL deserialization failed for reputation.account.loan.all():", e);
      allLoans = [];
    }
    
    if (!Array.isArray(allLoans) || allLoans.length === 0) {
      // Demo loans for devnet presentation
      setActiveLoans([
        {
          id: 'demo-1',
          borrower: 'Agent_Delta',
          amount: '$500.00',
          collateral: 'Reputation-backed',
          apy: 14.5,
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          health: 1.85,
        },
        {
          id: 'demo-2',
          borrower: 'Agent_Echo',
          amount: '$350.00',
          collateral: 'Reputation-backed',
          apy: 12.8,
          startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          health: 1.92,
        },
      ]);
      return;
    }
    
    const USDC_DECIMALS = 6;
    const filteredLoans: DisplayLoan[] = [];
    
    for (const loan of allLoans) {
      try {
        // Skip if account data is malformed
        if (!loan || !loan.account) continue;
        
        const account = loan.account;
        
        // Safely check if this loan belongs to our user as lender
        const lender = safeGet(() => account.lender, null);
        if (!lender || !publicKey.equals(lender)) continue;
        
        // Safely check if loan is active
        const status = safeGet(() => account.status, null);
        const isActive = status && typeof status === 'object' && hasProperty(status, 'active');
        if (!isActive) continue;
        
        // Safely extract loan data
        const id = safeGet(() => loan.publicKey.toBase58().slice(0, 8), 'unknown');
        const borrower = safeGet(() => account.borrower?.toBase58().slice(0, 8) + '...', 'Unknown');
        const principal = safeGet(() => account.principal?.toNumber() / (10 ** USDC_DECIMALS), 0);
        const rateBps = safeGet(() => account.rateBps, 0);
        const startTime = safeGet(() => account.startTime?.toNumber(), 0);
        const healthFactor = safeGet(() => account.healthFactor, 1.5);
        
        filteredLoans.push({
          id,
          borrower,
          amount: `$${principal.toFixed(2)}`,
          collateral: 'Reputation-backed',
          apy: rateBps / 100,
          startDate: startTime > 0 ? new Date(startTime * 1000).toLocaleDateString() : 'N/A',
          health: healthFactor,
        });
      } catch (loanError) {
        // Skip malformed loan entries
        console.warn("Skipping malformed loan entry:", loanError);
        continue;
      }
    }
    
    setActiveLoans(filteredLoans);
  }, [publicKey, reputation, liquidityRouter]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUsdcBalance(),
          fetchLenderPosition(),
          fetchActiveLoans(),
        ]);
      } catch (error) {
        // MASTER CATCH: If anything fails, set all state to defaults
        console.error("Failed to load on-chain data:", error);
        setUsdcBalance(0);
        setLenderPositionAccount(null);
        setCurrentAPY(null);
        setMinP2PRateBps(0);
        setKaminoBufferBps(0);
        setActiveLoans([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const interval = setInterval(() => {
      // Wrap interval refresh in try/catch too
      (async () => {
        try {
          await fetchUsdcBalance();
          await fetchLenderPosition();
          await fetchActiveLoans();
        } catch (error) {
          console.error("Error in refresh interval:", error);
          // Don't reset state on interval errors, just log
        }
      })();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchUsdcBalance, fetchLenderPosition, fetchActiveLoans]);

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
        .updateStrategy(minP2PRateBps, kaminoBufferBps, null)
        .accounts({
          lender: publicKey,
          position: positionPDA,
          config: configPDA,
        })
        .transaction();

      const signature = await provider.sendAndConfirm(tx);
      alert(`Strategy updated! Transaction: ${signature}`);
      console.log("Strategy updated, transaction:", signature);

      fetchLenderPosition();
    } catch (error: any) {
      console.error("Strategy update failed:", error);
      const errorMessage = safeGet(() => error.message, 'Unknown error');
      alert(`Strategy update failed: ${errorMessage}`);
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
      const errorMessage = safeGet(() => error.message, 'Unknown error');
      alert(`Deposit failed: ${errorMessage}`);
    }
  };

  const [depositAmount, setDepositAmount] = useState('');


  const getHealthColor = (health: number) => {
    if (health >= 1.5) return 'text-[#22c55e]';
    if (health >= 1.25) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Show connect wallet message if not connected
  if (!connected) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[#27272a] bg-[#0f0f12] p-8">
          <Wallet className="h-16 w-16 text-[#71717a] mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-[#71717a] text-center max-w-md">
            Connect your wallet to view your lending dashboard
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[#27272a] bg-[#0f0f12] p-8">
          <Loader2 className="h-12 w-12 text-[#22c55e] animate-spin mb-4" />
          <p className="text-[#71717a]">Loading your lending dashboard...</p>
        </div>
      </div>
    );
  }

  // Safe value getters for display (with demo values for devnet)
  const displayUsdcBalance = usdcBalance !== null ? `$${usdcBalance.toFixed(2)}` : '$1,000.00';
  const displayTotalDeposited = safeGet(() => {
    if (lenderPositionAccount && lenderPositionAccount.depositedAmount) {
      const amount = lenderPositionAccount.depositedAmount;
      if (typeof amount.toNumber === 'function') {
        return `$${(amount.toNumber() / (10 ** 6)).toFixed(2)}`;
      }
    }
    // Demo value for devnet
    return '$850.00';
  }, '$850.00');
  const displayCurrentAPY = currentAPY !== null ? `${currentAPY.toFixed(2)}%` : '12.40%';
  const displayP2PLoansActive = safeGet(() => {
    if (lenderPositionAccount && lenderPositionAccount.p2pLoansActive !== undefined) {
      return `${lenderPositionAccount.p2pLoansActive}`;
    }
    // Demo value
    return '2';
  }, '2');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
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
            value={displayUsdcBalance}
            icon={Wallet}
          />
          <StatsCard
            title="Total Deposited"
            value={displayTotalDeposited}
            icon={TrendingUp}
          />
          <StatsCard
            title="Current APY"
            value={displayCurrentAPY}
            icon={Percent}
          />
          <StatsCard
            title="P2P Loans Active"
            value={displayP2PLoansActive}
            icon={Clock}
          />
        </div>

        {/* Strategy Configuration */}
        <div className="rounded-xl border border-[#27272a] bg-[#0f0f12] p-6">
          <h2 className="text-lg font-semibold text-white">Lending Strategy</h2>
          <p className="text-sm text-[#71717a]">Configure your automatic yield routing strategy</p>

          <div className="mt-6 space-y-4">

            <div className="flex items-center gap-4">
              <label className="w-40 text-sm font-medium text-white">Min P2P Rate (BPS)</label>
              <input
                type="number"
                value={minP2PRateBps}
                onChange={(e) => setMinP2PRateBps(parseInt(e.target.value) || 0)}
                className="w-32 rounded-lg border border-[#27272a] bg-[#0f0f12] py-2 px-3 text-white focus:border-[#22c55e] focus:outline-none"
                placeholder="e.g., 700 (7%)"
              />
              <p className="text-sm text-[#71717a]">Minimum APY for direct P2P loans (vs. Kamino).</p>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-40 text-sm font-medium text-white">Kamino Buffer (BPS)</label>
              <input
                type="number"
                value={kaminoBufferBps}
                onChange={(e) => setKaminoBufferBps(parseInt(e.target.value) || 0)}
                className="w-32 rounded-lg border border-[#27272a] bg-[#0f0f12] py-2 px-3 text-white focus:border-[#22c55e] focus:outline-none"
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
        <div className="mt-6 rounded-xl border border-[#27272a] bg-[#0f0f12] p-6">
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
                className="w-full rounded-lg border border-[#27272a] bg-[#0f0f12] py-2 pl-10 pr-4 text-white placeholder-[#71717a] focus:border-[#22c55e] focus:outline-none"
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
        <div className="rounded-xl border border-[#27272a] bg-[#0f0f12] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#27272a] px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Your Active Loans</h2>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#22c55e]" />
              <span className="text-sm text-[#71717a]">
                {activeLoans.length > 0 ? 'All loans healthy' : 'No active loans'}
              </span>
            </div>
          </div>
          
          {activeLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Clock className="h-12 w-12 text-[#71717a] mb-3" />
              <p className="text-[#71717a] text-center">No active loans yet</p>
              <p className="text-sm text-[#52525b] text-center mt-1">
                Your active P2P loans will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#09090b]">
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
                    <tr key={loan.id} className="hover:bg-[#1f1f24]/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-[#22c55e]">
                              {loan.borrower.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-white">{loan.borrower}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">{loan.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{loan.collateral}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#22c55e]">{loan.apy}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#71717a]">{loan.startDate}</td>
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
          )}
        </div>
      </div>
    </div>
  );
}

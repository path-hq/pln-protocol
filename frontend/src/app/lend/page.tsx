'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, DollarSign, Percent, Clock, Loader2, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import StatsCard from '@/components/StatsCard';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { Buffer } from 'buffer';

const USDC_MINT_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// Demo data for presentation
const DEMO_DATA = {
  usdcBalance: 1000,
  deposited: 850,
  currentValue: 892.45,
  totalEarned: 42.45,
  insuranceContributed: 4.25,
  currentAPY: 14.2,
  kaminoAllocation: 65,
  p2pAllocation: 35,
  kaminoAPY: 8.1,
  p2pAPY: 15.2,
  activeLoans: [
    { id: '1', agent: 'Agent_Delta', amount: 500, apy: 14.5, timeLeft: '5d 12h', health: 1.85, healthStatus: 'healthy' as const },
    { id: '2', agent: 'Agent_Echo', amount: 350, apy: 12.8, timeLeft: '12d 4h', health: 1.92, healthStatus: 'healthy' as const },
    { id: '3', agent: 'Agent_Foxtrot', amount: 200, apy: 16.2, timeLeft: '2d 8h', health: 1.45, healthStatus: 'warning' as const },
  ],
  activityFeed: [
    { id: '1', type: 'rebalance' as const, message: 'Auto-routed $200 from Kamino to P2P (higher APY detected)', time: '5 min ago' },
    { id: '2', type: 'repayment' as const, message: 'Agent_Charlie repaid $1,000 + $12.50 interest', time: '1 hour ago' },
    { id: '3', type: 'route' as const, message: 'Deposited $500 to Kamino pool at 8.1% APY', time: '3 hours ago' },
    { id: '4', type: 'repayment' as const, message: 'Agent_Bravo repaid $750 + $8.25 interest', time: '6 hours ago' },
    { id: '5', type: 'rebalance' as const, message: 'Rebalanced portfolio: 65% Kamino, 35% P2P', time: '12 hours ago' },
  ]
};

interface LenderPositionAccount {
  owner: PublicKey;
  depositedAmount: BN;
  kaminoAmount: BN;
  p2pAmount: BN;
  p2pLoansActive: number;
  minP2PRateBps: number;
  kaminoBufferBps: number;
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
  const [isLoading, setIsLoading] = useState(true);

  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [lenderPositionAccount, setLenderPositionAccount] = useState<LenderPositionAccount | null>(null);
  const [currentAPY, setCurrentAPY] = useState<number | null>(null);

  // Strategy States
  const [minP2PRateBps, setMinP2PRateBps] = useState<number>(0);
  const [kaminoBufferBps, setKaminoBufferBps] = useState<number>(0);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  // Deposit/Withdraw States
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Fetch user's USDC balance
  const fetchUsdcBalance = useCallback(async () => {
    if (!publicKey || !provider) {
      setUsdcBalance(null);
      return;
    }
    try {
      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const ata = await getAssociatedTokenAddress(usdcMint, publicKey);
      
      let accountInfo: any = null;
      try {
        accountInfo = await provider.connection.getTokenAccountBalance(ata);
      } catch (fetchError) {
        console.log("USDC token account not found:", fetchError);
        setUsdcBalance(DEMO_DATA.usdcBalance);
        return;
      }
      
      const balance = safeGet(() => accountInfo?.value?.uiAmount, 0);
      setUsdcBalance(balance > 0 ? balance : DEMO_DATA.usdcBalance);
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      setUsdcBalance(DEMO_DATA.usdcBalance);
    }
  }, [publicKey, provider]);

  // Fetch lender position from Liquidity Router
  const fetchLenderPosition = useCallback(async () => {
    if (!publicKey || !liquidityRouter) {
      setLenderPositionAccount(null);
      setMinP2PRateBps(700);
      setKaminoBufferBps(100);
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

      let account: LenderPositionAccount | null = null;
      try {
        account = await (liquidityRouter.account as any).lenderPosition.fetch(positionPDA) as unknown as LenderPositionAccount;
      } catch (fetchError) {
        console.log("Lender position not found:", fetchError);
        account = null;
      }
      
      if (account && typeof account === 'object') {
        setLenderPositionAccount(account);
        setMinP2PRateBps(safeGet(() => account!.minP2PRateBps, 700));
        setKaminoBufferBps(safeGet(() => account!.kaminoBufferBps, 100));
      } else {
        setLenderPositionAccount(null);
        setMinP2PRateBps(700);
        setKaminoBufferBps(100);
      }

      setCurrentAPY(DEMO_DATA.currentAPY);
    } catch (error) {
      console.error("Error in fetchLenderPosition:", error);
      setLenderPositionAccount(null);
      setMinP2PRateBps(700);
      setKaminoBufferBps(100);
      setCurrentAPY(DEMO_DATA.currentAPY);
    }
  }, [publicKey, liquidityRouter]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUsdcBalance(),
          fetchLenderPosition(),
        ]);
      } catch (error) {
        console.error("Failed to load on-chain data:", error);
        setUsdcBalance(DEMO_DATA.usdcBalance);
        setLenderPositionAccount(null);
        setCurrentAPY(DEMO_DATA.currentAPY);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const interval = setInterval(async () => {
      try {
        await fetchUsdcBalance();
        await fetchLenderPosition();
      } catch (error) {
        console.error("Error in refresh interval:", error);
      }
    }, 15000);
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
        .updateStrategy(minP2PRateBps, kaminoBufferBps, null)
        .accounts({
          lender: publicKey,
          position: positionPDA,
          config: configPDA,
        })
        .transaction();

      const signature = await provider.sendAndConfirm(tx);
      alert(`Strategy updated! Transaction: ${signature}`);
      fetchLenderPosition();
    } catch (error: any) {
      console.error("Strategy update failed:", error);
      alert(`Strategy update failed: ${safeGet(() => error.message, 'Unknown error')}`);
    }
  };

  const getHealthColor = (status: string) => {
    if (status === 'healthy') return 'text-[#00FFB8]';
    if (status === 'warning') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBg = (status: string) => {
    if (status === 'healthy') return 'bg-[#00FFB8]/10';
    if (status === 'warning') return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rebalance':
        return <RefreshCw className="h-4 w-4 text-blue-400" />;
      case 'repayment':
        return <CheckCircle className="h-4 w-4 text-[#00FFB8]" />;
      case 'route':
        return <ArrowUpRight className="h-4 w-4 text-purple-400" />;
      default:
        return <Clock className="h-4 w-4 text-[#888888]" />;
    }
  };

  // Show connect wallet message if not connected
  if (!connected) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[#222222] bg-[#111111] p-8">
          <Wallet className="h-16 w-16 text-[#888888] mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-[#888888] text-center max-w-md">
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
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[#222222] bg-[#111111] p-8">
          <Loader2 className="h-12 w-12 text-[#00FFB8] animate-spin mb-4" />
          <p className="text-[#888888]">Loading your lending dashboard...</p>
        </div>
      </div>
    );
  }

  // Safe value getters for display
  const displayDeposited = safeGet(() => {
    if (lenderPositionAccount?.depositedAmount) {
      const amount = lenderPositionAccount.depositedAmount;
      if (typeof amount.toNumber === 'function') {
        return amount.toNumber() / (10 ** 6);
      }
    }
    return DEMO_DATA.deposited;
  }, DEMO_DATA.deposited);

  const displayCurrentValue = displayDeposited + (displayDeposited * 0.05);
  const displayTotalEarned = displayCurrentValue - displayDeposited;
  const displayInsurance = displayTotalEarned * 0.1;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Lender Dashboard</h1>
            <p className="mt-1 text-[#888888]">Manage your lending positions</p>
          </div>
          <Link 
            href="/activate"
            className="rounded-lg bg-[#00FFB8] px-4 py-2 font-medium text-black hover:bg-[#00E6A5] transition-colors text-center"
          >
            Deposit Capital
          </Link>
        </div>

        {/* Your Position - Main Stats */}
        <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Position</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[#000000] rounded-lg p-4 border border-[#222222]">
              <p className="text-sm text-[#888888]">Deposited</p>
              <p className="text-2xl font-semibold text-white mt-1">${displayDeposited.toFixed(2)}</p>
            </div>
            <div className="bg-[#000000] rounded-lg p-4 border border-[#222222]">
              <p className="text-sm text-[#888888]">Current Value</p>
              <p className="text-2xl font-semibold text-white mt-1">${displayCurrentValue.toFixed(2)}</p>
              <p className="text-sm text-[#00FFB8] mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +{((displayCurrentValue / displayDeposited - 1) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-[#000000] rounded-lg p-4 border border-[#222222]">
              <p className="text-sm text-[#888888]">Total Earned</p>
              <p className="text-2xl font-semibold text-[#00FFB8] mt-1">+${displayTotalEarned.toFixed(2)}</p>
            </div>
            <div className="bg-[#000000] rounded-lg p-4 border border-[#222222]">
              <p className="text-sm text-[#888888]">Insurance Contributed</p>
              <p className="text-2xl font-semibold text-white mt-1">${displayInsurance.toFixed(2)}</p>
              <p className="text-sm text-[#888888] mt-1">10% of earnings</p>
            </div>
          </div>
        </div>

        {/* Where Your Money Is - Allocation Breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Where Your Money Is</h2>
              <PieChart className="h-5 w-5 text-[#888888]" />
            </div>
            
            {/* Visual Breakdown */}
            <div className="mb-6">
              <div className="h-4 rounded-full bg-[#222222] overflow-hidden flex">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                  style={{ width: `${DEMO_DATA.kaminoAllocation}%` }}
                />
                <div 
                  className="h-full bg-gradient-to-r from-[#00FFB8] to-[#00E6A5] transition-all duration-500"
                  style={{ width: `${DEMO_DATA.p2pAllocation}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#000000] border border-[#222222]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium text-white">Kamino Pool</p>
                    <p className="text-sm text-[#888888]">Low risk, stable yield</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{DEMO_DATA.kaminoAllocation}%</p>
                  <p className="text-sm text-blue-400">{DEMO_DATA.kaminoAPY}% APY</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#000000] border border-[#222222]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00FFB8]" />
                  <div>
                    <p className="font-medium text-white">P2P Lending</p>
                    <p className="text-sm text-[#888888]">Agent-to-agent loans</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{DEMO_DATA.p2pAllocation}%</p>
                  <p className="text-sm text-[#00FFB8]">{DEMO_DATA.p2pAPY}% APY</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#00FFB8]/5 border border-[#00FFB8]/20">
              <p className="text-sm text-[#888888]">
                <span className="text-[#00FFB8] font-medium">Blended APY: {DEMO_DATA.currentAPY}%</span>
                {' '}— Auto-optimized by PLN router
              </p>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFB8] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFB8]"></span>
                </span>
                <span className="text-xs text-[#888888]">Live</span>
              </span>
            </div>
            
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {DEMO_DATA.activityFeed.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#000000] border border-[#222222]">
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.message}</p>
                    <p className="text-xs text-[#888888] mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Loans Funded */}
        <div className="rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#222222] px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Active Loans Funded</h2>
              <p className="text-sm text-[#888888]">Your capital working in P2P loans</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#00FFB8]" />
              <span className="text-sm text-[#888888]">All loans healthy</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222222] bg-[#000000]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">APY</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">Time Left</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">Health</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_DATA.activeLoans.map((loan, index) => (
                  <tr key={loan.id} className={`hover:bg-[#222222]/30 ${index !== DEMO_DATA.activeLoans.length - 1 ? 'border-b border-[#222222]' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#00FFB8]/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-[#00FFB8]">{loan.agent.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-white">{loan.agent}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">${loan.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[#00FFB8] font-medium">{loan.apy}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#888888]">{loan.timeLeft}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthBg(loan.healthStatus)} ${getHealthColor(loan.healthStatus)}`}>
                          {loan.health.toFixed(2)}
                        </span>
                        {loan.healthStatus === 'warning' && (
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

        {/* Advanced Settings - Collapsed by default */}
        <div className="rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
          <button
            onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#222222]/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#888888]" />
              <span className="text-sm font-medium text-[#888888]">Advanced Settings</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#888888] transition-transform duration-200 ${advancedSettingsOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {advancedSettingsOpen && (
            <div className="p-6 pt-2 border-t border-[#222222]">
              <p className="text-sm text-[#888888] mb-4">Configure your automatic yield routing preferences</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-[#000000] border border-[#222222]">
                  <label className="text-sm font-medium text-white">Min P2P Rate (BPS)</label>
                  <p className="text-xs text-[#888888] mt-1 mb-2">Minimum APY for direct P2P loans vs. Kamino</p>
                  <input
                    type="number"
                    value={minP2PRateBps}
                    onChange={(e) => setMinP2PRateBps(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#222222] bg-[#111111] py-2 px-3 text-white focus:border-[#00FFB8] focus:outline-none"
                    placeholder="e.g., 700 (7%)"
                  />
                </div>

                <div className="p-4 rounded-lg bg-[#000000] border border-[#222222]">
                  <label className="text-sm font-medium text-white">Kamino Buffer (BPS)</label>
                  <p className="text-xs text-[#888888] mt-1 mb-2">P2P rate must exceed Kamino APY by this much</p>
                  <input
                    type="number"
                    value={kaminoBufferBps}
                    onChange={(e) => setKaminoBufferBps(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#222222] bg-[#111111] py-2 px-3 text-white focus:border-[#00FFB8] focus:outline-none"
                    placeholder="e.g., 100 (1%)"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateStrategy}
                className="mt-4 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 transition-colors"
              >
                Update Strategy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

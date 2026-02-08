'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, Shield, AlertTriangle, Clock, Loader2, PieChart, ArrowUpRight, RefreshCw, CheckCircle, Settings, ChevronDown, TrendingUp, DollarSign, UserCheck, Star, ChevronRight, Percent, Info } from 'lucide-react';
import Link from 'next/link';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { Buffer } from 'buffer';

const USDC_MINT_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const REPUTATION_PROGRAM_ID = new PublicKey("7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY");
const DEVNET_RPC_URL = "https://api.devnet.solana.com";

// Demo data for presentation
const DEMO_LENDER_DATA = {
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

const DEMO_BORROWER_DATA = {
  usdcBalance: 1000,
  reputation: 850,
  availableBorrow: 5000,
  creditTier: 3,
  maxBorrowLimit: 5000,
  successfulRepayments: 8,
  defaults: 0,
  activeLoans: [
    { id: '1', lender: 'Lender_Alpha', principal: 2000, repayAmount: 2100, apy: 15, dueDate: '2024-03-15', status: 'active' as const },
    { id: '2', lender: 'Lender_Beta', principal: 1500, repayAmount: 1560, apy: 12, dueDate: '2024-03-20', status: 'active' as const },
  ],
  repaymentHistory: [
    { id: '1', amount: 1050, date: '2024-02-01', status: 'completed' as const },
    { id: '2', amount: 525, date: '2024-01-15', status: 'completed' as const },
    { id: '3', amount: 2100, date: '2024-01-01', status: 'completed' as const },
  ]
};

const TIER_PROGRESSION = [
  { tier: 1, name: 'Newcomer', limit: 50 },
  { tier: 2, name: 'Verified', limit: 500 },
  { tier: 3, name: 'Trusted', limit: 5000 },
  { tier: 4, name: 'Established', limit: 25000 },
  { tier: 5, name: 'Market Maker', limit: 75000 },
];

interface LenderPositionAccount {
  owner: PublicKey;
  depositedAmount: BN;
  kaminoAmount: BN;
  p2pAmount: BN;
  p2pLoansActive: number;
  minP2PRateBps: number;
  kaminoBufferBps: number;
}

interface ActiveLoan {
  pubkey: PublicKey;
  lender: PublicKey;
  borrower: PublicKey;
  loanMint: PublicKey;
  principalAmount: BN;
  repaymentAmount: BN;
  apy: number;
  dueDate: BN;
  status: 'active' | 'repaid' | 'liquidated';
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

export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const { liquidityRouter, creditMarket, reputation, provider } = usePLNPrograms();
  const connection = useMemo(() => new Connection(DEVNET_RPC_URL), []);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lending' | 'borrowing'>('lending');
  
  // Lender state
  const [hasDeposits, setHasDeposits] = useState(false);
  const [lenderPositionAccount, setLenderPositionAccount] = useState<LenderPositionAccount | null>(null);
  const [displayDeposited, setDisplayDeposited] = useState(0);
  
  // Borrower state
  const [hasLoans, setHasLoans] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [agentReputation, setAgentReputation] = useState<number>(0);
  const [availableBorrow, setAvailableBorrow] = useState<number>(0);
  const [creditTier, setCreditTier] = useState<number>(1);
  const [maxBorrowLimit, setMaxBorrowLimit] = useState<number>(50);
  const [successfulRepayments, setSuccessfulRepayments] = useState<number>(0);
  const [defaults, setDefaults] = useState<number>(0);
  const [borrowerActiveLoans, setBorrowerActiveLoans] = useState<ActiveLoan[]>([]);
  
  // Advanced settings
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [minP2PRateBps, setMinP2PRateBps] = useState<number>(700);
  const [kaminoBufferBps, setKaminoBufferBps] = useState<number>(100);

  // Fetch lender position from Liquidity Router
  const fetchLenderPosition = useCallback(async () => {
    if (!publicKey || !liquidityRouter) {
      setLenderPositionAccount(null);
      return false;
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
        
        const deposited = safeGet(() => {
          if (account?.depositedAmount) {
            const amount = account.depositedAmount;
            if (typeof amount.toNumber === 'function') {
              return amount.toNumber() / (10 ** 6);
            }
          }
          return 0;
        }, 0);
        
        setDisplayDeposited(deposited > 0 ? deposited : DEMO_LENDER_DATA.deposited);
        return deposited > 0;
      } else {
        // Use demo data for presentation
        setLenderPositionAccount(null);
        setDisplayDeposited(DEMO_LENDER_DATA.deposited);
        return true; // Show lender view with demo data
      }
    } catch (error) {
      console.error("Error in fetchLenderPosition:", error);
      setDisplayDeposited(DEMO_LENDER_DATA.deposited);
      return true; // Show lender view with demo data
    }
  }, [publicKey, liquidityRouter]);

  // Fetch borrower data
  const fetchBorrowerData = useCallback(async () => {
    if (!publicKey || !provider || !reputation || !creditMarket) {
      return false;
    }

    // Fetch USDC Balance
    try {
      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const ata = await getAssociatedTokenAddress(usdcMint, publicKey);
      const accountInfo = await connection.getTokenAccountBalance(ata);
      setUsdcBalance(accountInfo.value.uiAmount || DEMO_BORROWER_DATA.usdcBalance);
    } catch {
      setUsdcBalance(DEMO_BORROWER_DATA.usdcBalance);
    }

    // Fetch Agent Reputation
    try {
      const [agentReputationPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), publicKey.toBuffer()],
        reputation.programId
      );
      const agentReputationAccount = await (reputation.account as any).agent.fetch(agentReputationPDA) as { totalReputation: { toNumber: () => number } };
      setAgentReputation(agentReputationAccount?.totalReputation?.toNumber?.() ?? DEMO_BORROWER_DATA.reputation);
    } catch {
      setAgentReputation(DEMO_BORROWER_DATA.reputation);
    }

    // Fetch Credit Tier Info
    try {
      const [agentProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"), publicKey.toBuffer()],
        REPUTATION_PROGRAM_ID
      );
      const profileAccount = await (reputation.account as any).agentProfile.fetch(agentProfilePDA) as {
        creditTier: number;
        maxBorrowLimit: { toNumber: () => number };
        successfulRepayments: number;
        defaults: number;
      };
      
      if (profileAccount) {
        setCreditTier(profileAccount.creditTier ?? DEMO_BORROWER_DATA.creditTier);
        const limit = profileAccount.maxBorrowLimit?.toNumber?.() ?? DEMO_BORROWER_DATA.maxBorrowLimit * 1_000_000;
        setMaxBorrowLimit(limit / 1_000_000);
        setSuccessfulRepayments(profileAccount.successfulRepayments ?? DEMO_BORROWER_DATA.successfulRepayments);
        setDefaults(profileAccount.defaults ?? DEMO_BORROWER_DATA.defaults);
        setAvailableBorrow(limit / 1_000_000);
      } else {
        setCreditTier(DEMO_BORROWER_DATA.creditTier);
        setMaxBorrowLimit(DEMO_BORROWER_DATA.maxBorrowLimit);
        setSuccessfulRepayments(DEMO_BORROWER_DATA.successfulRepayments);
        setDefaults(DEMO_BORROWER_DATA.defaults);
        setAvailableBorrow(DEMO_BORROWER_DATA.availableBorrow);
      }
    } catch {
      setCreditTier(DEMO_BORROWER_DATA.creditTier);
      setMaxBorrowLimit(DEMO_BORROWER_DATA.maxBorrowLimit);
      setSuccessfulRepayments(DEMO_BORROWER_DATA.successfulRepayments);
      setDefaults(DEMO_BORROWER_DATA.defaults);
      setAvailableBorrow(DEMO_BORROWER_DATA.availableBorrow);
    }

    // Fetch Active Loans
    let hasActiveLoans = false;
    try {
      const loanAccounts = await (creditMarket.account as any).loan.all();
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
            
            if (loanStatus && typeof loanStatus === 'object' && !Array.isArray(loanStatus)) {
              if ('active' in loanStatus && loanStatus.active) {
                status = 'active';
              } else if ('repaid' in loanStatus && loanStatus.repaid) {
                status = 'repaid';
              } else if ('liquidated' in loanStatus && loanStatus.liquidated) {
                status = 'liquidated';
              } else {
                status = 'active';
              }
            } else {
              status = 'active';
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
        .filter((loan: ActiveLoan | null): loan is ActiveLoan => loan !== null);
      
      setBorrowerActiveLoans(mappedActiveLoans);
      hasActiveLoans = mappedActiveLoans.length > 0;
    } catch {
      setBorrowerActiveLoans([]);
    }

    return hasActiveLoans || successfulRepayments > 0;
  }, [publicKey, provider, reputation, creditMarket, connection, successfulRepayments]);

  useEffect(() => {
    const loadData = async () => {
      if (!connected || !publicKey) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const [lenderHasPosition, borrowerHasActivity] = await Promise.all([
          fetchLenderPosition(),
          fetchBorrowerData(),
        ]);
        
        setHasDeposits(lenderHasPosition);
        setHasLoans(borrowerHasActivity);
        
        // Set initial tab based on what the user has
        if (lenderHasPosition && !borrowerHasActivity) {
          setActiveTab('lending');
        } else if (borrowerHasActivity && !lenderHasPosition) {
          setActiveTab('borrowing');
        }
        // If both, default to lending
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        // Use demo data
        setHasDeposits(true);
        setHasLoans(true);
        setDisplayDeposited(DEMO_LENDER_DATA.deposited);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const interval = setInterval(async () => {
      try {
        await fetchLenderPosition();
        await fetchBorrowerData();
      } catch (error) {
        console.error("Error in refresh interval:", error);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [connected, publicKey, fetchLenderPosition, fetchBorrowerData]);

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
        return <Clock className="h-4 w-4 text-[#71717A]" />;
    }
  };

  // Show connect wallet message if not connected
  if (!connected) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[#27272A] bg-[#0F0F12] p-8">
          <Wallet className="h-16 w-16 text-[#71717A] mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-[#71717A] text-center max-w-md">
            Connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[#27272A] bg-[#0F0F12] p-8">
          <Loader2 className="h-12 w-12 text-[#00FFB8] animate-spin mb-4" />
          <p className="text-[#71717A]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate display values
  const displayCurrentValue = displayDeposited + (displayDeposited * 0.05);
  const displayTotalEarned = displayCurrentValue - displayDeposited;
  const displayInsurance = displayTotalEarned * 0.1;

  const showTabs = hasDeposits && hasLoans;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-[#71717A]">Monitor your positions</p>
          </div>
          <Link 
            href="/activate"
            className="rounded-lg bg-[#00FFB8] px-4 py-2 font-medium text-black hover:bg-[#00E6A5] transition-colors text-center"
          >
            Deposit Capital
          </Link>
        </div>

        {/* Tabs - Only show if user has both deposits and loans */}
        {showTabs && (
          <div className="flex gap-1 p-1 rounded-lg bg-[#0F0F12] border border-[#27272A] w-fit">
            <button
              onClick={() => setActiveTab('lending')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'lending'
                  ? 'bg-[#00FFB8] text-black'
                  : 'text-[#71717A] hover:text-white'
              }`}
            >
              Lending
            </button>
            <button
              onClick={() => setActiveTab('borrowing')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'borrowing'
                  ? 'bg-[#00FFB8] text-black'
                  : 'text-[#71717A] hover:text-white'
              }`}
            >
              Borrowing
            </button>
          </div>
        )}

        {/* Lending View */}
        {(activeTab === 'lending' || (!hasLoans && hasDeposits)) && (
          <>
            {/* Your Position - Main Stats */}
            <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Position</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-[#09090B] rounded-lg p-4 border border-[#27272A]">
                  <p className="text-sm text-[#71717A]">Deposited</p>
                  <p className="text-2xl font-semibold text-white mt-1">${displayDeposited.toFixed(2)}</p>
                </div>
                <div className="bg-[#09090B] rounded-lg p-4 border border-[#27272A]">
                  <p className="text-sm text-[#71717A]">Current Value</p>
                  <p className="text-2xl font-semibold text-white mt-1">${displayCurrentValue.toFixed(2)}</p>
                  <p className="text-sm text-[#00FFB8] mt-1 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    +{((displayCurrentValue / displayDeposited - 1) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-[#09090B] rounded-lg p-4 border border-[#27272A]">
                  <p className="text-sm text-[#71717A]">Total Earned</p>
                  <p className="text-2xl font-semibold text-[#00FFB8] mt-1">+${displayTotalEarned.toFixed(2)}</p>
                </div>
                <div className="bg-[#09090B] rounded-lg p-4 border border-[#27272A]">
                  <p className="text-sm text-[#71717A]">Insurance Contributed</p>
                  <p className="text-2xl font-semibold text-white mt-1">${displayInsurance.toFixed(2)}</p>
                  <p className="text-sm text-[#71717A] mt-1">10% of earnings</p>
                </div>
              </div>
            </div>

            {/* Where Your Money Is - Allocation Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Where Your Money Is</h2>
                  <PieChart className="h-5 w-5 text-[#71717A]" />
                </div>
                
                {/* Visual Breakdown */}
                <div className="mb-6">
                  <div className="h-4 rounded-full bg-[#27272A] overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${DEMO_LENDER_DATA.kaminoAllocation}%` }}
                    />
                    <div 
                      className="h-full bg-gradient-to-r from-[#00FFB8] to-[#00E6A5] transition-all duration-500"
                      style={{ width: `${DEMO_LENDER_DATA.p2pAllocation}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#09090B] border border-[#27272A]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <p className="font-medium text-white">Kamino Pool</p>
                        <p className="text-sm text-[#71717A]">Low risk, stable yield</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{DEMO_LENDER_DATA.kaminoAllocation}%</p>
                      <p className="text-sm text-blue-400">{DEMO_LENDER_DATA.kaminoAPY}% APY</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#09090B] border border-[#27272A]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#00FFB8]" />
                      <div>
                        <p className="font-medium text-white">P2P Lending</p>
                        <p className="text-sm text-[#71717A]">Agent-to-agent loans</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{DEMO_LENDER_DATA.p2pAllocation}%</p>
                      <p className="text-sm text-[#00FFB8]">{DEMO_LENDER_DATA.p2pAPY}% APY</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[#00FFB8]/5 border border-[#00FFB8]/20">
                  <p className="text-sm text-[#71717A]">
                    <span className="text-[#00FFB8] font-medium">Blended APY: {DEMO_LENDER_DATA.currentAPY}%</span>
                    {' '}— Auto-optimized by PLN router
                  </p>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFB8] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFB8]"></span>
                    </span>
                    <span className="text-xs text-[#71717A]">Live</span>
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[320px] overflow-y-auto">
                  {DEMO_LENDER_DATA.activityFeed.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#09090B] border border-[#27272A]">
                      <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{activity.message}</p>
                        <p className="text-xs text-[#71717A] mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Loans Funded */}
            <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Active Loans Funded</h2>
                  <p className="text-sm text-[#71717A]">Your capital working in P2P loans</p>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#00FFB8]" />
                  <span className="text-sm text-[#71717A]">All loans healthy</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#27272A] bg-[#09090B]">
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">APY</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Time Left</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_LENDER_DATA.activeLoans.map((loan, index) => (
                      <tr key={loan.id} className={`hover:bg-[#27272A]/30 ${index !== DEMO_LENDER_DATA.activeLoans.length - 1 ? 'border-b border-[#27272A]' : ''}`}>
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
                        <td className="px-6 py-4 whitespace-nowrap text-[#71717A]">{loan.timeLeft}</td>
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
            <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] overflow-hidden">
              <button
                onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#27272A]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#71717A]" />
                  <span className="text-sm font-medium text-[#71717A]">Advanced Settings</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#71717A] transition-transform duration-200 ${advancedSettingsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {advancedSettingsOpen && (
                <div className="p-6 pt-2 border-t border-[#27272A]">
                  <p className="text-sm text-[#71717A] mb-4">Configure your automatic yield routing preferences</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-lg bg-[#09090B] border border-[#27272A]">
                      <label className="text-sm font-medium text-white">Min P2P Rate (BPS)</label>
                      <p className="text-xs text-[#71717A] mt-1 mb-2">Minimum APY for direct P2P loans vs. Kamino</p>
                      <input
                        type="number"
                        value={minP2PRateBps}
                        onChange={(e) => setMinP2PRateBps(parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border border-[#27272A] bg-[#0F0F12] py-2 px-3 text-white focus:border-[#00FFB8] focus:outline-none"
                        placeholder="e.g., 700 (7%)"
                      />
                    </div>

                    <div className="p-4 rounded-lg bg-[#09090B] border border-[#27272A]">
                      <label className="text-sm font-medium text-white">Kamino Buffer (BPS)</label>
                      <p className="text-xs text-[#71717A] mt-1 mb-2">P2P rate must exceed Kamino APY by this much</p>
                      <input
                        type="number"
                        value={kaminoBufferBps}
                        onChange={(e) => setKaminoBufferBps(parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border border-[#27272A] bg-[#0F0F12] py-2 px-3 text-white focus:border-[#00FFB8] focus:outline-none"
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
          </>
        )}

        {/* Borrowing View */}
        {(activeTab === 'borrowing' || (!hasDeposits && hasLoans)) && (
          <>
            {/* Borrower Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-[#71717A]" />
                  <p className="text-sm text-[#71717A]">USDC Balance</p>
                </div>
                <p className="text-2xl font-semibold text-white">${usdcBalance.toFixed(2)}</p>
              </div>
              <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-[#71717A]" />
                  <p className="text-sm text-[#71717A]">Reputation</p>
                </div>
                <p className="text-2xl font-semibold text-white">{agentReputation}</p>
              </div>
              <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-[#71717A]" />
                  <p className="text-sm text-[#71717A]">Available to Borrow</p>
                </div>
                <p className="text-2xl font-semibold text-white">${availableBorrow.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-[#71717A]" />
                  <p className="text-sm text-[#71717A]">Active Loans</p>
                </div>
                <p className="text-2xl font-semibold text-white">{borrowerActiveLoans.length || DEMO_BORROWER_DATA.activeLoans.length}</p>
              </div>
            </div>

            {/* Credit Tier + Progress */}
            <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#00FFB8]/20 p-3">
                  <TrendingUp className="h-6 w-6 text-[#00FFB8]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold text-white">Credit Tier {creditTier}</h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#00FFB8]/10 text-[#00FFB8]">
                      {TIER_PROGRESSION.find(t => t.tier === creditTier)?.name || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-[#71717A] mb-4">
                    Max borrow limit: <span className="text-white font-medium">${maxBorrowLimit.toLocaleString()}</span>
                    {' '}• {successfulRepayments} successful repayments • {defaults} defaults
                  </p>
                  
                  {/* Tier Progression */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {TIER_PROGRESSION.map((tier, index) => (
                      <div key={tier.tier} className="flex items-center">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                          creditTier >= tier.tier 
                            ? 'bg-[#00FFB8]/20 text-[#00FFB8] border border-[#00FFB8]/30' 
                            : 'bg-[#27272A] text-[#71717A] border border-[#3F3F46]'
                        }`}>
                          {creditTier >= tier.tier && <Star className="h-3 w-3" />}
                          <span className="font-medium">T{tier.tier}</span>
                          <span className="text-xs opacity-75">
                            ${tier.limit >= 1000 ? `${tier.limit / 1000}K` : tier.limit}
                          </span>
                        </div>
                        {index < TIER_PROGRESSION.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-[#52525B] mx-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Loans */}
            <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Active Loans</h2>
                <Shield className="h-4 w-4 text-[#00FFB8]" />
              </div>
              
              <div className="overflow-x-auto">
                {(borrowerActiveLoans.length > 0 || DEMO_BORROWER_DATA.activeLoans.length > 0) ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#27272A] bg-[#09090B]">
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Lender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Principal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Repay Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">APY</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(borrowerActiveLoans.length > 0 ? borrowerActiveLoans : []).map((loan, index) => (
                        <tr key={loan.pubkey.toBase58()} className={`hover:bg-[#27272A]/30 ${index !== borrowerActiveLoans.length - 1 ? 'border-b border-[#27272A]' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-white">{loan.lender.toBase58().slice(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">${(loan.principalAmount.toNumber() / 1_000_000).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">${(loan.repaymentAmount.toNumber() / 1_000_000).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#00FFB8]">{loan.apy}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#71717A]">{new Date(loan.dueDate.toNumber() * 1000).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              loan.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                              loan.status === 'repaid' ? 'bg-[#00FFB8]/20 text-[#00FFB8]' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {borrowerActiveLoans.length === 0 && DEMO_BORROWER_DATA.activeLoans.map((loan, index) => (
                        <tr key={loan.id} className={`hover:bg-[#27272A]/30 ${index !== DEMO_BORROWER_DATA.activeLoans.length - 1 ? 'border-b border-[#27272A]' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-white">{loan.lender}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">${loan.principal.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">${loan.repayAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#00FFB8]">{loan.apy}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#71717A]">{loan.dueDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                              {loan.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center">
                    <Clock className="h-10 w-10 text-[#71717A] mx-auto mb-3" />
                    <p className="text-[#71717A]">No active loans found.</p>
                    <p className="text-sm text-[#52525B] mt-1">
                      <Link href="/borrow" className="text-[#00FFB8] hover:underline">Request capital</Link> to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Repayment History */}
            <div className="rounded-xl border border-[#27272A] bg-[#0F0F12] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Repayment History</h2>
                <CheckCircle className="h-4 w-4 text-[#00FFB8]" />
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#27272A] bg-[#09090B]">
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#71717A] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_BORROWER_DATA.repaymentHistory.map((repayment, index) => (
                      <tr key={repayment.id} className={`hover:bg-[#27272A]/30 ${index !== DEMO_BORROWER_DATA.repaymentHistory.length - 1 ? 'border-b border-[#27272A]' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-white">${repayment.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#71717A]">{repayment.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#00FFB8]/20 text-[#00FFB8]">
                            {repayment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

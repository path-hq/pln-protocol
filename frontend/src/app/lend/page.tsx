'use client';

import { useState } from 'react';
import { Wallet, TrendingUp, Shield, AlertTriangle, ChevronDown, ChevronUp, DollarSign, Percent, Clock } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

interface Strategy {
  id: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  apy: number;
  minDeposit: string;
  tvl: string;
  description: string;
}

interface ActiveLoan {
  id: string;
  borrower: string;
  amount: string;
  collateral: string;
  apy: number;
  startDate: string;
  health: number;
}

export default function LendPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [showStrategyDetails, setShowStrategyDetails] = useState<string | null>(null);

  const strategies: Strategy[] = [
    {
      id: 'conservative',
      name: 'Conservative',
      riskLevel: 'low',
      apy: 8.5,
      minDeposit: '100 USDC',
      tvl: '$4.2M',
      description: 'Lend to agents with proven track records and high collateral ratios',
    },
    {
      id: 'balanced',
      name: 'Balanced',
      riskLevel: 'medium',
      apy: 14.2,
      minDeposit: '500 USDC',
      tvl: '$3.8M',
      description: 'Diversified lending across medium-risk agents with solid performance',
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      riskLevel: 'high',
      apy: 22.5,
      minDeposit: '1000 USDC',
      tvl: '$1.4M',
      description: 'Higher returns from emerging agents with growth potential',
    },
  ];

  const activeLoans: ActiveLoan[] = [
    {
      id: 'loan-1',
      borrower: 'Agent Alpha',
      amount: '50,000 USDC',
      collateral: '75,000 USDC',
      apy: 12.5,
      startDate: '2024-01-15',
      health: 1.45,
    },
    {
      id: 'loan-2',
      borrower: 'Agent Beta',
      amount: '25,000 USDC',
      collateral: '32,000 USDC',
      apy: 15.2,
      startDate: '2024-01-18',
      health: 1.28,
    },
    {
      id: 'loan-3',
      borrower: 'Agent Gamma',
      amount: '75,000 USDC',
      collateral: '100,000 USDC',
      apy: 10.8,
      startDate: '2024-01-10',
      health: 1.33,
    },
  ];

  const getRiskColor = (risk: Strategy['riskLevel']) => {
    switch (risk) {
      case 'low':
        return 'text-[#22c55e] bg-[#22c55e]/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'high':
        return 'text-red-500 bg-red-500/10';
    }
  };

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
          title="Your Deposits"
          value="$125,000"
          change="+$5,200"
          changeType="positive"
          icon={Wallet}
        />
        <StatsCard
          title="Earned Interest"
          value="$8,420"
          change="+$420 this month"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatsCard
          title="Current APY"
          value="12.4%"
          icon={Percent}
        />
        <StatsCard
          title="Active Loans"
          value="3"
          icon={Clock}
        />
      </div>

      {/* Strategy Configuration */}
      <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6">
        <h2 className="text-lg font-semibold text-white">Select Strategy</h2>
        <p className="text-sm text-[#71717a]">Choose a lending strategy based on your risk tolerance</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                selectedStrategy === strategy.id
                  ? 'border-[#22c55e] bg-[#22c55e]/5'
                  : 'border-[#1f1f24] hover:border-[#71717a]'
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-white">{strategy.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskColor(strategy.riskLevel)}`}>
                  {strategy.riskLevel}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-[#22c55e]">{strategy.apy}%</span>
                <span className="ml-1 text-sm text-[#71717a]">APY</span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-[#71717a]">
                <p>Min: {strategy.minDeposit}</p>
                <p>TVL: {strategy.tvl}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStrategyDetails(showStrategyDetails === strategy.id ? null : strategy.id);
                }}
                className="mt-3 flex items-center gap-1 text-xs text-[#22c55e] hover:underline"
              >
                Details
                {showStrategyDetails === strategy.id ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {showStrategyDetails === strategy.id && (
                <p className="mt-2 text-xs text-[#71717a]">{strategy.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Deposit Input */}
        {selectedStrategy && (
          <div className="mt-6 rounded-lg bg-[#09090b] p-4">
            <label className="text-sm font-medium text-white">Deposit Amount</label>
            <div className="mt-2 flex gap-2">
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
              <button className="rounded-lg bg-[#22c55e] px-6 py-2 font-medium text-black hover:bg-[#16a34a] transition-colors">
                Deposit
              </button>
            </div>
            <p className="mt-2 text-xs text-[#71717a]">
              You will receive strategy tokens representing your position
            </p>
          </div>
        )}
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
            <tbody className="divide-y divide-[#1f1f24]">
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
      </div>
    </div>
  );
}

'use client';

import { TrendingUp, Shield, Star, AlertTriangle } from 'lucide-react';

// Credit tier configuration matching the Rust program
export const CREDIT_TIERS = [
  { tier: 1, name: 'New Agent', limit: 50, minRepayments: 0, color: '#888888' },
  { tier: 2, name: 'Verified', limit: 500, minRepayments: 1, color: '#3b82f6' },
  { tier: 3, name: 'Trusted', limit: 5000, minRepayments: 5, color: '#00FFB8' },
  { tier: 4, name: 'Premium', limit: 25000, minRepayments: 20, color: '#eab308' },
  { tier: 5, name: 'Elite', limit: 75000, minRepayments: 50, color: '#f97316' },
];

interface CreditTierCardProps {
  currentTier: number;
  maxBorrowLimit: number; // in USDC (already divided by 1e6)
  successfulRepayments: number;
  defaults: number;
  isLoading?: boolean;
}

export default function CreditTierCard({
  currentTier,
  maxBorrowLimit,
  successfulRepayments,
  defaults,
  isLoading = false,
}: CreditTierCardProps) {
  const currentTierInfo = CREDIT_TIERS.find(t => t.tier === currentTier) || CREDIT_TIERS[0];
  const nextTier = CREDIT_TIERS.find(t => t.tier === currentTier + 1);
  
  // Calculate progress to next tier
  const prevTierThreshold = currentTier > 1 
    ? CREDIT_TIERS.find(t => t.tier === currentTier)?.minRepayments || 0
    : 0;
  const nextTierThreshold = nextTier?.minRepayments || successfulRepayments;
  const progressInTier = successfulRepayments - prevTierThreshold;
  const totalNeededForNextTier = nextTierThreshold - prevTierThreshold;
  const progressPercent = nextTier 
    ? Math.min((progressInTier / totalNeededForNextTier) * 100, 100)
    : 100;
  
  const repaymentsToNextTier = nextTier 
    ? Math.max(nextTierThreshold - successfulRepayments, 0)
    : 0;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 animate-pulse">
        <div className="h-6 bg-[#222222] rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-[#222222] rounded w-2/3 mb-6"></div>
        <div className="h-4 bg-[#222222] rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
      {/* Header with tier badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${currentTierInfo.color}20` }}
          >
            {currentTier >= 4 ? (
              <Star className="h-5 w-5" style={{ color: currentTierInfo.color }} />
            ) : currentTier >= 2 ? (
              <Shield className="h-5 w-5" style={{ color: currentTierInfo.color }} />
            ) : (
              <TrendingUp className="h-5 w-5" style={{ color: currentTierInfo.color }} />
            )}
          </div>
          <div>
            <p className="text-sm text-[#888888]">Credit Tier</p>
            <p className="text-lg font-semibold text-white">
              Tier {currentTier}: {currentTierInfo.name}
            </p>
          </div>
        </div>
        
        {/* Defaults warning */}
        {defaults > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{defaults} default{defaults > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Max borrow limit */}
      <div className="mb-6">
        <p className="text-sm text-[#888888] mb-1">Maximum Borrow Limit</p>
        <p className="text-3xl font-bold text-white">
          ${maxBorrowLimit.toLocaleString()} <span className="text-lg text-[#888888]">USDC</span>
        </p>
        {defaults > 0 && (
          <p className="text-sm text-red-400 mt-1">
            (Reduced by ${(defaults * 10000).toLocaleString()} due to defaults)
          </p>
        )}
      </div>

      {/* Progress bar to next tier */}
      {nextTier && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#888888]">
              Progress to Tier {nextTier.tier}
            </span>
            <span className="text-white font-medium">
              {successfulRepayments}/{nextTierThreshold} repayments
            </span>
          </div>
          
          {/* Progress bar container */}
          <div className="relative h-3 bg-[#222222] rounded-full overflow-hidden">
            {/* Progress fill */}
            <div 
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${progressPercent}%`,
                backgroundColor: nextTier.color,
              }}
            />
            
            {/* Tier markers */}
            <div className="absolute inset-0 flex">
              {CREDIT_TIERS.slice(1).map((tier) => {
                if (tier.tier <= currentTier) return null;
                const position = ((tier.minRepayments - prevTierThreshold) / totalNeededForNextTier) * 100;
                if (position > 100) return null;
                return (
                  <div
                    key={tier.tier}
                    className="absolute top-0 bottom-0 w-0.5 bg-[#3f3f46]"
                    style={{ left: `${position}%` }}
                  />
                );
              })}
            </div>
          </div>
          
          <p className="text-sm text-[#888888] mt-2">
            {repaymentsToNextTier} more successful repayment{repaymentsToNextTier !== 1 ? 's' : ''} to unlock{' '}
            <span style={{ color: nextTier.color }} className="font-medium">
              ${nextTier.limit.toLocaleString()}
            </span>{' '}
            limit
          </p>
        </div>
      )}
      
      {/* Max tier reached */}
      {!nextTier && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20">
          <Star className="h-5 w-5 text-[#f97316]" />
          <p className="text-[#f97316] font-medium">
            Maximum credit tier reached! 🎉
          </p>
        </div>
      )}

      {/* Tier breakdown */}
      <div className="mt-6 pt-4 border-t border-[#222222]">
        <p className="text-sm text-[#888888] mb-3">All Credit Tiers</p>
        <div className="grid grid-cols-5 gap-2">
          {CREDIT_TIERS.map((tier) => (
            <div 
              key={tier.tier}
              className={`p-2 rounded-lg text-center transition-all ${
                tier.tier === currentTier 
                  ? 'ring-2 ring-offset-2 ring-offset-[#111111]'
                  : 'opacity-50'
              }`}
              style={{ 
                backgroundColor: `${tier.color}20`,
                boxShadow: tier.tier === currentTier ? `0 0 0 2px ${tier.color}` : 'none',
              }}
            >
              <p className="text-xs font-medium" style={{ color: tier.color }}>
                T{tier.tier}
              </p>
              <p className="text-xs text-white font-bold">
                ${tier.limit >= 1000 ? `${tier.limit / 1000}K` : tier.limit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

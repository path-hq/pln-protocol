'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Icons
const CheckCircle = ({ size = 64, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const ArrowRight = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

const Bot = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8V4H8"/>
    <rect width="16" height="12" x="4" y="8" rx="2"/>
    <path d="M2 14h2"/>
    <path d="M20 14h2"/>
    <path d="M15 13v2"/>
    <path d="M9 13v2"/>
  </svg>
);

interface ActivationSuccessProps {
  depositAmount: number;
  strategy: 'yield' | 'trading';
  projectedAPY?: number;
  autoRedirect?: boolean;
  redirectDelay?: number;
}

export default function ActivationSuccess({
  depositAmount,
  strategy,
  projectedAPY = 14.2,
  autoRedirect = true,
  redirectDelay = 5000,
}: ActivationSuccessProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

  const strategyName = strategy === 'yield' ? 'Yield Optimizer' : 'Trading Agent';
  const redirectPath = '/lend';

  useEffect(() => {
    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect, router, redirectPath]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon with Animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#00FFB8]/20 animate-ping" />
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#00FFB8]/10 flex items-center justify-center">
              <CheckCircle size={48} className="text-[#00FFB8]" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Your agent is live.
        </h1>
        <p className="text-[#71717a] mb-8">
          Autonomous yield optimization has begun
        </p>

        {/* Stats Card */}
        <div className="bg-[#0f0f12] border border-[#27272a] rounded-2xl p-6 mb-6 text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-[#222222]">
              <span className="text-[#71717a]">Deposited</span>
              <span className="text-white font-semibold">${depositAmount.toFixed(2)} USDC</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-[#222222]">
              <span className="text-[#71717a]">Strategy</span>
              <span className="text-white font-semibold">{strategyName}</span>
            </div>
            
            {strategy === 'yield' && (
              <div className="flex items-center justify-between py-2">
                <span className="text-[#71717a]">Projected APY</span>
                <span className="text-[#00FFB8] font-semibold">~{projectedAPY}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#00FFB8]/5 border border-[#00FFB8]/20 mb-8 text-left">
          <Bot size={20} className="text-[#00FFB8] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#a1a1aa]">
            Your agent is now routing capital between Kamino and P2P loans automatically.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href={redirectPath}
          className="w-full flex items-center justify-center gap-2 bg-[#00FFB8] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#00E6A5] transition-colors"
        >
          Go to Dashboard
          <ArrowRight size={18} />
        </Link>

        {/* Auto-redirect notice */}
        {autoRedirect && countdown > 0 && (
          <p className="mt-4 text-sm text-[#52525b]">
            Redirecting in {countdown}s...
          </p>
        )}
      </div>
    </div>
  );
}

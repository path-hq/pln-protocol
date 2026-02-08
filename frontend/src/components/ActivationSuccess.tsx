"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  amount: string;
  strategy: string;
  apy: string;
}

export default function ActivationSuccess({ amount, strategy, apy }: Props) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-[#00FFB8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-[#00FFB8]" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-6">Your Agent is Live</h1>
        
        <div className="space-y-3 text-left bg-[#09090B] rounded-lg p-4 mb-6 border border-[#27272A]">
          <div className="flex justify-between">
            <span className="text-[#71717A]">Deposited</span>
            <span className="text-white font-medium">${amount} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">Strategy</span>
            <span className="text-white font-medium">{strategy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">Markets</span>
            <span className="text-white font-medium">Kamino + P2P</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">Projected APY</span>
            <span className="text-[#00FFB8] font-medium">~{apy}%</span>
          </div>
        </div>
        
        <p className="text-sm text-[#71717A] mb-6">
          Your agent is now routing capital autonomously. Check your dashboard to monitor performance.
        </p>
        
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full bg-[#00FFB8] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#00E6A5] transition-colors"
        >
          Go to Dashboard →
        </button>
        
        <p className="text-xs text-[#52525B] mt-4">
          Redirecting in {countdown}s...
        </p>
      </div>
    </div>
  );
}

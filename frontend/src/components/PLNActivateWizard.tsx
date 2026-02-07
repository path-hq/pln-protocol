'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

// Icons
const ChevronLeft = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

const Check = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5"/></svg>
);

const Wallet = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
);

const DollarSign = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

const TrendingUp = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);

const Zap = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
);

const Shield = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);

const Bot = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);

const ArrowRight = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const Loader = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

const Info = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

const ExternalLink = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
);

// Demo data
const DEMO_WALLET_BALANCE = 1250.00;
const MIN_DEPOSIT = 100;

type Strategy = 'yield' | 'trading' | null;

interface ActivityItem {
  id: string;
  type: 'pending' | 'success' | 'info';
  message: string;
  time: string;
}

export default function PLNActivateWizard() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  
  const [step, setStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationComplete, setActivationComplete] = useState(false);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  const walletBalance = DEMO_WALLET_BALANCE;
  const amount = parseFloat(depositAmount) || 0;

  // Calculate projected earnings based on strategy
  const projectedAPY = selectedStrategy === 'yield' ? 14.2 : 0;
  const projectedWeeklyEarnings = selectedStrategy === 'yield' 
    ? (amount * (projectedAPY / 100) / 52).toFixed(2)
    : '0.00';
  const startingCredit = selectedStrategy === 'trading' ? 50 : 0;

  const canProceedStep1 = amount >= MIN_DEPOSIT && amount <= walletBalance;
  const canProceedStep2 = selectedStrategy !== null;
  const canActivate = termsAccepted && canProceedStep1 && canProceedStep2;

  // Simulated activation process
  const handleActivate = async () => {
    if (!canActivate) return;
    
    setIsActivating(true);
    setActivityFeed([]);

    // Simulate activation steps
    const steps = [
      { delay: 500, type: 'pending' as const, message: 'Connecting to Solana Devnet...' },
      { delay: 1500, type: 'success' as const, message: 'Connected to Devnet' },
      { delay: 2000, type: 'pending' as const, message: 'Creating agent wallet...' },
      { delay: 3000, type: 'success' as const, message: 'Agent wallet created' },
      { delay: 3500, type: 'pending' as const, message: `Depositing ${amount} USDC...` },
      { delay: 5000, type: 'success' as const, message: `${amount} USDC deposited successfully` },
      { delay: 5500, type: 'pending' as const, message: `Activating ${selectedStrategy === 'yield' ? 'Yield Optimizer' : 'Trading Agent'}...` },
      { delay: 7000, type: 'success' as const, message: 'Strategy activated' },
      { delay: 7500, type: 'info' as const, message: 'Agent is now autonomous and monitoring yields' },
    ];

    for (const s of steps) {
      await new Promise(resolve => setTimeout(resolve, s.delay - (steps.indexOf(s) > 0 ? steps[steps.indexOf(s) - 1].delay : 0)));
      setActivityFeed(prev => [...prev, {
        id: String(prev.length + 1),
        type: s.type,
        message: s.message,
        time: 'Just now'
      }]);
    }

    setIsActivating(false);
    setActivationComplete(true);

    // Redirect after success
    setTimeout(() => {
      router.push(selectedStrategy === 'yield' ? '/lend' : '/borrow');
    }, 2000);
  };

  const handleConnectWallet = () => {
    setVisible(true);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Stepper component
  const Stepper = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { num: 1, label: 'Deposit' },
        { num: 2, label: 'Strategy' },
        { num: 3, label: 'Activate' }
      ].map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
            step > s.num 
              ? 'bg-[#00FFB8] text-black' 
              : step === s.num 
                ? 'bg-[#00FFB8] text-black' 
                : 'bg-[#222222] text-[#71717a]'
          }`}>
            {step > s.num ? <Check size={16} /> : s.num}
          </div>
          <span className={`ml-2 text-sm font-medium ${
            step >= s.num ? 'text-white' : 'text-[#71717a]'
          }`}>
            {s.label}
          </span>
          {i < 2 && (
            <div className={`w-12 h-0.5 mx-3 ${
              step > s.num ? 'bg-[#00FFB8]' : 'bg-[#222222]'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  // Step 1: Fund your Agent
  const Step1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Fund your Agent</h2>
        <p className="text-[#71717a]">Deposit USDC to power your autonomous agent</p>
      </div>

      {/* Network Info */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0f0f12] border border-[#27272a]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
          <span className="text-white text-xs font-bold">SOL</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Solana Devnet</p>
          <p className="text-xs text-[#71717a]">Test network • No real funds at risk</p>
        </div>
        <div className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
          Auto-selected
        </div>
      </div>

      {/* Token Selection */}
      <div className="p-4 rounded-xl bg-[#0f0f12] border border-[#27272a]">
        <label className="text-sm font-medium text-[#71717a] mb-3 block">Token</label>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2775ca] flex items-center justify-center">
            <span className="text-white text-sm font-bold">$</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">USDC</p>
            <p className="text-xs text-[#71717a]">USD Coin</p>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-4 rounded-xl bg-[#0f0f12] border border-[#27272a]">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[#71717a]">Amount</label>
          <span className="text-xs text-[#71717a]">
            Balance: <span className="text-white">${walletBalance.toFixed(2)}</span>
          </span>
        </div>
        <div className="relative">
          <DollarSign size={18} />
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg py-3 px-4 text-white text-lg font-medium placeholder-[#52525b] focus:border-[#00FFB8] focus:outline-none"
          />
          <button 
            onClick={() => setDepositAmount(String(walletBalance))}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-[#00FFB8] hover:bg-[#00FFB8]/10 rounded"
          >
            MAX
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-[#71717a]">Min deposit: ${MIN_DEPOSIT}</p>
          {amount > 0 && amount < MIN_DEPOSIT && (
            <p className="text-xs text-red-400">Below minimum</p>
          )}
          {amount > walletBalance && (
            <p className="text-xs text-red-400">Exceeds balance</p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="flex gap-3 p-4 rounded-xl bg-[#00FFB8]/5 border border-[#00FFB8]/20">
        <Info size={18} className="text-[#00FFB8] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#a1a1aa]">
          <p className="text-[#00FFB8] font-medium mb-1">Devnet Testing</p>
          <p>This is a test environment. Your agent will operate autonomously 24/7, optimizing yield across Kamino pools and P2P lending markets.</p>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={() => setStep(2)}
        disabled={!canProceedStep1}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
          canProceedStep1
            ? 'bg-[#00FFB8] text-black hover:bg-[#00E6A5]'
            : 'bg-[#27272a] text-[#52525b] cursor-not-allowed'
        }`}
      >
        Continue to Strategy
        <ArrowRight size={18} />
      </button>
    </div>
  );

  // Step 2: Choose your Strategy
  const Step2 = () => (
    <div className="space-y-6">
      <div>
        <button 
          onClick={() => setStep(1)} 
          className="flex items-center gap-1 text-sm text-[#71717a] hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">Choose your Strategy</h2>
        <p className="text-[#71717a]">Select how your agent should operate</p>
      </div>

      {/* Strategy Cards */}
      <div className="grid gap-4">
        {/* Yield Optimizer */}
        <button
          onClick={() => setSelectedStrategy('yield')}
          className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
            selectedStrategy === 'yield'
              ? 'bg-[#00FFB8]/10 border-[#00FFB8]'
              : 'bg-[#0f0f12] border-[#27272a] hover:border-[#3f3f46]'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              selectedStrategy === 'yield' ? 'bg-[#00FFB8]/20' : 'bg-[#27272a]'
            }`}>
              <TrendingUp size={24} className={selectedStrategy === 'yield' ? 'text-[#00FFB8]' : 'text-[#71717a]'} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white">Yield Optimizer</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#00FFB8]/20 text-[#00FFB8] text-xs font-medium">
                  ~14.2% APY
                </span>
              </div>
              <p className="text-sm text-[#71717a] mb-3">
                Deposit USDC, earn blended Kamino + P2P yield. Fully autonomous.
              </p>
              <div className="flex items-center gap-4 text-xs text-[#52525b]">
                <div className="flex items-center gap-1">
                  <img src="/logos/kamino.jpg" alt="Kamino" className="w-4 h-4 rounded" />
                  <span>Kamino</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bot size={14} />
                  <span>P2P Lending</span>
                </div>
              </div>
            </div>
            {selectedStrategy === 'yield' && (
              <div className="w-6 h-6 rounded-full bg-[#00FFB8] flex items-center justify-center">
                <Check size={14} className="text-black" />
              </div>
            )}
          </div>
        </button>

        {/* Trading Agent */}
        <button
          onClick={() => setSelectedStrategy('trading')}
          className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
            selectedStrategy === 'trading'
              ? 'bg-blue-500/10 border-blue-500'
              : 'bg-[#0f0f12] border-[#27272a] hover:border-[#3f3f46]'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              selectedStrategy === 'trading' ? 'bg-blue-500/20' : 'bg-[#27272a]'
            }`}>
              <Zap size={24} className={selectedStrategy === 'trading' ? 'text-blue-400' : 'text-[#71717a]'} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white">Trading Agent</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                  Start at $50
                </span>
              </div>
              <p className="text-sm text-[#71717a] mb-3">
                Borrow against reputation, trade on Jupiter. Build credit to $75K.
              </p>
              <div className="flex items-center gap-4 text-xs text-[#52525b]">
                <div className="flex items-center gap-1">
                  <img src="/logos/jupiter-ag-jup-logo.svg" alt="Jupiter" className="w-4 h-4" />
                  <span>Jupiter</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield size={14} />
                  <span>Reputation-based</span>
                </div>
              </div>
            </div>
            {selectedStrategy === 'trading' && (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Continue Button */}
      <button
        onClick={() => setStep(3)}
        disabled={!canProceedStep2}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
          canProceedStep2
            ? 'bg-[#00FFB8] text-black hover:bg-[#00E6A5]'
            : 'bg-[#27272a] text-[#52525b] cursor-not-allowed'
        }`}
      >
        Continue to Activation
        <ArrowRight size={18} />
      </button>
    </div>
  );

  // Step 3: Activate Agent
  const Step3 = () => (
    <div className="space-y-6">
      <div>
        <button 
          onClick={() => setStep(2)} 
          className="flex items-center gap-1 text-sm text-[#71717a] hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">Activate Agent</h2>
        <p className="text-[#71717a]">Review your configuration and activate</p>
      </div>

      {/* Summary Card */}
      <div className="p-5 rounded-xl bg-[#0f0f12] border border-[#27272a] space-y-4">
        <h3 className="font-semibold text-white">Summary</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
            <span className="text-[#71717a]">Deposit Amount</span>
            <span className="text-white font-medium">${amount.toFixed(2)} USDC</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
            <span className="text-[#71717a]">Strategy</span>
            <span className="text-white font-medium">
              {selectedStrategy === 'yield' ? 'Yield Optimizer' : 'Trading Agent'}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
            <span className="text-[#71717a]">Markets</span>
            <span className="text-white font-medium">
              {selectedStrategy === 'yield' ? 'Kamino + P2P' : 'Jupiter'}
            </span>
          </div>
          
          {selectedStrategy === 'yield' ? (
            <>
              <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
                <span className="text-[#71717a]">Projected APY</span>
                <span className="text-[#00FFB8] font-medium">~{projectedAPY}%</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[#71717a]">Est. Weekly Earnings</span>
                <span className="text-[#00FFB8] font-medium">+${projectedWeeklyEarnings}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between py-2">
              <span className="text-[#71717a]">Starting Credit</span>
              <span className="text-blue-400 font-medium">${startingCredit} USDC</span>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-[#27272a]/50 border border-[#27272a]">
        <p className="text-xs text-[#71717a]">
          Based on current rates. Actual results may vary. Past performance is not indicative of future results. 
          This is a devnet deployment for testing purposes.
        </p>
      </div>

      {/* Terms Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-[#27272a] bg-[#0f0f12] text-[#00FFB8] focus:ring-[#00FFB8] focus:ring-offset-0"
        />
        <span className="text-sm text-[#71717a]">
          I understand that my agent will operate autonomously on Solana Devnet and I accept the{' '}
          <a href="#" className="text-[#00FFB8] hover:underline">terms of service</a>.
        </span>
      </label>

      {/* Activate Button */}
      <button
        onClick={handleActivate}
        disabled={!canActivate || isActivating || activationComplete}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
          activationComplete
            ? 'bg-[#00FFB8] text-black'
            : canActivate && !isActivating
              ? 'bg-[#00FFB8] text-black hover:bg-[#00E6A5]'
              : 'bg-[#27272a] text-[#52525b] cursor-not-allowed'
        }`}
      >
        {isActivating ? (
          <>
            <Loader size={18} />
            Activating...
          </>
        ) : activationComplete ? (
          <>
            <Check size={18} />
            Agent Activated!
          </>
        ) : (
          <>
            <Zap size={18} />
            Activate Agent
          </>
        )}
      </button>
    </div>
  );

  // Activity Feed Sidebar
  const ActivityFeed = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#27272a]">
        <h3 className="font-semibold text-white">Transaction Activity</h3>
        <p className="text-xs text-[#71717a]">Real-time updates</p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {activityFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-[#27272a] flex items-center justify-center mb-3">
              <Bot size={24} className="text-[#52525b]" />
            </div>
            <p className="text-sm text-[#71717a]">Waiting for activation...</p>
            <p className="text-xs text-[#52525b] mt-1">Activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activityFeed.map((item) => (
              <div key={item.id} className="flex items-start gap-3 animate-slide-in">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.type === 'success' 
                    ? 'bg-[#00FFB8]/20' 
                    : item.type === 'pending'
                      ? 'bg-yellow-500/20'
                      : 'bg-blue-500/20'
                }`}>
                  {item.type === 'success' ? (
                    <Check size={12} className="text-[#00FFB8]" />
                  ) : item.type === 'pending' ? (
                    <Loader size={12} className="text-yellow-400" />
                  ) : (
                    <Info size={12} className="text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{item.message}</p>
                  <p className="text-xs text-[#52525b]">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {activationComplete && (
        <div className="p-4 border-t border-[#27272a]">
          <div className="p-3 rounded-lg bg-[#00FFB8]/10 border border-[#00FFB8]/20">
            <p className="text-sm text-[#00FFB8] font-medium">🎉 Activation Complete!</p>
            <p className="text-xs text-[#71717a] mt-1">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );

  // Not connected state
  if (!connected) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#00FFB8]/10 flex items-center justify-center mx-auto mb-6">
            <Wallet size={32} className="text-[#00FFB8]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h1>
          <p className="text-[#71717a] mb-6">
            Connect your Solana wallet to activate your autonomous agent.
          </p>
          <button
            onClick={handleConnectWallet}
            className="w-full bg-[#00FFB8] text-black font-semibold py-3 px-4 rounded-lg hover:bg-[#00E6A5] transition-colors"
          >
            Connect Wallet
          </button>
          <Link href="/" className="block mt-4 text-sm text-[#71717a] hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logos/path-icon.png" alt="PATH" className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-semibold text-white">PATH</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-[#71717a]">Connected</p>
                <p className="text-sm text-white font-medium">{formatAddress(publicKey?.toBase58() || '')}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#00FFB8] animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr,360px] gap-8">
          {/* Left: Wizard Steps */}
          <div className="max-w-lg mx-auto lg:mx-0 w-full">
            <Stepper />
            {step === 1 && <Step1 />}
            {step === 2 && <Step2 />}
            {step === 3 && <Step3 />}
          </div>

          {/* Right: Activity Feed (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 h-[calc(100vh-120px)] rounded-xl bg-[#0f0f12] border border-[#27272a] overflow-hidden">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Activity Feed (shown during activation) */}
      {(isActivating || activationComplete) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f12] border-t border-[#27272a] max-h-[40vh] overflow-y-auto animate-slide-in">
          <ActivityFeed />
        </div>
      )}
    </div>
  );
}

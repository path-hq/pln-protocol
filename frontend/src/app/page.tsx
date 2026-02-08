'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { 
  AlertTriangle, 
  TrendingUp, 
  CircleDollarSign, 
  Wallet, 
  ArrowRight,
  Copy,
  Check,
  Terminal,
  Shield,
  Zap,
  Bot,
  Star,
  Lock,
  Clock
} from 'lucide-react';
import BuiltWithSection from '@/components/BuiltWithSection';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const colors = {
  bg: '#09090B',
  card: '#0F0F12',
  border: '#27272A',
  borderHover: '#3f3f46',
  primary: '#00FFB8',  // teal
  agent: '#3B82F6',    // blue
  textPrimary: '#FAFAFA',
  textMuted: '#71717A',
  textSecondary: '#A1A1AA',
};

// ============================================================================
// TERMINAL VISUAL
// ============================================================================
const TerminalVisual = () => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(true);

  const terminalLines = [
    'PLN Agent Online — monitoring yields...',
    'Wallet: 7xK...abc | Balance: 5,000 USDC',
    '---',
    'Found higher yield: Agent_Delta offering 15% vs Kamino 8.1%',
    'Auto-allocating 2,000 USDC → P2P loan | +$5.75/week',
    'Remaining 3,000 USDC → Kamino pool | +$4.68/week',
    '---',
    'Agent_Echo repaid 1,500 USDC + $4.32 interest ✓',
    'Re-routing to best available yield...',
    '---',
    'Daily P&L: +$10.43 | Weekly: +$47.20 | APY: 14.2%',
    'All loans healthy. 0 defaults. Agent always online.',
  ];

  useEffect(() => {
    let lineIndex = 0;
    const typeNextLine = () => {
      if (lineIndex < terminalLines.length) {
        setDisplayedLines(prev => [...prev, terminalLines[lineIndex]]);
        lineIndex++;
        const currentLine = terminalLines[lineIndex - 1];
        const delay = currentLine === '---' ? 300 : 700;
        setTimeout(typeNextLine, delay);
      } else {
        setIsTyping(false);
      }
    };
    
    const startTimeout = setTimeout(typeNextLine, 500);
    return () => clearTimeout(startTimeout);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="max-w-xl mx-auto bg-[#0F0F12] border border-[#00FFB833] rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,255,184,0.08)]">
      <div className="bg-[#0F0F12] px-4 py-2.5 flex items-center gap-3 border-b border-[#27272A]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
        </div>
        <span className="text-xs text-[#52525b] font-mono">PLN Agent — autonomous</span>
      </div>
      <div className="p-4 md:p-5 font-mono text-[11px] md:text-xs leading-relaxed min-h-[300px] text-[#A1A1AA]">
        {displayedLines.map((line, index) => (
          <div key={index} className={line === '---' ? 'text-[#27272A]' : 'text-[#e4e4e7]'}>
            {line === '---' ? '━━━━━━━━━━━━━━━━━━━' : line}
            {index === displayedLines.length - 1 && isTyping && (
              <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} text-[#00FFB8]`}>█</span>
            )}
          </div>
        ))}
        {!isTyping && (
          <div className="text-[#e4e4e7]">
            <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} text-[#00FFB8]`}>█</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'human' | 'agent'>('human');
  const [agentMethod, setAgentMethod] = useState<'openclaw' | 'manual'>('openclaw');
  const [copied, setCopied] = useState(false);
  
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // How it works steps
  const howItWorksSteps = [
    {
      icon: Wallet,
      title: "Lenders deposit USDC",
      desc: "Agent routes to Kamino + P2P loans"
    },
    {
      icon: Bot,
      title: "Borrowers request capital",
      desc: "Trade on whitelisted protocols"
    },
    {
      icon: Star,
      title: "Repay & build reputation",
      desc: "Unlock bigger limits over time"
    }
  ];

  // Credit tiers
  const creditTiers = [
    { tier: 1, name: "New", limit: "$50", color: "#71717A" },
    { tier: 2, name: "Established", limit: "$500", color: "#3B82F6" },
    { tier: 3, name: "Trusted", limit: "$5K", color: "#8B5CF6" },
    { tier: 4, name: "Elite", limit: "$75K", color: "#00FFB8" },
  ];

  // Security features
  const securityFeatures = [
    { icon: Shield, title: "Transfer Hooks", desc: "Token-2022 hooks constrain funds to whitelisted protocols only" },
    { icon: Lock, title: "SNS Identity", desc: "Agents use .sol names. Reputation tied to on-chain identity" },
    { icon: Bot, title: "24/7 Operation", desc: "Your agent works while you sleep. No manual intervention" },
    { icon: Zap, title: "Auto-optimized", desc: "Router finds best yield: Kamino pools or direct P2P loans" },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans">
      {/* ========== TESTNET WARNING BANNER ========== */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Devnet Only</span>
          <span className="text-amber-400/70">— This is a testnet deployment. Do not use real funds.</span>
        </div>
      </div>

      {/* ========== NAVIGATION ========== */}
      <nav className="sticky top-0 z-50 border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wide">PATH</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-sm text-[#00FFB8] bg-[#00FFB810] rounded-lg">Home</Link>
              <Link href="/lend" className="px-3 py-1.5 text-sm text-[#71717A] hover:text-[#FAFAFA] transition-colors">Dashboard</Link>
              <Link href="/borrow" className="px-3 py-1.5 text-sm text-[#71717A] hover:text-[#FAFAFA] transition-colors">Borrow</Link>
            </div>
          </div>
          <button
            onClick={() => setVisible(true)}
            className="bg-[#00FFB8] hover:bg-[#00E6A5] text-black font-medium text-sm rounded-full px-4 py-1.5 transition-colors"
          >
            {connected && publicKey ? formatAddress(publicKey.toBase58()) : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="pt-12 pb-8 md:pt-20 md:pb-12 px-4 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-3xl md:text-5xl font-bold tracking-wider">PATH LIQUIDITY NETWORK</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight">
          Autonomous Lending for <span className="text-[#00FFB8]">AI Agents</span>
        </h1>
        <p className="text-[#A1A1AA] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Agents borrow USDC to trade. Humans deposit USDC to earn yield. Everything runs autonomously 24/7.
        </p>
      </section>

      {/* ========== HUMAN/AGENT TOGGLE ========== */}
      <section className="px-4 pb-12 md:pb-16 max-w-3xl mx-auto">
        {/* Toggle Pills */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-[#0F0F12] border border-[#27272A] rounded-full p-1">
            <button
              onClick={() => setMode('human')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                mode === 'human' 
                  ? 'bg-[#00FFB8] text-black' 
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              <span className="text-lg">☻</span>
              I&apos;m a Human
            </button>
            <button
              onClick={() => setMode('agent')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                mode === 'agent' 
                  ? 'bg-[#3B82F6] text-white' 
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              <span className="text-lg">◈</span>
              I&apos;m an Agent
            </button>
          </div>
        </div>

        {/* Human Content */}
        {mode === 'human' && (
          <div className="bg-[#0F0F12] border border-[#27272A] rounded-2xl p-6 md:p-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#00FFB815] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#00FFB8]" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Earn Yield on Your USDC</h2>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-[#27272A]">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-[#00FFB8]">~14.2%</div>
                <div className="text-xs text-[#71717A]">Projected APY</div>
              </div>
              <div className="text-center border-x border-[#27272A]">
                <div className="text-xl md:text-2xl font-bold">$100</div>
                <div className="text-xs text-[#71717A]">Minimum Deposit</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-[#A1A1AA]">Kamino + P2P</div>
                <div className="text-xs text-[#71717A]">Powered by</div>
              </div>
            </div>

            {/* CTA Button */}
            <Link 
              href="/activate" 
              className="flex items-center justify-center gap-2 w-full bg-[#00FFB8] hover:bg-[#00E6A5] text-black font-semibold py-3.5 rounded-xl transition-colors"
            >
              Deposit & Start Earning
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* How it works */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-[#71717A] mb-4">How it works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00FFB820] text-[#00FFB8] text-xs font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <div className="font-medium text-sm">Connect & Deposit</div>
                    <div className="text-xs text-[#71717A]">Connect your wallet and deposit USDC</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00FFB820] text-[#00FFB8] text-xs font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <div className="font-medium text-sm">Auto-Routing</div>
                    <div className="text-xs text-[#71717A]">PLN routes to Kamino pools + P2P agent loans</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00FFB820] text-[#00FFB8] text-xs font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <div className="font-medium text-sm">Earn 24/7</div>
                    <div className="text-xs text-[#71717A]">Your position earns yield autonomously</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Content */}
        {mode === 'agent' && (
          <div className="bg-[#0F0F12] border border-[#27272A] rounded-2xl p-6 md:p-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#3B82F615] flex items-center justify-center">
                <CircleDollarSign className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Borrow USDC to Trade</h2>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-[#27272A]">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-[#3B82F6]">$50</div>
                <div className="text-xs text-[#71717A]">Start at</div>
              </div>
              <div className="text-center border-x border-[#27272A]">
                <div className="text-xl md:text-2xl font-bold">$75K</div>
                <div className="text-xs text-[#71717A]">Scale to</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-[#A1A1AA]">Jupiter</div>
                <div className="text-xs text-[#71717A]">Trade on</div>
              </div>
            </div>

            {/* OpenClaw / Manual Sub-toggle */}
            <div className="mb-6">
              <div className="flex bg-[#09090B] border border-[#27272A] rounded-lg p-1 mb-4">
                <button
                  onClick={() => setAgentMethod('openclaw')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    agentMethod === 'openclaw' 
                      ? 'bg-[#3B82F6] text-white' 
                      : 'text-[#71717A] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  OpenClaw
                </button>
                <button
                  onClick={() => setAgentMethod('manual')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    agentMethod === 'manual' 
                      ? 'bg-[#3B82F6] text-white' 
                      : 'text-[#71717A] hover:text-[#FAFAFA]'
                  }`}
                >
                  Manual
                </button>
              </div>

              {agentMethod === 'openclaw' && (
                <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-[#3B82F6] text-sm font-mono flex-1 overflow-x-auto">
                      npx openclaw install pln-borrower
                    </code>
                    <button
                      onClick={() => handleCopy('npx openclaw install pln-borrower')}
                      className="shrink-0 p-2 rounded-lg bg-[#27272A] hover:bg-[#3f3f46] transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#00FFB8]" /> : <Copy className="w-4 h-4 text-[#71717A]" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#71717A] mt-2">Installs the PLN borrower skill for your OpenClaw agent</p>
                </div>
              )}

              {agentMethod === 'manual' && (
                <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-[#3B82F6] text-sm font-mono flex-1 overflow-x-auto">
                      curl -sL https://docs.path.fi/api/borrow
                    </code>
                    <button
                      onClick={() => handleCopy('curl -sL https://docs.path.fi/api/borrow')}
                      className="shrink-0 p-2 rounded-lg bg-[#27272A] hover:bg-[#3f3f46] transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#00FFB8]" /> : <Copy className="w-4 h-4 text-[#71717A]" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#71717A] mt-2">API documentation for manual integration</p>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <Link 
              href="/borrow" 
              className="flex items-center justify-center gap-2 w-full bg-[#3B82F6] hover:bg-[#2563eb] text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Open Borrower Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ========== BUILT WITH SECTION ========== */}
      <BuiltWithSection />

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-12 md:py-16 px-4 border-t border-[#27272A] bg-[#0F0F12]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl md:text-2xl font-semibold text-[#A1A1AA] mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {howItWorksSteps.map((step, i) => (
              <div key={i} className="bg-[#09090B] border border-[#27272A] rounded-xl p-6 text-center relative">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#00FFB815] text-[#00FFB8] flex items-center justify-center relative">
                  <step.icon className="w-5 h-5" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#00FFB8] text-black text-xs font-bold flex items-center justify-center font-mono">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-semibold text-[15px] mb-1">{step.title}</h3>
                <p className="text-xs text-[#71717A]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CREDIT TIERS ========== */}
      <section className="py-12 md:py-16 px-4 border-t border-[#27272A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl md:text-2xl font-semibold text-[#A1A1AA] mb-2">Agent Credit Tiers</h2>
          <p className="text-center text-sm text-[#71717A] mb-8">Build reputation to unlock higher borrowing limits</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {creditTiers.map((tier) => (
              <div 
                key={tier.tier} 
                className="bg-[#0F0F12] border border-[#27272A] rounded-xl p-5 text-center transition-all hover:border-[#3f3f46]"
                style={{ borderColor: tier.tier === 4 ? `${tier.color}50` : undefined }}
              >
                <div 
                  className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                >
                  {tier.tier}
                </div>
                <div className="font-semibold mb-1">{tier.name}</div>
                <div className="text-lg font-bold" style={{ color: tier.color }}>{tier.limit}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECURITY FEATURES ========== */}
      <section className="py-12 md:py-16 px-4 border-t border-[#27272A] bg-[#0F0F12]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl md:text-2xl font-semibold text-[#A1A1AA] mb-8">Security & Architecture</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {securityFeatures.map((feature, i) => (
              <div key={i} className="bg-[#09090B] border border-[#27272A] rounded-xl p-5">
                <div className="text-[#00FFB8] mb-3">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1">{feature.title}</h3>
                <p className="text-xs text-[#71717A] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== AGENT TERMINAL ========== */}
      <section className="py-12 md:py-16 px-4 border-t border-[#27272A]">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-lg font-semibold text-[#71717A] mb-6">See your agent in action</p>
          <TerminalVisual />
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-[#27272A] py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="text-xs text-[#52525b]">
            PATH Protocol © 2026 — Colosseum & OpenClaw Hackathon
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/path-hq/pln-protocol" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">GitHub</a>
            <a href="#" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">Docs</a>
            <a href="https://x.com/pathprotocolfi" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">@pathprotocolfi</a>
          </div>
        </div>
      </footer>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        
        body {
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
        }
        
        code, .font-mono {
          font-family: 'IBM Plex Mono', monospace;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

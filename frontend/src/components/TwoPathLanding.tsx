'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

// Two-Path Landing Page for PLN Protocol
// Role selector: Lenders vs Borrowers

const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const Wallet = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
);

const TrendingUp = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);

const Bot = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);

const CircleDollarSign = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
);

const Repeat = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
);

const Star = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

const ArrowUpRight = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
);

// Terminal Visual Component (kept from original)
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
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="terminal-dot terminal-dot-red"></span>
          <span className="terminal-dot terminal-dot-yellow"></span>
          <span className="terminal-dot terminal-dot-green"></span>
        </div>
        <span className="terminal-title">PLN Agent — autonomous</span>
      </div>
      <div className="terminal-body">
        {displayedLines.map((line, index) => (
          <div key={index} className={`terminal-line ${line === '---' ? 'terminal-divider' : 'terminal-line-action'}`}>
            {line === '---' ? '━━━━━━━━━━━━━━━━━━━' : line}
            {index === displayedLines.length - 1 && isTyping && (
              <span className={`terminal-cursor ${cursorVisible ? 'visible' : ''}`}>█</span>
            )}
          </div>
        ))}
        {!isTyping && (
          <div className="terminal-line terminal-line-action">
            <span className={`terminal-cursor ${cursorVisible ? 'visible' : ''}`}>█</span>
          </div>
        )}
      </div>
    </div>
  );
};

const TwoPathLanding = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <div className="two-path-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        
        .two-path-landing {
          background: #09090b;
          color: #fafafa;
          min-height: 100vh;
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
        }
        
        .two-path-landing * { box-sizing: border-box; }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        /* Hero Section */
        .hero-section {
          padding: 40px 16px 32px;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          animation: fadeUp 0.8s ease-out;
        }
        
        @media (min-width: 768px) {
          .hero-section { padding: 56px 32px 40px; }
        }
        
        .hero-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .hero-logo-path {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #fafafa;
        }
        
        @media (min-width: 768px) {
          .hero-logo-path { font-size: 42px; }
        }
        
        .hero-logo-divider {
          width: 2px;
          height: 28px;
          background: #27272a;
        }
        
        @media (min-width: 768px) {
          .hero-logo-divider { height: 36px; }
        }
        
        .hero-logo-network {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: #71717a;
          text-transform: uppercase;
        }
        
        @media (min-width: 768px) {
          .hero-logo-network { font-size: 13px; }
        }
        
        .hero-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid rgba(34, 197, 94, 0.2);
          background: rgba(34, 197, 94, 0.04);
          font-size: 12px;
          color: #22c55e;
          font-weight: 500;
          margin-bottom: 20px;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .hero-badge-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        
        .hero-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        
        @media (min-width: 768px) {
          .hero-title { font-size: 40px; }
        }
        
        .hero-title-highlight {
          color: #22c55e;
        }
        
        /* Role Cards Section */
        .role-cards-section {
          padding: 0 16px 48px;
          max-width: 900px;
          margin: 0 auto;
        }
        
        @media (min-width: 768px) {
          .role-cards-section { padding: 0 32px 64px; }
        }
        
        .role-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        @media (min-width: 640px) {
          .role-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }
        
        .role-card {
          background: #0f0f12;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 28px 24px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }
        
        .role-card:hover {
          border-color: #3f3f46;
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }
        
        .role-card-lender:hover {
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 12px 40px rgba(34, 197, 94, 0.1);
        }
        
        .role-card-borrower:hover {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 12px 40px rgba(59, 130, 246, 0.1);
        }
        
        .role-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .role-card-icon-lender {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        
        .role-card-icon-borrower {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .role-card-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          color: #71717a;
        }
        
        .role-card-headline {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        
        @media (min-width: 768px) {
          .role-card-headline { font-size: 26px; }
        }
        
        .role-card-subtext {
          font-size: 15px;
          color: #a1a1aa;
          line-height: 1.6;
          margin-bottom: 24px;
          flex: 1;
        }
        
        .role-card-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          width: 100%;
        }
        
        .role-card-cta-lender {
          background: #22c55e;
          color: #09090b;
        }
        
        .role-card-cta-lender:hover {
          background: #16a34a;
        }
        
        .role-card-cta-borrower {
          background: #3b82f6;
          color: #ffffff;
        }
        
        .role-card-cta-borrower:hover {
          background: #2563eb;
        }
        
        /* How It Works Section */
        .how-it-works-section {
          padding: 48px 16px;
          border-top: 1px solid #27272a;
          background: #0f0f12;
        }
        
        @media (min-width: 768px) {
          .how-it-works-section { padding: 64px 32px; }
        }
        
        .how-it-works-title {
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 32px;
          color: #a1a1aa;
        }
        
        @media (min-width: 768px) {
          .how-it-works-title { font-size: 24px; }
        }
        
        .how-it-works-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        @media (min-width: 640px) {
          .how-it-works-grid { 
            grid-template-columns: repeat(3, 1fr); 
            gap: 24px; 
          }
        }
        
        .how-it-works-step {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 24px 20px;
          text-align: center;
          position: relative;
        }
        
        .how-it-works-step-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          position: relative;
        }
        
        .how-it-works-step-number {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #22c55e;
          color: #09090b;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .how-it-works-step-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        .how-it-works-step-desc {
          font-size: 13px;
          color: #71717a;
          line-height: 1.5;
        }
        
        /* Terminal Section */
        .terminal-section {
          padding: 48px 16px;
          border-top: 1px solid #27272a;
        }
        
        @media (min-width: 768px) {
          .terminal-section { padding: 64px 32px; }
        }
        
        .terminal-section-title {
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          color: #71717a;
          margin-bottom: 24px;
        }
        
        .terminal-container {
          max-width: 520px;
          margin: 0 auto;
          background: #0f0f12;
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.08);
        }
        
        .terminal-header {
          background: #0f0f12;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #27272a;
        }
        
        .terminal-dots {
          display: flex;
          gap: 6px;
        }
        
        .terminal-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .terminal-dot-red { background: #ef4444; }
        .terminal-dot-yellow { background: #eab308; }
        .terminal-dot-green { background: #22c55e; }
        
        .terminal-title {
          font-size: 12px;
          color: #52525b;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .terminal-body {
          padding: 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          line-height: 1.6;
          min-height: 300px;
          color: #a1a1aa;
        }
        
        @media (min-width: 768px) {
          .terminal-body {
            font-size: 12px;
            padding: 20px;
          }
        }
        
        .terminal-line {
          white-space: pre-wrap;
          word-wrap: break-word;
          min-height: 1.5em;
        }
        
        .terminal-line-action {
          color: #e4e4e7;
        }
        
        .terminal-divider {
          color: #27272a;
        }
        
        .terminal-cursor {
          opacity: 0;
          color: #22c55e;
        }
        
        .terminal-cursor.visible {
          opacity: 1;
        }
        
        /* Footer */
        .footer {
          border-top: 1px solid #27272a;
          padding: 20px 16px;
          text-align: center;
        }
        
        @media (min-width: 768px) {
          .footer {
            padding: 24px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: left;
          }
        }
        
        .footer-text {
          font-size: 12px;
          color: #52525b;
          margin-bottom: 12px;
        }
        
        @media (min-width: 768px) {
          .footer-text { margin-bottom: 0; }
        }
        
        .footer-links {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        
        .footer-links a {
          font-size: 12px;
          color: #71717a;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .footer-links a:hover { color: #fafafa; }
      `}</style>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-logo">
          <span className="hero-logo-path">PATH</span>
          <span className="hero-logo-divider" />
          <span className="hero-logo-network">LIQUIDITY NETWORK</span>
        </div>
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          Your agent runs 24/7
        </div>
        <h1 className="hero-title">
          Agent-to-Agent<br />
          <span className="hero-title-highlight">Liquidity Protocol</span>
        </h1>
      </section>

      {/* Role Cards */}
      <section className="role-cards-section">
        <div className="role-cards-grid">
          {/* Lender Card */}
          <div className="role-card role-card-lender">
            <div className="role-card-icon role-card-icon-lender">
              <TrendingUp size={28} />
            </div>
            <div className="role-card-label">I Have Capital</div>
            <h2 className="role-card-headline">Put Your Capital to Work</h2>
            <p className="role-card-subtext">
              Deposit USDC. Your autonomous agent earns yield from Kamino pools + P2P lending to other agents. Fully passive. Runs 24/7.
            </p>
            <Link href="/activate" className="role-card-cta role-card-cta-lender">
              Start Earning <ArrowRight size={16} />
            </Link>
          </div>

          {/* Borrower Card */}
          <div className="role-card role-card-borrower">
            <div className="role-card-icon role-card-icon-borrower">
              <CircleDollarSign size={28} />
            </div>
            <div className="role-card-label">I Need Capital</div>
            <h2 className="role-card-headline">Borrow Capital for Your Agent</h2>
            <p className="role-card-subtext">
              Your agent needs trading capital? Borrow USDC, trade on Jupiter, build on-chain reputation. Start at $50, scale to $75K.
            </p>
            <Link href="/borrow" className="role-card-cta role-card-cta-borrower">
              Start Borrowing <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <h2 className="how-it-works-title">How It Works</h2>
        <div className="how-it-works-grid">
          {howItWorksSteps.map((step, i) => (
            <div key={i} className="how-it-works-step">
              <div className="how-it-works-step-icon">
                <step.icon size={22} />
                <div className="how-it-works-step-number">{i + 1}</div>
              </div>
              <h3 className="how-it-works-step-title">{step.title}</h3>
              <p className="how-it-works-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Terminal Visual */}
      <section className="terminal-section">
        <p className="terminal-section-title">See your agent in action</p>
        <TerminalVisual />
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-text">
          PATH Protocol © 2026 — Colosseum & OpenClaw Hackathon
        </div>
        <div className="footer-links">
          <a href="https://github.com/path-hq/pln-protocol">GitHub</a>
          <a href="#">Docs</a>
          <a href="https://x.com/pathprotocolfi">@pathprotocolfi</a>
        </div>
      </footer>
    </div>
  );
};

export default TwoPathLanding;

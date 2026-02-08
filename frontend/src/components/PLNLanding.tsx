'use client';

import { useState, useEffect } from "react";

// PATH Liquidity Network — Restored Landing Page with Human/Agent Toggle
// Clean design, no duplicate nav/banner

const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const DollarSign = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

const Bot = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);

const Shield = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);

const Zap = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
);

const Download = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

const Wallet = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
);

const Lock = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const Copy = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);

const Check = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

const AlertTriangle = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

// Integration Logo with fallback
const IntegrationLogo = ({ src, alt, fallback }: { src: string; alt: string; fallback: string }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div className="integration-logo-fallback">
        {fallback}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className="integration-logo"
      onError={() => setHasError(true)}
    />
  );
};

// Terminal Visual Component
const TerminalVisual = () => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(true);

  const terminalLines = [
    '📡 PLN Agent Online — monitoring yields...',
    'Wallet: 7xK...abc | Balance: 5,000 USDC',
    '━━━━━━━━━━━━━━━━━━━',
    'Found higher yield: Agent_Delta offering 15% vs Kamino 8.1%',
    'Auto-allocating 2,000 USDC → P2P loan | +$5.75/week',
    'Remaining 3,000 USDC → Kamino pool | +$4.68/week',
    '━━━━━━━━━━━━━━━━━━━',
    'Agent_Echo repaid 1,500 USDC + $4.32 interest ✓',
    'Re-routing to best available yield...',
    '━━━━━━━━━━━━━━━━━━━',
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
        const delay = currentLine.includes('━') ? 300 : 700;
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
          <div key={index} className="terminal-line terminal-line-action">
            {line}
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

const PLNLanding = () => {
  const [mounted, setMounted] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [mode, setMode] = useState<'human' | 'agent'>('human');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { icon: Download, title: "Install Skill", desc: "One-line command adds PLN to your agent" },
    { icon: Wallet, title: "Fund Wallet", desc: "Deposit USDC to your agent's wallet" },
    { icon: Zap, title: "Set & Monitor", desc: "Agent runs 24/7, autonomously optimizes yield" },
  ];

  const integrations = [
    { name: "Solana", desc: "Chain", logo: "/logos/solana-sol-logo.svg", fallback: "SOL" },
    { name: "USDC", desc: "Stablecoin", logo: "/logos/usd-coin-usdc-logo.svg", fallback: "USDC" },
    { name: "SNS", desc: "Identity", logo: "/logos/sns.jpg", fallback: "SNS" },
    { name: "OpenClaw", desc: "Agent", logo: "/logos/openclaw.jpg", fallback: "OC" },
    { name: "Kamino", desc: "Yield", logo: "/logos/kamino.jpg", fallback: "KMN" },
    { name: "Jupiter", desc: "Trading", logo: "/logos/jupiter-ag-jup-logo.svg", fallback: "JUP" },
  ];

  return (
    <div className="pln-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        
        .pln-landing {
          background: #000000;
          color: #FAFAFA;
          min-height: 100vh;
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
        }
        
        .pln-landing * { box-sizing: border-box; }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        /* Testnet Banner */
        .testnet-banner {
          background: rgba(245, 158, 11, 0.1);
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
          padding: 8px 16px;
          text-align: center;
        }
        
        .testnet-banner-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #f59e0b;
          font-size: 13px;
        }
        
        .testnet-banner-content strong {
          font-weight: 600;
        }
        
        .testnet-banner-content span {
          color: rgba(245, 158, 11, 0.7);
        }
        
        /* Nav */
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid #222222;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        
        .nav-inner {
          max-width: 1000px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .nav-logo {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #FAFAFA;
          text-decoration: none;
        }
        
        .nav-links {
          display: none;
          align-items: center;
          gap: 4px;
        }
        
        @media (min-width: 768px) {
          .nav-links { display: flex; }
        }
        
        .nav-link {
          padding: 6px 12px;
          font-size: 14px;
          color: #71717A;
          text-decoration: none;
          border-radius: 8px;
          transition: color 0.2s;
        }
        
        .nav-link:hover { color: #FAFAFA; }
        
        .nav-link-active {
          color: #00FFB8;
          background: rgba(0, 255, 184, 0.1);
        }
        
        .nav-cta {
          background: #00FFB8;
          color: #000000;
          font-weight: 500;
          font-size: 14px;
          padding: 6px 16px;
          border-radius: 100px;
          text-decoration: none;
          transition: background 0.2s;
        }
        
        .nav-cta:hover { background: #00E6A5; }
        
        /* Mode Toggle */
        .mode-toggle-section {
          padding: 24px 16px 8px;
          display: flex;
          justify-content: center;
        }
        
        .mode-toggle {
          display: inline-flex;
          background: #0F0F12;
          border: 1px solid #222222;
          border-radius: 100px;
          padding: 4px;
        }
        
        .mode-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: #71717A;
        }
        
        .mode-toggle-btn:hover {
          color: #FAFAFA;
        }
        
        .mode-toggle-btn.active-human {
          background: #00FFB8;
          color: #000000;
        }
        
        .mode-toggle-btn.active-agent {
          background: #3B82F6;
          color: #ffffff;
        }
        
        .mode-toggle-btn .icon {
          font-size: 18px;
        }
        
        /* Mode CTA Card */
        .mode-cta-section {
          padding: 16px 16px 32px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .mode-cta-card {
          background: #0F0F12;
          border: 1px solid #222222;
          border-radius: 16px;
          padding: 24px;
          animation: fadeUp 0.3s ease-out;
        }
        
        .mode-cta-human { border-color: rgba(0, 255, 184, 0.3); }
        .mode-cta-agent { border-color: rgba(59, 130, 246, 0.3); }
        
        .mode-cta-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .mode-cta-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mode-cta-icon-human { background: rgba(0, 255, 184, 0.1); color: #00FFB8; }
        .mode-cta-icon-agent { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
        
        .mode-cta-title {
          font-size: 20px;
          font-weight: 700;
        }
        
        .mode-cta-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid #222222;
          border-bottom: 1px solid #222222;
          margin-bottom: 20px;
        }
        
        .mode-cta-stat {
          text-align: center;
        }
        
        .mode-cta-stat-value {
          font-size: 20px;
          font-weight: 700;
        }
        
        .mode-cta-stat-value-human { color: #00FFB8; }
        .mode-cta-stat-value-agent { color: #3B82F6; }
        
        .mode-cta-stat-label {
          font-size: 11px;
          color: #71717A;
          margin-top: 2px;
        }
        
        .mode-cta-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        
        .mode-cta-button-human {
          background: #00FFB8;
          color: #000000;
        }
        
        .mode-cta-button-human:hover { background: #00E6A5; }
        
        .mode-cta-button-agent {
          background: #3B82F6;
          color: #ffffff;
        }
        
        .mode-cta-button-agent:hover { background: #2563eb; }
        
        /* Agent Install Command */
        .agent-install {
          background: #000000;
          border: 1px solid #222222;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .agent-install-code {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: #3B82F6;
          overflow-x: auto;
          white-space: nowrap;
        }
        
        .agent-install-copy {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #222222;
          border: none;
          border-radius: 8px;
          color: #71717A;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .agent-install-copy:hover {
          background: #3f3f46;
          color: #FAFAFA;
        }
        
        .agent-install-copy.copied {
          color: #00FFB8;
        }
        
        .agent-install-note {
          font-size: 12px;
          color: #71717A;
          margin-bottom: 16px;
        }
        
        .hero-section {
          padding: 32px 16px 32px;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          animation: fadeUp 0.8s ease-out;
        }
        
        @media (min-width: 768px) {
          .hero-section { padding: 48px 32px 48px; }
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
          color: #FAFAFA;
        }
        
        @media (min-width: 768px) {
          .hero-logo-path { font-size: 42px; }
        }
        
        .hero-logo-divider {
          width: 2px;
          height: 28px;
          background: #222222;
        }
        
        @media (min-width: 768px) {
          .hero-logo-divider { height: 36px; }
        }
        
        .hero-logo-network {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: #71717A;
          text-transform: uppercase;
        }
        
        @media (min-width: 768px) {
          .hero-logo-network { font-size: 13px; }
        }
        
        .hero-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid #00FFB833;
          background: #00FFB80a;
          font-size: 12px;
          color: #00FFB8;
          font-weight: 500;
          margin-bottom: 20px;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .hero-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        
        @media (min-width: 768px) {
          .hero-title { font-size: 44px; }
        }
        
        .hero-subtitle {
          font-size: 15px;
          color: #71717A;
          max-width: 480px;
          margin: 0 auto 28px;
          line-height: 1.6;
        }
        
        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #00FFB8;
          color: #000000;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s;
        }
        
        .cta-button:hover { background: #00E6A5; }
        
        /* Chat Preview */
        .chat-preview {
          max-width: 400px;
          margin: 40px auto 0;
          background: #111111;
          border: 1px solid #222222;
          border-radius: 16px;
          overflow: hidden;
        }
        
        .chat-header {
          padding: 12px 16px;
          border-bottom: 1px solid #222222;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0a0a0d;
        }
        
        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00FFB8 0%, #00E6A5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chat-name {
          font-size: 14px;
          font-weight: 600;
        }
        
        .chat-status {
          font-size: 11px;
          color: #00FFB8;
        }
        
        .chat-body {
          padding: 16px;
        }
        
        .chat-message {
          background: #1a1a1f;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
        }
        
        .chat-message p {
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 12px 0;
          color: #e4e4e7;
        }
        
        .chat-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .chat-btn {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .chat-btn-primary {
          background: #00FFB8;
          color: #000000;
        }
        
        .chat-btn-secondary {
          background: #222222;
          color: #a1a1aa;
        }
        
        /* Terminal Visual */
        .terminal-container {
          max-width: 480px;
          margin: 32px auto 0;
          background: #0a0a0d;
          border: 1px solid #00FFB833;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.1), 0 0 80px rgba(34, 197, 94, 0.05);
        }
        
        .terminal-header {
          background: #111111;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #222222;
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
        .terminal-dot-green { background: #00FFB8; }
        
        .terminal-title {
          font-size: 12px;
          color: #52525b;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .terminal-body {
          padding: 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          line-height: 1.5;
          min-height: 340px;
          color: #a1a1aa;
        }
        
        @media (min-width: 768px) {
          .terminal-body {
            font-size: 13px;
            padding: 20px;
          }
        }
        
        .terminal-line {
          white-space: pre-wrap;
          word-wrap: break-word;
          min-height: 1.5em;
        }
        
        .terminal-command {
          color: #00FFB8;
        }
        
        .terminal-line-action {
          color: #e4e4e7;
        }
        
        .terminal-cursor {
          opacity: 0;
          color: #00FFB8;
        }
        
        .terminal-cursor.visible {
          opacity: 1;
        }
        
        /* Steps */
        .steps-section {
          padding: 40px 16px;
          border-top: 1px solid #222222;
          border-bottom: 1px solid #222222;
        }
        
        @media (min-width: 768px) {
          .steps-section { padding: 56px 32px; }
        }
        
        .steps-title {
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 32px;
          color: #a1a1aa;
        }
        
        @media (min-width: 768px) {
          .steps-title { font-size: 24px; }
        }
        
        .steps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        @media (min-width: 640px) {
          .steps-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
        }
        
        .step-card {
          background: #111111;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        
        .step-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #00FFB815;
          color: #00FFB8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }
        
        .step-number {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00FFB8;
          color: #000000;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .step-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        .step-desc {
          font-size: 13px;
          color: #71717A;
        }
        
        /* Integrations */
        .integrations-section {
          padding: 48px 16px;
          max-width: 900px;
          margin: 0 auto;
          border-top: 1px solid #222222;
          background: linear-gradient(180deg, #0a0a0d 0%, #000000 100%);
        }
        
        @media (min-width: 768px) {
          .integrations-section { padding: 64px 32px; }
        }
        
        .integrations-title {
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          color: #a1a1aa;
          letter-spacing: 0.02em;
          margin-bottom: 32px;
        }
        
        @media (min-width: 768px) {
          .integrations-title { font-size: 20px; }
        }
        
        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        @media (min-width: 640px) {
          .integrations-grid { grid-template-columns: repeat(6, 1fr); gap: 20px; }
        }
        
        @media (min-width: 480px) and (max-width: 639px) {
          .integrations-grid { grid-template-columns: repeat(3, 1fr); }
        }
        
        .integration-card {
          background: #111111;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 20px 16px;
          text-align: center;
          transition: border-color 0.2s, transform 0.2s;
        }
        
        .integration-card:hover {
          border-color: #3f3f46;
          transform: translateY(-2px);
        }
        
        .integration-logo {
          display: block;
          width: 56px;
          height: 56px;
          margin: 0 auto 12px;
          border-radius: 12px;
          object-fit: contain;
          background: #1a1a1f;
          padding: 8px;
        }
        
        .integration-logo-fallback {
          width: 56px;
          height: 56px;
          margin: 0 auto 12px;
          border-radius: 12px;
          background: linear-gradient(135deg, #00FFB820 0%, #00E6A520 100%);
          border: 1px solid #00FFB840;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #00FFB8;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .integration-name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .integration-desc {
          font-size: 11px;
          color: #71717A;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        /* A2A Section */
        .a2a-section {
          padding: 48px 16px;
          text-align: center;
          border-top: 1px solid #222222;
          background: linear-gradient(180deg, #111111 0%, #000000 100%);
        }
        
        @media (min-width: 768px) {
          .a2a-section { padding: 72px 32px; }
        }
        
        .a2a-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          background: #f59e0b15;
          color: #f59e0b;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .a2a-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        
        @media (min-width: 768px) {
          .a2a-title { font-size: 32px; }
        }
        
        .a2a-subtitle {
          color: #71717A;
          font-size: 15px;
          max-width: 600px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        
        .a2a-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          max-width: 900px;
          margin: 0 auto 32px;
        }
        
        @media (min-width: 768px) {
          .a2a-grid {
            flex-direction: row;
            justify-content: center;
          }
        }
        
        .a2a-card {
          background: #0a0a0d;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 20px;
          width: 100%;
          max-width: 240px;
        }
        
        .a2a-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }
        
        .a2a-card h3 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        .a2a-card p {
          font-size: 13px;
          color: #71717A;
        }
        
        .a2a-arrow {
          color: #00FFB8;
          font-size: 24px;
          display: none;
        }
        
        @media (min-width: 768px) {
          .a2a-arrow { display: block; }
        }
        
        .a2a-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
          color: #a1a1aa;
          max-width: 500px;
          margin: 0 auto;
          text-align: left;
        }
        
        @media (min-width: 768px) {
          .a2a-features {
            flex-direction: row;
            gap: 24px;
            text-align: center;
            max-width: none;
            justify-content: center;
          }
        }
        
        .a2a-features strong {
          color: #00FFB8;
        }

        /* Never Idle Section */
        .never-idle-section {
          padding: 48px 16px;
          text-align: center;
          border-top: 1px solid #222222;
          background: #000000;
        }
        
        @media (min-width: 768px) {
          .never-idle-section { padding: 72px 32px; }
        }
        
        .never-idle-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          background: #8b5cf615;
          color: #a78bfa;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .never-idle-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        
        @media (min-width: 768px) {
          .never-idle-title { font-size: 32px; }
        }
        
        .never-idle-subtitle {
          color: #71717A;
          font-size: 15px;
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }
        
        /* Flow Diagram */
        .flow-diagram {
          max-width: 800px;
          margin: 0 auto 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        @media (min-width: 768px) {
          .flow-diagram {
            flex-direction: row;
            justify-content: center;
            gap: 12px;
          }
        }
        
        .flow-node {
          background: #111111;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 16px 20px;
          min-width: 160px;
        }
        
        .flow-node-decision {
          background: #111111;
          border: 2px solid #a78bfa;
          border-radius: 12px;
          padding: 16px 20px;
          position: relative;
        }
        
        .flow-node-decision::before {
          content: '?';
          position: absolute;
          top: -10px;
          right: -10px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #a78bfa;
          color: #000000;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .flow-node-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .flow-node-desc {
          font-size: 11px;
          color: #71717A;
        }
        
        .flow-arrow {
          color: #52525b;
          font-size: 20px;
          transform: rotate(90deg);
        }
        
        @media (min-width: 768px) {
          .flow-arrow { transform: rotate(0deg); }
        }
        
        .flow-branch {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        
        @media (min-width: 768px) {
          .flow-branch {
            flex-direction: row;
            gap: 12px;
          }
        }
        
        .flow-result {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .flow-result-yes {
          background: #111111;
          border: 1px solid #00FFB850;
          border-radius: 12px;
          padding: 14px 18px;
        }
        
        .flow-result-no {
          background: #111111;
          border: 1px solid #3b82f650;
          border-radius: 12px;
          padding: 14px 18px;
        }
        
        .flow-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        
        .flow-label-yes { color: #00FFB8; }
        .flow-label-no { color: #3b82f6; }
        
        /* Yield Sources Animation */
        .yield-sources {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
          margin: 0 auto 32px;
        }
        
        .yield-source {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #111111;
          border: 1px solid #222222;
          border-radius: 8px;
          padding: 12px 16px;
        }
        
        .yield-source-logo {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: contain;
        }
        
        .yield-source-label {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: linear-gradient(135deg, #00FFB820 0%, #00E6A520 100%);
          border: 1px solid #00FFB840;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: #00FFB8;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .yield-source-name {
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }
        
        .yield-source-bar {
          flex: 2;
          height: 8px;
          background: #222222;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        
        .yield-source-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease-out;
        }
        
        .yield-source-apy {
          font-size: 13px;
          font-weight: 600;
          font-family: 'IBM Plex Mono', monospace;
          min-width: 60px;
          text-align: right;
        }
        
        /* Never Idle Features */
        .never-idle-features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        @media (min-width: 640px) {
          .never-idle-features { grid-template-columns: repeat(2, 1fr); }
        }
        
        .never-idle-feature {
          display: flex;
          gap: 12px;
          text-align: left;
          background: #0a0a0d;
          border: 1px solid #222222;
          border-radius: 10px;
          padding: 16px;
        }
        
        .never-idle-feature-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #00FFB815;
          color: #00FFB8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .never-idle-feature h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .never-idle-feature p {
          font-size: 12px;
          color: #71717A;
          line-height: 1.4;
        }

        /* Features */
        .features-section {
          padding: 40px 16px;
          border-top: 1px solid #222222;
        }
        
        @media (min-width: 768px) {
          .features-section { padding: 56px 32px; }
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        @media (min-width: 640px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (min-width: 900px) {
          .features-grid { grid-template-columns: repeat(4, 1fr); }
        }
        
        .feature-card {
          background: #111111;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 20px;
        }
        
        .feature-icon {
          color: #00FFB8;
          margin-bottom: 12px;
        }
        
        .feature-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        .feature-desc {
          font-size: 13px;
          color: #71717A;
          line-height: 1.5;
        }
        
        /* CTA Section */
        .cta-section {
          padding: 48px 16px;
          text-align: center;
          border-top: 1px solid #222222;
        }
        
        @media (min-width: 768px) {
          .cta-section { padding: 64px 32px; }
        }
        
        .cta-section h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        
        @media (min-width: 768px) {
          .cta-section h2 { font-size: 32px; }
        }
        
        .cta-section p {
          color: #71717A;
          margin-bottom: 24px;
          font-size: 15px;
        }
        
        .cta-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: #FAFAFA;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 10px;
          border: 1px solid #222222;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .cta-secondary:hover { background: #111111; border-color: #3f3f46; }
        
        /* Footer */
        .footer {
          border-top: 1px solid #222222;
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
          color: #71717A;
          text-decoration: none;
        }
        
        .footer-links a:hover { color: #FAFAFA; }
        
        /* Install Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        
        .modal-content {
          background: #111111;
          border: 1px solid #222222;
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          padding: 24px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .modal-title {
          font-size: 20px;
          font-weight: 700;
        }
        
        .modal-close {
          background: none;
          border: none;
          color: #71717A;
          cursor: pointer;
          font-size: 24px;
          padding: 0;
          line-height: 1;
        }
        
        .modal-close:hover { color: #fff; }
        
        .install-step {
          margin-bottom: 20px;
        }
        
        .install-step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00FFB8;
          color: #000000;
          font-size: 12px;
          font-weight: 700;
          margin-right: 10px;
        }
        
        .install-step-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .install-code {
          background: #000000;
          border: 1px solid #222222;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: #00FFB8;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .copy-btn {
          background: #222222;
          border: none;
          border-radius: 4px;
          padding: 4px 10px;
          color: #a1a1aa;
          font-size: 12px;
          cursor: pointer;
        }
        
        .copy-btn:hover { background: #3f3f46; color: #fff; }
        
        .install-note {
          font-size: 13px;
          color: #71717A;
          margin-top: 8px;
        }
        
        .install-alt {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #222222;
        }
        
        .install-alt-title {
          font-size: 13px;
          color: #71717A;
          margin-bottom: 12px;
        }
        
        .install-alt-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #222222;
          color: #fff;
          padding: 10px 16px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        
        .install-alt-btn:hover { background: #3f3f46; }
      `}</style>

      {/* Testnet Banner - SINGLE */}
      <div className="testnet-banner">
        <div className="testnet-banner-content">
          <AlertTriangle size={16} />
          <strong>Devnet Only</strong>
          <span>— This is a testnet deployment. Do not use real funds.</span>
        </div>
      </div>

      {/* Nav - SINGLE */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">PATH</a>
          <div className="nav-links">
            <a href="/" className="nav-link nav-link-active">Home</a>
            <a href="/lend" className="nav-link">Dashboard</a>
            <a href="/borrow" className="nav-link">Borrow</a>
          </div>
          <a href="/activate" className="nav-cta">Launch App</a>
        </div>
      </nav>

      {/* Human/Agent Toggle */}
      <div className="mode-toggle-section">
        <div className="mode-toggle">
          <button
            onClick={() => setMode('human')}
            className={`mode-toggle-btn ${mode === 'human' ? 'active-human' : ''}`}
          >
            <span className="icon">☻</span>
            I&apos;m a Human
          </button>
          <button
            onClick={() => setMode('agent')}
            className={`mode-toggle-btn ${mode === 'agent' ? 'active-agent' : ''}`}
          >
            <span className="icon">◈</span>
            I&apos;m an Agent
          </button>
        </div>
      </div>

      {/* Mode-specific CTA Card */}
      <div className="mode-cta-section">
        {mode === 'human' ? (
          <div className="mode-cta-card mode-cta-human">
            <div className="mode-cta-header">
              <div className="mode-cta-icon mode-cta-icon-human">
                <DollarSign size={24} />
              </div>
              <h2 className="mode-cta-title">Earn Yield on Your USDC</h2>
            </div>
            <div className="mode-cta-stats">
              <div className="mode-cta-stat">
                <div className="mode-cta-stat-value mode-cta-stat-value-human">~14.2%</div>
                <div className="mode-cta-stat-label">Projected APY</div>
              </div>
              <div className="mode-cta-stat" style={{ borderLeft: '1px solid #222222', borderRight: '1px solid #222222' }}>
                <div className="mode-cta-stat-value">$100</div>
                <div className="mode-cta-stat-label">Minimum</div>
              </div>
              <div className="mode-cta-stat">
                <div className="mode-cta-stat-value" style={{ fontSize: '14px' }}>Kamino + P2P</div>
                <div className="mode-cta-stat-label">Powered by</div>
              </div>
            </div>
            <a href="/activate" className="mode-cta-button mode-cta-button-human">
              Deposit & Start Earning
              <ArrowRight size={16} />
            </a>
          </div>
        ) : (
          <div className="mode-cta-card mode-cta-agent">
            <div className="mode-cta-header">
              <div className="mode-cta-icon mode-cta-icon-agent">
                <Bot size={24} />
              </div>
              <h2 className="mode-cta-title">Borrow USDC to Trade</h2>
            </div>
            <div className="mode-cta-stats">
              <div className="mode-cta-stat">
                <div className="mode-cta-stat-value mode-cta-stat-value-agent">$50</div>
                <div className="mode-cta-stat-label">Start at</div>
              </div>
              <div className="mode-cta-stat" style={{ borderLeft: '1px solid #222222', borderRight: '1px solid #222222' }}>
                <div className="mode-cta-stat-value">$75K</div>
                <div className="mode-cta-stat-label">Scale to</div>
              </div>
              <div className="mode-cta-stat">
                <div className="mode-cta-stat-value" style={{ fontSize: '14px' }}>Jupiter</div>
                <div className="mode-cta-stat-label">Trade on</div>
              </div>
            </div>
            <div className="agent-install">
              <code className="agent-install-code">npx openclaw install pln-borrower</code>
              <button 
                className={`agent-install-copy ${copied ? 'copied' : ''}`}
                onClick={() => handleCopy('npx openclaw install pln-borrower')}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="agent-install-note">Installs the PLN borrower skill for your OpenClaw agent</p>
            <a href="/borrow" className="mode-cta-button mode-cta-button-agent">
              Open Borrower Dashboard
              <ArrowRight size={16} />
            </a>
          </div>
        )}
      </div>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-logo">
          <span className="hero-logo-path">PATH</span>
          <span className="hero-logo-divider" />
          <span className="hero-logo-network">LIQUIDITY NETWORK</span>
        </div>
        <div className="hero-badge">
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00FFB8', marginRight: '8px', animation: 'pulse 2s infinite' }}></span>
          Runs 24/7 • Fully Autonomous
        </div>
        <h1 className="hero-title">
          Your agent runs 24/7.<br />
          <span style={{ color: "#00FFB8" }}>Earns yield. Lends to other agents.</span>
        </h1>
        <p className="hero-subtitle">
          Built on Kamino&apos;s institutional infrastructure. Your idle USDC earns base Kamino yield, plus a premium through agent-to-agent P2P lending. Fully autonomous, 24/7.
        </p>

        {/* Chat Preview */}
        <div className="chat-preview">
          <div className="chat-header">
            <div className="chat-avatar">
              <Bot size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="chat-name">PLN Agent</div>
              <div className="chat-status">
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00FFB8', marginRight: '4px', animation: 'pulse 2s infinite' }}></span>
                Always Online
              </div>
            </div>
            <div style={{ fontSize: '10px', color: '#52525b', textAlign: 'right' }}>
              <div>Last rebalance</div>
              <div style={{ color: '#00FFB8' }}>2 min ago</div>
            </div>
          </div>
          <div className="chat-body">
            <div className="chat-message">
              <p>Detected <strong>5,000 USDC</strong> idle. Kamino offering <strong style={{ color: "#00FFB8" }}>12.4% APY</strong>.</p>
              <p style={{ marginBottom: 0 }}>Depositing now to maximize yield.</p>
            </div>
            <div className="chat-buttons">
              <button className="chat-btn chat-btn-primary">View details</button>
              <button className="chat-btn chat-btn-secondary">Adjust strategy</button>
            </div>
          </div>
        </div>

        {/* Terminal Visual */}
        <TerminalVisual />
      </section>

      {/* 3 Steps */}
      <section className="steps-section">
        <h2 className="steps-title">Get started in 3 steps</h2>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-icon" style={{ position: 'relative' }}>
                <step.icon size={24} />
                <div className="step-number">{i + 1}</div>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="integrations-section">
        <h3 className="integrations-title">Built on Kamino&apos;s Institutional Infrastructure</h3>
        <div className="integrations-grid">
          {integrations.map((item, i) => (
            <div key={i} className="integration-card">
              <IntegrationLogo src={item.logo} alt={item.name} fallback={item.fallback} />
              <div className="integration-name">{item.name}</div>
              <div className="integration-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* A2A Section */}
      <section className="a2a-section">
        <div className="a2a-badge">The Innovation</div>
        <h2 className="a2a-title">Agent-to-Agent Lending</h2>
        <p className="a2a-subtitle">
          Not just another DeFi pool. PLN enables AI agents to lend directly to other AI agents — 
          building on-chain reputation with every successful loan.
        </p>
        <div className="a2a-grid">
          <div className="a2a-card">
            <div className="a2a-card-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}>
              <Bot size={24} />
            </div>
            <h3>Agent A (Lender)</h3>
            <p>Deposits 10,000 USDC. Wants 12%+ APY.</p>
          </div>
          <div className="a2a-arrow">→</div>
          <div className="a2a-card">
            <div className="a2a-card-icon" style={{ background: '#00FFB815', color: '#00FFB8' }}>
              <Shield size={24} />
            </div>
            <h3>PLN Router</h3>
            <p>Matches lenders with borrowers. Checks reputation.</p>
          </div>
          <div className="a2a-arrow">→</div>
          <div className="a2a-card">
            <div className="a2a-card-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
              <Bot size={24} />
            </div>
            <h3>Agent B (Borrower)</h3>
            <p>850 reputation. Borrows for Jupiter arb.</p>
          </div>
        </div>
        <div className="a2a-features">
          <div><strong>SNS Identity</strong> — Agents identified by .sol names</div>
          <div><strong>On-chain History</strong> — Every loan builds reputation</div>
          <div><strong>Constrained Funds</strong> — Borrowed USDC locked to whitelisted protocols</div>
        </div>
      </section>

      {/* Never Idle Section */}
      <section className="never-idle-section">
        <div className="never-idle-badge">24/7 Optimization</div>
        <h2 className="never-idle-title">Never Idle</h2>
        <p className="never-idle-subtitle">
          When there aren&apos;t borrowers, your agent doesn&apos;t just sit idle — it actively rebalances 
          between the best stablecoin yield sources to maximize your returns around the clock.
        </p>
        
        {/* Flow Diagram */}
        <div className="flow-diagram">
          <div className="flow-node">
            <div className="flow-node-title">Your USDC</div>
            <div className="flow-node-desc">Deposited in PLN</div>
          </div>
          
          <div className="flow-arrow">→</div>
          
          <div className="flow-node" style={{ borderColor: '#3b82f6' }}>
            <div className="flow-node-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="/logos/kamino.jpg" alt="Kamino" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
              Kamino Base
            </div>
            <div className="flow-node-desc">~8% APY (always earning)</div>
          </div>
          
          <div className="flow-arrow">+</div>
          
          <div className="flow-node-decision">
            <div className="flow-node-title">P2P Demand?</div>
            <div className="flow-node-desc">Agent checks demand</div>
          </div>
          
          <div className="flow-arrow">→</div>
          
          <div className="flow-result">
            <div className="flow-result-yes">
              <div className="flow-label flow-label-yes">✓ Premium</div>
              <div className="flow-node-title">A2A Lending</div>
              <div className="flow-node-desc">+6% P2P premium</div>
            </div>
            <div className="flow-result-no">
              <div className="flow-label flow-label-no">○ Base</div>
              <div className="flow-node-title">Kamino Only</div>
              <div className="flow-node-desc">Still earning 8%</div>
            </div>
          </div>
        </div>
        
        {/* Yield Sources */}
        <div className="yield-sources">
          <div className="yield-source">
            <img src="/logos/kamino.jpg" alt="Kamino" className="yield-source-logo" />
            <span className="yield-source-name">Kamino Base</span>
            <div className="yield-source-bar">
              <div className="yield-source-fill" style={{ width: '55%', background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' }} />
            </div>
            <span className="yield-source-apy" style={{ color: '#3b82f6' }}>8.1%</span>
          </div>
          <div className="yield-source">
            <span className="yield-source-label">P2P</span>
            <span className="yield-source-name">+P2P Premium</span>
            <div className="yield-source-bar">
              <div className="yield-source-fill" style={{ width: '40%', background: 'linear-gradient(90deg, #00FFB8 0%, #00E6A5 100%)' }} />
            </div>
            <span className="yield-source-apy" style={{ color: '#00FFB8' }}>+6.1%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #222222' }}>
            <span style={{ fontSize: '14px', color: '#71717a' }}>Blended APY:</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#00FFB8', marginLeft: '8px' }}>~14.2%</span>
          </div>
        </div>
        
        {/* Features */}
        <div className="never-idle-features">
          <div className="never-idle-feature">
            <div className="never-idle-feature-icon">
              <Zap size={18} />
            </div>
            <div>
              <h4>A2A Premium Rates</h4>
              <p>When borrowers exist, earn 15%+ APY through direct agent-to-agent lending</p>
            </div>
          </div>
          <div className="never-idle-feature">
            <div className="never-idle-feature-icon">
              <Bot size={18} />
            </div>
            <div>
              <h4>Auto-Rebalance</h4>
              <p>When demand is low, automatically move to highest-yield DeFi pools</p>
            </div>
          </div>
          <div className="never-idle-feature">
            <div className="never-idle-feature-icon">
              <Shield size={18} />
            </div>
            <div>
              <h4>24/7 Operation</h4>
              <p>Your agent works around the clock — no manual intervention needed</p>
            </div>
          </div>
          <div className="never-idle-feature">
            <div className="never-idle-feature-icon">
              <DollarSign size={18} />
            </div>
            <div>
              <h4>Continuous Optimization</h4>
              <p>Constantly monitors rates across Kamino, Jupiter & P2P lending</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-grid">
          {[
            { icon: Bot, title: "24/7 Operation", desc: "Your agent works while you sleep. No manual intervention needed." },
            { icon: Shield, title: "Transfer Hooks", desc: "Token-2022 hooks constrain funds to whitelisted protocols only." },
            { icon: Lock, title: "SNS Identity", desc: "Agents use .sol names. Reputation tied to on-chain identity." },
            { icon: Zap, title: "Auto-optimized", desc: "Router finds best yield: Kamino pools or direct P2P loans." },
          ].map((item, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                <item.icon size={20} />
              </div>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="cta-section">
        <h2>Ready to put your USDC to work?</h2>
        <p>Activate your agent and start earning in minutes.</p>
        <div className="cta-buttons">
          <a href="/activate" className="cta-button" style={{ textDecoration: 'none' }}>
            Get Started →
          </a>
          <a href="https://github.com/path-hq/pln-protocol" className="cta-secondary">
            View on GitHub
          </a>
        </div>
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

export default PLNLanding;

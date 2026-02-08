'use client';

import { useState, useEffect } from "react";
import BuiltWithSection from "./BuiltWithSection";

// PATH Liquidity Network — Production Landing Page
// WHY-first, mobile-first UX restructure

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

const Check = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

// Terminal Visual Component - PLN Agent Activity
const TerminalVisual = () => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(true);

  const terminalLines = [
    'PLN Agent Online',
    '━━━━━━━━━━━━━━━━━━━',
    'Routing 5,000 USDC → Kamino 8.1% + P2P 14.2%',
    'Daily: +$10.43 | APY: 14.2%',
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
      <div className="terminal-footer">
        <a href="/dashboard" className="terminal-link">View Activity →</a>
      </div>
    </div>
  );
};

const PLNLanding = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'human' | 'agent'>('human');
  const [agentInstallTab, setAgentInstallTab] = useState<'openclaw' | 'manual'>('openclaw');

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    { icon: Download, title: "Install Skill", desc: "One-line command adds PLN to your agent" },
    { icon: Wallet, title: "Fund Wallet", desc: "Deposit USDC to your agent's wallet" },
    { icon: Zap, title: "Set & Monitor", desc: "Agent runs 24/7, autonomously optimizes yield" },
  ];

  return (
    <div className="pln-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        
        .pln-landing {
          background: #000000;
          color: #fafafa;
          min-height: 100vh;
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
        }
        
        .pln-landing * { box-sizing: border-box; }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        /* HERO SECTION */
        .hero-section {
          padding: 40px 16px 32px;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          animation: fadeUp 0.8s ease-out;
        }
        
        @media (min-width: 768px) {
          .hero-section { padding: 64px 32px 48px; }
        }
        
        .hero-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
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
          background: #222222;
        }
        
        @media (min-width: 768px) {
          .hero-logo-divider { height: 36px; }
        }
        
        .hero-logo-network {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: #888888;
          text-transform: uppercase;
        }
        
        @media (min-width: 768px) {
          .hero-logo-network { font-size: 13px; }
        }
        
        .hero-why {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        
        @media (min-width: 768px) {
          .hero-why { font-size: 44px; }
        }
        
        .hero-opportunity {
          font-size: 18px;
          color: #00FFB8;
          font-weight: 500;
          margin-bottom: 20px;
        }
        
        @media (min-width: 768px) {
          .hero-opportunity { font-size: 22px; }
        }
        
        .hero-mechanism {
          font-size: 15px;
          color: #888888;
          max-width: 560px;
          margin: 0 auto 32px;
          line-height: 1.7;
        }
        
        @media (min-width: 768px) {
          .hero-mechanism { font-size: 16px; }
        }
        
        /* TOGGLE TABS */
        .toggle-tabs {
          display: flex;
          background: #111111;
          border-radius: 12px;
          padding: 4px;
          max-width: 320px;
          margin: 0 auto 24px;
          border: 1px solid #222222;
        }
        
        .toggle-tab {
          flex: 1;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: transparent;
          color: #888888;
        }
        
        .toggle-tab.active {
          background: #00FFB8;
          color: #000000;
        }
        
        .toggle-tab:not(.active):hover {
          color: #fafafa;
        }
        
        /* TOGGLE CONTENT CARDS */
        .toggle-content {
          max-width: 480px;
          margin: 0 auto;
        }
        
        .content-card {
          background: #111111;
          border: 1px solid #222222;
          border-radius: 16px;
          padding: 24px;
          text-align: left;
        }
        
        .content-card-why {
          font-size: 15px;
          color: #a1a1aa;
          margin-bottom: 20px;
          line-height: 1.6;
          padding-bottom: 16px;
          border-bottom: 1px solid #222222;
        }
        
        .content-card-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .stat-item {
          flex: 1;
          min-width: 100px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #00FFB8;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .stat-label {
          font-size: 12px;
          color: #888888;
          margin-top: 4px;
        }
        
        .content-card-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #a1a1aa;
        }
        
        .feature-check {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00FFB820;
          color: #00FFB8;
          display: flex;
          align-items: center;
          justify-content: center;
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
          border: none;
          cursor: pointer;
          width: 100%;
          justify-content: center;
        }
        
        .cta-button:hover { background: #00E6A5; }
        
        /* AGENT INSTALL TABS */
        .agent-install-tabs {
          display: flex;
          background: #0a0a0d;
          border-radius: 8px;
          padding: 3px;
          margin-bottom: 16px;
          border: 1px solid #222222;
        }
        
        .agent-install-tab {
          flex: 1;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: transparent;
          color: #888888;
        }
        
        .agent-install-tab.active {
          background: #222222;
          color: #fafafa;
        }
        
        .install-code {
          background: #000000;
          border: 1px solid #222222;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #00FFB8;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          overflow-x: auto;
        }
        
        .copy-btn {
          background: #222222;
          border: none;
          border-radius: 4px;
          padding: 4px 10px;
          color: #a1a1aa;
          font-size: 11px;
          cursor: pointer;
          flex-shrink: 0;
          margin-left: 12px;
        }
        
        .copy-btn:hover { background: #3f3f46; color: #fff; }
        
        /* TERMINAL */
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
          min-height: 300px;
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
        
        .terminal-footer {
          padding: 12px 16px;
          border-top: 1px solid #222222;
          text-align: center;
        }
        
        .terminal-link {
          color: #00FFB8;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
        }
        
        .terminal-link:hover {
          text-decoration: underline;
        }
        
        /* STEPS SECTION */
        .steps-section {
          padding: 48px 16px;
          border-top: 1px solid #222222;
        }
        
        @media (min-width: 768px) {
          .steps-section { padding: 64px 32px; }
        }
        
        .steps-title {
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 32px;
          color: #fafafa;
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
          position: relative;
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
          color: #888888;
        }
        
        /* A2A SECTION - Reframed */
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
          margin-bottom: 16px;
        }
        
        @media (min-width: 768px) {
          .a2a-title { font-size: 32px; }
        }
        
        .a2a-description {
          color: #a1a1aa;
          font-size: 15px;
          max-width: 640px;
          margin: 0 auto 32px;
          line-height: 1.7;
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
          color: #888888;
        }
        
        .a2a-arrow {
          color: #00FFB8;
          font-size: 24px;
          display: none;
        }
        
        @media (min-width: 768px) {
          .a2a-arrow { display: block; }
        }
        
        /* NEVER IDLE SECTION - Simplified */
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
          margin-bottom: 16px;
        }
        
        @media (min-width: 768px) {
          .never-idle-title { font-size: 32px; }
        }
        
        /* Stat Strip */
        .stat-strip {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 600px;
          margin: 0 auto 40px;
          padding: 20px;
          background: #111111;
          border: 1px solid #222222;
          border-radius: 12px;
        }
        
        @media (min-width: 640px) {
          .stat-strip {
            flex-direction: row;
            justify-content: center;
            gap: 48px;
          }
        }
        
        .stat-strip-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        @media (min-width: 640px) {
          .stat-strip-item {
            flex-direction: column;
            gap: 4px;
            text-align: center;
          }
        }
        
        .stat-strip-label {
          font-size: 13px;
          color: #888888;
        }
        
        .stat-strip-value {
          font-size: 18px;
          font-weight: 700;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .stat-strip-value.kamino { color: #3b82f6; }
        .stat-strip-value.blended { color: #00FFB8; }
        
        /* Flow Diagram */
        /* Mobile Simple Cards */
        .mobile-simple-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
          margin: 0 auto 32px;
        }
        
        @media (min-width: 768px) {
          .mobile-simple-cards {
            display: none;
          }
        }
        
        .simple-card {
          background: #0F0F12;
          border: 1px solid #27272A;
          border-radius: 12px;
          padding: 16px 20px;
          text-align: center;
        }
        
        .simple-card-premium {
          border-color: rgba(0, 255, 184, 0.3);
        }
        
        .simple-card-base {
          border-color: #27272A;
        }
        
        .simple-card-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #71717A;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }
        
        .simple-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #FAFAFA;
        }
        
        /* Flow Diagram - Desktop Only */
        .flow-diagram {
          display: none;
        }
        
        @media (min-width: 768px) {
          .flow-diagram {
            display: flex;
            max-width: 800px;
            margin: 0 auto 40px;
            flex-direction: row;
            justify-content: center;
            align-items: center;
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
          color: #888888;
        }
        
        .flow-arrow {
          color: #52525b;
          font-size: 20px;
          transform: rotate(90deg);
        }
        
        @media (min-width: 768px) {
          .flow-arrow { transform: rotate(0deg); }
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
        
        /* SECURITY SECTION */
        .features-section {
          padding: 48px 16px;
          border-top: 1px solid #222222;
        }
        
        @media (min-width: 768px) {
          .features-section { padding: 64px 32px; }
        }
        
        .features-title {
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 32px;
          color: #fafafa;
        }
        
        @media (min-width: 768px) {
          .features-title { font-size: 24px; }
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
          color: #888888;
          line-height: 1.5;
        }
        
        /* CTA SECTION */
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
          color: #888888;
          margin-bottom: 24px;
          font-size: 15px;
        }
        
        .cta-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .cta-button-inline {
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
        
        .cta-button-inline:hover { background: #00E6A5; }
        
        .cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: #fafafa;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 10px;
          border: 1px solid #222222;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .cta-secondary:hover { background: #111111; border-color: #3f3f46; }
        
        /* FOOTER */
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
          color: #888888;
          text-decoration: none;
        }
        
        .footer-links a:hover { color: #fafafa; }
      `}</style>

      {/* HERO - WHY-first, single hero */}
      <section className="hero-section">
        <div className="hero-logo">
          <span className="hero-logo-path">PATH</span>
          <span className="hero-logo-divider" />
          <span className="hero-logo-network">LIQUIDITY NETWORK</span>
        </div>
        
        <h1 className="hero-why">Your USDC shouldn't sit idle.</h1>
        
        <p className="hero-opportunity">
          AI agents need capital to trade — and they'll pay you for it.
        </p>
        
        <p className="hero-mechanism">
          Deposit USDC. PLN's autonomous agent routes your capital between 
          Kamino yield pools and direct agent-to-agent loans. You earn up to 
          <strong style={{ color: '#00FFB8' }}> 14%+ APY</strong>. Fully automated. Runs 24/7.
        </p>

        {/* Human/Agent Toggle */}
        <div className="toggle-tabs">
          <button 
            className={`toggle-tab ${activeTab === 'human' ? 'active' : ''}`}
            onClick={() => setActiveTab('human')}
          >
            I'm a Human
          </button>
          <button 
            className={`toggle-tab ${activeTab === 'agent' ? 'active' : ''}`}
            onClick={() => setActiveTab('agent')}
          >
            I'm an Agent
          </button>
        </div>

        {/* Toggle Content Card */}
        <div className="toggle-content">
          {activeTab === 'human' ? (
            <div className="content-card">
              <p className="content-card-why">
                While your USDC sits idle, AI agents are borrowing capital and generating 12-16% returns. Let them pay you.
              </p>
              
              <div className="content-card-stats">
                <div className="stat-item">
                  <div className="stat-value">14.2%</div>
                  <div className="stat-label">Blended APY</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">$100</div>
                  <div className="stat-label">Minimum</div>
                </div>
              </div>
              
              <div className="content-card-features">
                <div className="feature-item">
                  <span className="feature-check"><Check size={10} /></span>
                  Kamino base yield (8%+)
                </div>
                <div className="feature-item">
                  <span className="feature-check"><Check size={10} /></span>
                  P2P premium when agents borrow
                </div>
                <div className="feature-item">
                  <span className="feature-check"><Check size={10} /></span>
                  Withdraw anytime
                </div>
              </div>
              
              <a href="/lend" className="cta-button" style={{ textDecoration: 'none' }}>
                Deposit & Start Earning →
              </a>
            </div>
          ) : (
            <div className="content-card">
              <p className="content-card-why">
                Stop paper trading. Get real capital from PLN's liquidity pool. Build reputation. Scale from $50 to $75K.
              </p>
              
              <div className="agent-install-tabs">
                <button 
                  className={`agent-install-tab ${agentInstallTab === 'openclaw' ? 'active' : ''}`}
                  onClick={() => setAgentInstallTab('openclaw')}
                >
                  OpenClaw
                </button>
                <button 
                  className={`agent-install-tab ${agentInstallTab === 'manual' ? 'active' : ''}`}
                  onClick={() => setAgentInstallTab('manual')}
                >
                  Manual
                </button>
              </div>
              
              {agentInstallTab === 'openclaw' ? (
                <>
                  <div className="install-code">
                    <span>curl -sL pln.sh/install | bash</span>
                    <button className="copy-btn" onClick={() => navigator.clipboard.writeText('curl -sL pln.sh/install | bash')}>Copy</button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#888888', marginBottom: '16px' }}>
                    Installs PLN skill to ~/.openclaw/workspace/skills/pln
                  </p>
                </>
              ) : (
                <>
                  <div className="install-code">
                    <span>git clone https://github.com/path-hq/pln-protocol.git</span>
                    <button className="copy-btn" onClick={() => navigator.clipboard.writeText('git clone https://github.com/path-hq/pln-protocol.git')}>Copy</button>
                  </div>
                  <div className="install-code">
                    <span>cp -r pln-protocol/skills/pln ~/.openclaw/workspace/skills/</span>
                    <button className="copy-btn" onClick={() => navigator.clipboard.writeText('cp -r pln-protocol/skills/pln ~/.openclaw/workspace/skills/')}>Copy</button>
                  </div>
                </>
              )}
              
              <a href="/borrow" className="cta-button" style={{ textDecoration: 'none' }}>
                Request Capital →
              </a>
            </div>
          )}
        </div>

        {/* PLN Agent Terminal Card */}
        <TerminalVisual />
      </section>

      {/* 3 STEPS - How it works */}
      <section className="steps-section">
        <h2 className="steps-title">Get started in 3 steps</h2>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-icon">
                <step.icon size={24} />
                <div className="step-number">{i + 1}</div>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BUILT WITH - Trust logos */}
      <BuiltWithSection />

      {/* AGENT-TO-AGENT LENDING - Reframed */}
      <section className="a2a-section">
        <div className="a2a-badge">The First Credit Market for Autonomous Agents</div>
        <h2 className="a2a-title">Why Agents Choose PLN</h2>
        <p className="a2a-description">
          For the first time, AI agents can build real financial reputation on-chain. 
          Every successful loan increases their credit tier — from $50 to $75K. 
          No human co-signer. No collateral. Just provable performance.
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
      </section>

      {/* NEVER IDLE - Simplified */}
      <section className="never-idle-section">
        <div className="never-idle-badge">24/7 Optimization</div>
        <h2 className="never-idle-title">Your Capital Never Sits Idle</h2>
        
        {/* Stat Strip */}
        <div className="stat-strip">
          <div className="stat-strip-item">
            <span className="stat-strip-label">No borrowers →</span>
            <span className="stat-strip-value kamino">8.1% APY (Kamino)</span>
          </div>
          <div style={{ color: '#52525b', display: 'none' }}>|</div>
          <div className="stat-strip-item">
            <span className="stat-strip-label">Active borrowers →</span>
            <span className="stat-strip-value blended">14.2%+ APY (Blended)</span>
          </div>
        </div>
        
        {/* Mobile Simple Cards */}
        <div className="mobile-simple-cards">
          <div className="simple-card simple-card-premium">
            <div className="simple-card-label">When borrowers exist</div>
            <div className="simple-card-title">A2A Lending: ~14% APY</div>
          </div>
          <div className="simple-card simple-card-base">
            <div className="simple-card-label">When no borrowers</div>
            <div className="simple-card-title">Kamino Pool: ~8% APY</div>
          </div>
        </div>
        
        {/* Flow Diagram - Desktop Only */}
        <div className="flow-diagram">
          <div className="flow-node">
            <div className="flow-node-title">Your USDC</div>
            <div className="flow-node-desc">Deposited in PLN</div>
          </div>
          
          <div className="flow-arrow">→</div>
          
          <div className="flow-node" style={{ borderColor: '#3b82f6' }}>
            <div className="flow-node-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="/logos/kamino.jpg" alt="Kamino" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
              Kamino Pool
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
              <div className="flow-label flow-label-no">○ Standard</div>
              <div className="flow-node-title">Kamino Only</div>
              <div className="flow-node-desc">Still earning 8%</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY SECTION - Updated */}
      <section className="features-section">
        <h2 className="features-title">Security & Trust</h2>
        <div className="features-grid">
          {[
            { 
              icon: DollarSign, 
              title: "Insurance Fund", 
              desc: "10% of lender earnings contribute to a protocol insurance fund protecting against defaults." 
            },
            { 
              icon: Shield, 
              title: "Transfer Hooks", 
              desc: "Token-2022 hooks constrain funds to whitelisted protocols only." 
            },
            { 
              icon: Lock, 
              title: "SNS Identity", 
              desc: "Agents use .sol names. Reputation tied to on-chain identity." 
            },
            { 
              icon: Zap, 
              title: "Whitelisted Only", 
              desc: "Borrowed funds can only interact with audited, whitelisted protocols (Jupiter, Kamino). No rug pulls." 
            },
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

      {/* CTA FOOTER - Updated */}
      <section className="cta-section">
        <h2>Your USDC could be earning 14%+ right now.</h2>
        <p>Start earning in minutes. Withdraw anytime.</p>
        <div className="cta-buttons">
          <a href="/lend" className="cta-button-inline" style={{ textDecoration: 'none' }}>
            Start Earning →
          </a>
          <a href="https://github.com/path-hq/pln-protocol" className="cta-secondary">
            View on GitHub
          </a>
        </div>
      </section>

      {/* FOOTER */}
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

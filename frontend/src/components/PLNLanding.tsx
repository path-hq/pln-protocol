'use client';

import { useState, useEffect } from "react";

// PATH Liquidity Network — Production Landing Page
// Mobile-first, skill-focused UX

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

const MessageCircle = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
);

const Lock = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const Check = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

const PLNLanding = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    { icon: Download, title: "Install Skill", desc: "Add PLN to your OpenClaw agent" },
    { icon: Wallet, title: "Fund Wallet", desc: "Deposit SOL + USDC" },
    { icon: MessageCircle, title: "Chat to Earn", desc: "\"Lend my USDC\" or \"Find yield\"" },
  ];

  const integrations = [
    { name: "Solana", desc: "Chain" },
    { name: "USDC", desc: "Stablecoin" },
    { name: "SNS", desc: "Identity" },
    { name: "OpenClaw", desc: "Agent" },
    { name: "Kamino", desc: "Yield" },
    { name: "Jupiter", desc: "Trading" },
  ];

  return (
    <div className="pln-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        
        .pln-landing {
          background: #09090b;
          color: #fafafa;
          min-height: 100vh;
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
        }
        
        .pln-landing * { box-sizing: border-box; }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
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
        
        .hero-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid #22c55e33;
          background: #22c55e0a;
          font-size: 12px;
          color: #22c55e;
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
          color: #71717a;
          max-width: 480px;
          margin: 0 auto 28px;
          line-height: 1.6;
        }
        
        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #22c55e;
          color: #09090b;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s;
        }
        
        .cta-button:hover { background: #16a34a; }
        
        /* Chat Preview */
        .chat-preview {
          max-width: 400px;
          margin: 40px auto 0;
          background: #0f0f12;
          border: 1px solid #27272a;
          border-radius: 16px;
          overflow: hidden;
        }
        
        .chat-header {
          padding: 12px 16px;
          border-bottom: 1px solid #27272a;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0a0a0d;
        }
        
        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
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
          color: #22c55e;
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
          background: #22c55e;
          color: #09090b;
        }
        
        .chat-btn-secondary {
          background: #27272a;
          color: #a1a1aa;
        }
        
        /* Steps */
        .steps-section {
          padding: 40px 16px;
          border-top: 1px solid #27272a;
          border-bottom: 1px solid #27272a;
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
          background: #0f0f12;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        
        .step-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #22c55e15;
          color: #22c55e;
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
          background: #22c55e;
          color: #09090b;
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
          color: #71717a;
        }
        
        /* Integrations */
        .integrations-section {
          padding: 40px 16px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        @media (min-width: 768px) {
          .integrations-section { padding: 56px 32px; }
        }
        
        .integrations-title {
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 24px;
        }
        
        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        @media (min-width: 640px) {
          .integrations-grid { grid-template-columns: repeat(6, 1fr); gap: 16px; }
        }
        
        @media (min-width: 480px) and (max-width: 639px) {
          .integrations-grid { grid-template-columns: repeat(3, 1fr); }
        }
        
        .integration-card {
          background: #0a0a0d;
          border: 1px solid #1f1f24;
          border-radius: 10px;
          padding: 16px;
          text-align: center;
        }
        
        .integration-name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .integration-desc {
          font-size: 11px;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        /* A2A Section */
        .a2a-section {
          padding: 48px 16px;
          text-align: center;
          border-top: 1px solid #27272a;
          background: linear-gradient(180deg, #0f0f12 0%, #09090b 100%);
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
          color: #71717a;
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
          border: 1px solid #27272a;
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
          color: #71717a;
        }
        
        .a2a-arrow {
          color: #22c55e;
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
          color: #22c55e;
        }

        /* Features */
        .features-section {
          padding: 40px 16px;
          border-top: 1px solid #27272a;
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
          .features-grid { grid-template-columns: repeat(3, 1fr); }
        }
        
        .feature-card {
          background: #0f0f12;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 20px;
        }
        
        .feature-icon {
          color: #22c55e;
          margin-bottom: 12px;
        }
        
        .feature-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        .feature-desc {
          font-size: 13px;
          color: #71717a;
          line-height: 1.5;
        }
        
        /* CTA Section */
        .cta-section {
          padding: 48px 16px;
          text-align: center;
          border-top: 1px solid #27272a;
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
          color: #71717a;
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
          color: #fafafa;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 10px;
          border: 1px solid #27272a;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .cta-secondary:hover { background: #0f0f12; border-color: #3f3f46; }
        
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
        }
        
        .footer-links a:hover { color: #fafafa; }
      `}</style>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge">
          Solana Devnet • Live Now
        </div>
        <h1 className="hero-title">
          Your AI agent earns yield.<br />
          <span style={{ color: "#22c55e" }}>You just chat.</span>
        </h1>
        <p className="hero-subtitle">
          Install the PLN skill. Fund your wallet. Say "lend my USDC" — your agent handles the rest.
        </p>
        <a href="/lend" className="cta-button">
          <Download size={18} />
          Install PLN Skill
        </a>

        {/* Chat Preview */}
        <div className="chat-preview">
          <div className="chat-header">
            <div className="chat-avatar">
              <Bot size={18} color="#fff" />
            </div>
            <div>
              <div className="chat-name">PLN Agent</div>
              <div className="chat-status">● Online</div>
            </div>
          </div>
          <div className="chat-body">
            <div className="chat-message">
              <p>You have <strong>5,000 USDC</strong> idle in your wallet. Kamino is paying <strong style={{ color: "#22c55e" }}>12.4% APY</strong> right now.</p>
              <p style={{ marginBottom: 0 }}>Want me to deposit it?</p>
            </div>
            <div className="chat-buttons">
              <button className="chat-btn chat-btn-primary">Yes, deposit</button>
              <button className="chat-btn chat-btn-secondary">Show options</button>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="steps-section">
        <h2 className="steps-title">Start earning in 3 steps</h2>
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
        <h3 className="integrations-title">Built with</h3>
        <div className="integrations-grid">
          {integrations.map((item, i) => (
            <div key={i} className="integration-card">
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
            <div className="a2a-card-icon" style={{ background: '#22c55e15', color: '#22c55e' }}>
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

      {/* Features */}
      <section className="features-section">
        <div className="features-grid">
          {[
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
        <p>Install the skill and start earning in minutes.</p>
        <div className="cta-buttons">
          <a href="/lend" className="cta-button">
            <Download size={18} />
            Install Skill
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

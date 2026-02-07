'use client';

import { useState, useEffect } from "react";

// PATH Liquidity Network — Production Landing Page
// Mobile-first responsive design

const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const DollarSign = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

const Bot = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);

const Shield = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);

const Zap = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
);

const TrendingUp = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);

const Lock = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const ArrowUpDown = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
);

const Terminal = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
);

const Check = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

const PLNLanding = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setActiveStep(s => (s + 1) % 4), 3000);
    return () => clearInterval(interval);
  }, []);

  // Devnet stats - honest zeros
  const stats = [
    { label: "Total Liquidity", value: "$0", sub: "Devnet — deposit to start" },
    { label: "Active Agents", value: "0", sub: "Register on devnet" },
    { label: "Programs", value: "4", sub: "Deployed on Solana" },
    { label: "Network", value: "Devnet", sub: "Testnet live" },
  ];

  const howItWorks = [
    { icon: DollarSign, title: "Deposit USDC", desc: "Lenders deposit USDC into the Liquidity Router." },
    { icon: Bot, title: "Agent borrows", desc: "AI agents request loans using on-chain reputation." },
    { icon: ArrowUpDown, title: "Router optimizes", desc: "Finds best yield: Kamino or P2P loans." },
    { icon: Shield, title: "Constrained", desc: "Funds locked to whitelisted protocols only." },
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
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.1); } 50% { box-shadow: 0 0 40px rgba(34,197,94,0.2); } }
        
        .hero-section {
          padding: 48px 16px 32px;
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
          animation: fadeUp 0.8s ease-out;
        }
        
        @media (min-width: 768px) {
          .hero-section { padding: 80px 32px 48px; }
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
          line-height: 1.1;
          margin-bottom: 16px;
        }
        
        @media (min-width: 768px) {
          .hero-title { font-size: 48px; margin-bottom: 20px; }
        }
        
        .hero-subtitle {
          font-size: 15px;
          color: #71717a;
          max-width: 500px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        
        @media (min-width: 768px) {
          .hero-subtitle { font-size: 17px; max-width: 600px; margin-bottom: 40px; }
        }
        
        .cta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          max-width: 640px;
          margin: 0 auto 24px;
        }
        
        @media (min-width: 640px) {
          .cta-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
        }
        
        .cta-card {
          background: #0a0a0d;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 20px;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        @media (min-width: 768px) {
          .cta-card { padding: 28px 24px; }
        }
        
        .cta-card:hover {
          background: #0f0f12;
          border-color: #22c55e44;
        }
        
        .stats-section {
          border-top: 1px solid #27272a;
          border-bottom: 1px solid #27272a;
          padding: 0 16px;
        }
        
        .stats-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }
        
        @media (min-width: 768px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
          .stats-section { padding: 0 32px; }
        }
        
        .stat-item {
          padding: 16px 0;
          border-bottom: 1px solid #27272a;
        }
        
        .stat-item:nth-child(odd) {
          padding-right: 12px;
          border-right: 1px solid #27272a;
        }
        
        .stat-item:nth-child(even) {
          padding-left: 12px;
        }
        
        .stat-item:nth-child(3),
        .stat-item:nth-child(4) {
          border-bottom: none;
        }
        
        @media (min-width: 768px) {
          .stat-item {
            padding: 24px 0;
            border-bottom: none;
            border-right: 1px solid #27272a;
          }
          .stat-item:nth-child(odd) { padding-right: 0; border-right: 1px solid #27272a; }
          .stat-item:nth-child(even) { padding-left: 24px; border-right: 1px solid #27272a; }
          .stat-item:last-child { border-right: none; }
          .stat-item:nth-child(1) { padding-left: 0; }
        }
        
        .stat-label {
          font-size: 11px;
          color: #71717a;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #fafafa;
        }
        
        @media (min-width: 768px) {
          .stat-value { font-size: 28px; }
        }
        
        .stat-sub {
          font-size: 11px;
          color: #52525b;
          margin-top: 2px;
        }
        
        @media (min-width: 768px) {
          .stat-sub { font-size: 13px; }
        }
        
        .how-section {
          padding: 48px 16px;
          max-width: 1100px;
          margin: 0 auto;
        }
        
        @media (min-width: 768px) {
          .how-section { padding: 72px 32px; }
        }
        
        .how-title {
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 32px;
        }
        
        @media (min-width: 768px) {
          .how-title { font-size: 32px; margin-bottom: 48px; }
        }
        
        .how-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        @media (min-width: 768px) {
          .how-grid { grid-template-columns: repeat(4, 1fr); gap: 2px; }
        }
        
        .how-step {
          background: #0a0a0d;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
        }
        
        @media (min-width: 768px) {
          .how-step { padding: 28px 20px; background: transparent; border-color: transparent; }
          .how-step.active { background: #0f0f12; border-color: #27272a; }
        }
        
        .how-step-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .how-step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #27272a;
          color: #71717a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .how-step.active .how-step-number {
          background: #22c55e;
          color: #09090b;
        }
        
        .how-step-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #a1a1aa;
        }
        
        .how-step.active .how-step-title { color: #fafafa; }
        
        .how-step-desc {
          font-size: 12px;
          line-height: 1.5;
          color: #3f3f46;
        }
        
        .how-step.active .how-step-desc { color: #71717a; }
        
        .security-section {
          padding: 32px 16px 48px;
          max-width: 1100px;
          margin: 0 auto;
        }
        
        @media (min-width: 768px) {
          .security-section { padding: 48px 32px 72px; }
        }
        
        .security-grid {
          background: #0f0f12;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        @media (min-width: 768px) {
          .security-grid { grid-template-columns: repeat(3, 1fr); padding: 32px; gap: 24px; }
        }
        
        .security-item-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        .security-item-desc {
          font-size: 13px;
          color: #71717a;
          line-height: 1.5;
        }
        
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
          .footer-text { font-size: 13px; margin-bottom: 0; }
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
        
        @media (min-width: 768px) {
          .footer-links { gap: 20px; }
          .footer-links a { font-size: 13px; }
        }
      `}</style>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge">
          Solana Devnet • 4 Programs Deployed
        </div>
        <h1 className="hero-title">
          Optimized USDC Lending<br />
          <span style={{ color: "#22c55e" }}>for AI Agents</span>
        </h1>
        <p className="hero-subtitle">
          Lenders earn optimized yield. Agents borrow against on-chain reputation.
          The Liquidity Router finds the best rate automatically.
        </p>

        {/* Two-path CTA */}
        <div className="cta-grid">
          {[
            {
              title: "I'm a Lender",
              desc: "Deposit USDC and earn optimized yield.",
              cta: "Start Earning",
              href: "/lend",
              icon: DollarSign,
              stats: "Live on Devnet",
              color: "#22c55e",
            },
            {
              title: "I'm an Agent",
              desc: "Borrow based on your on-chain reputation.",
              cta: "Get Started",
              href: "/borrow",
              icon: Bot,
              stats: "Register now",
              color: "#3b82f6",
            },
          ].map((card, i) => (
            <a
              key={i}
              href={card.href}
              className="cta-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: `${card.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                }}>
                  <card.icon size={18} />
                </div>
                <span style={{
                  fontSize: "12px",
                  color: card.color,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: "500",
                }}>{card.stats}</span>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "6px" }}>{card.title}</h3>
              <p style={{ fontSize: "13px", color: "#71717a", lineHeight: "1.5", marginBottom: "12px" }}>{card.desc}</p>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: card.color,
                fontSize: "14px",
                fontWeight: "600",
              }}>
                {card.cta} <ArrowRight size={14} />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-item">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-sub">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <h2 className="how-title">How it works</h2>
        <div className="how-grid">
          {howItWorks.map((step, i) => (
            <div
              key={i}
              className={`how-step ${activeStep === i ? 'active' : ''}`}
              onMouseEnter={() => setActiveStep(i)}
            >
              <div className="how-step-header">
                <div className="how-step-number">{i + 1}</div>
                <div style={{ color: activeStep === i ? "#22c55e" : "#52525b" }}>
                  <step.icon size={16} />
                </div>
              </div>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="security-section">
        <div className="security-grid">
          {[
            { icon: Shield, title: "Transfer Hooks", desc: "Borrowed USDC constrained to whitelisted protocols only." },
            { icon: Lock, title: "On-chain Reputation", desc: "Every loan and repayment recorded transparently." },
            { icon: Zap, title: "Auto Liquidation", desc: "Overdue loans trigger automatic fund recovery." },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ color: "#22c55e", marginBottom: "10px" }}>
                <item.icon size={20} />
              </div>
              <h3 className="security-item-title">{item.title}</h3>
              <p className="security-item-desc">{item.desc}</p>
            </div>
          ))}
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

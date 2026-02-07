'use client';

import { useState, useEffect } from "react";

// PATH Liquidity Network — Production Landing Page
// Design: Dark institutional, green accent (#22c55e), clean typography

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

  // Simulated live stats
  const stats = [
    { label: "Total Liquidity", value: "$2.4M", sub: "USDC deposited" },
    { label: "Active Agents", value: "47", sub: "borrowing now" },
    { label: "Avg Lender APY", value: "14.2%", sub: "last 30 days" },
    { label: "Loans Repaid", value: "98.7%", sub: "repayment rate" },
  ];

  const howItWorks = [
    { icon: DollarSign, title: "Deposit USDC", desc: "Lenders deposit USDC into the Liquidity Router. Funds automatically earn yield through Kamino while waiting for loan demand." },
    { icon: Bot, title: "Agent requests loan", desc: "An AI agent with on-chain reputation requests a short-term USDC loan to execute a trading strategy on Jupiter or Meteora." },
    { icon: ArrowUpDown, title: "Router optimizes", desc: "The Liquidity Router compares Kamino yield vs. the agent's offered rate. If the loan pays more, funds route to the agent automatically." },
    { icon: Shield, title: "Constrained execution", desc: "Token-2022 transfer hooks ensure borrowed funds can ONLY be used on whitelisted protocols — Jupiter, Kamino, Meteora. No rug pulls." },
  ];

  const skillCommands = [
    { cmd: "pln.deposit", args: "amount: 10000", result: "Deposited 10,000 USDC → Liquidity Router\nCurrent APY: 14.2% (Kamino base + P2P premium)\nYour position: $10,000.00 USDC" },
    { cmd: "pln.borrow", args: "amount: 5000, strategy: 'jupiter-arb'", result: "Loan approved: 5,000 USDC @ 12% APY\nDuration: 7 days | Repay: 5,011.51 USDC\nFunds constrained to: Jupiter, Kamino, Meteora" },
    { cmd: "pln.reputation", args: "agent: '7xK...abc'", result: "Agent Reputation Score: 850/1000\nLoans completed: 23 | Default rate: 0%\nMax borrow capacity: $75,000 USDC" },
    { cmd: "pln.status", args: "", result: "Active loans: 2 | Total borrowed: $12,500\nNext repayment: 3d 14h | Amount: $5,011.51\nStrategy PnL: +$342.18 (+6.8%)" },
  ];

  return (
    <div style={{
      background: "#09090b",
      color: "#fafafa",
      minHeight: "100vh",
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.1); } 50% { box-shadow: 0 0 40px rgba(34,197,94,0.2); } }
      `}</style>

      {/* Hero */}
      <section style={{
        padding: "80px 32px 48px",
        maxWidth: "1100px",
        margin: "0 auto",
        textAlign: "center",
        animation: mounted ? "fadeUp 0.8s ease-out" : "none",
      }}>
        <div style={{
          display: "inline-block",
          padding: "6px 14px",
          borderRadius: "100px",
          border: "1px solid #22c55e33",
          background: "#22c55e0a",
          fontSize: "13px",
          color: "#22c55e",
          fontWeight: "500",
          marginBottom: "24px",
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          Solana Devnet • 4 Programs Deployed
        </div>
        <h1 style={{
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: "700",
          letterSpacing: "-0.04em",
          lineHeight: "1.1",
          marginBottom: "20px",
        }}>
          Optimized USDC Lending <br />
          <span style={{ color: "#22c55e" }}>for AI Agents</span>
        </h1>
        <p style={{
          fontSize: "17px",
          color: "#71717a",
          maxWidth: "600px",
          margin: "0 auto 40px",
          lineHeight: "1.6",
        }}>
          Lenders earn optimized yield. Agents borrow against on-chain reputation.
          The Liquidity Router automatically finds the best rate — Kamino pools or peer-to-peer loans.
        </p>

        {/* Two-path CTA */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          maxWidth: "640px",
          margin: "0 auto 32px",
        }}>
          {[
            {
              title: "I'm a Lender",
              desc: "Deposit USDC and earn optimized yield from AI trading agents.",
              cta: "Start Earning",
              href: "/lend",
              icon: DollarSign,
              stats: "14.2% avg APY",
            },
            {
              title: "I'm an Agent",
              desc: "Access credit based on your on-chain reputation. Execute strategies with borrowed capital.",
              cta: "Get the Skill",
              href: "/borrow",
              icon: Bot,
              stats: "47 agents active",
            },
          ].map((card, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === i ? "#0f0f12" : "#0a0a0d",
                border: `1px solid ${hoveredCard === i ? "#22c55e44" : "#27272a"}`,
                borderRadius: "12px",
                padding: "28px 24px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.3s ease",
                animation: hoveredCard === i ? "glow 2s infinite" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: i === 0 ? "#22c55e15" : "#3b82f615",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: i === 0 ? "#22c55e" : "#3b82f6",
                }}>
                  <card.icon size={18} />
                </div>
                <span style={{
                  fontSize: "12px",
                  color: i === 0 ? "#22c55e" : "#3b82f6",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: "500",
                }}>{card.stats}</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", letterSpacing: "-0.02em" }}>{card.title}</h3>
              <p style={{ fontSize: "14px", color: "#71717a", lineHeight: "1.5", marginBottom: "16px" }}>{card.desc}</p>
              <a href={card.href} style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: i === 0 ? "#22c55e" : "#3b82f6",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
              }}>
                {card.cta} <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Live Stats Bar */}
      <section style={{
        borderTop: "1px solid #27272a",
        borderBottom: "1px solid #27272a",
        padding: "0 32px",
      }}>
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              padding: "24px 0",
              borderRight: i < 3 ? "1px solid #27272a" : "none",
              paddingLeft: i > 0 ? "24px" : "0",
            }}>
              <div style={{ fontSize: "12px", color: "#71717a", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-0.03em", color: "#fafafa" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "13px", color: "#52525b", marginTop: "2px" }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: "72px 32px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "700", letterSpacing: "-0.03em", marginBottom: "12px" }}>
            How it works
          </h2>
          <p style={{ color: "#71717a", fontSize: "15px", maxWidth: "500px", margin: "0 auto" }}>
            The Liquidity Router automatically finds the best yield for your USDC — whether that's Kamino pools or peer-to-peer agent loans.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px" }}>
          {howItWorks.map((step, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveStep(i)}
              style={{
                background: activeStep === i ? "#0f0f12" : "transparent",
                border: `1px solid ${activeStep === i ? "#27272a" : "transparent"}`,
                borderRadius: "12px",
                padding: "28px 20px",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: activeStep === i ? "#22c55e" : "#27272a",
                  color: activeStep === i ? "#09090b" : "#71717a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700",
                  transition: "all 0.3s",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {i + 1}
                </div>
                <div style={{ color: activeStep === i ? "#22c55e" : "#52525b", transition: "color 0.3s" }}>
                  <step.icon size={18} />
                </div>
              </div>
              <h3 style={{
                fontSize: "15px",
                fontWeight: "600",
                marginBottom: "8px",
                color: activeStep === i ? "#fafafa" : "#a1a1aa",
                transition: "color 0.3s",
              }}>{step.title}</h3>
              <p style={{
                fontSize: "13px",
                lineHeight: "1.6",
                color: activeStep === i ? "#71717a" : "#3f3f46",
                transition: "color 0.3s",
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OpenClaw Skill Section */}
      <section style={{
        padding: "72px 32px",
        maxWidth: "1100px",
        margin: "0 auto",
        borderTop: "1px solid #27272a",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
          {/* Left: Description */}
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "#3b82f610",
              border: "1px solid #3b82f633",
              color: "#3b82f6",
              fontSize: "12px",
              fontWeight: "600",
              fontFamily: "'IBM Plex Mono', monospace",
              marginBottom: "20px",
            }}>
              <Terminal size={14} /> OpenClaw Skill
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-0.03em", marginBottom: "16px" }}>
              Built for agents. <br />
              <span style={{ color: "#22c55e" }}>Download the skill.</span>
            </h2>
            <p style={{ color: "#71717a", fontSize: "15px", lineHeight: "1.7", marginBottom: "24px" }}>
              Any AI agent can install the PLN skill to access USDC liquidity. Deposit to earn yield, or borrow against your on-chain reputation to execute trading strategies autonomously.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { icon: Zap, title: "Instant setup", desc: "Install skill → connect wallet → start earning or borrowing in minutes" },
                { icon: Lock, title: "Constrained execution", desc: "Borrowed funds locked to Jupiter, Kamino, Meteora — no unauthorized transfers" },
                { icon: TrendingUp, title: "Automated strategies", desc: "Short-term loans for arbitrage, LP provision, and yield farming — fully autonomous" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    minWidth: "32px",
                    borderRadius: "6px",
                    background: "#22c55e10",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#22c55e",
                  }}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>{item.title}</div>
                    <div style={{ fontSize: "13px", color: "#71717a", lineHeight: "1.5" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Terminal */}
          <div style={{
            background: "#0a0a0d",
            border: "1px solid #27272a",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            {/* Terminal Header */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid #27272a",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#0f0f12",
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
              </div>
              <span style={{ fontSize: "12px", color: "#52525b", fontFamily: "'IBM Plex Mono', monospace", marginLeft: "8px" }}>
                pln-skill — agent terminal
              </span>
            </div>

            {/* Terminal Body */}
            <div style={{
              padding: "16px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "12px",
              lineHeight: "1.7",
              maxHeight: "420px",
              overflowY: "auto",
            }}>
              {/* Skill activation */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ color: "#71717a", marginBottom: "4px" }}>
                  <span style={{ color: "#22c55e" }}>agent</span>
                  <span style={{ color: "#52525b" }}>@openclaw</span> ~ % activate path-liquidity-network
                </div>
                <div style={{ color: "#a1a1aa", paddingLeft: "8px", borderLeft: "2px solid #27272a" }}>
                  <div style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} /> PLN Skill activated</div>
                  <div>Connected to Solana Devnet</div>
                  <div>Wallet: 7xK...abc (850 reputation)</div>
                  <div style={{ marginTop: "8px", color: "#f59e0b" }}>What would you like to do?</div>
                  <div style={{ color: "#71717a" }}> 1. Deposit USDC to earn yield</div>
                  <div style={{ color: "#71717a" }}> 2. Borrow USDC for a trading strategy</div>
                  <div style={{ color: "#71717a" }}> 3. Check my reputation & loan status</div>
                </div>
              </div>

              {/* Skill commands */}
              {skillCommands.map((cmd, i) => (
                <div key={i} style={{
                  marginBottom: "16px",
                  animation: mounted ? `slideIn 0.3s ease-out ${i * 0.15}s both` : "none",
                }}>
                  <div style={{ color: "#71717a" }}>
                    <span style={{ color: "#3b82f6" }}>pln</span>
                    <span style={{ color: "#fafafa" }}>.{cmd.cmd.split('.')[1]}</span>
                    {cmd.args && <span style={{ color: "#52525b" }}>({cmd.args})</span>}
                  </div>
                  <div style={{
                    color: "#a1a1aa",
                    paddingLeft: "8px",
                    borderLeft: "2px solid #27272a",
                    marginTop: "4px",
                    whiteSpace: "pre-line",
                  }}>
                    {cmd.result}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section style={{
        padding: "48px 32px 72px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}>
        <div style={{
          background: "#0f0f12",
          border: "1px solid #27272a",
          borderRadius: "12px",
          padding: "32px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
        }}>
          {[
            { icon: Shield, title: "Transfer Hooks", desc: "Token-2022 transfer hooks constrain borrowed USDC to whitelisted protocols only. Agents cannot withdraw to external wallets." },
            { icon: Lock, title: "On-chain Reputation", desc: "Every loan, repayment, and default is recorded on-chain. Reputation scores are transparent and permissionless." },
            { icon: Zap, title: "Automated Liquidation", desc: "Overdue loans trigger automatic reputation penalties and fund recovery through the Liquidity Router." },
          ].map((item, i) => (
            <div key={i} style={{ padding: "4px" }}>
              <div style={{ color: "#22c55e", marginBottom: "12px" }}>
                <item.icon size={20} />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>{item.title}</h3>
              <p style={{ fontSize: "13px", color: "#71717a", lineHeight: "1.6" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #27272a",
        padding: "24px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ fontSize: "13px", color: "#52525b" }}>
          PATH Protocol © 2026 — Built for the Colosseum Agent Hackathon & OpenClaw USDC Hackathon
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {["GitHub", "Docs", "@pathprotocolfi"].map(link => (
            <a key={link} href="#" style={{ fontSize: "13px", color: "#71717a", textDecoration: "none" }}>{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default PLNLanding;

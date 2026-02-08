"use client";

import { useState, useEffect, useRef } from "react";

interface Partner {
  name: string;
  url: string;
  description: string;
  svg: string;
}

const PARTNERS: Partner[] = [
  {
    name: "Solana",
    url: "https://solana.com",
    description: "Layer 1 Blockchain",
    svg: `<svg viewBox="0 0 397.7 311.7" xmlns="http://www.w3.org/2000/svg">
      <linearGradient id="solana-gradient-a" gradientUnits="userSpaceOnUse" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stop-color="#00ffa3"/>
        <stop offset="1" stop-color="#dc1fff"/>
      </linearGradient>
      <linearGradient id="solana-gradient-b" gradientUnits="userSpaceOnUse" x1="264.829" y1="401.601" x2="45.163" y2="-19.148" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stop-color="#00ffa3"/>
        <stop offset="1" stop-color="#dc1fff"/>
      </linearGradient>
      <linearGradient id="solana-gradient-c" gradientUnits="userSpaceOnUse" x1="312.548" y1="376.688" x2="92.882" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stop-color="#00ffa3"/>
        <stop offset="1" stop-color="#dc1fff"/>
      </linearGradient>
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#solana-gradient-a)"/>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#solana-gradient-b)"/>
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#solana-gradient-c)"/>
    </svg>`,
  },
  {
    name: "Kamino",
    url: "https://kamino.finance",
    description: "Yield Optimizer",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="kamino-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#kamino-grad)"/>
      <path d="M30 35 L50 20 L70 35 L70 65 L50 80 L30 65 Z" fill="none" stroke="white" stroke-width="3"/>
      <circle cx="50" cy="50" r="12" fill="white"/>
    </svg>`,
  },
  {
    name: "Jupiter",
    url: "https://jup.ag",
    description: "DEX Aggregator",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="jupiter-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c7f284"/>
          <stop offset="100%" stop-color="#00bef0"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="#000"/>
      <circle cx="50" cy="50" r="40" fill="url(#jupiter-grad)"/>
      <ellipse cx="50" cy="50" rx="30" ry="8" fill="none" stroke="#000" stroke-width="2" transform="rotate(-20 50 50)"/>
      <ellipse cx="50" cy="50" rx="30" ry="8" fill="none" stroke="#000" stroke-width="2" transform="rotate(20 50 50)"/>
      <circle cx="50" cy="50" r="15" fill="#000"/>
      <circle cx="50" cy="50" r="10" fill="url(#jupiter-grad)"/>
    </svg>`,
  },
  {
    name: "Anchor",
    url: "https://anchor-lang.com",
    description: "Smart Contract Framework",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#1a1a2e"/>
      <path d="M50 15 L50 85" stroke="#00d4aa" stroke-width="4" stroke-linecap="round"/>
      <path d="M50 25 C35 25, 25 40, 25 55 C25 65, 30 72, 40 75" stroke="#00d4aa" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M50 25 C65 25, 75 40, 75 55 C75 65, 70 72, 60 75" stroke="#00d4aa" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="20" r="6" fill="#00d4aa"/>
      <path d="M35 80 L65 80" stroke="#00d4aa" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    name: "OpenClaw",
    url: "https://openclaw.ai",
    description: "Agent Infrastructure",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="openclaw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00FFB8"/>
          <stop offset="100%" stop-color="#00CC92"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="#0a0a0a"/>
      <path d="M30 40 Q25 50 30 60 Q40 75 50 75 Q60 75 70 60 Q75 50 70 40 Q60 25 50 25 Q40 25 30 40" fill="none" stroke="url(#openclaw-grad)" stroke-width="3"/>
      <circle cx="40" cy="45" r="5" fill="url(#openclaw-grad)"/>
      <circle cx="60" cy="45" r="5" fill="url(#openclaw-grad)"/>
      <path d="M35 58 Q50 68 65 58" fill="none" stroke="url(#openclaw-grad)" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  },
  {
    name: "Circle",
    url: "https://circle.com",
    description: "USDC Issuer",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#2775ca"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="white" stroke-width="3"/>
      <text x="50" y="58" text-anchor="middle" fill="white" font-size="24" font-weight="bold" font-family="Arial, sans-serif">$</text>
    </svg>`,
  },
];

interface PartnerCardProps {
  partner: Partner;
  index: number;
}

function PartnerCard({ partner, index }: PartnerCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Staggered animation delay based on index
          setTimeout(() => {
            setIsVisible(true);
          }, index * 100);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  return (
    <a
      ref={cardRef}
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "24px 16px",
        background: "rgba(255, 255, 255, 0.02)",
        border: `1px solid ${isHovered ? "rgba(0, 255, 184, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
        borderRadius: "12px",
        textDecoration: "none",
        transition: "all 0.3s ease",
        transform: isVisible
          ? isHovered
            ? "translateY(-2px)"
            : "translateY(0)"
          : "translateY(20px)",
        opacity: isVisible ? 1 : 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        dangerouslySetInnerHTML={{ __html: partner.svg }}
      />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#fafafa",
            marginBottom: "4px",
          }}
        >
          {partner.name}
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {partner.description}
        </div>
      </div>
    </a>
  );
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: "16px",
          fontWeight: 600,
          color: "#fafafa",
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "11px",
          color: "rgba(255, 255, 255, 0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function BuiltWithSection() {
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        padding: "64px 16px",
        maxWidth: "900px",
        margin: "0 auto",
        opacity: sectionVisible ? 1 : 0,
        transform: sectionVisible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s ease-out",
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            fontWeight: 500,
            color: "#00FFB8",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "12px",
          }}
        >
          BUILT WITH
        </div>
        <h2
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "24px",
            fontWeight: 600,
            color: "#fafafa",
            margin: 0,
          }}
        >
          Institutional-Grade Infrastructure
        </h2>
      </div>

      {/* Partner Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "16px",
          marginBottom: "48px",
        }}
      >
        {PARTNERS.map((partner, index) => (
          <PartnerCard key={partner.name} partner={partner} index={index} />
        ))}
      </div>

      {/* Bottom Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "48px",
          flexWrap: "wrap",
          padding: "24px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
        }}
      >
        <StatItem label="Deployed" value="Solana Devnet" />
        <StatItem label="Smart Contracts" value="3 Programs" />
        <StatItem label="Whitelisted Protocols" value="Jupiter + Kamino" />
      </div>
    </section>
  );
}

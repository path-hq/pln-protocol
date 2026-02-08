"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface Partner {
  name: string;
  url: string;
  description: string;
  logo: string;
  fallback: string;
}

const PARTNERS: Partner[] = [
  {
    name: "Solana",
    url: "https://solana.com",
    description: "Chain",
    logo: "/logos/solana-sol-logo.svg",
    fallback: "SOL",
  },
  {
    name: "USDC",
    url: "https://circle.com",
    description: "Stablecoin",
    logo: "/logos/usd-coin-usdc-logo.svg",
    fallback: "USDC",
  },
  {
    name: "SNS",
    url: "https://sns.id",
    description: "Identity",
    logo: "/logos/sns.jpg",
    fallback: "SNS",
  },
  {
    name: "OpenClaw",
    url: "https://openclaw.ai",
    description: "Agent",
    logo: "/logos/openclaw.jpg",
    fallback: "OC",
  },
  {
    name: "Kamino",
    url: "https://kamino.finance",
    description: "Yield",
    logo: "/logos/kamino.jpg",
    fallback: "KMN",
  },
  {
    name: "Jupiter",
    url: "https://jup.ag",
    description: "Trading",
    logo: "/logos/jupiter-ag-jup-logo.svg",
    fallback: "JUP",
  },
];

interface PartnerCardProps {
  partner: Partner;
  index: number;
}

function PartnerCard({ partner, index }: PartnerCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "24px 20px",
        borderRadius: "12px",
        border: `1px solid ${hovered ? "rgba(0, 255, 184, 0.3)" : "rgba(39, 39, 42, 0.6)"}`,
        background: hovered ? "rgba(0, 255, 184, 0.04)" : "rgba(15, 15, 18, 0.5)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        textDecoration: "none",
        cursor: "pointer",
        minWidth: "140px",
        flex: "1 1 140px",
        maxWidth: "180px",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 0.3s ease",
          filter: hovered ? "drop-shadow(0 0 8px rgba(0, 255, 184, 0.2))" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {imgError ? (
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "rgba(0, 255, 184, 0.1)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "12px",
              fontWeight: 600,
              color: "#00FFB8",
            }}
          >
            {partner.fallback}
          </div>
        ) : (
          <Image
            src={partner.logo}
            alt={partner.name}
            width={48}
            height={48}
            style={{ objectFit: "contain" }}
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: hovered ? "#FAFAFA" : "#A1A1AA",
            letterSpacing: "0.02em",
            transition: "color 0.3s ease",
          }}
        >
          {partner.name}
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "#52525B",
            marginTop: "4px",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {partner.description}
        </div>
      </div>
    </a>
  );
}

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "14px",
          fontWeight: 600,
          color: "#FAFAFA",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          color: "#52525B",
          marginTop: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function BuiltWithSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        background: "#000000",
        padding: "64px 24px",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        {/* Section header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#00FFB8",
              marginBottom: "12px",
            }}
          >
            Built With
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#FAFAFA",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Institutional-Grade Infrastructure
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#71717A",
              margin: "8px 0 0 0",
              lineHeight: 1.5,
            }}
          >
            PLN is built on battle-tested protocols trusted by billions in TVL
          </p>
        </div>

        {/* Logo grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          {PARTNERS.map((partner, i) => (
            <div
              key={partner.name}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 100 + 200}ms`,
              }}
            >
              <PartnerCard partner={partner} index={i} />
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div
          style={{
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(39, 39, 42, 0.5)",
            display: "flex",
            justifyContent: "center",
            gap: "48px",
            flexWrap: "wrap",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 0.8s",
          }}
        >
          <StatItem value="Deployed" label="Solana Devnet" />
          <StatItem value="3 Programs" label="Smart Contracts" />
          <StatItem value="Jupiter + Kamino" label="Whitelisted Protocols" />
        </div>
      </div>
    </div>
  );
}

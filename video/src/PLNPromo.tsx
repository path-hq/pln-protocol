import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig, IFrame } from 'remotion';
import { AppWindow } from './AppWindow';
import { ParticleGrid } from './ParticleGrid';
import { SpringIn } from './SpringAnimation';

// 60 second video
const FPS = 30;
const DURATION = 60;
const TOTAL_FRAMES = DURATION * FPS;

// Design System Colors
const COLORS = {
  bg: '#0c0a09',
  surface: '#1c1917',
  border: '#292524',
  accent: '#fbbf24', // amber
  white: '#fafaf9',
  muted: '#a8a29e',
  dim: '#78716c',
};

// Typography
const FONTS = {
  ui: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  mono: 'SF Mono, Monaco, "Cascadia Code", monospace',
  brand: 'Georgia, "Times New Roman", serif',
};

// Animated Text with spring
const SpringText: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });
  
  const scale = interpolate(progress, [0, 1], [0.95, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [10, 0]);
  
  return (
    <div style={{ transform: `scale(${scale}) translateY(${y}px)`, opacity, ...style }}>
      {children}
    </div>
  );
};

// Scene 1: Intro
const IntroScene: React.FC = () => {
  return (
    <AppWindow title="PLN Protocol">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 24,
        }}
      >
        <SpringText delay={5}>
          <h1
            style={{
              fontFamily: FONTS.brand,
              fontSize: 72,
              fontWeight: 400,
              color: COLORS.accent,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            PLN Protocol
          </h1>
        </SpringText>
        
        <SpringText delay={20}>
          <p
            style={{
              fontFamily: FONTS.ui,
              fontSize: 24,
              color: COLORS.muted,
              margin: 0,
            }}
          >
            Autonomous Lending on Solana
          </p>
        </SpringText>
        
        <SpringText delay={40}>
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: COLORS.accent,
              }}
            >
              Unlock 14%+ APY with AI-powered lending
            </span>
          </div>
        </SpringText>
      </div>
    </AppWindow>
  );
};

// Scene 2: Problem
const ProblemScene: React.FC = () => {
  return (
    <AppWindow title="The Problem">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 60,
          padding: 40,
        }}
      >
        <SpringText delay={0}>
          <div
            style={{
              width: 280,
              padding: 32,
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
            <h3
              style={{
                fontFamily: FONTS.ui,
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.white,
                margin: '0 0 8px 0',
              }}
            >
              Your USDC sits idle
            </h3>
            <p
              style={{
                fontFamily: FONTS.ui,
                fontSize: 14,
                color: COLORS.dim,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Earning 0-4% while DeFi complexity overwhelms
            </p>
          </div>
        </SpringText>
        
        <SpringText delay={15}>
          <div style={{ fontSize: 32, color: COLORS.accent }}>+</div>
        </SpringText>
        
        <SpringText delay={30}>
          <div
            style={{
              width: 280,
              padding: 32,
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <h3
              style={{
                fontFamily: FONTS.ui,
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.white,
                margin: '0 0 8px 0',
              }}
            >
              Agents need capital
            </h3>
            <p
              style={{
                fontFamily: FONTS.ui,
                fontSize: 14,
                color: COLORS.dim,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              No credit history, no way to prove reputation
            </p>
          </div>
        </SpringText>
      </div>
    </AppWindow>
  );
};

// Scene 3: Live Demo
const DemoScene: React.FC = () => {
  return (
    <AppWindow title="Live Demo — pln-protocol.vercel.app">
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <IFrame
          src="https://pln-protocol.vercel.app"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </div>
    </AppWindow>
  );
};

// Scene 4: How It Works
const HowItWorksScene: React.FC = () => {
  const steps = [
    { icon: '💰', title: 'Deposit USDC', desc: 'Min $100, start earning' },
    { icon: '⚡', title: 'Auto-Routing', desc: 'Kamino 8.1% + P2P 14.2%' },
    { icon: '📈', title: 'Watch It Grow', desc: 'Dashboard shows real-time' },
  ];
  
  return (
    <AppWindow title="How It Works">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 40,
          padding: 40,
        }}
      >
        <SpringText delay={0}>
          <h2
            style={{
              fontFamily: FONTS.brand,
              fontSize: 36,
              color: COLORS.white,
              margin: 0,
            }}
          >
            Three Simple Steps
          </h2>
        </SpringText>
        
        <div
          style={{
            display: 'flex',
            gap: 24,
          }}
        >
          {steps.map((step, i) => (
            <SpringText key={i} delay={15 + i * 15}>
              <div
                style={{
                  width: 240,
                  padding: 28,
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{step.icon}</div>
                <h4
                  style={{
                    fontFamily: FONTS.ui,
                    fontSize: 18,
                    fontWeight: 600,
                    color: COLORS.white,
                    margin: '0 0 8px 0',
                  }}
                >
                  {step.title}
                </h4>
                <p
                  style={{
                    fontFamily: FONTS.ui,
                    fontSize: 13,
                    color: COLORS.dim,
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </SpringText>
          ))}
        </div>
      </div>
    </AppWindow>
  );
};

// Scene 5: Numbers
const NumbersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const apyProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  
  const apyDisplay = interpolate(apyProgress, [0, 1], [0, 14.2]);
  
  return (
    <AppWindow title="Performance">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 80,
          padding: 40,
        }}
      >
        <SpringText delay={0}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 120,
                fontWeight: 700,
                color: COLORS.accent,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {apyDisplay.toFixed(1)}%
            </div>
            <div
              style={{
                fontFamily: FONTS.ui,
                fontSize: 20,
                color: COLORS.muted,
                marginTop: 12,
              }}
            >
              Blended APY
            </div>
          </div>
        </SpringText>
        
        <SpringText delay={30}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '🛡️', text: 'Insurance Fund (10%)' },
              { icon: '🔒', text: 'Transfer Hooks' },
              { icon: '✓', text: 'Whitelisted Protocols' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span
                  style={{
                    fontFamily: FONTS.ui,
                    fontSize: 15,
                    color: COLORS.white,
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </SpringText>
      </div>
    </AppWindow>
  );
};

// Scene 6: CTA
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const pulse = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 50, mass: 1 },
  });
  
  const buttonScale = interpolate(pulse, [0, 0.5, 1], [1, 1.02, 1]);
  
  return (
    <AppWindow title="Get Started">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 32,
          padding: 40,
        }}
      >
        <SpringText delay={0}>
          <p
            style={{
              fontFamily: FONTS.brand,
              fontSize: 32,
              color: COLORS.white,
              textAlign: 'center',
              margin: 0,
              maxWidth: 600,
              lineHeight: 1.4,
            }}
          >
            Your USDC could be earning 14%+ right now.
          </p>
        </SpringText>
        
        <SpringText delay={20}>
          <div
            style={{
              transform: `scale(${buttonScale})`,
              padding: '16px 32px',
              backgroundColor: COLORS.accent,
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: FONTS.ui,
                fontSize: 18,
                fontWeight: 600,
                color: COLORS.bg,
              }}
            >
              Deposit Now →
            </span>
          </div>
        </SpringText>
        
        <SpringText delay={40}>
          <p
            style={{
              fontFamily: FONTS.mono,
              fontSize: 13,
              color: COLORS.dim,
              margin: 0,
            }}
          >
            pln-protocol.vercel.app
          </p>
        </SpringText>
      </div>
    </AppWindow>
  );
};

// Main composition
export const PLNPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Particle Grid Background */}
      <ParticleGrid />
      
      {/* Scenes */}
      <Sequence from={0} durationInFrames={180}>
        <IntroScene />
      </Sequence>
      
      <Sequence from={180} durationInFrames={120}>
        <ProblemScene />
      </Sequence>
      
      <Sequence from={300} durationInFrames={360}>
        <DemoScene />
      </Sequence>
      
      <Sequence from={660} durationInFrames={240}>
        <HowItWorksScene />
      </Sequence>
      
      <Sequence from={900} durationInFrames={180}>
        <NumbersScene />
      </Sequence>
      
      <Sequence from={1080} durationInFrames={720}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export default PLNPromo;

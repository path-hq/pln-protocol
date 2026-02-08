import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, IFrame, useVideoConfig } from 'remotion';

// 60 second video, 30fps = 1800 frames
const FPS = 30;
const DURATION = 60;
const TOTAL_FRAMES = DURATION * FPS;

const ACCENT = '#00FFB8';
const BLACK = '#000000';
const WHITE = '#FAFAFA';
const GRAY = '#71717A';

// Timing constants
const T1_INTRO = 180;        // 0-6s: Hook
const T2_PROBLEM = 300;      // 6-10s: Problem
const T3_SOLUTION = 600;     // 10-20s: Website demo (iframe)
const T4_HOW = 960;          // 20-32s: How it works
const T5_NUMBERS = 1260;     // 32-42s: Safety & APY
const T6_CTA = 1800;         // 42-60s: CTA

// Animated text component
const FadeText: React.FC<{
  text: string;
  subtext?: string;
  startFrame: number;
  duration?: number;
  size?: number;
  accent?: boolean;
}> = ({ text, subtext, startFrame, duration = 60, size = 64, accent = false }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 20, startFrame + duration - 20, startFrame + duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const y = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [20, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, textAlign: 'center' }}>
      <div
        style={{
          fontSize: size,
          fontWeight: 700,
          color: accent ? ACCENT : WHITE,
          fontFamily: "'IBM Plex Sans', sans-serif",
          textShadow: accent ? `0 0 40px ${ACCENT}40` : 'none',
        }}
      >
        {text}
      </div>
      {subtext && (
        <div
          style={{
            fontSize: size * 0.4,
            color: GRAY,
            marginTop: 16,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
};

// Pulsing glow effect
const GlowPulse: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30, 60], [0.3, 0.6, 0.3], { extrapolateRight: 'loop' });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${ACCENT}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
        pointerEvents: 'none',
      }}
    />
  );
};

// Main composition
export const PLNPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BLACK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Background glow pulse */}
      <GlowPulse />

      {/* SECTION 1: INTRO (0-6s) */}
      <Sequence from={0} durationInFrames={T2_PROBLEM}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <FadeText
            text="PLN Protocol"
            subtext="Autonomous Lending on Solana"
            startFrame={0}
            duration={120}
            size={120}
            accent
          />
          <div
            style={{
              position: 'absolute',
              top: '60%',
              fontSize: 32,
              color: ACCENT,
              fontFamily: "'IBM Plex Mono', monospace",
              opacity: interpolate(useCurrentFrame(), [60, 90, 150, 180], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}
          >
            Unlock 14%+ APY with AI-powered lending
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* SECTION 2: PROBLEM (6-10s) */}
      <Sequence from={T2_PROBLEM} durationInFrames={T3_SOLUTION - T2_PROBLEM}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 80 }}>
          {/* Human problem */}
          <div
            style={{
              opacity: interpolate(useCurrentFrame(), [300, 330, 450, 480], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              transform: `translateX(${interpolate(useCurrentFrame(), [300, 330], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            <div style={{ fontSize: 72, marginBottom: 20 }}>☹️</div>
            <div style={{ fontSize: 28, color: WHITE, fontWeight: 600, marginBottom: 12 }}>Your USDC sits idle</div>
            <div style={{ fontSize: 18, color: GRAY }}>Earning 0-4% while DeFi complexity overwhelms</div>
          </div>

          {/* AI problem */}
          <div
            style={{
              opacity: interpolate(useCurrentFrame(), [360, 390, 450, 480], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              transform: `translateX(${interpolate(useCurrentFrame(), [360, 390], [-50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            <div style={{ fontSize: 72, marginBottom: 20 }}>🤖</div>
            <div style={{ fontSize: 28, color: WHITE, fontWeight: 600, marginBottom: 12 }}>Agents need capital</div>
            <div style={{ fontSize: 18, color: GRAY }}>No credit history, no way to prove reputation</div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* SECTION 3: LIVE WEBSITE DEMO (10-20s) */}
      <Sequence from={T3_SOLUTION} durationInFrames={T4_HOW - T3_SOLUTION}>
        <AbsoluteFill>
          {/* Header overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '20px 40px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)',
              zIndex: 10,
              fontSize: 24,
              color: ACCENT,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Live Demo: pln-protocol.vercel.app
          </div>
          
          {/* IFrame capturing live site */}
          <IFrame
            src="https://pln-protocol.vercel.app"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* SECTION 4: HOW IT WORKS (20-32s) */}
      <Sequence from={T4_HOW} durationInFrames={T5_NUMBERS - T4_HOW}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              opacity: interpolate(useCurrentFrame(), [960, 990], [0, 1], { extrapolateLeft: 'clamp' }),
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, color: WHITE, fontWeight: 700, marginBottom: 60 }}>How It Works</div>
            
            {/* Steps */}
            <div style={{ display: 'flex', gap: 60 }}>
              {[
                { icon: '💰', title: 'Deposit USDC', desc: 'Min $100, start earning' },
                { icon: '⚡', title: 'Auto-Routing', desc: 'Kamino 8.1% + P2P 14.2%' },
                { icon: '📈', title: 'Watch It Grow', desc: 'Dashboard shows real-time' },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    opacity: interpolate(useCurrentFrame(), [1000 + i * 60, 1030 + i * 60], [0, 1], { extrapolateLeft: 'clamp' }),
                    transform: `translateY(${interpolate(useCurrentFrame(), [1000 + i * 60, 1030 + i * 60], [30, 0], { extrapolateLeft: 'clamp' })}px)`,
                    textAlign: 'center',
                    width: 280,
                    padding: 24,
                    background: '#0F0F12',
                    borderRadius: 12,
                    border: '1px solid #27272A',
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16 }}>{step.icon}</div>
                  <div style={{ fontSize: 22, color: WHITE, fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
                  <div style={{ fontSize: 15, color: GRAY }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* SECTION 5: SAFETY & NUMBERS (32-42s) */}
      <Sequence from={T5_NUMBERS} durationInFrames={T6_CTA - T5_NUMBERS}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 60 }}>
          {/* Big APY number */}
          <div
            style={{
              opacity: interpolate(useCurrentFrame(), [1260, 1290], [0, 1], { extrapolateLeft: 'clamp' }),
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 140,
                fontWeight: 800,
                color: ACCENT,
                textShadow: `0 0 60px ${ACCENT}60`,
                lineHeight: 1,
              }}
            >
              14.2%
            </div>
            <div style={{ fontSize: 28, color: WHITE, marginTop: 16 }}>Blended APY</div>
            <div style={{ fontSize: 18, color: GRAY, marginTop: 8 }}>8.1% base + 6% P2P premium</div>
          </div>

          {/* Safety icons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '🛡️', text: 'Insurance Fund (10%)' },
              { icon: '🔒', text: 'Transfer Hooks' },
              { icon: '✓', text: 'Whitelisted Protocols' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  opacity: interpolate(useCurrentFrame(), [1320 + i * 40, 1350 + i * 40], [0, 1], { extrapolateLeft: 'clamp' }),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 22,
                  color: WHITE,
                }}
              >
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* SECTION 6: CTA (42-60s) */}
      <Sequence from={T6_CTA} durationInFrames={TOTAL_FRAMES - T6_CTA}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          {/* Pulsing CTA */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 56,
                color: WHITE,
                fontWeight: 700,
                marginBottom: 40,
                opacity: interpolate(useCurrentFrame(), [1440, 1470], [0, 1], { extrapolateLeft: 'clamp' }),
              }}
            >
              Your USDC could be earning 14%+ right now.
            </div>

            {/* Pulsing button */}
            <div
              style={{
                transform: `scale(${interpolate(useCurrentFrame(), [1500, 1530, 1560, 1590], [1, 1.05, 1.05, 1], { extrapolateRight: 'loop' })})`,
                opacity: interpolate(useCurrentFrame(), [1470, 1500], [0, 1], { extrapolateLeft: 'clamp' }),
              }}
            >
              <div
                style={{
                  padding: '20px 48px',
                  background: ACCENT,
                  borderRadius: 8,
                  color: BLACK,
                  fontSize: 28,
                  fontWeight: 700,
                  boxShadow: `0 0 40px ${ACCENT}80`,
                }}
              >
                Deposit Now → pln-protocol.vercel.app
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                position: 'absolute',
                bottom: 40,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 16,
                color: GRAY,
                opacity: interpolate(useCurrentFrame(), [1560, 1590], [0, 1], { extrapolateLeft: 'clamp' }),
              }}
            >
              Colosseum & OpenClaw Hackathon 2026
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export default PLNPromo;

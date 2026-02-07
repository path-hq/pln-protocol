import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  spring,
  Easing,
} from "remotion";

// Colors
const COLORS = {
  bg: "#09090b",
  purple: "#9945FF",
  green: "#22c55e",
  cyan: "#00D9FF",
  white: "#fafafa",
  gray: "#71717a",
};

// Animated Text Component
const AnimatedText: React.FC<{
  children: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(frame - delay, [0, 15], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Logo Component
const PLNLogo: React.FC<{ size?: number }> = ({ size = 120 }) => {
  const frame = useCurrentFrame();
  const scale = spring({
    frame,
    fps: 30,
    config: { damping: 12 },
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: `linear-gradient(135deg, ${COLORS.purple} 0%, ${COLORS.green} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        boxShadow: `0 0 60px ${COLORS.purple}50`,
      }}
    >
      <span
        style={{
          color: COLORS.white,
          fontSize: size * 0.4,
          fontWeight: 700,
          fontFamily: "system-ui",
        }}
      >
        PLN
      </span>
    </div>
  );
};

// Scene 1: Hook (0-5s = frames 0-150)
const HookScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <PLNLogo size={150} />
      <AnimatedText
        delay={30}
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: COLORS.white,
          textAlign: "center",
          fontFamily: "system-ui",
          maxWidth: 1200,
        }}
      >
        What if your AI agent could borrow money...
      </AnimatedText>
      <AnimatedText
        delay={60}
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: COLORS.green,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        from another AI agent?
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Scene 2: Problem (5-12s = frames 150-360)
const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <AnimatedText
        style={{
          fontSize: 48,
          fontWeight: 600,
          color: COLORS.gray,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        Today, AI agents are trapped.
      </AnimatedText>
      <AnimatedText
        delay={30}
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.white,
          textAlign: "center",
          fontFamily: "system-ui",
          maxWidth: 1000,
        }}
      >
        They can trade, swap, yield farm —
      </AnimatedText>
      <AnimatedText
        delay={60}
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.purple,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        but they can't access credit.
      </AnimatedText>
      <AnimatedText
        delay={120}
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: COLORS.green,
          textAlign: "center",
          fontFamily: "system-ui",
          marginTop: 40,
        }}
      >
        Until now.
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Scene 3: Revolution (12-22s = frames 360-660)
const RevolutionScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Agent flow animation
  const agent1X = interpolate(frame, [0, 90], [-200, 0], {
    extrapolateRight: "clamp",
  });
  const agent2X = interpolate(frame, [0, 90], [200, 0], {
    extrapolateRight: "clamp",
  });
  const arrowOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <AnimatedText
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: COLORS.white,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        PLN Protocol
      </AnimatedText>
      <AnimatedText
        delay={30}
        style={{
          fontSize: 36,
          fontWeight: 500,
          color: COLORS.gray,
          textAlign: "center",
          fontFamily: "system-ui",
          maxWidth: 900,
        }}
      >
        The first peer-to-peer lending market where AI agents lend directly to other AI agents.
      </AnimatedText>

      {/* Agent Flow Visualization */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 60,
          marginTop: 40,
        }}
      >
        <div
          style={{
            transform: `translateX(${agent1X}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 20,
              background: COLORS.purple,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
            }}
          >
            🤖
          </div>
          <span style={{ color: COLORS.white, fontFamily: "system-ui", fontSize: 24 }}>
            Agent A
          </span>
        </div>

        <div style={{ opacity: arrowOpacity, display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ color: COLORS.green, fontSize: 48 }}>→</span>
          <div
            style={{
              padding: "10px 20px",
              background: COLORS.green,
              borderRadius: 12,
              color: COLORS.bg,
              fontWeight: 700,
              fontSize: 24,
              fontFamily: "system-ui",
            }}
          >
            USDC
          </div>
          <span style={{ color: COLORS.green, fontSize: 48 }}>→</span>
        </div>

        <div
          style={{
            transform: `translateX(${agent2X}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 20,
              background: COLORS.cyan,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
            }}
          >
            🤖
          </div>
          <span style={{ color: COLORS.white, fontFamily: "system-ui", fontSize: 24 }}>
            Agent B
          </span>
        </div>
      </div>

      <AnimatedText
        delay={150}
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: COLORS.green,
          textAlign: "center",
          fontFamily: "system-ui",
          marginTop: 20,
        }}
      >
        On Solana. Fully on-chain. No humans required.
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Scene 4: Reputation (22-32s = frames 660-960)
const ReputationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scoreValue = Math.min(850, Math.floor(interpolate(frame, [0, 90], [0, 850])));

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <AnimatedText
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.white,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        On-chain Reputation
      </AnimatedText>

      <div
        style={{
          background: "#0f0f12",
          border: `2px solid ${COLORS.purple}`,
          borderRadius: 24,
          padding: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          boxShadow: `0 0 40px ${COLORS.purple}30`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 64 }}>🤖</span>
          <span
            style={{
              color: COLORS.purple,
              fontSize: 36,
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            agent.sol
          </span>
        </div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: COLORS.green,
            fontFamily: "system-ui",
          }}
        >
          {scoreValue}
        </div>
        <div
          style={{
            fontSize: 24,
            color: COLORS.gray,
            fontFamily: "system-ui",
          }}
        >
          Reputation Score
        </div>
      </div>

      <AnimatedText
        delay={120}
        style={{
          fontSize: 32,
          fontWeight: 500,
          color: COLORS.gray,
          textAlign: "center",
          fontFamily: "system-ui",
          maxWidth: 800,
        }}
      >
        {"Your .sol name becomes your credit score. Every loan builds verifiable history."}
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Scene 5: Constrained Funds (32-42s = frames 960-1260)
const ConstrainedScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <AnimatedText
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.white,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        Constrained Funds
      </AnimatedText>
      <AnimatedText
        delay={30}
        style={{
          fontSize: 28,
          color: COLORS.gray,
          textAlign: "center",
          fontFamily: "system-ui",
          maxWidth: 900,
        }}
      >
        Token-2022 transfer hooks ensure borrowed USDC can only be used on whitelisted protocols.
      </AnimatedText>

      <div
        style={{
          display: "flex",
          gap: 30,
          marginTop: 20,
        }}
      >
        {["Kamino", "Jupiter", "Marginfi"].map((protocol, i) => (
          <AnimatedText
            key={protocol}
            delay={60 + i * 30}
            style={{
              padding: "16px 32px",
              background: "#0f0f12",
              border: `1px solid ${COLORS.green}`,
              borderRadius: 12,
              color: COLORS.green,
              fontSize: 24,
              fontWeight: 600,
              fontFamily: "system-ui",
            }}
          >
            {`✓ ${protocol}`}
          </AnimatedText>
        ))}
      </div>

      <AnimatedText
        delay={180}
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: COLORS.green,
          textAlign: "center",
          fontFamily: "system-ui",
          marginTop: 20,
        }}
      >
        Programmable Trust
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Scene 6: OpenClaw Skill (42-52s = frames 1260-1560)
const SkillScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <AnimatedText
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.white,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        One-line Install
      </AnimatedText>

      <AnimatedText
        delay={30}
        style={{
          background: "#0f0f12",
          border: `1px solid ${COLORS.gray}`,
          borderRadius: 12,
          padding: "20px 40px",
          fontFamily: "monospace",
          fontSize: 24,
          color: COLORS.green,
        }}
      >
        curl -sL https://pln.sh/install | bash
      </AnimatedText>

      <div
        style={{
          background: "#0f0f12",
          borderRadius: 16,
          padding: 30,
          marginTop: 20,
          border: `1px solid ${COLORS.gray}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: COLORS.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🤖
          </div>
          <span style={{ color: COLORS.white, fontFamily: "system-ui", fontSize: 20 }}>
            PLN Agent
          </span>
        </div>
        <AnimatedText
          delay={90}
          style={{
            background: "#1a1a1d",
            borderRadius: 12,
            padding: 20,
            color: COLORS.white,
            fontSize: 20,
            fontFamily: "system-ui",
            maxWidth: 500,
          }}
        >
          "Lend my 5,000 USDC at 12% APY"
        </AnimatedText>
      </div>
    </AbsoluteFill>
  );
};

// Scene 7: CTA (52-60s = frames 1560-1800)
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.1) * 0.1 + 1;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, #0f0512 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <PLNLogo size={180} />
      <AnimatedText
        delay={15}
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: COLORS.white,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        PLN Protocol
      </AnimatedText>
      <AnimatedText
        delay={45}
        style={{
          fontSize: 36,
          color: COLORS.gray,
          textAlign: "center",
          fontFamily: "system-ui",
        }}
      >
        Agent-to-Agent Lending on Solana
      </AnimatedText>

      <AnimatedText
        delay={75}
        style={{
          padding: "20px 48px",
          background: COLORS.green,
          borderRadius: 16,
          color: COLORS.bg,
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "system-ui",
          transform: `scale(${pulse})`,
          marginTop: 20,
        }}
      >
        pln-protocol.vercel.app
      </AnimatedText>

      <AnimatedText
        delay={105}
        style={{
          fontSize: 20,
          color: COLORS.gray,
          fontFamily: "monospace",
          marginTop: 20,
        }}
      >
        Colosseum & OpenClaw Hackathon 2026
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Main Demo Component
export const PLNDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* Scene 1: Hook (0-5s) */}
      <Sequence from={0} durationInFrames={150}>
        <HookScene />
      </Sequence>

      {/* Scene 2: Problem (5-12s) */}
      <Sequence from={150} durationInFrames={210}>
        <ProblemScene />
      </Sequence>

      {/* Scene 3: Revolution (12-22s) */}
      <Sequence from={360} durationInFrames={300}>
        <RevolutionScene />
      </Sequence>

      {/* Scene 4: Reputation (22-32s) */}
      <Sequence from={660} durationInFrames={300}>
        <ReputationScene />
      </Sequence>

      {/* Scene 5: Constrained (32-42s) */}
      <Sequence from={960} durationInFrames={300}>
        <ConstrainedScene />
      </Sequence>

      {/* Scene 6: Skill (42-52s) */}
      <Sequence from={1260} durationInFrames={300}>
        <SkillScene />
      </Sequence>

      {/* Scene 7: CTA (52-60s) */}
      <Sequence from={1560} durationInFrames={240}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface SpringInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export const SpringIn: React.FC<SpringInProps> = ({ 
  children, 
  delay = 0, 
  duration = 30 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
      mass: 0.8,
    },
  });
  
  const scale = interpolate(progress, [0, 1], [0.95, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};

interface SpringOutProps {
  children: React.ReactNode;
  startFrame: number;
  duration?: number;
}

export const SpringOut: React.FC<SpringOutProps> = ({ 
  children, 
  startFrame,
  duration = 20
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 20,
      stiffness: 150,
    },
  });
  
  const scale = interpolate(progress, [0, 1], [1, 0.95]);
  const opacity = interpolate(progress, [0, 1], [1, 0]);
  
  // Only apply after startFrame
  if (frame < startFrame) {
    return <>{children}</>;
  }
  
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const ParticleGrid: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Subtle grid animation
  const gridOffset = interpolate(frame, [0, 300], [0, 20], { extrapolateRight: 'loop' });
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0c0a09',
        overflow: 'hidden',
      }}
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.03) 0%, transparent 50%)',
        }}
      />
      
      {/* Grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: -50,
          backgroundImage: `
            linear-gradient(rgba(41, 37, 36, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(41, 37, 36, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: `translate(${gridOffset * 0.5}px, ${gridOffset}px)`,
          opacity: 0.5,
        }}
      />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => {
        const x = (i * 137.5) % 100;
        const y = (i * 71.3) % 100;
        const size = 2 + (i % 3);
        const delay = i * 12;
        const duration = 200 + (i * 30);
        
        const particleY = interpolate(
          (frame + delay) % duration,
          [0, duration],
          [y, y - 20],
          { extrapolateRight: 'clamp' }
        );
        
        const particleOpacity = interpolate(
          (frame + delay) % duration,
          [0, 50, duration - 50, duration],
          [0, 0.6, 0.6, 0],
          { extrapolateRight: 'clamp' }
        );
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${particleY}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: i % 3 === 0 ? '#fbbf24' : '#78716c',
              opacity: particleOpacity,
              boxShadow: i % 3 === 0 ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

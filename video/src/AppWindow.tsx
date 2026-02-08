import React from 'react';
import { AbsoluteFill } from 'remotion';

interface AppWindowProps {
  children: React.ReactNode;
  title?: string;
}

export const AppWindow: React.FC<AppWindowProps> = ({ children, title }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0c0a09',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      {/* Main Window Container */}
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          height: '100%',
          maxHeight: 700,
          backgroundColor: '#1c1917',
          borderRadius: 12,
          border: '1px solid #292524',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title Bar / Traffic Lights */}
        <div
          style={{
            height: 44,
            backgroundColor: '#1c1917',
            borderBottom: '1px solid #292524',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 8,
          }}
        >
          {/* Traffic Lights */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#ff5f57',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#febc2e',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#28c840',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
          </div>
          
          {/* Window Title */}
          {title && (
            <div
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                color: '#a8a29e',
                marginLeft: -68, // Offset for traffic lights
              }}
            >
              {title}
            </div>
          )}
        </div>
        
        {/* Content Area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

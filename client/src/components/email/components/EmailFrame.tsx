import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface EmailFrameProps {
  device: 'desktop' | 'mobile';
  children: React.ReactNode;
}

export function EmailFrame({ device, children }: EmailFrameProps) {
  const isMobile = device === 'mobile';
  const Icon = isMobile ? Smartphone : Monitor;

  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '100%' }}>
      <figcaption style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
        <Icon size={16} aria-hidden="true" />
        <span>{isMobile ? 'Mobile View · 375px' : 'Desktop View · 600px'}</span>
      </figcaption>
      <div style={{ maxWidth: '100%', overflowX: 'auto', borderRadius: '16px', border: '1px solid #dce8de', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ width: isMobile ? 375 : 640 }}>{children}</div>
      </div>
    </figure>
  );
}

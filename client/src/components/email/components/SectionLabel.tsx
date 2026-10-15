import React from 'react';
import { theme } from '../data/emailTheme';

interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p
      style={{
        margin: '0 0 6px',
        fontFamily: theme.font,
        fontSize: 13,
        lineHeight: 1.5,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </p>
  );
}

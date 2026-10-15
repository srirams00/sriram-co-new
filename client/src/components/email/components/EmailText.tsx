import React from 'react';
import { theme } from '../data/emailTheme';

type Variant = 'body' | 'muted' | 'note';

interface EmailTextProps {
  variant?: Variant;
  children: React.ReactNode;
  spaceAfter?: number;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  body: { fontSize: 15, lineHeight: 1.6, color: theme.text },
  muted: { fontSize: 15, lineHeight: 1.6, color: theme.muted },
  note: { fontSize: 13, lineHeight: 1.6, color: theme.muted },
};

export function EmailText({ variant = 'body', children, spaceAfter = 0 }: EmailTextProps) {
  return (
    <p style={{ margin: `0 0 ${spaceAfter}px`, fontFamily: theme.font, fontWeight: 400, ...variantStyles[variant] }}>
      {children}
    </p>
  );
}

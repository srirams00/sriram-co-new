import React from 'react';
import { theme } from '../data/emailTheme';

interface InfoBlockProps {
  title: string;
  body: string;
  linkLabel: string;
  href: string;
}

export function InfoBlock({ title, body, linkLabel, href }: InfoBlockProps) {
  return (
    <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
      <h2 style={{ margin: 0, fontFamily: theme.font, fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: theme.text }}>{title}</h2>
      <p style={{ margin: '4px 0 0', fontFamily: theme.font, fontSize: 15, lineHeight: 1.6, color: theme.muted }}>{body}</p>
      <a
        href={href}
        style={{
          display: 'inline-block',
          padding: '12px 0',
          fontFamily: theme.font,
          fontSize: 15,
          lineHeight: '20px',
          fontWeight: 600,
          color: theme.green,
          textDecoration: 'underline',
        }}
      >
        {linkLabel}
      </a>
    </div>
  );
}

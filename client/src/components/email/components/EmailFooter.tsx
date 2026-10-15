'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme } from '../data/emailTheme';
import { footerLinks, stores, company } from '../data/order';
import { BrandMark } from './BrandMark';
import { TwoColumn } from './TwoColumn';

const small: React.CSSProperties = {
  margin: 0,
  fontFamily: theme.font,
  fontSize: 13,
  lineHeight: 1.6,
  color: theme.muted,
};

export function EmailFooter() {
  const { mobile } = useEmailView();

  return (
    <footer style={{ maxWidth: 600, margin: '0 auto', padding: mobile ? '28px 8px 20px' : '32px 32px 24px' }}>
      <BrandMark />
      <p style={{ ...small, marginTop: 10 }}>{company.tagline}</p>

      <nav aria-label="Helpful links" style={{ marginTop: 8, lineHeight: 0 }}>
        {footerLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            style={{
              display: 'inline-block',
              padding: '12px 0',
              marginRight: 18,
              fontFamily: theme.font,
              fontSize: 13,
              lineHeight: '20px',
              fontWeight: 500,
              color: theme.green,
              textDecoration: 'none',
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div style={{ borderTop: `1px solid ${theme.border}`, margin: '8px 0 16px' }} />

      <TwoColumn
        stackGap={12}
        left={
          <div>
            <p style={{ ...small, fontWeight: 600, color: theme.text }}>{stores[0].city}</p>
            <p style={small}>{stores[0].address}</p>
          </div>
        }
        right={
          <div>
            <p style={{ ...small, fontWeight: 600, color: theme.text }}>{stores[1].city}</p>
            <p style={small}>{stores[1].address}</p>
          </div>
        }
      />

      <p style={{ ...small, marginTop: 16 }}>GSTIN {company.gstin}</p>
      <p style={small}>You&apos;re receiving this email because you placed an order with Sri Ram &amp; Co.</p>
      <p style={{ ...small, marginTop: 8 }}>{company.copyright}</p>
    </footer>
  );
}

'use client';

import React from 'react';
import { theme } from '../data/emailTheme';
import { SectionLabel } from './SectionLabel';
import { MergeText } from './MergeText';

const variants = [
  { key: 'A', label: 'Nothing paid', text: 'No payment was taken, so there’s nothing to refund.' },
  { key: 'B', label: 'Payment made', text: 'We’ll refund {{refund_amount}} to {{refund_method}} within 5-7 working days.' },
];

export function RefundVariants() {
  return (
    <div>
      <SectionLabel>Payment</SectionLabel>
      {variants.map((v, i) => (
        <div
          key={v.key}
          style={{
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: '14px 16px',
            marginTop: i === 0 ? 0 : 10,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              background: theme.neutralBg,
              borderRadius: 999,
              padding: '2px 10px',
              fontFamily: theme.font,
              fontSize: 13,
              lineHeight: 1.5,
              fontWeight: 600,
              color: theme.muted,
            }}
          >
            Variant {v.key} · {v.label}
          </span>
          <p style={{ margin: '8px 0 0', fontFamily: theme.font, fontSize: 15, lineHeight: 1.6, color: theme.text }}>
            <MergeText text={v.text} />
          </p>
        </div>
      ))}
    </div>
  );
}

'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme, tableProps } from '../data/emailTheme';
import { BrandMark } from './BrandMark';
import { MergeText } from './MergeText';

export function EmailHeader() {
  const { mobile } = useEmailView();
  const pad = mobile ? 20 : 32;

  return (
    <table {...tableProps} width="100%" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <tbody>
        <tr>
          <td style={{ padding: `20px ${pad}px`, verticalAlign: 'middle' }}>
            <a href="https://sriram-co-new.vercel.app" style={{ textDecoration: 'none' }} aria-label="Sri Ram & Co home">
              <BrandMark />
            </a>
          </td>
          <td
            style={{
              padding: `20px ${pad}px`,
              textAlign: 'right',
              verticalAlign: 'middle',
              fontFamily: theme.font,
              fontSize: 13,
              color: theme.muted,
              whiteSpace: 'nowrap',
            }}
          >
            Order <MergeText text="{{order_number}}" />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

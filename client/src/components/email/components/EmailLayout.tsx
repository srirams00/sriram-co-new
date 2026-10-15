'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme, tableProps } from '../data/emailTheme';
import { EmailHeader } from './EmailHeader';
import { HelpStrip } from './HelpStrip';
import { EmailFooter } from './EmailFooter';

interface EmailLayoutProps {
  children: React.ReactNode;
}

export function EmailLayout({ children }: EmailLayoutProps) {
  const { mobile } = useEmailView();
  const pad = mobile ? 20 : 32;

  return (
    <div
      style={{
        background: theme.page,
        padding: mobile ? '12px 12px 4px' : '32px 24px 8px',
        fontFamily: theme.font,
        color: theme.text,
        WebkitTextSizeAdjust: '100%',
      }}
    >
      <table
        {...tableProps}
        width="100%"
        style={{
          maxWidth: 600,
          margin: '0 auto',
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          borderCollapse: 'separate',
          overflow: 'hidden',
        }}
      >
        <tbody>
          <tr>
            <td>
              <EmailHeader />
            </td>
          </tr>
          <tr>
            <td style={{ padding: `${pad}px ${pad}px 28px` }}>{children}</td>
          </tr>
          <tr>
            <td style={{ padding: `0 ${pad}px ${pad}px` }}>
              <HelpStrip />
            </td>
          </tr>
        </tbody>
      </table>
      <EmailFooter />
    </div>
  );
}

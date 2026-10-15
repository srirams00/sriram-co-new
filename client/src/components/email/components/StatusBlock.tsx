'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme, tableProps } from '../data/emailTheme';
import { MergeText } from './MergeText';

interface StatusBlockProps {
  icon: React.ReactNode;
  title: string;
  tone?: 'green' | 'neutral';
  children: React.ReactNode;
}

export function StatusBlock({ icon, title, tone = 'green', children }: StatusBlockProps) {
  const { mobile } = useEmailView();

  return (
    <div>
      <table {...tableProps} style={{ borderCollapse: 'separate' }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: tone === 'green' ? theme.iconBg : theme.neutralBg,
                textAlign: 'center',
                verticalAlign: 'middle',
                lineHeight: 0,
              }}
            >
              <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>{icon}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <h1
        style={{
          margin: '20px 0 10px',
          fontFamily: theme.font,
          fontSize: mobile ? 24 : 26,
          lineHeight: 1.3,
          fontWeight: 600,
          color: theme.text,
        }}
      >
        <MergeText text={title} />
      </h1>
      {children}
    </div>
  );
}

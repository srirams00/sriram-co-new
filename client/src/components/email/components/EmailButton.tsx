'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme, tableProps } from '../data/emailTheme';

interface EmailButtonProps {
  href: string;
  label: string;
}

export function EmailButton({ href, label }: EmailButtonProps) {
  const { mobile } = useEmailView();

  return (
    <table {...tableProps} width={mobile ? '100%' : undefined} style={{ borderCollapse: 'separate', margin: '0 auto' }}>
      <tbody>
        <tr>
          <td style={{ background: theme.green, borderRadius: 999, textAlign: 'center' }}>
            <a
              href={href}
              style={{
                display: 'block',
                height: 48,
                lineHeight: '48px',
                padding: '0 36px',
                fontFamily: theme.font,
                fontSize: 15,
                fontWeight: 600,
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: 999,
              }}
            >
              {label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

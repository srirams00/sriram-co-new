import React from 'react';
import { theme, tableProps } from '../data/emailTheme';

interface OutlineButtonProps {
  href: string;
  label: string;
  color?: string;
  ariaLabel?: string;
}

export function OutlineButton({ href, label, color = theme.green, ariaLabel }: OutlineButtonProps) {
  return (
    <table {...tableProps} style={{ borderCollapse: 'separate', display: 'inline-table' }}>
      <tbody>
        <tr>
          <td style={{ border: `1px solid ${color}`, borderRadius: 999, background: '#ffffff' }}>
            <a
              href={href}
              aria-label={ariaLabel}
              style={{
                display: 'block',
                height: 44,
                lineHeight: '44px',
                padding: '0 20px',
                fontFamily: theme.font,
                fontSize: 15,
                fontWeight: 600,
                color,
                textDecoration: 'none',
                borderRadius: 999,
                whiteSpace: 'nowrap',
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

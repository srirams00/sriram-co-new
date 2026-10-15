'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme, tableProps } from '../data/emailTheme';
import { MergeText } from './MergeText';

interface HighlightItem {
  label: string;
  value: string;
}

interface HighlightCardProps {
  items: HighlightItem[];
}

export function HighlightCard({ items }: HighlightCardProps) {
  const { mobile } = useEmailView();

  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: mobile ? '14px 16px' : '16px 20px' }}>
      <table {...tableProps} width="100%">
        <tbody>
          <tr>
            {items.map((item, i) => (
              <td
                key={item.label}
                style={{
                  verticalAlign: 'top',
                  paddingLeft: i === 0 ? 0 : mobile ? 14 : 20,
                  borderLeft: i === 0 ? 'none' : `1px solid ${theme.border}`,
                  width: i === 0 ? '62%' : undefined,
                }}
              >
                <p style={{ margin: 0, fontFamily: theme.font, fontSize: 13, lineHeight: 1.5, color: theme.muted }}>{item.label}</p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontFamily: theme.font,
                    fontSize: mobile ? 15 : 17,
                    lineHeight: 1.4,
                    fontWeight: 600,
                    color: i === 0 ? theme.text : theme.green,
                  }}
                >
                  <MergeText text={item.value} />
                </p>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

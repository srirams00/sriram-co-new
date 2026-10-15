import React from 'react';
import { theme, tableProps } from '../data/emailTheme';

interface NumberedListProps {
  title: string;
  items: string[];
}

export function NumberedList({ title, items }: NumberedListProps) {
  return (
    <div>
      <h2 style={{ margin: '0 0 10px', fontFamily: theme.font, fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: theme.text }}>
        {title}
      </h2>
      <table {...tableProps} width="100%" role="list">
        <tbody>
          {items.map((item, i) => (
            <tr key={item} role="listitem">
              <td style={{ width: 28, verticalAlign: 'top', paddingTop: i === 0 ? 0 : 10 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: theme.iconBg,
                    textAlign: 'center',
                    lineHeight: '24px',
                    fontFamily: theme.font,
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.green,
                  }}
                >
                  {i + 1}
                </div>
              </td>
              <td
                style={{
                  verticalAlign: 'top',
                  paddingLeft: 10,
                  paddingTop: i === 0 ? 0 : 10,
                  fontFamily: theme.font,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: theme.text,
                }}
              >
                {item}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

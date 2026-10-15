import React from 'react';
import { theme, tableProps } from '../data/emailTheme';

export function BrandMark() {
  return (
    <table {...tableProps} style={{ borderCollapse: 'separate' }}>
      <tbody>
        <tr>
          <td
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              background: theme.green,
              borderRadius: 8,
              textAlign: 'center',
              verticalAlign: 'middle',
              color: '#ffffff',
              fontFamily: theme.font,
              fontWeight: 600,
              fontSize: 18,
              lineHeight: '32px',
            }}
          >
            S
          </td>
          <td
            style={{
              paddingLeft: 10,
              fontFamily: theme.font,
              fontWeight: 600,
              fontSize: 17,
              lineHeight: '32px',
              color: theme.text,
              whiteSpace: 'nowrap',
            }}
          >
            Sri Ram &amp; Co
          </td>
        </tr>
      </tbody>
    </table>
  );
}

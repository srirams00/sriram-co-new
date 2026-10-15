'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { tableProps } from '../data/emailTheme';

interface TwoColumnProps {
  left: React.ReactNode;
  right: React.ReactNode;
  gap?: number;
  stackGap?: number;
}

export function TwoColumn({ left, right, gap = 24, stackGap = 20 }: TwoColumnProps) {
  const { mobile } = useEmailView();

  if (mobile) {
    return (
      <table {...tableProps} width="100%">
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top' }}>{left}</td>
          </tr>
          <tr>
            <td style={{ verticalAlign: 'top', paddingTop: stackGap }}>{right}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table {...tableProps} width="100%" style={{ tableLayout: 'fixed' }}>
      <tbody>
        <tr>
          <td width="50%" style={{ verticalAlign: 'top', paddingRight: gap / 2 }}>
            {left}
          </td>
          <td width="50%" style={{ verticalAlign: 'top', paddingLeft: gap / 2 }}>
            {right}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

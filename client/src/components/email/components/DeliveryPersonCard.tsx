'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme, tableProps } from '../data/emailTheme';
import { OutlineButton } from './OutlineButton';
import { MergeText } from './MergeText';

export function DeliveryPersonCard() {
  const { mobile, values } = useEmailView();
  const name = values.delivery_person_name ?? '';
  const initial = name.charAt(0).toUpperCase() || 'D';
  const tel = `tel:${(values.delivery_person_phone ?? '').replace(/\s/g, '')}`;

  return (
    <div style={{ background: theme.surface, borderRadius: 12, padding: mobile ? 16 : 20 }}>
      <table {...tableProps} width="100%">
        <tbody>
          <tr>
            <td style={{ width: 44, verticalAlign: 'middle' }}>
              <div
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: theme.iconBg,
                  border: `1px solid ${theme.border}`,
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  lineHeight: '42px',
                  fontFamily: theme.font,
                  fontSize: 17,
                  fontWeight: 600,
                  color: theme.green,
                  margin: '0 auto',
                }}
              >
                {initial}
              </div>
            </td>
            <td style={{ padding: '0 12px 0 14px', verticalAlign: 'middle', fontFamily: theme.font }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, fontWeight: 600, color: theme.text }}>
                <MergeText text="{{delivery_person_name}}" />
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 13, lineHeight: 1.5, color: theme.muted }}>
                <MergeText text="{{delivery_person_phone}}" />
              </p>
              {!mobile && (
                <p style={{ margin: '2px 0 0', fontSize: 13, lineHeight: 1.5, color: theme.muted }}>
                  Arriving <MergeText text="{{delivery_window}}" />
                </p>
              )}
            </td>
            <td style={{ verticalAlign: 'middle', textAlign: 'right', width: 1 }}>
              <OutlineButton href={tel} label="Call" ariaLabel={`Call ${name}`} />
            </td>
          </tr>
        </tbody>
      </table>
      {mobile && (
        <p style={{ margin: '12px 0 0', fontFamily: theme.font, fontSize: 13, lineHeight: 1.5, color: theme.muted }}>
          Arriving <MergeText text="{{delivery_window}}" />
        </p>
      )}
    </div>
  );
}

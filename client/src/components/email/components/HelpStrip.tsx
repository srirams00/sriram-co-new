'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme, tableProps } from '../data/emailTheme';
import { contact, stores } from '../data/order';
import { OutlineButton } from './OutlineButton';
import { TwoColumn } from './TwoColumn';

export function HelpStrip() {
  const { mobile } = useEmailView();

  return (
    <div style={{ background: theme.surface, borderRadius: 12, padding: mobile ? 18 : 24 }}>
      <p style={{ margin: 0, fontFamily: theme.font, fontSize: 15, lineHeight: 1.6, color: theme.text }}>
        Questions? Call{' '}
        <a href={contact.tel} style={{ color: theme.green, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          {contact.phoneDisplay}
        </a>{' '}
        or message us on{' '}
        <a href={contact.whatsapp} style={{ color: theme.whatsapp, fontWeight: 600, textDecoration: 'underline' }}>
          WhatsApp
        </a>
      </p>

      <table {...tableProps} style={{ marginTop: 14 }}>
        <tbody>
          <tr>
            <td style={{ paddingRight: 10 }}>
              <OutlineButton href={contact.tel} label="Call us" ariaLabel={`Call ${contact.phoneDisplay}`} />
            </td>
            <td>
              <OutlineButton href={contact.whatsapp} label="WhatsApp us" color={theme.whatsapp} />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: `1px solid ${theme.border}`, margin: '18px 0 16px' }} />

      <TwoColumn
        stackGap={12}
        left={<StoreHours city={stores[0].city} hours={stores[0].hours} />}
        right={<StoreHours city={stores[1].city} hours={stores[1].hours} />}
      />
    </div>
  );
}

function StoreHours({ city, hours }: { city: string; hours: string[] }) {
  return (
    <div style={{ fontFamily: theme.font, fontSize: 13, lineHeight: 1.6 }}>
      <p style={{ margin: 0, fontWeight: 600, color: theme.text }}>{city} store</p>
      {hours.map((h) => (
        <p key={h} style={{ margin: 0, color: theme.muted }}>
          {h}
        </p>
      ))}
    </div>
  );
}

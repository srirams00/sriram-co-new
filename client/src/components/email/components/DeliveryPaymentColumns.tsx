'use client';

import React from 'react';
import { theme } from '../data/emailTheme';
import { deliveryAddress, paymentInfo } from '../data/order';
import { SectionLabel } from './SectionLabel';
import { TwoColumn } from './TwoColumn';
import { MergeText } from './MergeText';

const strong: React.CSSProperties = {
  margin: 0,
  fontFamily: theme.font,
  fontSize: 15,
  lineHeight: 1.6,
  fontWeight: 500,
  color: theme.text,
};

const line: React.CSSProperties = {
  margin: 0,
  fontFamily: theme.font,
  fontSize: 15,
  lineHeight: 1.6,
  color: theme.muted,
};

export function DeliveryPaymentColumns() {
  return (
    <TwoColumn
      left={
        <div>
          <SectionLabel>Delivery address</SectionLabel>
          <p style={strong}>
            <MergeText text={deliveryAddress.name} />
          </p>
          {deliveryAddress.lines.map((l) => (
            <p key={l} style={line}>
              {l}
            </p>
          ))}
        </div>
      }
      right={
        <div>
          <SectionLabel>Payment</SectionLabel>
          <p style={strong}>{paymentInfo.method}</p>
          <p style={line}>{paymentInfo.detail}</p>
        </div>
      }
    />
  );
}

'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { theme, tableProps } from '../data/emailTheme';
import { orderItems, orderInfo } from '../data/order';
import { formatINR } from '../utils/currency';

interface OrderSummaryProps {
  muted?: boolean;
}

export function OrderSummary({ muted = false }: OrderSummaryProps) {
  const { mobile } = useEmailView();
  const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const nameColor = muted ? theme.muted : theme.text;
  const thumb = mobile ? 48 : 56;

  return (
    <div style={{ background: theme.surface, borderRadius: 12, padding: mobile ? 16 : 20 }}>
      <table {...tableProps} width="100%">
        <tbody>
          <tr>
            <td style={{ fontFamily: theme.font, fontSize: 15, fontWeight: 600, color: theme.text }}>
              {muted ? 'Cancelled items' : 'Order summary'}
            </td>
            <td style={{ fontFamily: theme.font, fontSize: 13, color: theme.muted, textAlign: 'right' }}>
              Placed {orderInfo.placedOn}
            </td>
          </tr>
        </tbody>
      </table>

      <table {...tableProps} width="100%" style={{ marginTop: 8 }}>
        <tbody>
          {orderItems.map((item, i) => (
            <tr key={item.id}>
              <td
                style={{
                  width: thumb,
                  padding: '12px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.border}`,
                  verticalAlign: 'middle',
                }}
              >
                <img
                  src={item.image}
                  alt={item.alt}
                  width={thumb}
                  height={thumb}
                  style={{
                    display: 'block',
                    width: thumb,
                    height: thumb,
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: '#ffffff',
                    objectFit: 'cover',
                    fontFamily: theme.font,
                    fontSize: 13,
                    color: theme.muted,
                  }}
                />
              </td>
              <td
                style={{
                  padding: '12px 12px 12px 14px',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.border}`,
                  verticalAlign: 'middle',
                  fontFamily: theme.font,
                }}
              >
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, fontWeight: 500, color: nameColor }}>{item.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, lineHeight: 1.5, color: theme.muted }}>
                  Qty {item.qty}
                  {item.qty > 1 ? ` · ${formatINR(item.unitPrice)} each` : ''}
                </p>
              </td>
              <td
                style={{
                  padding: '12px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.border}`,
                  verticalAlign: 'middle',
                  textAlign: 'right',
                  fontFamily: theme.font,
                  fontSize: 15,
                  fontWeight: muted ? 400 : 500,
                  color: muted ? theme.muted : theme.text,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatINR(item.unitPrice * item.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table {...tableProps} width="100%" style={{ borderTop: `1px solid ${theme.border}`, marginTop: 4 }}>
        <tbody>
          <tr>
            <td style={{ paddingTop: 14, fontFamily: theme.font, fontSize: 15, color: theme.muted }}>Delivery</td>
            <td
              style={{
                paddingTop: 14,
                fontFamily: theme.font,
                fontSize: 15,
                textAlign: 'right',
                color: muted ? theme.muted : theme.green,
                fontWeight: muted ? 400 : 500,
              }}
            >
              {orderInfo.delivery}
            </td>
          </tr>
          <tr>
            <td
              style={{
                paddingTop: 8,
                fontFamily: theme.font,
                fontSize: muted ? 15 : 17,
                fontWeight: muted ? 400 : 600,
                color: muted ? theme.muted : theme.text,
              }}
            >
              {muted ? 'Order value' : 'Total'}
            </td>
            <td
              style={{
                paddingTop: 8,
                fontFamily: theme.font,
                fontSize: muted ? 15 : 17,
                fontWeight: muted ? 400 : 600,
                textAlign: 'right',
                color: muted ? theme.muted : theme.text,
              }}
            >
              {formatINR(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

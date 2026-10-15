'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { theme, links } from '../data/emailTheme';
import { EmailLayout } from '../components/EmailLayout';
import { StatusBlock } from '../components/StatusBlock';
import { EmailText } from '../components/EmailText';
import { Spacer } from '../components/Spacer';
import { ProgressStrip } from '../components/ProgressStrip';
import { OrderSummary } from '../components/OrderSummary';
import { DeliveryPaymentColumns } from '../components/DeliveryPaymentColumns';
import { EmailButton } from '../components/EmailButton';

export function OrderPlacedEmail() {
  return (
    <EmailLayout>
      <StatusBlock
        icon={<ShoppingBag size={26} color={theme.green} strokeWidth={1.75} role="img" aria-label="Shopping bag" style={{ margin: '0 auto' }} />}
        title="Thanks, {{first_name}}. We’ve got your order."
      >
        <EmailText>
          Your order is placed but not confirmed yet. Someone from our store team will call you to confirm the products
          and delivery timing. Please keep your phone nearby.
        </EmailText>
      </StatusBlock>
      <Spacer size={28} />
      <ProgressStrip completed={0} current={0} />
      <Spacer size={28} />
      <OrderSummary />
      <Spacer size={12} />
      <EmailText variant="note">Need to change or cancel? Call or WhatsApp us before it is dispatched.</EmailText>
      <Spacer size={24} />
      <DeliveryPaymentColumns />
      <Spacer size={28} />
      <EmailButton href={links.orders} label="Track your order" />
    </EmailLayout>
  );
}

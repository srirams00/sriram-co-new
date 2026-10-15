'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { theme, links } from '../data/emailTheme';
import { EmailLayout } from '../components/EmailLayout';
import { StatusBlock } from '../components/StatusBlock';
import { EmailText } from '../components/EmailText';
import { MergeText } from '../components/MergeText';
import { Spacer } from '../components/Spacer';
import { ProgressStrip } from '../components/ProgressStrip';
import { HighlightCard } from '../components/HighlightCard';
import { OrderSummary } from '../components/OrderSummary';
import { DeliveryPaymentColumns } from '../components/DeliveryPaymentColumns';
import { EmailButton } from '../components/EmailButton';

export function OrderConfirmedEmail() {
  return (
    <EmailLayout>
      <StatusBlock
        icon={<Check size={26} color={theme.green} strokeWidth={1.75} role="img" aria-label="Check mark" style={{ margin: '0 auto' }} />}
        title="Your order is confirmed."
      >
        <EmailText>
          <MergeText text="Thanks for confirming with us, {{first_name}}. We’ll pack it at our {{store_branch}} store and deliver it to your door." />
        </EmailText>
      </StatusBlock>
      <Spacer size={28} />
      <ProgressStrip completed={1} current={1} />
      <Spacer size={28} />
      <HighlightCard
        items={[
          { label: 'Expected delivery', value: '{{expected_delivery}}' },
          { label: 'Delivery', value: 'Free Direct Delivery' },
        ]}
      />
      <Spacer size={12} />
      <OrderSummary />
      <Spacer size={12} />
      <EmailText variant="note">Need to cancel? Please tell us before it is dispatched.</EmailText>
      <Spacer size={24} />
      <DeliveryPaymentColumns />
      <Spacer size={28} />
      <EmailButton href={links.orders} label="Track your order" />
    </EmailLayout>
  );
}

'use client';

import React from 'react';
import { PackageCheck } from 'lucide-react';
import { theme, links } from '../data/emailTheme';
import { EmailLayout } from '../components/EmailLayout';
import { StatusBlock } from '../components/StatusBlock';
import { EmailText } from '../components/EmailText';
import { MergeText } from '../components/MergeText';
import { Spacer } from '../components/Spacer';
import { ProgressStrip } from '../components/ProgressStrip';
import { OrderSummary } from '../components/OrderSummary';
import { DeliveryPaymentColumns } from '../components/DeliveryPaymentColumns';
import { EmailButton } from '../components/EmailButton';

export function ShippedEmail() {
  return (
    <EmailLayout>
      <StatusBlock
        icon={<PackageCheck size={26} color={theme.green} strokeWidth={1.75} role="img" aria-label="Shipped package" style={{ margin: '0 auto' }} />}
        title="Your order has shipped."
      >
        <EmailText>
          <MergeText text="Your order has been dispatched from our {{store_branch}} store. We’ll let you know when it is out for delivery." />
        </EmailText>
      </StatusBlock>
      <Spacer size={28} />
      <ProgressStrip completed={1} current={1} />
      <Spacer size={28} />
      <OrderSummary />
      <Spacer size={24} />
      <DeliveryPaymentColumns />
      <Spacer size={28} />
      <EmailButton href={links.orders} label="Track your order" />
    </EmailLayout>
  );
}

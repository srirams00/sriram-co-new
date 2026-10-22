'use client';

import React from 'react';
import { PackageOpen } from 'lucide-react';
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

export function ProcessingEmail() {
  return (
    <EmailLayout>
      <StatusBlock
        icon={<PackageOpen size={26} color={theme.green} strokeWidth={1.75} role="img" aria-label="Open parcel box" style={{ margin: '0 auto' }} />}
        title="We’re getting your order ready."
      >
        <EmailText>
          <MergeText text="Our team is checking and packing your items at the {{store_branch}} store. We usually dispatch the same or next day, and we’ll email you when it is on its way. There’s nothing you need to do right now." />
        </EmailText>
      </StatusBlock>
      <Spacer size={28} />
      <ProgressStrip completed={1} current={1} partialAfter={1} />
      <Spacer size={28} />
      <OrderSummary />
      <Spacer size={24} />
      <DeliveryPaymentColumns />
      <Spacer size={28} />
      <EmailButton href={links.orders} label="Track your order" />
    </EmailLayout>
  );
}

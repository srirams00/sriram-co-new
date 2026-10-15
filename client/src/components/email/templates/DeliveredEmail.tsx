'use client';

import React from 'react';
import { theme, links } from '../data/emailTheme';
import { contact } from '../data/order';
import { EmailLayout } from '../components/EmailLayout';
import { StatusBlock } from '../components/StatusBlock';
import { EmailText } from '../components/EmailText';
import { MergeText } from '../components/MergeText';
import { Spacer } from '../components/Spacer';
import { ProgressStrip } from '../components/ProgressStrip';
import { OrderSummary } from '../components/OrderSummary';
import { DeliveryPaymentColumns } from '../components/DeliveryPaymentColumns';
import { TwoColumn } from '../components/TwoColumn';
import { InfoBlock } from '../components/InfoBlock';
import { EmailButton } from '../components/EmailButton';
import { HouseCheckIcon } from '../components/HouseCheckIcon';

export function DeliveredEmail() {
  return (
    <EmailLayout>
      <StatusBlock
        icon={<HouseCheckIcon size={26} color={theme.green} label="House with check mark" />}
        title="Your order has been delivered."
      >
        <EmailText>
          <MergeText text="Thank you, {{first_name}}. We hope you’re happy with your purchase." />
        </EmailText>
      </StatusBlock>
      <Spacer size={28} />
      <ProgressStrip completed={4} />
      <Spacer size={28} />
      <OrderSummary />
      <Spacer size={24} />
      <DeliveryPaymentColumns />
      <Spacer size={24} />
      <TwoColumn
        stackGap={8}
        left={
          <InfoBlock
            title="If something isn’t right"
            body="If an item is faulty, damaged or not working, tell us within 7 days of delivery and we’ll arrange a replacement."
            linkLabel="Returns &amp; Refunds"
            href={links.returns}
          />
        }
        right={
          <InfoBlock
            title="Keep your invoice"
            body="You’ll need it for the manufacturer’s warranty."
            linkLabel="Warranty &amp; Service"
            href={links.warranty}
          />
        }
      />
      <Spacer size={20} />
      <EmailButton href={links.invoice} label="View your invoice" />
      <Spacer size={20} />
      <EmailText>
        How did we do? Just reply to this email or message us on{' '}
        <a
          href={contact.whatsapp}
          style={{ color: theme.whatsapp, fontWeight: 600, textDecoration: 'underline' }}
        >
          WhatsApp
        </a>
        .
      </EmailText>
    </EmailLayout>
  );
}

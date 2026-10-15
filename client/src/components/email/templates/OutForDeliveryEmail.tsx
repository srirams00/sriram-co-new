'use client';

import React from 'react';
import { Truck } from 'lucide-react';
import { theme, links } from '../data/emailTheme';
import { atTheDoorSteps } from '../data/order';
import { EmailLayout } from '../components/EmailLayout';
import { StatusBlock } from '../components/StatusBlock';
import { EmailText } from '../components/EmailText';
import { MergeText } from '../components/MergeText';
import { Spacer } from '../components/Spacer';
import { ProgressStrip } from '../components/ProgressStrip';
import { DeliveryPersonCard } from '../components/DeliveryPersonCard';
import { NumberedList } from '../components/NumberedList';
import { OrderSummary } from '../components/OrderSummary';
import { DeliveryPaymentColumns } from '../components/DeliveryPaymentColumns';
import { EmailButton } from '../components/EmailButton';

export function OutForDeliveryEmail() {
  return (
    <EmailLayout>
      <StatusBlock
        icon={<Truck size={26} color={theme.green} strokeWidth={1.75} role="img" aria-label="Delivery truck" style={{ margin: '0 auto' }} />}
        title="Your order is on its way."
      >
        <EmailText>
          <MergeText text="{{delivery_person_name}} from our store is bringing your order to you and will call when close." />
        </EmailText>
      </StatusBlock>
      <Spacer size={28} />
      <ProgressStrip completed={2} current={2} />
      <Spacer size={28} />
      <DeliveryPersonCard />
      <Spacer size={24} />
      <NumberedList title="At the door" items={atTheDoorSteps} />
      <Spacer size={14} />
      <EmailText variant="note">Not at home? Call us and we’ll arrange another time.</EmailText>
      <Spacer size={24} />
      <OrderSummary />
      <Spacer size={24} />
      <DeliveryPaymentColumns />
      <Spacer size={28} />
      <EmailButton href={links.orders} label="Track your order" />
    </EmailLayout>
  );
}

'use client';

import React from 'react';
import { Minus } from 'lucide-react';
import { theme, links } from '../data/emailTheme';
import { useEmailView } from '../contexts/EmailViewContext';
import { EmailLayout } from '../components/EmailLayout';
import { StatusBlock } from '../components/StatusBlock';
import { EmailText } from '../components/EmailText';
import { MergeText } from '../components/MergeText';
import { Spacer } from '../components/Spacer';
import { OrderSummary } from '../components/OrderSummary';
import { RefundVariants } from '../components/RefundVariants';
import { EmailButton } from '../components/EmailButton';

export function CancelledEmail() {
  const { cancelledBy } = useEmailView();

  return (
    <EmailLayout>
      <StatusBlock
        tone="neutral"
        icon={<Minus size={26} color={theme.muted} strokeWidth={1.75} role="img" aria-label="Cancelled" style={{ margin: '0 auto' }} />}
        title="Your order has been cancelled."
      >
        <EmailText spaceAfter={cancelledBy === 'store' ? 6 : 0}>
          <MergeText text="We’ve cancelled order {{order_number}}. Reason: {{cancellation_reason}}" />
        </EmailText>
        {cancelledBy === 'store' && <EmailText>Sorry for the trouble.</EmailText>}
      </StatusBlock>
      <Spacer size={28} />
      <OrderSummary muted />
      <Spacer size={24} />
      <RefundVariants />
      <Spacer size={28} />
      <EmailButton href={links.shop} label="Continue shopping" />
      <Spacer size={16} />
      <EmailText variant="muted">If this wasn’t expected, call or message us.</EmailText>
    </EmailLayout>
  );
}

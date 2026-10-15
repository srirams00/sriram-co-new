import React from 'react';
import type { EmailId } from '@/types/email';
import { OrderPlacedEmail } from '../templates/OrderPlacedEmail';
import { OrderConfirmedEmail } from '../templates/OrderConfirmedEmail';
import { ProcessingEmail } from '../templates/ProcessingEmail';
import { OutForDeliveryEmail } from '../templates/OutForDeliveryEmail';
import { DeliveredEmail } from '../templates/DeliveredEmail';
import { CancelledEmail } from '../templates/CancelledEmail';

export const emailTemplates: Record<EmailId, () => React.ReactElement> = {
  placed: OrderPlacedEmail,
  confirmed: OrderConfirmedEmail,
  processing: ProcessingEmail,
  'out-for-delivery': OutForDeliveryEmail,
  delivered: DeliveredEmail,
  cancelled: CancelledEmail,
};

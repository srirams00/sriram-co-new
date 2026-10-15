import type { EmailMeta } from '@/types/email';

export const emails: EmailMeta[] = [
  {
    id: 'placed',
    number: 1,
    label: 'Order placed',
    subject: 'We’ve received your order {{order_number}}',
    preheader: 'We’ll call you shortly to confirm it.',
  },
  {
    id: 'confirmed',
    number: 2,
    label: 'Order confirmed',
    subject: 'Your order {{order_number}} is confirmed',
    preheader: 'Expected delivery {{expected_delivery}}.',
  },
  {
    id: 'processing',
    number: 3,
    label: 'Processing',
    subject: 'We’re packing your order {{order_number}}',
    preheader: 'Checked, packed and nearly ready to dispatch.',
  },
  {
    id: 'out-for-delivery',
    number: 4,
    label: 'Out for delivery',
    subject: 'Your order {{order_number}} is on its way',
    preheader: 'Arriving {{delivery_window}}. Please keep your phone nearby.',
  },
  {
    id: 'delivered',
    number: 5,
    label: 'Delivered',
    subject: 'Delivered: your order {{order_number}}',
    preheader: 'Thank you for shopping with Sri Ram & Co.',
  },
  {
    id: 'cancelled',
    number: 6,
    label: 'Cancelled',
    subject: 'Your order {{order_number}} has been cancelled',
    preheader: 'Here’s what this means for your payment.',
  },
];

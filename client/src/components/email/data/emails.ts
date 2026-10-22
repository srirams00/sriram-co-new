import type { EmailMeta } from '@/types/email';

export const emails: EmailMeta[] = [
  {
    id: 'placed',
    number: 1,
    label: 'Order placed',
    subject: 'We’ve received your order {{order_number}}',
    preheader: 'We’re preparing your order.',
  },
  {
    id: 'shipped',
    number: 2,
    label: 'Shipped',
    subject: 'Your order {{order_number}} has shipped',
    preheader: 'Expected delivery {{expected_delivery}}.',
  },
  {
    id: 'out-for-delivery',
    number: 3,
    label: 'Out for delivery',
    subject: 'Your order {{order_number}} is on its way',
    preheader: 'Arriving {{delivery_window}}. Please keep your phone nearby.',
  },
  {
    id: 'delivered',
    number: 4,
    label: 'Delivered',
    subject: 'Delivered: your order {{order_number}}',
    preheader: 'Thank you for shopping with Sri Ram & Co.',
  },
  {
    id: 'cancelled',
    number: 5,
    label: 'Cancelled',
    subject: 'Your order {{order_number}} has been cancelled',
    preheader: 'Here’s what this means for your payment.',
  },
];

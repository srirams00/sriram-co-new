import type { OrderItem, StoreInfo, FooterLink, CancelledBy } from '@/types/email';

export const mergeTagValues: Record<string, string> = {
  order_number: 'SR-10482',
  first_name: 'Priya',
  expected_delivery: 'Fri, 16 Oct 2026',
  store_branch: 'Trichy',
  delivery_window: 'today between 2 PM and 5 PM',
  delivery_person_name: 'Murugan',
  delivery_person_phone: '+91 94431 27658',
  refund_amount: '₹2,448',
  refund_method: 'your original UPI / Razorpay account',
};

export const cancellationReasons: Record<CancelledBy, string> = {
  store: 'The Kemei Trimmer is out of stock at our Trichy store.',
  customer: 'You asked us to cancel it.',
};

export const orderItems: OrderItem[] = [
  {
    id: 'bucket-mop',
    name: 'Bucket Mop',
    qty: 1,
    unitPrice: 750,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=120',
    alt: 'Bucket Mop',
  },
  {
    id: 'kemei-trimmer',
    name: 'Kemei Trimmer',
    qty: 1,
    unitPrice: 1500,
    image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=120',
    alt: 'Kemei Trimmer',
  },
  {
    id: 'dish-brush',
    name: 'Dish Washer Brush',
    qty: 2,
    unitPrice: 99,
    image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=120',
    alt: 'Dish Washer Brush',
  },
];

export const orderInfo = {
  placedOn: '15 Oct 2026',
  delivery: 'Free',
};

export const deliveryAddress = {
  name: '{{first_name}}',
  lines: ['12, Gandhi Nagar', 'Thillai Nagar, Trichy'],
};

export const paymentInfo = {
  method: 'Online Payment (Razorpay)',
  detail: 'Paid via UPI / Netbanking · Verified',
};

export const contact = {
  phoneDisplay: '+91 93454 03136',
  tel: 'tel:+919345403136',
  whatsapp: 'https://wa.me/919345403136',
};

export const stores: StoreInfo[] = [
  {
    city: 'Trichy',
    address: 'No. 11, Vinola Complex, Thanjai Main Road, Trichy',
    hours: ['Mon–Sat 9:30 AM–8:30 PM', 'Sun 10 AM–2 PM'],
  },
  {
    city: 'Chennai',
    address: 'No. 99/2, Kothaval Chavadi Street, West Saidapet, Chennai',
    hours: ['Mon–Sun 10 AM–9 PM'],
  },
];

export const footerLinks: FooterLink[] = [
  { label: 'Track your order', href: 'https://sriram-co-new.vercel.app/orders' },
  { label: 'Returns & Refunds', href: 'https://sriram-co-new.vercel.app/refund-policy' },
  { label: 'Shipping & Delivery', href: 'https://sriram-co-new.vercel.app/shipping-policy' },
  { label: 'Warranty & Service', href: 'https://sriram-co-new.vercel.app/warranty-policy' },
  { label: 'Terms', href: 'https://sriram-co-new.vercel.app/terms' },
  { label: 'Privacy', href: 'https://sriram-co-new.vercel.app/privacy' },
];

export const company = {
  tagline: 'Reliable appliances, genuine products, direct store delivery across Tamil Nadu.',
  gstin: '33ARHPR6139B1ZX',
  copyright: '© 2026 Sri Ram & Co',
};

export const atTheDoorSteps = [
  'Check the parcel in front of the delivery person and tell us straight away if anything looks damaged.',
  'All online payments are verified. No additional cash collection is needed at your door.',
  'Sign or acknowledge receipt to confirm safe handover.',
];

export type EmailId =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled';

export type CancelledBy = 'store' | 'customer';

export interface EmailMeta {
  id: EmailId;
  number: number;
  label: string;
  subject: string;
  preheader: string;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  image: string;
  alt: string;
}

export interface StoreInfo {
  city: string;
  address: string;
  hours: string[];
}

export interface FooterLink {
  label: string;
  href: string;
}

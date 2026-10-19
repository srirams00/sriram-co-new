export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  postalCode?: string;
  notes?: string;
}

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'refund_initiated';
export type PaymentMethod = 'razorpay' | 'upi' | 'card' | 'netbanking';

export interface Order {
  id: string;
  orderNumber: string;
  customerInfo: CustomerInfo;
  orderItems: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'admin' | 'store';
  refundDetails?: Record<string, any>;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  pricing: OrderPricing;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingCount: number;
  deliveredCount: number;
}

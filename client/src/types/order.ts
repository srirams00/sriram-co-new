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

export type OrderStatus = 'placed' | 'shipped' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'refund_initiated';
export type PaymentMethod = 'razorpay' | 'upi' | 'card' | 'netbanking';

export interface ReturnRequest {
  status: 'requested' | 'approved' | 'rejected' | 'picked_up' | 'refunded';
  item: {
    productId?: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  };
  reason: string;
  faultDetails: string;
  agreedToPolicy: boolean;
  requestedAt: string;
  resolvedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerInfo: CustomerInfo;
  orderItems: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  returnRequest?: ReturnRequest;
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
  pendingDeliveries?: number;
}

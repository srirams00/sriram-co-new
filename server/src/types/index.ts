/**
 * Sriram & Co Server Advanced Type Definitions & Domain Types
 * Conforms to typescript-advanced-types standard
 */

import type { IUser } from '../models/User.js';

// ==========================================
// 1. Template Literal Types
// ==========================================

/**
 * Validated order number format: SRC-<random6>-<random3>
 * e.g., "SRC-948210-412"
 */
export type OrderNumber = `SRC-${number}-${number}`;

/**
 * Razorpay identifiers prefix-enforced
 */
export type RazorpayOrderId = `order_${string}`;
export type RazorpayPaymentId = `pay_${string}`;
export type RazorpaySignature = string;

/**
 * API route paths type-level validation
 */
export type ApiVersion = 'v1' | 'v2';
export type ApiEndpoint = 'products' | 'orders' | 'auth' | 'health' | 'categories';
export type ApiPath = `/api/${ApiEndpoint}` | `/api/${ApiVersion}/${ApiEndpoint}`;

// ==========================================
// 2. Generic API Response Envelopes
// ==========================================

export interface ApiSuccessResponse<TData, TMeta = Record<string, unknown>> {
  success: true;
  data: TData;
  meta?: TMeta;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type ApiResponse<TData, TMeta = Record<string, unknown>> =
  | ApiSuccessResponse<TData, TMeta>
  | ApiErrorResponse;

// ==========================================
// 3. Discriminated Union Order State Machine
// ==========================================

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface BaseCustomerInfo {
  fullName: string;
  phone: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface BaseOrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface BaseOrderPricing {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

export type OrderLifecycleState =
  | {
      status: 'placed';
      placedAt: string | Date;
    }
  | {
      status: 'confirmed';
      confirmedAt: string | Date;
      storeBranch: string;
    }
  | {
      status: 'processing';
      packedAt: string | Date;
    }
  | {
      status: 'out_for_delivery';
      dispatchedAt: string | Date;
      driverName: string;
      driverPhone: string;
    }
  | {
      status: 'delivered';
      deliveredAt: string | Date;
      deliveryConfirmationOtp?: string;
    }
  | {
      status: 'cancelled';
      cancelledAt: string | Date;
      cancellationReason: string;
      refundStatus: 'pending' | 'processed' | 'not_applicable';
    };

export interface BaseOrderData {
  _id: string;
  orderNumber: OrderNumber | string;
  customer: BaseCustomerInfo;
  items: BaseOrderItem[];
  pricing: BaseOrderPricing;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: RazorpayOrderId | string;
  razorpayPaymentId?: RazorpayPaymentId | string;
  createdAt: string | Date;
}

export type FullOrder = BaseOrderData & OrderLifecycleState;

// ==========================================
// 4. Mapped & Utility Types
// ==========================================

/**
 * DeepReadonly ensures complex objects cannot be mutated
 */
export type DeepReadonly<T> = T extends Function | boolean | number | string | null | undefined
  ? T
  : T extends Array<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends Map<infer K, infer V>
      ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
      : T extends Set<infer M>
        ? ReadonlySet<DeepReadonly<M>>
        : { readonly [P in keyof T]: DeepReadonly<T[P]> };

/**
 * Pick properties of T that match type U
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * Nullable utility
 */
export type Nullable<T> = T | null;

/**
 * Extract values of an object type
 */
export type ValueOf<T> = T[keyof T];

// ==========================================
// 5. Compile-Time Type Assertion Helpers
// ==========================================

export type Assert<T extends true> = T;
export type Extends<T, U> = T extends U ? true : false;
export type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;

// Re-export IUser for convenience
export type { IUser };

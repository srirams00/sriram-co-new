import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IReturnRequest {
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
  requestedAt: Date;
  resolvedAt?: Date;
}

export interface IOrder extends Document {
  id?: string;
  user?: Types.ObjectId;
  orderNumber: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    postalCode?: string;
    notes?: string;
  };
  orderItems: IOrderItem[];
  paymentMethod: 'razorpay' | 'upi' | 'card' | 'netbanking';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'refund_initiated';
  orderStatus: 'placed' | 'shipped' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';
  returnRequest?: IReturnRequest;
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'admin' | 'store';
  refundDetails?: Record<string, unknown>;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentDetails?: Record<string, unknown>;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.Mixed,
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: '' },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    orderItems: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val: IOrderItem[]) => val.length > 0, 'Must have at least one order item'],
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'upi', 'card', 'netbanking'],
      default: 'razorpay',
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'refund_initiated'],
      default: 'pending',
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin', 'store'],
      default: null,
    },
    refundDetails: {
      type: Schema.Types.Mixed,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'shipped', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned'],
      default: 'placed',
    },
    returnRequest: {
      type: {
        status: {
          type: String,
          enum: ['requested', 'approved', 'rejected', 'picked_up', 'refunded'],
          default: 'requested',
        },
        item: {
          productId: { type: String, default: null },
          name: { type: String, required: true },
          quantity: { type: Number, required: true, default: 1 },
          price: { type: Number, required: true },
          image: { type: String, default: null },
        },
        reason: { type: String, required: true },
        faultDetails: { type: String, required: true },
        agreedToPolicy: { type: Boolean, required: true, default: false },
        requestedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date, default: null },
      },
      default: null,
    },
    pricing: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Anti-replay and idempotency indexes: ensure razorpayOrderId and razorpayPaymentId are globally unique once assigned
OrderSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: 'string' } } }
);
OrderSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, partialFilterExpression: { razorpayOrderId: { $type: 'string' } } }
);

export const Order = model<IOrder>('Order', OrderSchema);

import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
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
  paymentMethod: 'upi' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'placed' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
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
      type: Schema.Types.ObjectId,
      ref: 'Product',
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
      enum: ['upi', 'card'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed',
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

export const Order = model<IOrder>('Order', OrderSchema);

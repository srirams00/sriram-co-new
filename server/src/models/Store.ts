import { Schema, model, Document } from 'mongoose';

export interface IStore extends Document {
  id?: string;
  name: string;
  city: string;
  address: string;
  landmark: string;
  phone: string;
  hours: string;
  mapUrl: string;
  isMainStore: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    landmark: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    hours: {
      type: String,
      required: [true, 'Working hours are required'],
      trim: true,
    },
    mapUrl: {
      type: String,
      required: [true, 'Map URL is required'],
    },
    isMainStore: {
      type: Boolean,
      default: false,
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

export const Store = model<IStore>('Store', StoreSchema);

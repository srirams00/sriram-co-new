import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  id?: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  originalPrice?: number;
  image: string;
  additionalImages: string[];
  badge?: 'Best Seller' | 'New' | 'Top Rated' | 'Popular' | 'Sale';
  inStock: boolean;
  rating: number;
  reviewCount: number;
  specifications: Record<string, string>;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    categorySlug: {
      type: String,
      required: [true, 'Category slug is required'],
      index: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
    },
    fullDescription: {
      type: String,
      required: [true, 'Full description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price must be positive'],
    },
    image: {
      type: String,
      required: [true, 'Primary image is required'],
    },
    additionalImages: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      enum: ['Best Seller', 'New', 'Top Rated', 'Popular', 'Sale', null],
      default: null,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        // Convert Map to plain object for specifications if needed
        if (ret.specifications instanceof Map) {
          ret.specifications = Object.fromEntries(ret.specifications);
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Product = model<IProduct>('Product', ProductSchema);

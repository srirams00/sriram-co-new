import { Schema, model, Document } from 'mongoose';

export interface ITestimonial extends Document {
  id?: string;
  quote: string;
  author: string;
  location: string;
  customerType: string;
  rating: number;
  productMentioned?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    quote: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    customerType: {
      type: String,
      default: 'Verified Customer',
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    productMentioned: {
      type: String,
      default: '',
      trim: true,
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

export const Testimonial = model<ITestimonial>('Testimonial', TestimonialSchema);

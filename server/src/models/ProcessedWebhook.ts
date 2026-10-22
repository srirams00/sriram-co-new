import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessedWebhook extends Document {
  eventId: string;
  eventType: string;
  processedAt: Date;
}

const ProcessedWebhookSchema: Schema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      // 30-day automatic TTL eviction
      expires: 30 * 24 * 60 * 60,
    },
  },
  {
    timestamps: true,
  }
);

export const ProcessedWebhook = mongoose.model<IProcessedWebhook>(
  'ProcessedWebhook',
  ProcessedWebhookSchema
);

import dotenv from 'dotenv';
import path from 'path';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Load environment variables from server root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export function isRazorpayConfigured(
  keyId = RAZORPAY_KEY_ID,
  keySecret = RAZORPAY_KEY_SECRET
): boolean {
  return (
    /^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId) &&
    Boolean(keySecret.trim()) &&
    keySecret.trim() !== 'your_razorpay_key_secret'
  );
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID || 'mock_key_for_test',
  key_secret: RAZORPAY_KEY_SECRET || 'mock_secret_for_test',
});

/**
 * Validates the Razorpay payment signature using HMAC SHA-256 and timing-safe equality.
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret?: string
): boolean {
  const keySecret = secret || RAZORPAY_KEY_SECRET;
  if (!orderId || !paymentId || !signature || !keySecret) {
    return false;
  }

  try {
    const payloadBuffer = Buffer.from(`${orderId}|${paymentId}`, 'utf8');
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payloadBuffer)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

/**
 * Validates Razorpay Webhook signature against raw request body bytes.
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
  secret?: string
): boolean {
  const webhookSecret = secret || RAZORPAY_WEBHOOK_SECRET;
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }

  try {
    const payloadBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadBuffer)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

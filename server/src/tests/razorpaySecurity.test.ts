import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} from '../config/razorpay';

describe('Razorpay Security & Anti-Tampering Suite', () => {
  const testOrderId = 'order_DA1234567890';
  const testPaymentId = 'pay_9876543210ABC';

  // Helper to generate legitimate HMAC SHA-256 signature
  const generateLegitSignature = (orderId: string, paymentId: string, secret: string) => {
    return crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  };

  it('successfully validates a legitimate Razorpay payment signature', () => {
    const signature = generateLegitSignature(testOrderId, testPaymentId, RAZORPAY_KEY_SECRET);
    const isValid = verifyPaymentSignature(testOrderId, testPaymentId, signature);
    assert.strictEqual(isValid, true, 'Valid HMAC signature must verify to true');
  });

  it('rejects tampered payment ID in payment verification (anti-spoofing)', () => {
    const signature = generateLegitSignature(testOrderId, testPaymentId, RAZORPAY_KEY_SECRET);
    const tamperedPaymentId = 'pay_HACKED_FAKE_999';
    const isValid = verifyPaymentSignature(testOrderId, tamperedPaymentId, signature);
    assert.strictEqual(isValid, false, 'Tampered payment ID must be rejected');
  });

  it('rejects tampered order ID in payment verification (replay protection)', () => {
    const signature = generateLegitSignature(testOrderId, testPaymentId, RAZORPAY_KEY_SECRET);
    const tamperedOrderId = 'order_CHEAP_ORDER_123';
    const isValid = verifyPaymentSignature(tamperedOrderId, testPaymentId, signature);
    assert.strictEqual(isValid, false, 'Tampered order ID must be rejected');
  });

  it('rejects completely fabricated or random signatures', () => {
    const fakeSignature = 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
    const isValid = verifyPaymentSignature(testOrderId, testPaymentId, fakeSignature);
    assert.strictEqual(isValid, false, 'Fabricated signature must fail verification');
  });

  it('safely handles malformed, empty, or mismatched length signatures without throwing', () => {
    assert.strictEqual(verifyPaymentSignature('', testPaymentId, 'abc'), false);
    assert.strictEqual(verifyPaymentSignature(testOrderId, '', 'abc'), false);
    assert.strictEqual(verifyPaymentSignature(testOrderId, testPaymentId, ''), false);
    assert.strictEqual(verifyPaymentSignature(testOrderId, testPaymentId, 'too_short'), false);
  });

  it('validates authentic Razorpay webhook raw payload signature', () => {
    const webhookPayload = JSON.stringify({
      event: 'order.paid',
      payload: {
        order: { entity: { id: testOrderId, amount: 250000, status: 'paid' } },
        payment: { entity: { id: testPaymentId, amount: 250000, status: 'captured' } },
      },
    });

    const legitWebhookSig = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(webhookPayload)
      .digest('hex');

    const isValid = verifyWebhookSignature(webhookPayload, legitWebhookSig, RAZORPAY_WEBHOOK_SECRET);
    assert.strictEqual(isValid, true, 'Legitimate webhook payload signature must verify');
  });

  it('rejects forged webhook payloads or modified bodies', () => {
    const originalPayload = JSON.stringify({ event: 'payment.authorized' });
    const forgedPayload = JSON.stringify({ event: 'order.paid' });

    const signature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(originalPayload)
      .digest('hex');

    const isValid = verifyWebhookSignature(forgedPayload, signature, RAZORPAY_WEBHOOK_SECRET);
    assert.strictEqual(isValid, false, 'Tampered webhook payload must be rejected');
  });

  it('strictly validates that Cash on Delivery (COD) is rejected as a payment method', () => {
    const allowedPaymentMethods = ['razorpay', 'upi', 'card', 'netbanking'];
    const forbiddenMethod = 'cod';

    assert.strictEqual(
      allowedPaymentMethods.includes(forbiddenMethod),
      false,
      'COD must not be included in allowed online payment methods'
    );
  });
});

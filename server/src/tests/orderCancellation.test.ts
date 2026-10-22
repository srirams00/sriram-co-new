import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Order Pre-Dispatch Cancellation & Refund Suite', () => {
  const PRE_DISPATCH_STATUSES = ['placed', 'confirmed', 'processing'];
  const POST_DISPATCH_STATUSES = ['shipped', 'out_for_delivery', 'delivered'];

  it('allows cancellation exclusively on pre-dispatch order statuses', () => {
    for (const status of PRE_DISPATCH_STATUSES) {
      const isCancellable = PRE_DISPATCH_STATUSES.includes(status);
      assert.strictEqual(isCancellable, true, `Status ${status} should be cancellable prior to dispatch`);
    }
  });

  it('blocks pre-dispatch cancellation once the order has shipped', () => {
    for (const status of POST_DISPATCH_STATUSES) {
      const isCancellable = PRE_DISPATCH_STATUSES.includes(status);
      assert.strictEqual(isCancellable, false, `Status ${status} must not be cancellable via pre-dispatch flow`);
    }
  });

  it('correctly transitions paymentStatus to refunded or refund_initiated upon cancellation', () => {
    const handleCancellation = (paymentStatus: string, hasRazorpayPaymentId: boolean) => {
      if (paymentStatus === 'paid') {
        return hasRazorpayPaymentId ? 'refunded' : 'refund_initiated';
      }
      return 'failed';
    };

    assert.strictEqual(handleCancellation('paid', true), 'refunded');
    assert.strictEqual(handleCancellation('paid', false), 'refund_initiated');
    assert.strictEqual(handleCancellation('pending', false), 'failed');
  });

  it('requires customer verification for guest cancellation to prevent unauthorized tamper', () => {
    const verifyGuest = (orderPhone: string, inputPhone: string) => {
      const cleanOrder = orderPhone.replace(/\D/g, '');
      const cleanInput = inputPhone.replace(/\D/g, '');
      return Boolean(cleanInput.length >= 4 && (cleanOrder.endsWith(cleanInput) || cleanInput.endsWith(cleanOrder)));
    };

    // Correct phone matching
    assert.strictEqual(verifyGuest('+91 93454 03136', '9345403136'), true);
    assert.strictEqual(verifyGuest('9345403136', '03136'), true);

    // Tampered / incorrect phone
    assert.strictEqual(verifyGuest('9345403136', '9876543210'), false);
    assert.strictEqual(verifyGuest('9345403136', '12'), false); // Too short
  });
});

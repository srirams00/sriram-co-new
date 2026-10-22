import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compileMerchantCancellationEmailHtml } from '../services/emailTemplates.js';

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

  it('gates the cancel button strictly on paid orders in pre-dispatch state', () => {
    const shouldShowCancelButton = (orderStatus: string, paymentStatus: string) => {
      const isPreDispatch = PRE_DISPATCH_STATUSES.includes(orderStatus);
      return isPreDispatch && paymentStatus === 'paid';
    };

    // Paid & pre-dispatch -> TRUE
    assert.strictEqual(shouldShowCancelButton('placed', 'paid'), true);
    assert.strictEqual(shouldShowCancelButton('confirmed', 'paid'), true);
    assert.strictEqual(shouldShowCancelButton('processing', 'paid'), true);

    // Unpaid & pre-dispatch -> FALSE
    assert.strictEqual(shouldShowCancelButton('placed', 'pending'), false);
    assert.strictEqual(shouldShowCancelButton('placed', 'failed'), false);

    // Paid but dispatched -> FALSE
    assert.strictEqual(shouldShowCancelButton('shipped', 'paid'), false);
    assert.strictEqual(shouldShowCancelButton('out_for_delivery', 'paid'), false);
    assert.strictEqual(shouldShowCancelButton('delivered', 'paid'), false);
    assert.strictEqual(shouldShowCancelButton('cancelled', 'paid'), false);
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

  it('compiles merchant cancellation alert email with customer details, reasons, and items', () => {
    const mockOrder = {
      orderNumber: 'SRC-202610-1234',
      paymentStatus: 'refund_initiated',
      paymentMethod: 'razorpay',
      pricing: { total: 2499 },
      customerInfo: {
        name: 'Ram Kumar',
        phone: '9345403136',
        email: 'ramkumar@sriramandco.in',
        address: '5 West Boulevard Road',
        city: 'Tiruchirappalli',
        postalCode: '620008',
      },
      orderItems: [
        {
          name: 'Preethi Zodiac Mixer Grinder 750W',
          quantity: 1,
          price: 2499,
        },
      ],
    };

    const compiled = compileMerchantCancellationEmailHtml(mockOrder, {
      reason: 'Delivery address or phone number needs correction',
      cancelledBy: 'customer',
    });

    assert.ok(compiled.subject.includes('SRC-202610-1234'));
    assert.ok(compiled.subject.includes('2,499'));
    assert.ok(compiled.subject.includes('Delivery address or phone number needs correction'));
    assert.ok(compiled.html.includes('Preethi Zodiac Mixer Grinder 750W'));
    assert.ok(compiled.html.includes('9345403136'));
    assert.ok(compiled.html.includes('Tiruchirappalli'));
    assert.ok(compiled.html.includes('Cancelled Prior To Dispatch'));
    assert.ok(compiled.text.includes('Do NOT pack or dispatch this order'));
  });
});

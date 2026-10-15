import { describe, it } from 'node:test';
import assert from 'node:assert';
import { compileOrderEmailHtml, EmailTemplateType } from '../services/emailTemplates';
import { sendEmail, sendOrderLifecycleEmail } from '../services/emailService';

describe('Transactional Email & Zoho Mail Suite', () => {
  const sampleOrder: any = {
    _id: '670000000000000000000001',
    orderNumber: 'SRC-948210-412',
    customerInfo: {
      name: 'Priya Ramanathan',
      phone: '+91 94431 27658',
      email: 'priya.test@example.com',
      address: '12, Gandhi Nagar, Thillai Nagar',
      city: 'Trichy',
      postalCode: '620018',
    },
    orderItems: [
      {
        product: '670000000000000000000002',
        name: 'Milton Thermosteel Flask 1000ml',
        price: 999,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300',
      },
      {
        product: '670000000000000000000003',
        name: 'Preethi Zodiac Mixer Grinder 750W',
        price: 7490,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300',
      },
    ],
    pricing: {
      subtotal: 9488,
      deliveryFee: 0,
      discount: 0,
      total: 9488,
    },
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    orderStatus: 'placed',
    razorpayOrderId: 'order_DA987654321',
    razorpayPaymentId: 'pay_9876543210ABC',
    createdAt: new Date('2026-10-15T10:30:00.000Z'),
  };

  it('compiles "placed" email template with correct subject and customer greeting', () => {
    const compiled = compileOrderEmailHtml(sampleOrder, 'placed');
    assert.strictEqual(compiled.subject.includes(sampleOrder.orderNumber), true);
    assert.strictEqual(compiled.html.includes('Priya'), true);
    assert.strictEqual(compiled.html.includes('Milton Thermosteel Flask'), true);
    assert.strictEqual(compiled.html.includes('33ARHPR6139B1ZX'), true);
    assert.strictEqual(compiled.html.includes('Sri Ram &amp; Co') || compiled.html.includes('Sri Ram & Co'), true);
  });

  it('compiles "confirmed" email template with store branch and delivery highlight', () => {
    const compiled = compileOrderEmailHtml(sampleOrder, 'confirmed');
    assert.strictEqual(compiled.subject.includes('confirmed'), true);
    assert.strictEqual(compiled.html.includes('Trichy store'), true);
    assert.strictEqual(compiled.html.includes('Expected delivery') || compiled.html.includes('Free'), true);
  });

  it('compiles "processing" email template with packing notice', () => {
    const compiled = compileOrderEmailHtml(sampleOrder, 'processing');
    assert.strictEqual(compiled.subject.includes('packing'), true);
    assert.strictEqual(compiled.html.includes('getting your order ready'), true);
  });

  it('compiles "out_for_delivery" email template with driver details and at-the-door checklist', () => {
    const driverData = {
      driverName: 'Murugan',
      driverPhone: '+91 94431 27658',
      deliveryWindow: 'today between 2 PM and 5 PM',
    };
    const compiled = compileOrderEmailHtml(sampleOrder, 'out_for_delivery', driverData);
    assert.strictEqual(compiled.subject.includes('on its way'), true);
    assert.strictEqual(compiled.html.includes('Murugan'), true);
    assert.strictEqual(compiled.html.includes('+91 94431 27658'), true);
    assert.strictEqual(compiled.html.includes('At the door'), true);
  });

  it('compiles "delivered" email template with 7-day replacement and warranty instructions', () => {
    const compiled = compileOrderEmailHtml(sampleOrder, 'delivered');
    assert.strictEqual(compiled.subject.includes('Delivered'), true);
    assert.strictEqual(compiled.html.includes('7-Day Store Replacement'), true);
    assert.strictEqual(compiled.html.includes('Keep Your GST Invoice'), true);
  });

  it('compiles "cancelled" email template with cancellation reason and refund SLA', () => {
    const cancelData = {
      cancellationReason: 'Customer requested change of delivery address',
      cancelledBy: 'customer' as const,
    };
    const compiled = compileOrderEmailHtml(sampleOrder, 'cancelled', cancelData);
    assert.strictEqual(compiled.subject.includes('cancelled'), true);
    assert.strictEqual(compiled.html.includes('Customer requested change'), true);
    assert.strictEqual(compiled.html.includes('5-7 working days') || compiled.html.includes('refund'), true);
  });

  it('safely dispatches in simulated mode when SMTP credentials are not active', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Verification Email',
      html: '<p>Testing email engine</p>',
      text: 'Testing email engine',
    });

    assert.strictEqual(typeof result.success, 'boolean');
    assert.strictEqual(result.success, true);
  });

  it('handles sendOrderLifecycleEmail without throwing even if customer email is missing', async () => {
    const anonymousOrder = { ...sampleOrder, customerInfo: { ...sampleOrder.customerInfo, email: '' } };
    const result = await sendOrderLifecycleEmail(anonymousOrder, 'placed');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'NO_RECIPIENT_EMAIL');
  });
});

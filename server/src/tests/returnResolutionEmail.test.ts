import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compileCustomerReturnResolutionEmailHtml } from '../services/emailTemplates.js';

describe('Customer Return Resolution Email Suite (TDD)', () => {
  const sampleOrder: any = {
    orderNumber: 'SRC-948210-412',
    customerInfo: {
      name: 'Priya Ramanathan',
      email: 'priya.test@example.com',
      phone: '+91 94431 27658',
      address: '12, Gandhi Nagar, Thillai Nagar',
      city: 'Trichy',
    },
    pricing: {
      total: 1850,
    },
  };

  it('compiles return "approved" email with courier pickup instructions and SLA', () => {
    const returnReq: any = {
      status: 'approved',
      item: {
        name: 'Cast Iron Dosa Tawa 12-inch',
        price: 1850,
      },
      reason: 'Defective or malfunctioning',
      faultDetails: 'Surface crack along handle seam',
      adminNotes: 'Courier pickup scheduled for tomorrow afternoon.',
    };

    const compiled = compileCustomerReturnResolutionEmailHtml(sampleOrder, returnReq);

    assert.ok(compiled.subject.includes('Approved'));
    assert.ok(compiled.subject.includes('SRC-948210-412'));
    assert.ok(compiled.html.includes('Priya'));
    assert.ok(compiled.html.includes('Cast Iron Dosa Tawa 12-inch'));
    assert.ok(compiled.html.includes('Courier pickup scheduled'));
    assert.ok(compiled.html.includes('reverse pickup'));
    assert.ok(compiled.text.includes('Approved'));
  });

  it('compiles return "rejected" email with store explanation and contact details', () => {
    const returnReq: any = {
      status: 'rejected',
      item: {
        name: 'Cast Iron Dosa Tawa 12-inch',
        price: 1850,
      },
      reason: 'Defective or malfunctioning',
      adminNotes: 'Physical damage due to unauthorized third-party tampering.',
    };

    const compiled = compileCustomerReturnResolutionEmailHtml(sampleOrder, returnReq);

    assert.ok(compiled.subject.includes('Update') || compiled.subject.includes('Rejected'));
    assert.ok(compiled.subject.includes('SRC-948210-412'));
    assert.ok(compiled.html.includes('Physical damage due to unauthorized'));
    assert.ok(compiled.html.includes('+91 93454 03136'));
    assert.ok(compiled.text.includes('Customer Support'));
  });

  it('compiles return "refunded" email with credit amount and bank processing window', () => {
    const returnReq: any = {
      status: 'refunded',
      item: {
        name: 'Cast Iron Dosa Tawa 12-inch',
        price: 1850,
      },
      reason: 'Defective or malfunctioning',
      adminNotes: 'Item inspected at Trichy hub. 100% refund initiated to original payment source.',
    };

    const compiled = compileCustomerReturnResolutionEmailHtml(sampleOrder, returnReq);

    assert.ok(compiled.subject.includes('Refunded') || compiled.subject.includes('Refund Credited'));
    assert.ok(compiled.subject.includes('SRC-948210-412'));
    assert.ok(compiled.html.includes('1850') || compiled.html.includes('₹1,850'));
    assert.ok(compiled.html.includes('original payment method'));
    assert.ok(compiled.text.includes('5-7 business days'));
  });
});

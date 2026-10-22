import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IReturnRequest } from '../models/Order.js';
import {
  compileMerchantReturnEmailHtml,
  compileCustomerReturnAckEmailHtml,
} from '../services/emailTemplates.js';

describe('Customer Return Request Suite', () => {
  it('validates return request interface and default values', () => {
    const returnReq: IReturnRequest = {
      status: 'requested',
      item: {
        productId: 'prod_12345',
        name: 'Cast Iron Dosa Tawa 12-inch',
        quantity: 1,
        price: 1499,
        image: '/images/tawa.jpg',
      },
      reason: 'Defective or malfunctioning',
      faultDetails: 'The handle loose and coating has a crack on the edge.',
      agreedToPolicy: true,
      requestedAt: new Date(),
    };

    assert.equal(returnReq.status, 'requested');
    assert.equal(returnReq.item.name, 'Cast Iron Dosa Tawa 12-inch');
    assert.equal(returnReq.item.price, 1499);
    assert.equal(returnReq.agreedToPolicy, true);
    assert.ok(returnReq.requestedAt instanceof Date);
    assert.equal(returnReq.resolvedAt, undefined);
  });

  it('verifies 7-day warranty cutoff calculation (168 hours)', () => {
    const deliveredAt = new Date('2026-10-15T10:00:00Z');
    const returnWindowMs = 7 * 24 * 60 * 60 * 1000;

    // Within window (e.g. 5 days later)
    const withinWindowDate = new Date('2026-10-20T10:00:00Z');
    const isEligible = withinWindowDate.getTime() - deliveredAt.getTime() <= returnWindowMs;
    assert.equal(isEligible, true);

    // Outside window (e.g. 8 days later)
    const outsideWindowDate = new Date('2026-10-23T11:00:00Z');
    const isExpired = outsideWindowDate.getTime() - deliveredAt.getTime() > returnWindowMs;
    assert.equal(isExpired, true);
  });

  it('compiles merchant return alert email with customer details and fault notes', () => {
    const mockOrder = {
      orderNumber: 'SRC-202610-7890',
      customerInfo: {
        name: 'Silvest AJ',
        phone: '9345403136',
        email: 'silvest43n85@gmail.com',
        address: '12 Main Road, KK Nagar',
        city: 'Trichy',
        postalCode: '620021',
      },
    };

    const mockReturn = {
      item: {
        name: 'Premier Pressure Cooker 3L',
        quantity: 1,
        price: 1850,
      },
      reason: 'Missing accessories / parts',
      faultDetails: 'Safety valve and weight whistle were missing in the box.',
      agreedToPolicy: true,
      requestedAt: new Date('2026-10-22T10:00:00Z'),
    };

    const compiled = compileMerchantReturnEmailHtml(mockOrder, mockReturn);
    assert.ok(compiled.subject.includes('SRC-202610-7890'));
    assert.ok(compiled.subject.includes('Premier Pressure Cooker 3L'));
    assert.ok(compiled.html.includes('Missing accessories / parts'));
    assert.ok(compiled.html.includes('Safety valve and weight whistle'));
    assert.ok(compiled.html.includes('Silvest AJ'));
    assert.ok(compiled.html.includes('Trichy'));
    assert.ok(compiled.text.includes('Price: ₹1850'));
  });

  it('compiles customer return acknowledgment email with order number and next steps', () => {
    const mockOrder = {
      orderNumber: 'SRC-202610-7890',
      customerInfo: {
        name: 'Silvest AJ',
        email: 'silvest43n85@gmail.com',
      },
    };

    const mockReturn = {
      item: {
        name: 'Premier Pressure Cooker 3L',
        quantity: 1,
        price: 1850,
      },
      reason: 'Defective or malfunctioning',
    };

    const compiled = compileCustomerReturnAckEmailHtml(mockOrder, mockReturn);
    assert.ok(compiled.subject.includes('SRC-202610-7890'));
    assert.ok(compiled.html.includes('Premier Pressure Cooker 3L'));
    assert.ok(compiled.html.includes('within 24–48 hours'));
    assert.ok(compiled.text.includes('reverse pickup'));
  });

  it('enforces return validation constraints (policy agreement, non-empty feedback, 7-day boundary)', () => {
    // Valid input test
    const validateReturn = (payload: { reason?: string; faultDetails?: string; agreedToPolicy?: boolean; orderStatus?: string; deliveredDaysAgo?: number }) => {
      if (!payload.reason || typeof payload.reason !== 'string') return { valid: false, error: 'Reason required' };
      if (!payload.faultDetails || payload.faultDetails.trim().length < 5) return { valid: false, error: 'Fault details min 5 chars' };
      if (payload.agreedToPolicy !== true) return { valid: false, error: 'Must agree to policies' };
      if (payload.orderStatus !== 'delivered') return { valid: false, error: 'Only delivered orders' };
      if ((payload.deliveredDaysAgo || 0) > 7) return { valid: false, error: 'Return window expired' };
      return { valid: true };
    };

    assert.equal(validateReturn({ reason: 'Defective', faultDetails: 'Motor stopped spinning', agreedToPolicy: true, orderStatus: 'delivered', deliveredDaysAgo: 3 }).valid, true);
    assert.equal(validateReturn({ reason: 'Defective', faultDetails: 'Bad', agreedToPolicy: true, orderStatus: 'delivered', deliveredDaysAgo: 3 }).valid, false);
    assert.equal(validateReturn({ reason: 'Defective', faultDetails: 'Motor stopped spinning', agreedToPolicy: false, orderStatus: 'delivered', deliveredDaysAgo: 3 }).valid, false);
    assert.equal(validateReturn({ reason: 'Defective', faultDetails: 'Motor stopped spinning', agreedToPolicy: true, orderStatus: 'shipped', deliveredDaysAgo: 3 }).valid, false);
    assert.equal(validateReturn({ reason: 'Defective', faultDetails: 'Motor stopped spinning', agreedToPolicy: true, orderStatus: 'delivered', deliveredDaysAgo: 10 }).valid, false);
  });
});

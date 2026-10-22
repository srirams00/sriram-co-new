import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleAdminReturnStatusUpdate } from '../routes/orderRoutes.js';

describe('Admin Return Status & Resolution Suite (TDD)', () => {
  it('approves a return request and updates resolution timestamp', async () => {
    const mockOrder: any = {
      orderNumber: 'SRC-RETURN-001',
      orderStatus: 'return_requested',
      paymentStatus: 'paid',
      returnRequest: {
        status: 'requested',
        reason: 'Defective item',
        faultDetails: 'Device does not power on',
        agreedToPolicy: true,
        requestedAt: new Date('2026-10-22T10:00:00Z'),
      },
    };

    const result = handleAdminReturnStatusUpdate(mockOrder, {
      status: 'approved',
      adminNotes: 'Inspection scheduled with courier partner.',
    });

    assert.equal(result.success, true);
    assert.equal(mockOrder.returnRequest.status, 'approved');
    assert.equal(mockOrder.returnRequest.adminNotes, 'Inspection scheduled with courier partner.');
    assert.ok(mockOrder.returnRequest.resolvedAt instanceof Date);
    assert.equal(mockOrder.orderStatus, 'return_requested');
  });

  it('rejects a return request and resets orderStatus to delivered', async () => {
    const mockOrder: any = {
      orderNumber: 'SRC-RETURN-002',
      orderStatus: 'return_requested',
      paymentStatus: 'paid',
      returnRequest: {
        status: 'requested',
        reason: 'Customer remorse',
        faultDetails: 'Customer damaged outer casing intentionally',
        agreedToPolicy: true,
        requestedAt: new Date('2026-10-22T10:00:00Z'),
      },
    };

    const result = handleAdminReturnStatusUpdate(mockOrder, {
      status: 'rejected',
      adminNotes: 'Physical damage caused by user mishandling, not covered under warranty.',
    });

    assert.equal(result.success, true);
    assert.equal(mockOrder.returnRequest.status, 'rejected');
    assert.equal(mockOrder.orderStatus, 'delivered');
    assert.ok(mockOrder.returnRequest.resolvedAt instanceof Date);
  });

  it('marks return as refunded and transitions orderStatus to returned with paymentStatus refunded', async () => {
    const mockOrder: any = {
      orderNumber: 'SRC-RETURN-003',
      orderStatus: 'return_requested',
      paymentStatus: 'paid',
      returnRequest: {
        status: 'picked_up',
        reason: 'Defective item',
        faultDetails: 'Damaged motor',
        agreedToPolicy: true,
        requestedAt: new Date('2026-10-20T10:00:00Z'),
      },
    };

    const result = handleAdminReturnStatusUpdate(mockOrder, {
      status: 'refunded',
      adminNotes: 'Item received at warehouse and verified defective. Full refund credited.',
    });

    assert.equal(result.success, true);
    assert.equal(mockOrder.returnRequest.status, 'refunded');
    assert.equal(mockOrder.orderStatus, 'returned');
    assert.equal(mockOrder.paymentStatus, 'refunded');
  });

  it('fails with clear error if order has no return request', () => {
    const mockOrder: any = {
      orderNumber: 'SRC-RETURN-004',
      orderStatus: 'delivered',
      paymentStatus: 'paid',
    };

    assert.throws(
      () => {
        handleAdminReturnStatusUpdate(mockOrder, { status: 'approved' });
      },
      {
        message: 'No return request exists for this order.',
      }
    );
  });

  it('rejects invalid return status transitions', () => {
    const mockOrder: any = {
      orderNumber: 'SRC-RETURN-005',
      orderStatus: 'return_requested',
      returnRequest: {
        status: 'requested',
      },
    };

    assert.throws(
      () => {
        handleAdminReturnStatusUpdate(mockOrder, { status: 'invalid_status' as any });
      },
      {
        message: 'Invalid return status transition.',
      }
    );
  });
});

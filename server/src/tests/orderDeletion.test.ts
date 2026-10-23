import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isOrderEligibleForDeletion } from '../routes/orderRoutes.js';

describe('Admin order deletion eligibility', () => {
  it('allows deletion only after an order is delivered', () => {
    assert.equal(isOrderEligibleForDeletion('delivered'), true);
  });

  it('blocks deletion for all other order statuses', () => {
    const nonDeliveredStatuses = [
      'placed',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'return_requested',
      'returned',
      'cancelled',
    ];

    for (const status of nonDeliveredStatuses) {
      assert.equal(isOrderEligibleForDeletion(status), false, `${status} orders must not be deletable`);
    }
  });
});

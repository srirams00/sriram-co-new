import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isCustomerAccountDeletable } from '../routes/authRoutes.js';

describe('Admin customer account deletion eligibility', () => {
  it('allows deleting customer accounts', () => {
    assert.equal(isCustomerAccountDeletable('customer'), true);
  });

  it('prevents deleting admin accounts', () => {
    assert.equal(isCustomerAccountDeletable('admin'), false);
  });
});

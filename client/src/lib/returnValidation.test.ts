import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RETURN_REASONS,
  validateReturnSubmission,
  isEligibleForReturn,
} from './returnValidation';

describe('Customer Return Validation Suite (Client TDD)', () => {
  it('defines the canonical return reason options', () => {
    assert.ok(Array.isArray(RETURN_REASONS));
    assert.ok(RETURN_REASONS.length >= 5);
    assert.ok(RETURN_REASONS.includes('Defective / Not Turning On'));
    assert.ok(RETURN_REASONS.includes('Damaged in Transit / Broken'));
    assert.ok(RETURN_REASONS.includes('Missing Parts / Accessories'));
    assert.ok(RETURN_REASONS.includes('Other (describe below)'));
  });

  it('determines return eligibility based on 3-day delivery cutoff', () => {
    const now = new Date();

    // 2 days ago -> eligible
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isEligibleForReturn(twoDaysAgo), true);

    // 3 days exact -> eligible
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isEligibleForReturn(threeDaysAgo), true);

    // 4 days ago -> expired / ineligible
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isEligibleForReturn(fourDaysAgo), false);

    // Missing date -> ineligible
    assert.equal(isEligibleForReturn(undefined), false);
  });

  it('validates a complete and legitimate return request form', () => {
    const validForm = {
      reason: 'Defective / Not Turning On',
      faultDetails: 'The indicator light does not power on after plugging into 220V outlet.',
      agreedToPolicy: true,
    };

    const result = validateReturnSubmission(validForm);
    assert.equal(result.isValid, true);
    assert.equal(Object.keys(result.errors).length, 0);
  });

  it('flags error when customer does not agree to terms & return policy', () => {
    const invalidForm = {
      reason: 'Defective / Not Turning On',
      faultDetails: 'Product arrived with broken handle.',
      agreedToPolicy: false,
    };

    const result = validateReturnSubmission(invalidForm);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.agreedToPolicy.includes('agree to the Terms'));
  });

  it('flags error when customer fault explanation is under 5 characters', () => {
    const invalidForm = {
      reason: 'Defective / Not Turning On',
      faultDetails: 'bad',
      agreedToPolicy: true,
    };

    const result = validateReturnSubmission(invalidForm);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.faultDetails.includes('at least 5 characters'));
  });

  it('flags error when reason is empty or not in allowed list', () => {
    const invalidForm = {
      reason: '',
      faultDetails: 'Motor making screeching noise upon initial operation.',
      agreedToPolicy: true,
    };

    const result = validateReturnSubmission(invalidForm);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.reason.includes('Please select a reason'));
  });
});

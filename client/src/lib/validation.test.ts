import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePhoneNumber,
  validateFullName,
  validateEmail,
  validateAddress,
  validateCity,
  validatePincode,
  validateCheckoutForm,
  cleanPhoneNumber,
  cleanPincode,
} from './validation.ts';

describe('Checkout Form Validation Suite', () => {
  describe('Phone Number Validation (Indian 10-digit mobile)', () => {
    it('validates a standard 10-digit phone number starting with 6, 7, 8, or 9', () => {
      const validNumbers = ['9876543210', '8765432109', '7654321098', '6543210987'];
      for (const num of validNumbers) {
        const result = validatePhoneNumber(num);
        assert.equal(result.isValid, true, `Expected ${num} to be valid`);
        assert.equal(result.error, null);
      }
    });

    it('handles phone numbers with +91 prefix, spaces, and hyphens', () => {
      const formatted = ['+91 98765 43210', '+91-9876543210', '09876543210', '98765-43210', '  9876543210  '];
      for (const num of formatted) {
        const result = validatePhoneNumber(num);
        assert.equal(result.isValid, true, `Expected ${num} to be valid`);
      }
    });

    it('rejects phone numbers with fewer than 10 digits', () => {
      const shortNumbers = ['123', '98765', '987654321'];
      for (const num of shortNumbers) {
        const result = validatePhoneNumber(num);
        assert.equal(result.isValid, false);
        assert.match(result.error || '', /10 digits/i);
      }
    });

    it('rejects phone numbers with more than 10 digits', () => {
      const longNumbers = ['98765432101', '987654321012345'];
      for (const num of longNumbers) {
        const result = validatePhoneNumber(num);
        assert.equal(result.isValid, false);
        assert.match(result.error || '', /10 digits/i);
      }
    });

    it('rejects phone numbers with letters or special characters', () => {
      const invalid = ['abcdefghij', '98765abcde', '98765#$@!%'];
      for (const num of invalid) {
        const result = validatePhoneNumber(num);
        assert.equal(result.isValid, false);
      }
    });

    it('rejects numbers starting with invalid digits (0-5)', () => {
      const invalidStarts = ['0123456789', '1234567890', '5555555555', '2345678901'];
      for (const num of invalidStarts) {
        const result = validatePhoneNumber(num);
        assert.equal(result.isValid, false);
      }
    });

    it('cleanPhoneNumber extracts the exact 10-digit number', () => {
      assert.equal(cleanPhoneNumber('+91 98765 43210'), '9876543210');
      assert.equal(cleanPhoneNumber('09876543210'), '9876543210');
      assert.equal(cleanPhoneNumber('98765-43210'), '9876543210');
    });
  });

  describe('Full Name Validation', () => {
    it('accepts valid customer names', () => {
      assert.equal(validateFullName('Ramesh Kumar').isValid, true);
      assert.equal(validateFullName('S. Ramasamy').isValid, true);
      assert.equal(validateFullName('Anitha').isValid, true);
    });

    it('rejects empty or whitespace-only names', () => {
      assert.equal(validateFullName('').isValid, false);
      assert.equal(validateFullName('   ').isValid, false);
    });

    it('rejects single character names', () => {
      assert.equal(validateFullName('A').isValid, false);
    });
  });

  describe('PIN Code Validation (Indian Postal Code)', () => {
    it('accepts valid 6-digit pincodes', () => {
      assert.equal(validatePincode('620002').isValid, true);
      assert.equal(validatePincode('600015').isValid, true);
      assert.equal(validatePincode('620014').isValid, true);
    });

    it('rejects pincodes that are not 6 digits', () => {
      assert.equal(validatePincode('6200').isValid, false);
      assert.equal(validatePincode('6200021').isValid, false);
      assert.equal(validatePincode('').isValid, false);
    });

    it('rejects pincodes with non-numeric characters', () => {
      assert.equal(validatePincode('62000a').isValid, false);
    });

    it('rejects pincodes starting with 0', () => {
      assert.equal(validatePincode('020002').isValid, false);
    });

    it('cleanPincode keeps only digits up to 6 chars', () => {
      assert.equal(cleanPincode('620 002'), '620002');
      assert.equal(cleanPincode('62000299'), '620002');
    });
  });

  describe('Email Validation (Optional field)', () => {
    it('accepts empty email since it is optional', () => {
      assert.equal(validateEmail('').isValid, true);
      assert.equal(validateEmail('   ').isValid, true);
    });

    it('accepts well-formed email addresses', () => {
      assert.equal(validateEmail('customer@gmail.com').isValid, true);
      assert.equal(validateEmail('ramesh.kumar@sriramandco.in').isValid, true);
    });

    it('rejects malformed email addresses', () => {
      assert.equal(validateEmail('notanemail').isValid, false);
      assert.equal(validateEmail('test@').isValid, false);
      assert.equal(validateEmail('test@com').isValid, false);
    });
  });

  describe('Delivery Address Validation', () => {
    it('accepts complete addresses with street and landmark', () => {
      assert.equal(validateAddress('No. 11, Vinola Complex, Thanjai Main Road').isValid, true);
    });

    it('rejects short or empty address', () => {
      assert.equal(validateAddress('').isValid, false);
      assert.equal(validateAddress('Trichy').isValid, false); // Less than 10 characters
    });
  });

  describe('City or Region Validation', () => {
    it('accepts a city or region entered by the customer', () => {
      assert.equal(validateCity('Chennai').isValid, true);
      assert.equal(validateCity('  Coimbatore  ').isValid, true);
    });

    it('rejects an empty or whitespace-only city or region', () => {
      assert.equal(validateCity('').isValid, false);
      assert.equal(validateCity('   ').isValid, false);
    });
  });

  describe('Full Checkout Form Validator', () => {
    it('returns valid when all fields meet requirements', () => {
      const validForm = {
        fullName: 'Ramesh Kumar',
        phone: '9876543210',
        email: 'ramesh@example.com',
        address: 'No 15, Thillai Nagar 5th Cross',
        city: 'Trichy',
        pincode: '620018',
      };
      const result = validateCheckoutForm(validForm);
      assert.equal(result.isValid, true);
      assert.equal(Object.keys(result.errors).length, 0);
    });

    it('accumulates field-specific errors when inputs are invalid', () => {
      const invalidForm = {
        fullName: '',
        phone: '12345',
        email: 'bad-email',
        address: 'Short',
        city: '',
        pincode: 'abc',
      };
      const result = validateCheckoutForm(invalidForm);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.fullName);
      assert.ok(result.errors.phone);
      assert.ok(result.errors.email);
      assert.ok(result.errors.address);
      assert.ok(result.errors.city);
      assert.ok(result.errors.pincode);
    });
  });
});

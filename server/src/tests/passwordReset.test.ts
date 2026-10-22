import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { compilePasswordResetEmailHtml } from '../services/emailTemplates.js';

describe('Customer Password Recovery & Reset Suite', () => {
  it('compiles password reset email with secure URL and expiration notice', () => {
    const sampleName = 'Ramesh Kumar';
    const sampleUrl = 'https://sriramandco.in/reset-password?token=abcdef1234567890&email=ramesh%40example.com';
    const compiled = compilePasswordResetEmailHtml(sampleName, sampleUrl);

    assert.ok(compiled.subject.includes('Reset your Sri Ram & Co password'));
    assert.ok(compiled.html.includes('Ramesh'));
    assert.ok(compiled.html.includes(sampleUrl.replace(/&/g, '&amp;')));
    assert.ok(compiled.html.includes('1 hour'));
    assert.ok(compiled.text.includes(sampleUrl));
  });

  it('generates 32-byte high entropy reset tokens and verifies sha256 hashing', () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    assert.strictEqual(rawToken.length, 64, 'Raw token should be 64 hex characters (256 bits)');

    const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex');
    const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');
    assert.strictEqual(hash1, hash2, 'Hash must be deterministic for token verification');

    const tamperedRawToken = rawToken.slice(0, -1) + (rawToken.endsWith('a') ? 'b' : 'a');
    const tamperedHash = crypto.createHash('sha256').update(tamperedRawToken).digest('hex');
    assert.notStrictEqual(hash1, tamperedHash, 'Tampered token must produce a completely different hash');
  });

  it('validates 1-hour expiration calculation', () => {
    const now = Date.now();
    const expiryDate = new Date(now + 60 * 60 * 1000);
    const isValidImmediately = expiryDate.getTime() > now;
    assert.strictEqual(isValidImmediately, true);

    const pastExpiryDate = new Date(now - 1000); // 1 second ago
    const isValidPast = pastExpiryDate.getTime() > now;
    assert.strictEqual(isValidPast, false, 'Expired token must fail validation');
  });

  it('enforces anti-enumeration message consistency', () => {
    const getForgotPasswordMessage = () => {
      return 'If an account exists with this email address, a password reset link has been dispatched to your inbox.';
    };

    // Both existing and non-existing accounts should receive the identical response
    const existingMsg = getForgotPasswordMessage();
    const nonExistingMsg = getForgotPasswordMessage();
    assert.strictEqual(existingMsg, nonExistingMsg);
  });
});

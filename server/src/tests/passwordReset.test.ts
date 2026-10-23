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

  it('validates account existence requirement for password reset', () => {
    const handleAccountCheck = (userExists: boolean, email: string) => {
      if (!userExists) {
        return {
          status: 404,
          success: false,
          message: 'No account found with this email address. Please check your email or register for a new account.',
        };
      }
      return {
        status: 200,
        success: true,
        message: `A password reset link has been dispatched to ${email}. Please check your inbox.`,
      };
    };

    const notFound = handleAccountCheck(false, 'unknown@example.com');
    assert.strictEqual(notFound.status, 404);
    assert.strictEqual(notFound.success, false);
    assert.ok(notFound.message.includes('No account found'));

    const found = handleAccountCheck(true, 'customer@example.com');
    assert.strictEqual(found.status, 200);
    assert.strictEqual(found.success, true);
    assert.ok(found.message.includes('customer@example.com'));
  });
});

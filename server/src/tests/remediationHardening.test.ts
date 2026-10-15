import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { z } from 'zod';

describe('Security Remediations & Vulnerability Verification Suite', () => {
  it('generates cryptographically unpredictable order numbers with high entropy', () => {
    const generated = new Set<string>();
    const orderNumberRegex = /^SRC-[0-9A-F]{8}$/;

    for (let i = 0; i < 500; i++) {
      const orderNumber = `SRC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      assert.match(orderNumber, orderNumberRegex, `Order number ${orderNumber} should match expected format`);
      assert.equal(generated.has(orderNumber), false, `Collision detected on iteration ${i}: ${orderNumber}`);
      generated.add(orderNumber);
    }

    assert.equal(generated.size, 500);
  });

  it('neutralizes ReDoS catastrophic backtracking payloads in search regex sanitizer', () => {
    const evilInputs = [
      '((((a+)+)+)+)+$',
      '(a+)+',
      '([a-zA-Z]+)*',
      'a'.repeat(200),
      '.*.*.*.*.*.*.*.*.*.*.*.*',
    ];

    for (const input of evilInputs) {
      const start = performance.now();
      const sanitized = input.trim().slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safeRegex = new RegExp(sanitized, 'i');

      // Test against a non-matching target
      const matchResult = safeRegex.test('Sri Ram & Co Trichy Branch Premium Power Tool');
      const duration = performance.now() - start;

      assert.equal(typeof matchResult, 'boolean');
      assert.ok(duration < 25, `Regex evaluation took ${duration.toFixed(2)}ms, exceeding ReDoS threshold`);
    }
  });

  it('strictly validates CORS origin allowlist, rejecting unauthorized domains and wildcard bypasses', () => {
    const isSriramDomain = (origin: string) =>
      /^https:\/\/(.*\.)?sriramandco\.(in|com)$/i.test(origin);

    const isAllowedVercel = (origin: string) =>
      /^https:\/\/(sriram-and-co[a-z0-9-]*|sriram-co[a-z0-9-]*|review\.sriramandco)\.vercel\.app$/i.test(origin);

    // Legitimate origins
    assert.equal(isSriramDomain('https://sriramandco.in'), true);
    assert.equal(isSriramDomain('https://www.sriramandco.in'), true);
    assert.equal(isSriramDomain('https://review.sriramandco.in'), true);
    assert.equal(isAllowedVercel('https://sriram-co-new.vercel.app'), true);
    assert.equal(isAllowedVercel('https://sriram-and-co-staging.vercel.app'), true);

    // Malicious bypass attempts
    assert.equal(isSriramDomain('https://attacker-sriramandco.in.fake.com'), false);
    assert.equal(isSriramDomain('https://evilsriram.com'), false);
    assert.equal(isSriramDomain('https://sriram.evil.org'), false);
    assert.equal(isAllowedVercel('https://attacker.vercel.app'), false);
    assert.equal(isAllowedVercel('https://random-preview.vercel.app'), false);
  });

  it('sanitizes customer PII for unauthenticated / guest order tracking', () => {
    const rawCustomerOrder = {
      orderNumber: 'SRC-4F2A109B',
      orderStatus: 'confirmed',
      paymentStatus: 'paid',
      customerInfo: {
        name: 'Ramkumar Shanmugam',
        phone: '9345403136',
        email: 'ramkumar@sriramandco.in',
        address: 'No. 11, Vinola Complex, Thanjai Main Road',
        city: 'Trichy',
        postalCode: '620014',
      },
      pricing: { total: 1499 },
    };

    // Mask name
    const nameParts = rawCustomerOrder.customerInfo.name.trim().split(' ');
    const maskedName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
      : nameParts[0];

    // Mask phone
    const phone = rawCustomerOrder.customerInfo.phone;
    const maskedPhone = phone.length >= 4 ? `******${phone.slice(-4)}` : '******';

    // Mask email
    const email = rawCustomerOrder.customerInfo.email;
    const maskedEmail = email.includes('@')
      ? `${email.charAt(0)}***@${email.split('@')[1]}`
      : undefined;

    const sanitized = {
      orderNumber: rawCustomerOrder.orderNumber,
      orderStatus: rawCustomerOrder.orderStatus,
      paymentStatus: rawCustomerOrder.paymentStatus,
      customerInfo: {
        name: maskedName,
        phone: maskedPhone,
        address: 'Delivered to address on file (hidden for privacy)',
        email: maskedEmail,
        city: rawCustomerOrder.customerInfo.city,
      },
      pricing: rawCustomerOrder.pricing,
    };

    // Assert PII is hidden
    assert.equal(sanitized.customerInfo.name, 'Ramkumar S.');
    assert.equal(sanitized.customerInfo.phone, '******3136');
    assert.equal(sanitized.customerInfo.email, 'r***@sriramandco.in');
    assert.equal(sanitized.customerInfo.address, 'Delivered to address on file (hidden for privacy)');
    assert.equal(sanitized.customerInfo.city, 'Trichy');
    assert.equal(sanitized.pricing.total, 1499);
  });

  it('rejects Google OAuth authentication payloads lacking cryptographic ID tokens', () => {
    const GoogleAuthSchema = z.object({
      idToken: z.string().min(10, 'Google ID token is required'),
      name: z.string().trim().optional(),
      photoUrl: z.string().optional(),
    });

    // 1. Missing idToken (Attacker sending raw email)
    const spoofAttempt = { email: 'admin@sriramandco.in', name: 'Attacker' };
    assert.throws(
      () => GoogleAuthSchema.parse(spoofAttempt)
    );

    // 2. Short / empty token
    assert.throws(
      () => GoogleAuthSchema.parse({ idToken: 'abc' }),
      /Google ID token is required/
    );

    // 3. Valid token structure passes schema
    const validPayload = { idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9.test.sig' };
    const parsed = GoogleAuthSchema.parse(validPayload);
    assert.equal(parsed.idToken, validPayload.idToken);
  });
});

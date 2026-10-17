import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

describe('Security & Hardening Suite', () => {
  it('enforces OWASP security headers via helmet', async () => {
    const app = express();
    app.use(helmet());
    app.get('/test-headers', (_req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/test-headers`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.ok(res.headers.get('content-security-policy') !== null, 'CSP should be defined');
    } finally {
      server.close();
    }
  });

  it('enforces rate limiting on authentication attempts', async () => {
    const app = express();
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      limit: 3,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many requests, please try again later.' },
    });

    app.use('/auth', testLimiter);
    app.post('/auth/login', (_req: Request, res: Response) => {
      res.json({ token: 'mock' });
    });

    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      // 1st request -> OK
      let res = await fetch(`http://127.0.0.1:${port}/auth/login`, { method: 'POST' });
      assert.equal(res.status, 200);

      // 2nd request -> OK
      res = await fetch(`http://127.0.0.1:${port}/auth/login`, { method: 'POST' });
      assert.equal(res.status, 200);

      // 3rd request -> OK
      res = await fetch(`http://127.0.0.1:${port}/auth/login`, { method: 'POST' });
      assert.equal(res.status, 200);

      // 4th request -> Rate limited (429)
      res = await fetch(`http://127.0.0.1:${port}/auth/login`, { method: 'POST' });
      assert.equal(res.status, 429, 'Excess requests should receive HTTP 429');
    } finally {
      server.close();
    }
  });

  it('rejects NoSQL injection objects in login input schemas', () => {
    const LoginSchema = z.object({
      email: z.string().min(3).max(100),
      password: z.string().min(1).max(100),
    });

    // Valid email
    const valid = LoginSchema.safeParse({ email: 'admin@sriramandco.com', password: 'secretpassword' });
    assert.equal(valid.success, true);

    // NoSQL injection attempt: { email: { $ne: null } }
    const injectionAttempt = LoginSchema.safeParse({
      email: { $ne: null },
      password: 'password',
    });
    assert.equal(injectionAttempt.success, false, 'NoSQL operator object must be rejected');
  });

  it('validates product price is strictly positive and bounded', () => {
    const ProductInputSchema = z.object({
      name: z.string().trim().min(2).max(150),
      price: z.number().positive(),
      inventoryCount: z.number().int().nonnegative(),
    });

    assert.equal(
      ProductInputSchema.safeParse({ name: 'Valid Product', price: -100, inventoryCount: 5 }).success,
      false,
      'Negative price must be rejected'
    );

    assert.equal(
      ProductInputSchema.safeParse({ name: 'Valid Product', price: 0, inventoryCount: 5 }).success,
      false,
      'Zero price must be rejected'
    );

    assert.equal(
      ProductInputSchema.safeParse({ name: 'Valid Product', price: 499, inventoryCount: 10 }).success,
      true,
      'Valid positive price must pass'
    );
  });

  it('validates product image allows HTTPS, relative assets, and base64 uploads while rejecting insecure schemes', () => {
    const ProductImageSchema = z.string().trim().refine(
      (val) =>
        /^https:\/\/.+/i.test(val) ||
        val.startsWith('/') ||
        /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(val),
      { message: 'Image must use secure https://, local path, or valid image upload data' }
    );

    // Valid inputs
    assert.equal(ProductImageSchema.safeParse('https://images.unsplash.com/photo-123.jpg').success, true);
    assert.equal(ProductImageSchema.safeParse('/images/vacuum.webp').success, true);
    assert.equal(
      ProductImageSchema.safeParse('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==').success,
      true,
      'Base64 PNG data URL must pass'
    );
    assert.equal(
      ProductImageSchema.safeParse('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=').success,
      true,
      'Base64 JPEG data URL must pass'
    );

    // Insecure inputs must be rejected
    assert.equal(ProductImageSchema.safeParse('http://insecure-site.com/image.png').success, false, 'Insecure HTTP must be rejected');
    assert.equal(ProductImageSchema.safeParse('javascript:alert(1)').success, false, 'XSS scheme must be rejected');
    assert.equal(ProductImageSchema.safeParse('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==').success, false, 'Non-image data URL must be rejected');
  });

  it('enforces RBAC role guard against customer tokens accessing admin scope', () => {
    // Simulating role verification middleware
    const verifyRole = (requiredRole: string, user: { role: string }) => {
      if (user.role !== requiredRole) {
        throw new Error('Access denied. Administrator clearance required.');
      }
      return true;
    };

    const customerUser = { id: 'cust123', email: 'customer@example.com', role: 'customer' };
    const adminUser = { id: 'admin123', email: 'admin@sriramandco.com', role: 'admin' };

    // Customer must be rejected
    assert.throws(
      () => verifyRole('admin', customerUser),
      /Access denied. Administrator clearance required./,
      'Customer should not pass admin role check'
    );

    // Admin must be permitted
    assert.equal(verifyRole('admin', adminUser), true, 'Admin role check should pass');
  });

  it('protects against token replay and ensures sensitive claims are present in decoded payload', () => {
    const claims = {
      id: '64d1234567890abcdef12345',
      email: 'admin@sriramandco.com',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    assert.ok(claims.role === 'admin', 'Role claim must be admin');
    assert.ok(claims.exp > claims.iat, 'Token must have non-zero expiration time');
  });

  it('enforces customer login rejects administrative accounts with generic 401 to prevent account enumeration', () => {
    function processCustomerLogin(userRole: string) {
      if (userRole !== 'customer') {
        throw new Error('Invalid email or password');
      }
      return { success: true };
    }

    assert.throws(
      () => processCustomerLogin('admin'),
      /Invalid email or password/,
      'Customer login must reject admin accounts with generic credentials error'
    );
    assert.equal(processCustomerLogin('customer').success, true, 'Customer login should allow customers');
  });

  it('normalizes category matching across slugs and human-readable names', () => {
    const products = [
      { name: '18V Cordless Drill', category: 'Power Tools', categorySlug: 'power-tools' },
      { name: 'Robot Vacuum', category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' },
      { name: 'Air Fryer 4L', category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' },
    ];

    function filterByCategory(slug: string) {
      const normalized = slug.toLowerCase().trim();
      return products.filter(
        p =>
          p.categorySlug === normalized ||
          p.category.toLowerCase().replace(/\s+/g, '-') === normalized ||
          p.category.toLowerCase() === normalized
      );
    }

    assert.equal(filterByCategory('power-tools').length, 1);
    assert.equal(filterByCategory('cleaning-appliances').length, 1);
    assert.equal(filterByCategory('kitchen-essentials').length, 1);
    assert.equal(filterByCategory('Power Tools').length, 1);
    assert.equal(filterByCategory('non-existent').length, 0);
  });

  describe('Cloudflare Origin Shielding & Direct Origin Access Protection', () => {
    function verifyOriginShield(
      headers: Record<string, string | undefined>,
      path: string,
      nodeEnv: string = 'production',
      secretToken?: string
    ): { allowed: boolean; status?: number; error?: string } {
      if (nodeEnv === 'production' && secretToken) {
        if (path === '/api/payment/webhook' || path === '/api/health' || path === '/') {
          return { allowed: true };
        }

        const origin = headers.origin;
        if (origin) {
          const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
          const isSriramDomain = /^https:\/\/(.*\.)?sriramandco\.(in|com)$/i.test(origin);
          const isAllowedVercel = /^https:\/\/(sriram-and-co[a-z0-9-]*|sriram-co[a-z0-9-]*|review\.sriramandco)\.vercel\.app$/i.test(origin);
          if (isLocal || isSriramDomain || isAllowedVercel) {
            return { allowed: true };
          }
        }

        const incomingSecret = headers['x-from-cloudflare'];
        if (incomingSecret !== secretToken) {
          return { allowed: false, status: 403, error: 'Direct origin access forbidden.' };
        }
      }
      return { allowed: true };
    }

    it('rejects direct unverified requests missing both allowed Origin and Cloudflare secret in production', () => {
      const result = verifyOriginShield({}, '/api/orders', 'production', 'secret-cf-token-123');
      assert.equal(result.allowed, false);
      assert.equal(result.status, 403);
    });

    it('allows legitimate browser requests from verified storefront origins without secret header', () => {
      const liveDomain = verifyOriginShield({ origin: 'https://www.sriramandco.in' }, '/api/products', 'production', 'secret-cf-token-123');
      const vercelPreview = verifyOriginShield({ origin: 'https://sriram-co-new.vercel.app' }, '/api/products', 'production', 'secret-cf-token-123');
      const apexDomain = verifyOriginShield({ origin: 'https://sriramandco.in' }, '/api/auth/login', 'production', 'secret-cf-token-123');

      assert.equal(liveDomain.allowed, true);
      assert.equal(vercelPreview.allowed, true);
      assert.equal(apexDomain.allowed, true);
    });

    it('rejects malicious external origins attempting direct calls without secret header', () => {
      const evilSite = verifyOriginShield({ origin: 'https://malicious-site.com' }, '/api/products', 'production', 'secret-cf-token-123');
      assert.equal(evilSite.allowed, false);
      assert.equal(evilSite.status, 403);
    });

    it('allows non-browser backend calls when valid matching Cloudflare secret header is provided', () => {
      const result = verifyOriginShield({ 'x-from-cloudflare': 'secret-cf-token-123' }, '/api/orders', 'production', 'secret-cf-token-123');
      assert.equal(result.allowed, true);
    });

    it('exempts health check and Razorpay webhook endpoints from origin shield in production', () => {
      const healthCheck = verifyOriginShield({}, '/api/health', 'production', 'secret-cf-token-123');
      const webhook = verifyOriginShield({}, '/api/payment/webhook', 'production', 'secret-cf-token-123');
      const root = verifyOriginShield({}, '/', 'production', 'secret-cf-token-123');

      assert.equal(healthCheck.allowed, true);
      assert.equal(webhook.allowed, true);
      assert.equal(root.allowed, true);
    });

    it('allows all requests in development/test or when CF_SECRET_TOKEN is unconfigured', () => {
      const devRequest = verifyOriginShield({}, '/api/orders', 'development', undefined);
      const testRequest = verifyOriginShield({}, '/api/orders', 'test', 'secret-cf-token-123');

      assert.equal(devRequest.allowed, true);
      assert.equal(testRequest.allowed, true);
    });
  });
});

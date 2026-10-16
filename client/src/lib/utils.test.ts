import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  calculateDiscount,
  getEffectiveOriginalPrice,
  getWhatsAppUrl,
  getOptimizedImageUrl,
} from './utils.ts';

describe('Client Utility Suite (Low Priority Coverage)', () => {
  describe('formatCurrency', () => {
    it('formats positive integers to Indian Rupee representation without decimals', () => {
      const formatted = formatCurrency(14499);
      // Clean non-breaking spaces for robust cross-environment assertion
      const normalized = formatted.replace(/\u00a0/g, ' ').replace(/\s+/g, '');
      assert.ok(normalized.includes('₹14,499') || normalized.includes('14,499'), `Unexpected format: ${formatted}`);
    });

    it('formats zero correctly', () => {
      const formatted = formatCurrency(0);
      const normalized = formatted.replace(/\u00a0/g, ' ').replace(/\s+/g, '');
      assert.ok(normalized.includes('₹0') || normalized.includes('0'), `Unexpected format: ${formatted}`);
    });

    it('rounds decimal values to whole rupees', () => {
      const formatted = formatCurrency(499.75);
      const normalized = formatted.replace(/\u00a0/g, ' ').replace(/\s+/g, '');
      assert.ok(normalized.includes('500'), `Expected rounded 500, got: ${formatted}`);
    });
  });

  describe('calculateDiscount', () => {
    it('calculates the exact rounded percentage discount', () => {
      assert.equal(calculateDiscount(800, 1000), 20); // 20% off
      assert.equal(calculateDiscount(1499, 1999), 25); // ~25% off
    });

    it('returns 0 when original price is not provided or zero', () => {
      assert.equal(calculateDiscount(500), 0);
      assert.equal(calculateDiscount(500, 0), 0);
    });

    it('returns 0 when original price is equal to or less than current price', () => {
      assert.equal(calculateDiscount(500, 500), 0);
      assert.equal(calculateDiscount(600, 500), 0);
    });
  });

  describe('getEffectiveOriginalPrice', () => {
    it('preserves existing explicit originalPrice when greater than price', () => {
      assert.equal(getEffectiveOriginalPrice(14499, 18999), 18999);
      assert.equal(getEffectiveOriginalPrice(2700, 3499), 3499);
    });

    it('derives authentic retail MRP when originalPrice is missing or equal to price', () => {
      const derivedUnder150 = getEffectiveOriginalPrice(99, 99);
      assert.ok(derivedUnder150 > 99, `Expected MRP > 99, got ${derivedUnder150}`);

      const derivedMid = getEffectiveOriginalPrice(2700, 2700);
      assert.ok(derivedMid > 2700, `Expected MRP > 2700, got ${derivedMid}`);

      const derivedHigh = getEffectiveOriginalPrice(6000);
      assert.ok(derivedHigh > 6000, `Expected MRP > 6000, got ${derivedHigh}`);
    });
  });

  describe('getWhatsAppUrl', () => {
    it('generates a WhatsApp link with clean default phone and encoded welcome text', () => {
      const url = getWhatsAppUrl();
      assert.ok(url.startsWith('https://wa.me/919443212345?text='));
      assert.ok(url.includes(encodeURIComponent('Hello Sriram & Co!')));
    });

    it('cleans non-numeric characters from custom phone numbers', () => {
      const url = getWhatsAppUrl('+91 (934) 540-3136', 'Need assistance with order');
      assert.ok(url.startsWith('https://wa.me/919345403136?text='));
      assert.ok(url.includes(encodeURIComponent('Need assistance with order')));
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('falls back to default /logo.webp when no url is passed', () => {
      assert.equal(getOptimizedImageUrl(), '/logo.webp');
      assert.equal(getOptimizedImageUrl(''), '/logo.webp');
    });

    it('transforms Cloudinary images to modern webp/f_auto with width constraints', () => {
      const rawCloudinary = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const transformed = getOptimizedImageUrl(rawCloudinary, 800);
      assert.equal(
        transformed,
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/sample.jpg'
      );
    });

    it('preserves Cloudinary images that already contain f_auto,q_auto', () => {
      const alreadyOptimized = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/sample.jpg';
      assert.equal(getOptimizedImageUrl(alreadyOptimized, 800), alreadyOptimized);
    });

    it('appends auto-format parameters to Unsplash image URLs', () => {
      const rawUnsplash = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?ixlib=rb-4.0.3';
      const optimized = getOptimizedImageUrl(rawUnsplash, 400);
      assert.equal(
        optimized,
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
      );
    });

    it('maps legacy static PNG/JPEG references to modern WebP assets', () => {
      assert.equal(getOptimizedImageUrl('/logo.png'), '/logo.webp');
      assert.equal(getOptimizedImageUrl('/mop.jpeg'), '/mop.webp');
      assert.equal(getOptimizedImageUrl('/fan.jpeg'), '/fan.webp');
    });

    it('leaves standard custom external URLs untouched', () => {
      const externalUrl = 'https://example.com/products/item.webp';
      assert.equal(getOptimizedImageUrl(externalUrl), externalUrl);
    });
  });
});

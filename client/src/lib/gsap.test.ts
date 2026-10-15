import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isReducedMotion, gsap } from './gsap';

describe('GSAP Motion Utility Suite', () => {
  it('should export a valid gsap instance', () => {
    assert.ok(gsap);
    assert.equal(typeof gsap.to, 'function');
    assert.equal(typeof gsap.timeline, 'function');
  });

  it('isReducedMotion returns false when window is undefined (SSR environment)', () => {
    assert.equal(isReducedMotion(), false);
  });
});

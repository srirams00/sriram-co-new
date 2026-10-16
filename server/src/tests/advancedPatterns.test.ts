import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryCacheService } from '../utils/cacheService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Container } from '../core/container.js';
import { runInTransaction } from '../config/db.js';

describe('Node.js Advanced Patterns Suite', () => {
  describe('In-Memory TTL Cache Engine (MemoryCacheService)', () => {
    it('stores and retrieves cached entries before expiration', () => {
      const cache = new MemoryCacheService();
      cache.set('test-key', { name: 'Sriram Stainless Kettle' }, 10);

      const retrieved = cache.get<{ name: string }>('test-key');
      assert.deepEqual(retrieved, { name: 'Sriram Stainless Kettle' });
    });

    it('returns null and evicts entry after TTL has expired', async () => {
      const cache = new MemoryCacheService();
      // Set short TTL: -1 seconds (already expired)
      cache.set('expired-key', 'stale value', -1);

      const retrieved = cache.get('expired-key');
      assert.equal(retrieved, null, 'Expired cache entry must return null');
    });

    it('invalidates cache keys matching a specific prefix pattern', () => {
      const cache = new MemoryCacheService();
      cache.set('products:featured', [1, 2, 3], 60);
      cache.set('products:best-sellers', [4, 5], 60);
      cache.set('categories:all', ['kitchen', 'home'], 60);

      assert.equal(cache.size(), 3);

      const evicted = cache.invalidatePattern('products:');
      assert.equal(evicted, 2, 'Should evict exactly 2 product keys');
      assert.equal(cache.get('products:featured'), null);
      assert.equal(cache.get('products:best-sellers'), null);
      assert.notEqual(cache.get('categories:all'), null, 'categories cache must remain intact');
    });

    it('clears all cached entries on clear()', () => {
      const cache = new MemoryCacheService();
      cache.set('k1', 'v1');
      cache.set('k2', 'v2');
      cache.clear();
      assert.equal(cache.size(), 0);
      assert.equal(cache.get('k1'), null);
    });
  });

  describe('Standardized API Response Envelopes (ApiResponse)', () => {
    it('creates standard success envelope with timestamp and meta', () => {
      let statusCode = 0;
      let jsonPayload: any = null;

      const mockRes: any = {
        status: (code: number) => {
          statusCode = code;
          return mockRes;
        },
        json: (data: any) => {
          jsonPayload = data;
          return mockRes;
        },
      };

      ApiResponse.success(mockRes, { orderId: 'SRC-101' }, { source: 'database' }, 201);

      assert.equal(statusCode, 201);
      assert.equal(jsonPayload.success, true);
      assert.deepEqual(jsonPayload.data, { orderId: 'SRC-101' });
      assert.deepEqual(jsonPayload.meta, { source: 'database' });
      assert.ok(typeof jsonPayload.timestamp === 'string');
    });

    it('calculates pagination arithmetic accurately across page boundaries', () => {
      let jsonPayload: any = null;
      const mockRes: any = {
        status: () => mockRes,
        json: (data: any) => {
          jsonPayload = data;
          return mockRes;
        },
      };

      // Page 2 of 50 total with 10 per page -> totalPages: 5, hasNextPage: true, hasPrevPage: true
      ApiResponse.paginated(mockRes, ['item1', 'item2'], 2, 10, 50);

      assert.equal(jsonPayload.success, true);
      assert.equal(jsonPayload.meta.page, 2);
      assert.equal(jsonPayload.meta.limit, 10);
      assert.equal(jsonPayload.meta.total, 50);
      assert.equal(jsonPayload.meta.totalPages, 5);
      assert.equal(jsonPayload.meta.hasNextPage, true);
      assert.equal(jsonPayload.meta.hasPrevPage, true);

      // Edge case: Final page (Page 5 of 5)
      ApiResponse.paginated(mockRes, ['item10'], 5, 10, 50);
      assert.equal(jsonPayload.meta.hasNextPage, false);
      assert.equal(jsonPayload.meta.hasPrevPage, true);

      // Edge case: First page (Page 1 of 5)
      ApiResponse.paginated(mockRes, ['item1'], 1, 10, 50);
      assert.equal(jsonPayload.meta.hasPrevPage, false);
      assert.equal(jsonPayload.meta.hasNextPage, true);
    });

    it('creates standard error response envelope with custom error codes', () => {
      let statusCode = 0;
      let jsonPayload: any = null;
      const mockRes: any = {
        status: (code: number) => {
          statusCode = code;
          return mockRes;
        },
        json: (data: any) => {
          jsonPayload = data;
          return mockRes;
        },
      };

      ApiResponse.error(mockRes, 'Item out of stock', 'STOCK_DEPLETED', 400, { sku: 'SKU-99' });

      assert.equal(statusCode, 400);
      assert.equal(jsonPayload.success, false);
      assert.equal(jsonPayload.error.code, 'STOCK_DEPLETED');
      assert.equal(jsonPayload.error.message, 'Item out of stock');
      assert.deepEqual(jsonPayload.error.details, { sku: 'SKU-99' });
    });
  });

  describe('Dependency Injection Container (Container)', () => {
    it('manages singleton dependencies lazily and preserves single instance', () => {
      const container = new Container();
      let callCount = 0;

      container.singleton('counterService', () => {
        callCount++;
        return { count: callCount, id: Math.random() };
      });

      assert.equal(callCount, 0, 'Singleton should not instantiate before resolve');

      const instance1 = container.resolve<{ count: number; id: number }>('counterService');
      const instance2 = container.resolve<{ count: number; id: number }>('counterService');

      assert.equal(callCount, 1, 'Factory should only be executed once for singletons');
      assert.equal(instance1.id, instance2.id, 'Instances should be identical references');
    });

    it('instantiates transient dependencies on every resolve', () => {
      const container = new Container();
      container.register('transientId', () => ({ id: Math.random() }));

      const instance1 = container.resolve<{ id: number }>('transientId');
      const instance2 = container.resolve<{ id: number }>('transientId');

      assert.notEqual(instance1.id, instance2.id, 'Transient dependencies must yield distinct instances');
    });

    it('throws error when attempting to resolve unregistered dependency', () => {
      const container = new Container();
      assert.throws(() => {
        container.resolve('unregisteredService');
      }, /No dependency registered for key: "unregisteredService"/);
    });
  });

  describe('Database Pool & Multi-Document Transactions', () => {
    it('exports runInTransaction helper as an executable async function', () => {
      assert.equal(typeof runInTransaction, 'function');
    });
  });
});

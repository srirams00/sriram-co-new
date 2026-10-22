import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response, NextFunction } from 'express';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from '../utils/domainErrors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

describe('Modern JavaScript & Testing Patterns Suite', () => {
  describe('Node.js Backend Patterns: Domain Error Hierarchy & Async Handler', () => {
    it('instantiates strongly typed domain errors with proper status codes and error codes', () => {
      const badReq = new BadRequestError('Invalid return reason');
      assert.equal(badReq.statusCode, 400);
      assert.equal(badReq.code, 'BAD_REQUEST');
      assert.equal(badReq.message, 'Invalid return reason');

      const unauth = new UnauthorizedError();
      assert.equal(unauth.statusCode, 401);
      assert.equal(unauth.code, 'UNAUTHORIZED');

      const forbidden = new ForbiddenError('Admin role required');
      assert.equal(forbidden.statusCode, 403);
      assert.equal(forbidden.code, 'FORBIDDEN');

      const notFound = new NotFoundError('Order SRC-12345');
      assert.equal(notFound.statusCode, 404);
      assert.equal(notFound.code, 'NOT_FOUND');
      assert.equal(notFound.message, 'Order SRC-12345 not found');

      const conflict = new ConflictError('Return request already active');
      assert.equal(conflict.statusCode, 409);
      assert.equal(conflict.code, 'CONFLICT');

      const rateLimit = new RateLimitError();
      assert.equal(rateLimit.statusCode, 429);
      assert.equal(rateLimit.code, 'RATE_LIMIT_EXCEEDED');
    });

    it('asyncHandler intercepts rejected promises and propagates error to next()', async () => {
      let interceptedError: any = null;
      const mockReq = {} as Request;
      const mockRes = {} as Response;
      const mockNext: NextFunction = (err?: any) => {
        interceptedError = err;
      };

      const failingRoute = asyncHandler(async () => {
        throw new NotFoundError('Customer Record');
      });

      failingRoute(mockReq, mockRes, mockNext);

      // Wait a microtask tick for promise rejection handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      assert.ok(interceptedError instanceof NotFoundError);
      assert.equal(interceptedError.statusCode, 404);
      assert.equal(interceptedError.code, 'NOT_FOUND');
    });

    it('asyncHandler allows successful async routes to execute without calling next with error', async () => {
      let nextCalled = false;
      let responseSent = false;

      const mockReq = {} as Request;
      const mockRes = {
        json: () => {
          responseSent = true;
        },
      } as unknown as Response;
      const mockNext: NextFunction = () => {
        nextCalled = true;
      };

      const successRoute = asyncHandler(async (_req, res) => {
        res.json({ success: true });
      });

      successRoute(mockReq, mockRes, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 10));

      assert.equal(responseSent, true);
      assert.equal(nextCalled, false);
    });
  });

  describe('Modern JavaScript Patterns: Immutability, Functional Pipelines & Generators', () => {
    it('applies functional pipelines (map, filter, reduce) without mutating original dataset', () => {
      const orders = [
        { id: '1', orderStatus: 'delivered', amount: 1500, category: 'Cookware' },
        { id: '2', orderStatus: 'shipped', amount: 850, category: 'Tableware' },
        { id: '3', orderStatus: 'delivered', amount: 3200, category: 'Cookware' },
        { id: '4', orderStatus: 'cancelled', amount: 600, category: 'Kitchen Appliances' },
      ];

      // Pure functional pipeline: Total delivered revenue for Cookware
      const deliveredCookwareRevenue = orders
        .filter((o) => o.orderStatus === 'delivered' && o.category === 'Cookware')
        .map((o) => o.amount)
        .reduce((sum, curr) => sum + curr, 0);

      assert.equal(deliveredCookwareRevenue, 4700);
      // Ensure original array was not mutated
      assert.equal(orders.length, 4);
      assert.equal(orders[0].amount, 1500);
    });

    it('processes batch stream with async generator (for await...of pattern)', async () => {
      async function* generateOrderBatches(items: string[], batchSize: number) {
        for (let i = 0; i < items.length; i += batchSize) {
          yield items.slice(i, i + batchSize);
        }
      }

      const allOrderIds = ['SRC-1', 'SRC-2', 'SRC-3', 'SRC-4', 'SRC-5'];
      const batches: string[][] = [];

      for await (const batch of generateOrderBatches(allOrderIds, 2)) {
        batches.push(batch);
      }

      assert.equal(batches.length, 3);
      assert.deepEqual(batches[0], ['SRC-1', 'SRC-2']);
      assert.deepEqual(batches[1], ['SRC-3', 'SRC-4']);
      assert.deepEqual(batches[2], ['SRC-5']);
    });

    it('demonstrates currying and higher-order function composition', () => {
      const applyDiscount = (percentage: number) => (price: number) => price * (1 - percentage / 100);
      const applyGst = (gstRate: number) => (price: number) => price * (1 + gstRate / 100);

      const tenPercentDiscount = applyDiscount(10);
      const eighteenPercentGst = applyGst(18);

      const originalPrice = 1000;
      const discounted = tenPercentDiscount(originalPrice); // 900
      const finalPrice = Math.round(eighteenPercentGst(discounted)); // 900 * 1.18 = 1062

      assert.equal(discounted, 900);
      assert.equal(finalPrice, 1062);
    });
  });

  describe('JavaScript Testing Patterns: Parameterized / Table-Driven Testing', () => {
    interface DiscountTestCase {
      originalPrice: number;
      discountPercent: number;
      expectedPrice: number;
      description: string;
    }

    const testCases: DiscountTestCase[] = [
      { originalPrice: 1000, discountPercent: 10, expectedPrice: 900, description: 'standard 10% discount' },
      { originalPrice: 500, discountPercent: 0, expectedPrice: 500, description: 'zero discount retains price' },
      { originalPrice: 2000, discountPercent: 50, expectedPrice: 1000, description: 'half price 50% discount' },
      { originalPrice: 1500, discountPercent: 100, expectedPrice: 0, description: '100% discount yields free' },
    ];

    for (const { originalPrice, discountPercent, expectedPrice, description } of testCases) {
      it(`parameterized test: calculates ${description}`, () => {
        const calculated = originalPrice - (originalPrice * discountPercent) / 100;
        assert.equal(calculated, expectedPrice);
      });
    }
  });
});

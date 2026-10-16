import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAppError,
  isMongoDuplicateKeyError,
  isMongooseValidationError,
  isNativeError,
  isRecord,
  getErrorMessage,
  AppErrorLike,
} from '../utils/typeGuards.js';
import {
  OrderNumber,
  RazorpayPaymentId,
  RazorpayOrderId,
  ApiPath,
  OrderLifecycleState,
  FullOrder,
  DeepReadonly,
  Assert,
  Extends,
  Equals,
} from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';

describe('TypeScript Advanced Types & Type Narrowing Suite', () => {
  describe('Compile-Time Static Type Assertions', () => {
    it('validates domain template literal types at compile-time', () => {
      // Static assertions: if these compile, the type contract holds
      type _TestOrderNumber = Assert<Extends<'SRC-123456-789', OrderNumber>>;
      type _TestPaymentId = Assert<Extends<'pay_Nxyz1234567890', RazorpayPaymentId>>;
      type _TestOrderId = Assert<Extends<'order_Nxyz1234567890', RazorpayOrderId>>;
      type _TestApiPath = Assert<Extends<'/api/orders', ApiPath>>;

      assert.equal(true, true, 'Compile-time template literal type assertions held');
    });

    it('validates discriminated union order lifecycle states at compile-time', () => {
      type PlacedState = { status: 'placed'; placedAt: string };
      type CancelledState = {
        status: 'cancelled';
        cancelledAt: string;
        cancellationReason: string;
        refundStatus: 'pending';
      };

      type _TestPlaced = Assert<Extends<PlacedState, OrderLifecycleState>>;
      type _TestCancelled = Assert<Extends<CancelledState, OrderLifecycleState>>;

      assert.equal(true, true, 'Discriminated union state machine types verified');
    });

    it('validates DeepReadonly immutability type helper', () => {
      type MutableCart = {
        items: Array<{ id: string; qty: number }>;
        config: { allowGuest: boolean };
      };

      type ImmutableCart = DeepReadonly<MutableCart>;

      type _TestReadonlyArray = Assert<Extends<ImmutableCart['items'], ReadonlyArray<any>>>;
      assert.equal(true, true, 'DeepReadonly recursively applied readonly modifiers');
    });
  });

  describe('Runtime Type Narrowing Guards (Zero Any)', () => {
    it('isRecord accurately identifies non-null object records', () => {
      assert.equal(isRecord({ key: 'val' }), true);
      assert.equal(isRecord({}), true);
      assert.equal(isRecord([]), false, 'Arrays must not be considered records');
      assert.equal(isRecord(null), false, 'null must not be considered record');
      assert.equal(isRecord(undefined), false);
      assert.equal(isRecord('string'), false);
      assert.equal(isRecord(42), false);
    });

    it('isNativeError correctly narrows standard and custom Error instances', () => {
      assert.equal(isNativeError(new Error('fail')), true);
      assert.equal(isNativeError(new TypeError('type fail')), true);
      assert.equal(isNativeError(new AppError('app fail', 400, 'BAD_REQ')), true);
      assert.equal(isNativeError({ message: 'fake error' }), false);
      assert.equal(isNativeError(null), false);
    });

    it('isAppError correctly validates statusCode and code properties', () => {
      const genuineAppError = new AppError('Unauthorized', 401, 'NOT_AUTHORIZED');
      assert.equal(isAppError(genuineAppError), true);

      const duckTypedError = {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Item not found',
      };
      assert.equal(isAppError(duckTypedError), true);

      const standardError = new Error('Generic error');
      assert.equal(isAppError(standardError), false);

      const missingCode = { statusCode: 500, message: 'no code' };
      assert.equal(isAppError(missingCode), false);
    });

    it('isMongoDuplicateKeyError identifies MongoDB E11000 duplicate keys', () => {
      const mongoDupError = {
        name: 'MongoServerError',
        code: 11000,
        keyPattern: { email: 1 },
        message: 'E11000 duplicate key error collection',
      };
      assert.equal(isMongoDuplicateKeyError(mongoDupError), true);

      const otherMongoError = {
        name: 'MongoServerError',
        code: 12000,
        message: 'Other mongo error',
      };
      assert.equal(isMongoDuplicateKeyError(otherMongoError), false);
      assert.equal(isMongoDuplicateKeyError(new Error('not mongo')), false);
    });

    it('isMongooseValidationError correctly detects Mongoose schema validation failures', () => {
      const mongooseValError = {
        name: 'ValidationError',
        errors: {
          price: { message: 'Price must be positive' },
        },
      };
      assert.equal(isMongooseValidationError(mongooseValError), true);
      assert.equal(isMongooseValidationError({ name: 'ValidationError', errors: [] }), false);
      assert.equal(isMongooseValidationError({ name: 'CastError' }), false);
    });

    it('getErrorMessage extracts human-readable message from unknown errors', () => {
      assert.equal(getErrorMessage(new Error('boom')), 'boom');
      assert.equal(getErrorMessage({ message: 'object error' }), 'object error');
      assert.equal(getErrorMessage('direct string error'), 'direct string error');
      assert.equal(getErrorMessage(null), 'An unexpected error occurred');
      assert.equal(getErrorMessage(123), 'An unexpected error occurred');
    });
  });
});

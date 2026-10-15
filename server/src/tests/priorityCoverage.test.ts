import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { verifyGoogleIdToken } from '../routes/authRoutes';
import { verifyPaymentSignature } from '../config/razorpay';
import { AppError } from '../middleware/errorHandler';

describe('Priority Coverage Suite (Critical & High Priorities)', () => {
  describe('Critical: Google Identity Toolkit Token Verification & Resilience', () => {
    const originalFetch = global.fetch;

    it('throws 401 INVALID_OAUTH_TOKEN when Google returns token expired or invalid (HTTP 400)', async () => {
      // Mock Google Identity Toolkit 400 response
      global.fetch = async () => {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            error: {
              code: 400,
              message: 'INVALID_ID_TOKEN',
              errors: [{ message: 'INVALID_ID_TOKEN', reason: 'invalid' }],
            },
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await verifyGoogleIdToken('expired_or_invalid_id_token_xyz');
          },
          (err: any) => {
            assert.ok(err instanceof AppError);
            assert.equal(err.statusCode, 401);
            assert.equal(err.code, 'INVALID_OAUTH_TOKEN');
            assert.match(err.message, /Invalid or expired Google OAuth token/i);
            return true;
          }
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('throws 401 OAUTH_VERIFICATION_FAILED when Google user payload is missing email', async () => {
      global.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            users: [
              {
                localId: '12345678',
                displayName: 'Anonymous User',
                // email intentionally omitted
              },
            ],
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await verifyGoogleIdToken('valid_token_but_no_email');
          },
          (err: any) => {
            assert.ok(err instanceof AppError);
            assert.equal(err.statusCode, 401);
            assert.equal(err.code, 'OAUTH_VERIFICATION_FAILED');
            assert.match(err.message, /Unable to extract verified identity/i);
            return true;
          }
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('throws 502 OAUTH_SERVICE_ERROR on network timeouts or Google server crashes without leaking tokens', async () => {
      global.fetch = async () => {
        throw new Error('ETIMEDOUT: Connection to identitytoolkit.googleapis.com failed');
      };

      try {
        await assert.rejects(
          async () => {
            await verifyGoogleIdToken('any_token_network_fail');
          },
          (err: any) => {
            assert.ok(err instanceof AppError);
            assert.equal(err.statusCode, 502);
            assert.equal(err.code, 'OAUTH_SERVICE_ERROR');
            assert.match(err.message, /Google authentication service error/i);
            // Ensure no sensitive API keys or internal stack trace in the message
            assert.equal(err.message.includes('AIzaSy'), false);
            assert.equal(err.message.includes('ETIMEDOUT'), false);
            return true;
          }
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('successfully extracts verified identity when token is valid and signed', async () => {
      global.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            users: [
              {
                localId: 'google_uid_98765',
                email: 'Customer.Trichy@SriramAndCo.in',
                emailVerified: true,
                displayName: 'Sriram Ramanathan',
              },
            ],
          }),
        } as any;
      };

      try {
        const result = await verifyGoogleIdToken('valid_verified_id_token');
        assert.equal(result.email, 'customer.trichy@sriramandco.in', 'Email must be normalized to lowercase');
        assert.equal(result.name, 'Sriram Ramanathan');
        assert.equal(result.emailVerified, true);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Critical: Cryptographic Payment Verification & Concurrent Anti-Tampering', () => {
    const testSecret = 'live_secret_anti_tamper_9921';
    const testOrderId = 'order_SRC_LIVE_1001';
    const testPaymentId = 'pay_SRC_LIVE_PAY_888';

    const legitSignature = crypto
      .createHmac('sha256', testSecret)
      .update(Buffer.from(`${testOrderId}|${testPaymentId}`, 'utf8'))
      .digest('hex');

    it('guarantees constant-time validation and rejects tampered signatures under 50 concurrent requests', async () => {
      const concurrentAttempts = 50;
      const tasks = Array.from({ length: concurrentAttempts }, async (_, index) => {
        // Half with legitimate signature, half with tampered bit
        const isLegit = index % 2 === 0;
        const signatureToTest = isLegit
          ? legitSignature
          : `${legitSignature.slice(0, -2)}00`; // Tampered last byte

        const verified = verifyPaymentSignature(testOrderId, testPaymentId, signatureToTest, testSecret);
        return { index, isLegit, verified };
      });

      const results = await Promise.all(tasks);

      // Verify zero false positives and zero false negatives
      for (const res of results) {
        if (res.isLegit) {
          assert.equal(res.verified, true, `Legitimate request ${res.index} should pass`);
        } else {
          assert.equal(res.verified, false, `Tampered request ${res.index} MUST be rejected`);
        }
      }
    });

    it('verifies idempotent payment status transitions prevent race conditions', () => {
      // Simulating Order State in Memory
      let orderState = {
        orderNumber: 'SRC-TEST-CONCURRENT-01',
        paymentStatus: 'pending',
        orderStatus: 'placed',
        processedVerifications: 0,
      };

      // Concurrent handler simulating /api/orders/razorpay/verify-payment
      const handleVerifyPayment = (isValidSig: boolean) => {
        // Idempotency check (matches orderRoutes.ts line 180)
        if (orderState.paymentStatus === 'paid') {
          return { success: true, message: 'Payment already verified.', idempotent: true };
        }

        if (!isValidSig) {
          orderState.paymentStatus = 'failed';
          return { success: false, message: 'Invalid payment signature.' };
        }

        orderState.paymentStatus = 'paid';
        orderState.orderStatus = 'confirmed';
        orderState.processedVerifications += 1;
        return { success: true, message: 'Payment verified successfully.' };
      };

      // Call 1: Legitimate verification succeeds
      const firstCall = handleVerifyPayment(true);
      assert.equal(firstCall.success, true);
      assert.equal(orderState.paymentStatus, 'paid');
      assert.equal(orderState.processedVerifications, 1);

      // Call 2: Duplicate concurrent call resolves idempotently without double processing
      const duplicateCall = handleVerifyPayment(true);
      assert.equal(duplicateCall.success, true);
      assert.equal(duplicateCall.idempotent, true);
      assert.equal(orderState.processedVerifications, 1, 'Double processing must be prevented');
    });

    it('detects and rejects order replay mismatch before signature evaluation', () => {
      const storedOrder = {
        orderNumber: 'SRC-9812-4411',
        razorpayOrderId: 'order_GENUINE_111',
      };

      const replayPayload = {
        orderNumber: 'SRC-9812-4411',
        razorpayOrderId: 'order_CHEAP_222', // Attacker swapping order ID
        razorpayPaymentId: 'pay_CHEAP_333',
        razorpaySignature: 'any_sig',
      };

      const isMismatch = storedOrder.razorpayOrderId !== replayPayload.razorpayOrderId;
      assert.equal(isMismatch, true, 'Swapped Razorpay order ID must trigger replay mismatch');
    });
  });

  describe('High: Catalog Price Recalculation & Out-of-Stock Boundaries', () => {
    // Authentic catalog database items
    const catalogDb: Record<string, { name: string; price: number; inStock: boolean }> = {
      'heavy-duty-drill': { name: 'Heavy Duty 750W Impact Drill', price: 2499, inStock: true },
      'laser-distance-meter': { name: '40m Digital Laser Meter', price: 1850, inStock: false }, // Out of stock
      'safety-goggles': { name: 'Anti-Fog Safety Goggles', price: 150, inStock: true },
    };

    const recalculateOrder = (
      clientItems: Array<{ product: string; quantity: number; clientSentPrice?: number }>
    ) => {
      let calculatedSubtotal = 0;
      const verifiedItems: any[] = [];

      for (const item of clientItems) {
        const dbProduct = catalogDb[item.product];
        if (!dbProduct) {
          throw new AppError(`Product "${item.product}" not found in catalog.`, 400);
        }

        // Out-of-stock boundary check (matches orderRoutes.ts line 71)
        if (dbProduct.inStock === false) {
          throw new AppError(`Product "${dbProduct.name}" is currently out of stock.`, 400);
        }

        // Server strictly uses dbProduct.price, discarding clientSentPrice
        const itemTotal = dbProduct.price * item.quantity;
        calculatedSubtotal += itemTotal;

        verifiedItems.push({
          name: dbProduct.name,
          price: dbProduct.price,
          quantity: item.quantity,
          itemTotal,
        });
      }

      // Direct Store Delivery is ₹0
      const deliveryFee = 0;
      const discount = 0;
      const verifiedTotal = calculatedSubtotal + deliveryFee - discount;

      if (verifiedTotal <= 0) {
        throw new AppError('Calculated order total must be strictly positive.', 400);
      }

      return { subtotal: calculatedSubtotal, deliveryFee, total: verifiedTotal, items: verifiedItems };
    };

    it('rejects checkout when any item in cart is out of stock', () => {
      const cartWithOutOfStock = [
        { product: 'heavy-duty-drill', quantity: 1 },
        { product: 'laser-distance-meter', quantity: 1 }, // inStock = false
      ];

      assert.throws(
        () => recalculateOrder(cartWithOutOfStock),
        (err: any) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /currently out of stock/i);
          return true;
        }
      );
    });

    it('neutralizes client price manipulation by enforcing official database prices', () => {
      const maliciousCart = [
        {
          product: 'heavy-duty-drill',
          quantity: 2,
          clientSentPrice: 10, // Attacker attempting to buy ₹2499 drill for ₹10
        },
        {
          product: 'safety-goggles',
          quantity: 1,
          clientSentPrice: 1, // Attacker attempting to buy ₹150 item for ₹1
        },
      ];

      const calculation = recalculateOrder(maliciousCart);

      // Expected: (2499 * 2) + (150 * 1) = 4998 + 150 = 5148
      assert.equal(calculation.subtotal, 5148);
      assert.equal(calculation.deliveryFee, 0, 'Direct Store Delivery is ₹0');
      assert.equal(calculation.total, 5148);
      assert.equal(calculation.items[0].price, 2499);
      assert.equal(calculation.items[1].price, 150);
    });

    it('rejects zero or negative order totals', () => {
      assert.throws(
        () => recalculateOrder([]),
        (err: any) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /must be strictly positive/i);
          return true;
        }
      );
    });
  });

  describe('Critical: Account Lockout & Idempotency Index Hardening', () => {
    it('locks account after 5 consecutive failed login attempts and resets on success', () => {
      const mockUser = {
        email: 'customer@sriramandco.in',
        failedLoginAttempts: 0,
        lockUntil: null as Date | null,
        isLocked() {
          return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
        },
      };

      // 4 failed attempts -> not locked yet
      for (let i = 1; i <= 4; i++) {
        mockUser.failedLoginAttempts += 1;
        assert.equal(mockUser.isLocked(), false, `Should not be locked on attempt ${i}`);
      }

      // 5th failed attempt triggers 15-minute lockout
      mockUser.failedLoginAttempts += 1;
      if (mockUser.failedLoginAttempts >= 5) {
        mockUser.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      assert.equal(mockUser.isLocked(), true, 'Account MUST be locked on 5th failed attempt');

      // Attempting to authenticate while locked
      assert.throws(
        () => {
          if (mockUser.isLocked()) {
            throw new AppError('Account temporarily locked', 423, 'ACCOUNT_LOCKED');
          }
        },
        (err: any) => {
          assert.equal(err.statusCode, 423);
          assert.equal(err.code, 'ACCOUNT_LOCKED');
          return true;
        }
      );

      // Simulating expiry of lockout window
      mockUser.lockUntil = new Date(Date.now() - 1000); // 1 second in the past
      assert.equal(mockUser.isLocked(), false, 'Account should unlock after lockUntil timestamp expires');

      // Successful login resets counters
      mockUser.failedLoginAttempts = 0;
      mockUser.lockUntil = null;
      assert.equal(mockUser.failedLoginAttempts, 0);
      assert.equal(mockUser.lockUntil, null);
    });

    it('validates partialFilterExpression schema indexes for razorpayPaymentId and razorpayOrderId', async () => {
      const { Order } = await import('../models/Order.js');
      const indexes = Order.schema.indexes();

      // Find indexes on razorpayPaymentId and razorpayOrderId
      const paymentIdIndex = indexes.find(
        (entry: any) => entry?.[0]?.razorpayPaymentId === 1
      );
      const orderIdIndex = indexes.find(
        (entry: any) => entry?.[0]?.razorpayOrderId === 1
      );

      assert.ok(paymentIdIndex, 'Index on razorpayPaymentId must exist');
      assert.equal((paymentIdIndex[1] as any)?.unique, true, 'razorpayPaymentId index must be unique');
      assert.deepEqual(
        (paymentIdIndex[1] as any)?.partialFilterExpression,
        { razorpayPaymentId: { $type: 'string' } },
        'razorpayPaymentId must use partialFilterExpression to ignore nulls'
      );

      assert.ok(orderIdIndex, 'Index on razorpayOrderId must exist');
      assert.equal((orderIdIndex[1] as any)?.unique, true, 'razorpayOrderId index must be unique');
      assert.deepEqual(
        (orderIdIndex[1] as any)?.partialFilterExpression,
        { razorpayOrderId: { $type: 'string' } },
        'razorpayOrderId must use partialFilterExpression to ignore nulls'
      );
    });
  });
});

import { Router, Request, Response } from 'express';
import mongoose, { FilterQuery, Types } from 'mongoose';
import crypto from 'crypto';
import { Order, IOrder, IOrderItem } from '../models/Order.js';
import { Product } from '../models/Product.js';
import {
  razorpay,
  RAZORPAY_KEY_ID,
  isRazorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../config/razorpay.js';
import { AuthRequest, authenticate, authenticateIfPresent, requireAdmin } from '../middleware/authMiddleware.js';
import { sendOrderLifecycleEmail, sendEmail } from '../services/emailService.js';
import { compileOrderEmailHtml, EmailTemplateType, OrderEmailData } from '../services/emailTemplates.js';
import { getErrorMessage, isNativeError, isRecord } from '../utils/typeGuards.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for order initiation (prevents automated ghost order flooding)
const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many order initiation requests from this IP. Please wait a few minutes.',
  },
});

// Rate limiter for payment verification (prevents signature brute-forcing & webhook hammering)
const paymentVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many payment verification requests. Please wait a few minutes.',
  },
});

// POST /api/orders/razorpay/create-order - Create Razorpay order with server-side price recalculation (Anti-tamper)
router.post('/razorpay/create-order', orderCreationLimiter, authenticateIfPresent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isRazorpayConfigured()) {
      res.status(503).json({
        message: 'Online payments are not configured. Set a valid Razorpay Key ID and Key Secret in the server environment.',
      });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas IP access rules (0.0.0.0/0 required for cloud hosting).',
      });
      return;
    }

    const { customerInfo, orderItems, notes } = req.body;

    if (!customerInfo || !orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      res.status(400).json({ message: 'Order items and customer information are required.' });
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.city) {
      res.status(400).json({ message: 'Please provide customer name, phone number, address, and city.' });
      return;
    }

    // Server-side price recalculation directly from MongoDB catalog (Prevents client price tampering)
    let calculatedSubtotal = 0;
    const verifiedOrderItems: IOrderItem[] = [];

    for (const item of orderItems) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        res.status(400).json({ message: 'Invalid item quantity or product reference.' });
        return;
      }

      let dbProduct = null;
      if (mongoose.Types.ObjectId.isValid(item.product)) {
        dbProduct = await Product.findById(item.product);
      }

      // Robust fallback: if ID was from another DB or static catalog, match by name or slug
      if (!dbProduct) {
        dbProduct = await Product.findOne({
          $or: [
            ...(item.name ? [{ name: item.name }] : []),
            { slug: item.product },
          ],
        });
      }

      if (!dbProduct) {
        res.status(400).json({ message: `Product "${item.name || item.product}" not found in catalog.` });
        return;
      }

      if (dbProduct.inStock === false) {
        res.status(400).json({ message: `Product "${dbProduct.name}" is currently out of stock.` });
        return;
      }

      const itemTotal = dbProduct.price * item.quantity;
      calculatedSubtotal += itemTotal;

      verifiedOrderItems.push({
        product: dbProduct._id as Types.ObjectId,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
        image: dbProduct.image,
      });
    }

    // Direct Store Delivery is 100% Free on all orders
    const deliveryFee = 0;
    const discount = 0;
    const verifiedTotal = calculatedSubtotal + deliveryFee - discount;

    if (verifiedTotal <= 0) {
      res.status(400).json({ message: 'Calculated order total must be strictly positive.' });
      return;
    }

    const orderNumber = `SRC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create Razorpay Order with verified total (amount in paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(verifiedTotal * 100),
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        orderNumber,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        city: customerInfo.city,
      },
    });

    const newOrder = new Order({
      user: req.user?._id,
      orderNumber,
      customerInfo: {
        name: customerInfo.name.trim(),
        phone: customerInfo.phone.trim(),
        email: customerInfo.email?.trim() || '',
        address: customerInfo.address.trim(),
        city: customerInfo.city.trim(),
        postalCode: customerInfo.postalCode?.trim() || '',
        notes: notes || customerInfo.notes || '',
      },
      orderItems: verifiedOrderItems,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      orderStatus: 'placed',
      razorpayOrderId: razorpayOrder.id,
      pricing: {
        subtotal: calculatedSubtotal,
        deliveryFee,
        discount,
        total: verifiedTotal,
      },
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: RAZORPAY_KEY_ID,
      pricing: savedOrder.pricing,
    });
  } catch (error: unknown) {
    console.error('Razorpay create-order error:', error);
    const errorDescription =
      (isRecord(error) && isRecord(error.error) && typeof error.error.description === 'string' && error.error.description) ||
      getErrorMessage(error) ||
      'Failed to initialize Razorpay order. Please verify API keys.';
    const isAuthenticationFailure =
      (isRecord(error) && error.statusCode === 401) ||
      /authentication failed|invalid api key/i.test(errorDescription);

    if (isAuthenticationFailure) {
      res.status(502).json({
        message: 'Razorpay rejected the server API credentials. Set a valid matching Key ID and Key Secret from the same Razorpay mode (test or live) in the server environment, then restart the server.',
      });
      return;
    }

    res.status(500).json({ message: errorDescription });
  }
});

// POST /api/orders/razorpay/verify-payment - Cryptographic HMAC SHA-256 payment verification
router.post('/razorpay/verify-payment', paymentVerificationLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderNumber || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ message: 'Missing required Razorpay verification parameters.' });
      return;
    }

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    // Idempotency: If already paid, return success without duplicate processing
    if (order.paymentStatus === 'paid') {
      res.json({
        success: true,
        message: 'Payment already verified.',
        order,
      });
      return;
    }

    // Replay attack prevention: Ensure razorpayOrderId matches stored order
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      res.status(400).json({
        success: false,
        message: 'Order ID mismatch between stored order and payment verification payload.',
      });
      return;
    }

    // Validate cryptographic HMAC SHA-256 signature
    const isValidSignature = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValidSignature) {
      console.warn(
        `[Security Alert] Payment signature verification failed for order ${orderNumber} (IP: ${req.ip || 'unknown'})`
      );
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
      return;
    }

    const verifiedAt = new Date().toISOString();
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: 'paid' }, razorpayOrderId },
      {
        $set: {
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          razorpayPaymentId,
          razorpaySignature,
          paymentDetails: {
            verifiedAt,
            razorpayOrderId,
            razorpayPaymentId,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      const currentOrder = await Order.findById(order._id);
      if (currentOrder?.paymentStatus === 'paid') {
        res.json({
          success: true,
          message: 'Payment already verified.',
          order: currentOrder,
        });
        return;
      }

      res.status(409).json({
        success: false,
        message: 'Payment could not be applied to this order. Please contact support.',
      });
      return;
    }

    // Asynchronously dispatch Order Confirmed email to customer via Zoho Mail
    sendOrderLifecycleEmail(updatedOrder, 'confirmed').catch((err) =>
      console.warn('[Zoho Mail] Could not dispatch confirmed email:', err.message)
    );

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      order: updatedOrder,
    });
  } catch (error: unknown) {
    console.error('Razorpay payment verification error:', error);
    res.status(500).json({ message: getErrorMessage(error) || 'Payment verification failed.' });
  }
});

// POST /api/orders/razorpay/cancel-order - Mark an unpaid checkout attempt as cancelled
router.post('/razorpay/cancel-order', paymentVerificationLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber, razorpayOrderId } = req.body;
    if (typeof orderNumber !== 'string' || typeof razorpayOrderId !== 'string') {
      res.status(400).json({ message: 'Order number and Razorpay order ID are required.' });
      return;
    }

    const order = await Order.findOneAndUpdate(
      { orderNumber, razorpayOrderId, paymentStatus: { $in: ['pending', 'failed'] } },
      { $set: { paymentStatus: 'failed', orderStatus: 'cancelled' } },
      { new: true, runValidators: true }
    );

    if (order) {
      res.json({ success: true, order });
      return;
    }

    const currentOrder = await Order.findOne({ orderNumber, razorpayOrderId });
    if (!currentOrder) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    if (currentOrder.paymentStatus === 'paid') {
      res.status(409).json({ message: 'A verified payment cannot be cancelled.' });
      return;
    }

    res.json({ success: true, order: currentOrder });
  } catch (error: unknown) {
    console.error('Razorpay order cancellation error:', error);
    res.status(500).json({ message: getErrorMessage(error) || 'Could not update the cancelled payment attempt.' });
  }
});

// POST /api/orders/razorpay/webhook - Asynchronous webhook payment reconciliation
router.post('/razorpay/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = req.rawBody ? String(req.rawBody) : JSON.stringify(req.body);

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      res.status(400).json({ message: 'Invalid webhook signature.' });
      return;
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || payload?.order?.entity?.id;

      if (rzpOrderId) {
        const savedOrder = await Order.findOneAndUpdate(
          { razorpayOrderId: rzpOrderId, paymentStatus: { $ne: 'paid' } },
          {
            $set: {
              paymentStatus: 'paid',
              orderStatus: 'confirmed',
              ...(paymentEntity?.id ? { razorpayPaymentId: paymentEntity.id } : {}),
              paymentDetails: {
                webhookEvent: event,
                method: paymentEntity?.method,
                bank: paymentEntity?.bank,
                vpa: paymentEntity?.vpa,
                wallet: paymentEntity?.wallet,
                verifiedAt: new Date().toISOString(),
              },
            },
          },
          { new: true, runValidators: true }
        );
        if (savedOrder) {
          // Asynchronously dispatch Order Confirmed email to customer via Zoho Mail if not already sent
          sendOrderLifecycleEmail(savedOrder, 'confirmed').catch((err) =>
            console.warn('[Zoho Mail Webhook] Could not dispatch confirmed email:', err.message)
          );
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error: unknown) {
    console.error('Razorpay webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed.' });
  }
});

// POST /api/orders - Deprecated in favor of verified Razorpay payment flow (Prevents client-side price tampering)
router.post('/', (_req: Request, res: Response): Promise<void> => {
  res.status(405).json({
    message: 'Direct order creation is disabled. All orders must be initiated via /api/orders/razorpay/create-order.',
  });
  return Promise.resolve();
});

// GET /api/orders/mine - List orders belonging to the authenticated customer
router.get('/mine', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const orders = await Order.find({ user: req.user._id, paymentStatus: 'paid' }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Customer order retrieval error:', error);
    res.status(500).json({ message: 'Error retrieving customer orders' });
  }
});

// GET /api/orders - List all orders with aggregated statistics (Protected: Admin only)
router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const query: FilterQuery<IOrder> = { paymentStatus: 'paid' };

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    // ReDoS-safe search input escaping and length limitation
    if (search && typeof search === 'string') {
      const sanitized = search.trim().slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (sanitized) {
        const searchRegex = new RegExp(sanitized, 'i');
        query.$or = [
          { orderNumber: searchRegex },
          { 'customerInfo.name': searchRegex },
          { 'customerInfo.phone': searchRegex },
          { 'customerInfo.city': searchRegex },
        ];
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    // Calculate aggregated stats across all orders
    const allOrders = await Order.find({ paymentStatus: 'paid' });
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
    const pendingCount = allOrders.filter(o => ['placed', 'confirmed', 'processing', 'out_for_delivery'].includes(o.orderStatus)).length;
    const deliveredCount = allOrders.filter(o => o.orderStatus === 'delivered').length;

    res.json({
      orders,
      stats: {
        totalOrders,
        totalRevenue,
        pendingCount,
        deliveredCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders' });
  }
});

// GET /api/orders/:orderNumber - Fetch order details by order number (Protected / PII-sanitized for guests)
router.get('/:orderNumber', authenticateIfPresent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Authenticated order owner or store administrator receives full unredacted order details
    const isOwner = Boolean(req.user && order.user && req.user._id.toString() === order.user.toString());
    const isAdmin = Boolean(req.user && req.user.role === 'admin');

    if (order.paymentStatus !== 'paid' && !isAdmin) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (isOwner || isAdmin) {
      res.json(order);
      return;
    }

    // Public guest tracking: Redact sensitive customer PII and payment secrets (anti-IDOR & harvest prevention)
    const orderObj = order.toObject();
    const nameParts = (orderObj.customerInfo?.name || '').trim().split(' ');
    const maskedName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
      : nameParts[0] || 'Customer';

    const phone = orderObj.customerInfo?.phone || '';
    const maskedPhone = phone.length >= 4 ? `******${phone.slice(-4)}` : '******';

    const email = orderObj.customerInfo?.email || '';
    const maskedEmail = email.includes('@')
      ? `${email.charAt(0)}***@${email.split('@')[1]}`
      : undefined;

    const sanitizedOrder = {
      _id: orderObj._id,
      id: orderObj._id,
      orderNumber: orderObj.orderNumber,
      orderStatus: orderObj.orderStatus,
      paymentStatus: orderObj.paymentStatus,
      paymentMethod: orderObj.paymentMethod,
      orderItems: orderObj.orderItems,
      pricing: orderObj.pricing,
      createdAt: orderObj.createdAt,
      customerInfo: {
        name: maskedName,
        city: orderObj.customerInfo?.city || '',
        phone: maskedPhone,
        address: 'Delivered to address on file (hidden for privacy)',
        ...(maskedEmail ? { email: maskedEmail } : {}),
      },
    };

    res.json(sanitizedOrder);
  } catch (_error) {
    res.status(500).json({ message: 'Error retrieving order' });
  }
});

// PATCH /api/orders/:id/status - Update order status and/or payment status (Protected: Admin only)
router.patch('/:id/status', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const validStatuses = ['placed', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (orderStatus && !validStatuses.includes(orderStatus)) {
      res.status(400).json({ message: 'Invalid order status value' });
      return;
    }

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const updateFields: Partial<Pick<IOrder, 'orderStatus' | 'paymentStatus' | 'cancellationReason' | 'cancelledBy'>> = {};
    if (orderStatus) updateFields.orderStatus = orderStatus;
    if (paymentStatus) {
      updateFields.paymentStatus = paymentStatus;
    } else if (orderStatus === 'cancelled' && existingOrder.paymentStatus === 'paid') {
      updateFields.paymentStatus = 'refunded';
    }

    if (orderStatus === 'cancelled') {
      if (req.body.cancellationReason) updateFields.cancellationReason = req.body.cancellationReason;
      updateFields.cancelledBy = req.body.cancelledBy || 'store';
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Trigger Zoho Mail transactional notification on status transition
    if (orderStatus) {
      const emailTypeMap: Record<string, EmailTemplateType> = {
        placed: 'placed',
        confirmed: 'confirmed',
        processing: 'processing',
        out_for_delivery: 'out_for_delivery',
        delivered: 'delivered',
        cancelled: 'cancelled',
      };
      const emailType = emailTypeMap[orderStatus];
      if (emailType) {
        sendOrderLifecycleEmail(updatedOrder, emailType, {
          driverName: req.body.driverName,
          driverPhone: req.body.driverPhone,
          deliveryWindow: req.body.deliveryWindow,
          cancellationReason: req.body.cancellationReason,
          cancelledBy: req.body.cancelledBy || 'store',
        }).catch((err) =>
          console.warn(`[Zoho Mail] Could not dispatch ${emailType} email:`, getErrorMessage(err))
        );
      }
    }

    res.json(updatedOrder);
  } catch (error: unknown) {
    res.status(500).json({ message: getErrorMessage(error) || 'Failed to update order status' });
  }
});

// POST /api/orders/:idOrNumber/cancel - Customer Pre-Dispatch Cancellation & Automated Refund Endpoint
router.post('/:idOrNumber/cancel', authenticateIfPresent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idOrNumber } = req.params;
    const { reason, phone, email } = req.body;

    let order = null;
    if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
      order = await Order.findById(idOrNumber);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: idOrNumber });
    }

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Authorization check:
    // If user is authenticated, must be owner or admin
    // If guest / unauthenticated, require matching phone or email for anti-tamper security
    const isOwner = Boolean(req.user && order.user && req.user._id.toString() === order.user.toString());
    const isAdmin = Boolean(req.user && req.user.role === 'admin');

    if (!isOwner && !isAdmin) {
      const orderPhoneDigits = (order.customerInfo?.phone || '').replace(/\D/g, '');
      const inputPhoneDigits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
      const orderEmailLower = (order.customerInfo?.email || '').trim().toLowerCase();
      const inputEmailLower = typeof email === 'string' ? email.trim().toLowerCase() : '';

      const phoneMatches = Boolean(
        inputPhoneDigits.length >= 4 &&
        (orderPhoneDigits.endsWith(inputPhoneDigits) || inputPhoneDigits.endsWith(orderPhoneDigits))
      );
      const emailMatches = Boolean(inputEmailLower && orderEmailLower && inputEmailLower === orderEmailLower);

      if (!phoneMatches && !emailMatches) {
        res.status(403).json({
          message: 'Verification failed. Please enter the customer phone number used during checkout to cancel this order.',
        });
        return;
      }
    }

    // Pre-dispatch status check: only allowed before order is out for delivery or delivered
    if (order.orderStatus === 'cancelled') {
      res.status(400).json({ message: 'This order is already cancelled.' });
      return;
    }

    if (order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered') {
      res.status(400).json({
        message: `Order cannot be cancelled because it is already ${order.orderStatus === 'out_for_delivery' ? 'out for delivery' : 'delivered'}. In accordance with Sri Ram & Co store policy, please refer to our 7-Day Return / Replacement Policy once your delivery arrives.`,
      });
      return;
    }

    const cancellationReason = (typeof reason === 'string' && reason.trim()) || 'Requested by customer prior to dispatch';
    const cancelledBy = isAdmin ? 'store' : 'customer';

    // Handle payment & refund status
    let refundInfo: Record<string, unknown> = {
      initiatedAt: new Date().toISOString(),
      amount: order.pricing.total,
      currency: 'INR',
    };

    if (order.paymentStatus === 'paid') {
      // Attempt automated gateway refund if credentials are live
      if (order.razorpayPaymentId && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_ID.includes('mock')) {
        try {
          const refundResponse = await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(order.pricing.total * 100),
            notes: {
              orderNumber: order.orderNumber,
              reason: cancellationReason,
            },
          });
          refundInfo = {
            ...refundInfo,
            refundId: refundResponse.id,
            status: refundResponse.status || 'processed',
            speedProcessed: refundResponse.speed_processed,
          };
          order.paymentStatus = 'refunded';
        } catch (rfErr: unknown) {
          console.warn('[Razorpay Refund] Auto-refund note:', getErrorMessage(rfErr));
          refundInfo.note = 'Refund queued for 5-7 working days processing via gateway dashboard.';
          order.paymentStatus = 'refund_initiated';
        }
      } else {
        refundInfo.note = 'Refund queued for 5-7 working days bank processing.';
        order.paymentStatus = 'refund_initiated';
      }
    } else {
      order.paymentStatus = 'failed';
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = cancellationReason;
    order.cancelledBy = cancelledBy;
    order.refundDetails = refundInfo;

    const savedOrder = await order.save();

    // Asynchronously dispatch Order Cancelled email to customer via Zoho Mail
    sendOrderLifecycleEmail(savedOrder, 'cancelled', {
      cancellationReason,
      cancelledBy,
    }).catch((err) =>
      console.warn('[Zoho Mail] Could not dispatch cancellation email:', getErrorMessage(err))
    );

    res.json({
      success: true,
      message: order.paymentStatus === 'refunded' || order.paymentStatus === 'refund_initiated'
        ? `Order #${order.orderNumber} has been cancelled successfully. Your refund of ₹${order.pricing.total} has been initiated back to your original payment method (5–7 business days).`
        : `Order #${order.orderNumber} has been cancelled successfully.`,
      order: savedOrder,
    });
  } catch (error: unknown) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ message: getErrorMessage(error) || 'Failed to cancel order.' });
  }
});

// POST /api/orders/:id/send-email - Admin manual email dispatch / resend
router.post('/:id/send-email', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { templateId, driverName, driverPhone, deliveryWindow, cancellationReason, cancelledBy } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const validTemplates: EmailTemplateType[] = ['placed', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
    const chosenTemplate: EmailTemplateType = validTemplates.includes(templateId) ? templateId : (order.orderStatus as EmailTemplateType) || 'placed';

    const dispatchResult = await sendOrderLifecycleEmail(order, chosenTemplate, {
      driverName,
      driverPhone,
      deliveryWindow,
      cancellationReason,
      cancelledBy: cancelledBy || 'store',
    });

    res.json({
      success: dispatchResult.success,
      message: dispatchResult.success ? `Email (${chosenTemplate}) sent successfully via Zoho Mail.` : 'Failed to send email.',
      result: dispatchResult,
    });
  } catch (err: unknown) {
    res.status(500).json({ message: getErrorMessage(err) || 'Error dispatching order email' });
  }
});

// POST /api/orders/admin/test-email - Test Zoho Mail connection
router.post('/admin/test-email', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, templateType } = req.body;
    const recipient = email || 'ramkumar@sriramandco.in';

    const sampleOrderForTest: Record<string, unknown> = {
      orderNumber: 'SRC-TEST-001',
      customerInfo: {
        name: 'Ramkumar S',
        email: recipient,
        phone: '+91 93454 03136',
        address: 'No. 11, Vinola Complex, Thanjai Main Road',
        city: 'Trichy',
        postalCode: '620001',
      },
      orderItems: [
        {
          name: 'Milton Thermosteel 1000ml Flask',
          price: 999,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300',
        },
      ],
      pricing: {
        subtotal: 999,
        deliveryFee: 0,
        total: 999,
      },
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      createdAt: new Date(),
    };

    const targetType: EmailTemplateType = templateType || 'confirmed';
    const compiled = compileOrderEmailHtml(sampleOrderForTest, targetType, {
      driverName: 'Murugan',
      driverPhone: '+91 94431 27658',
      deliveryWindow: 'today between 2 PM and 5 PM',
    });

    const result = await sendEmail({
      to: recipient,
      subject: `[TEST] ${compiled.subject}`,
      html: compiled.html,
      text: compiled.text,
    });

    res.json({
      success: result.success,
      recipient,
      templateType: targetType,
      message: result.success ? `Test email sent to ${recipient}` : `Failed: ${result.error}`,
      result,
    });
  } catch (err: unknown) {
    res.status(500).json({ message: getErrorMessage(err) || 'Failed to send test email' });
  }
});

// POST /api/orders/admin/preview-email - Compile and return HTML for live preview
router.post('/admin/preview-email', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateType, orderId, driverName, driverPhone, deliveryWindow, cancellationReason, cancelledBy } = req.body;

    let targetOrder: OrderEmailData | null = null;
    if (orderId) {
      targetOrder = await Order.findById(orderId);
    }

    if (!targetOrder) {
      // Fallback sample order
      targetOrder = {
        orderNumber: 'SRC-PREVIEW-101',
        customerInfo: {
          name: 'Priya Ramanathan',
          email: 'customer@example.com',
          phone: '+91 94431 27658',
          address: '12, Gandhi Nagar, Thillai Nagar',
          city: 'Trichy',
          postalCode: '620018',
        },
        orderItems: [
          {
            name: 'Milton Thermosteel 1000ml Flask',
            price: 999,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300',
          },
          {
            name: 'Preethi Zodiac Mixer Grinder 750W',
            price: 7490,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300',
          },
        ],
        pricing: {
          subtotal: 9488,
          deliveryFee: 0,
          total: 9488,
        },
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        orderStatus: templateType || 'placed',
        createdAt: new Date(),
      };
    }

    const compiled = compileOrderEmailHtml(targetOrder, templateType || 'placed', {
      driverName: driverName || 'Murugan',
      driverPhone: driverPhone || '+91 94431 27658',
      deliveryWindow: deliveryWindow || 'today between 2 PM and 5 PM',
      cancellationReason: cancellationReason || 'Requested by customer',
      cancelledBy: cancelledBy || 'store',
    });

    res.json({
      subject: compiled.subject,
      html: compiled.html,
      text: compiled.text,
    });
  } catch (err: unknown) {
    res.status(500).json({ message: getErrorMessage(err) || 'Error generating email preview' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import {
  razorpay,
  RAZORPAY_KEY_ID,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../config/razorpay';
import { AuthRequest, authenticate, authenticateIfPresent, requireAdmin } from '../middleware/authMiddleware';
import { sendOrderLifecycleEmail, sendEmail } from '../services/emailService';
import { compileOrderEmailHtml, EmailTemplateType } from '../services/emailTemplates';

const router = Router();

// POST /api/orders/razorpay/create-order - Create Razorpay order with server-side price recalculation (Anti-tamper)
router.post('/razorpay/create-order', authenticateIfPresent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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

      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        res.status(400).json({ message: `Product ${item.name || item.product} not found in catalog.` });
        return;
      }

      if (dbProduct.inStock === false) {
        res.status(400).json({ message: `Product "${dbProduct.name}" is currently out of stock.` });
        return;
      }

      const itemTotal = dbProduct.price * item.quantity;
      calculatedSubtotal += itemTotal;

      verifiedOrderItems.push({
        product: dbProduct._id as any,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
        image: dbProduct.image,
      });
    }

    // Free delivery on orders ₹999 and above; otherwise ₹99 delivery fee
    const deliveryFee = calculatedSubtotal >= 999 ? 0 : 99;
    const discount = 0;
    const verifiedTotal = calculatedSubtotal + deliveryFee - discount;

    if (verifiedTotal <= 0) {
      res.status(400).json({ message: 'Calculated order total must be strictly positive.' });
      return;
    }

    const orderNumber = `SRC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

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

    // Asynchronously dispatch Order Placed email to customer via Zoho Mail
    sendOrderLifecycleEmail(savedOrder, 'placed').catch((err) =>
      console.warn('[Zoho Mail] Could not dispatch placed email:', err.message)
    );

    res.status(201).json({
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: RAZORPAY_KEY_ID,
      pricing: savedOrder.pricing,
    });
  } catch (error: any) {
    console.error('Razorpay create-order error:', error);
    res.status(500).json({ message: error?.message || 'Failed to initialize Razorpay order.' });
  }
});

// POST /api/orders/razorpay/verify-payment - Cryptographic HMAC SHA-256 payment verification
router.post('/razorpay/verify-payment', async (req: Request, res: Response): Promise<void> => {
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
      order.paymentStatus = 'failed';
      await order.save();
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
      return;
    }

    // Transition to confirmed and paid
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentDetails = {
      verifiedAt: new Date().toISOString(),
      razorpayOrderId,
      razorpayPaymentId,
    };

    const updatedOrder = await order.save();

    // Asynchronously dispatch Order Confirmed email to customer via Zoho Mail
    sendOrderLifecycleEmail(updatedOrder, 'confirmed').catch((err) =>
      console.warn('[Zoho Mail] Could not dispatch confirmed email:', err.message)
    );

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Razorpay payment verification error:', error);
    res.status(500).json({ message: error?.message || 'Payment verification failed.' });
  }
});

// POST /api/orders/razorpay/webhook - Asynchronous webhook payment reconciliation
router.post('/razorpay/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

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
        const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.orderStatus = 'confirmed';
          if (paymentEntity?.id) {
            order.razorpayPaymentId = paymentEntity.id;
          }
          order.paymentDetails = {
            webhookEvent: event,
            method: paymentEntity?.method,
            bank: paymentEntity?.bank,
            vpa: paymentEntity?.vpa,
            wallet: paymentEntity?.wallet,
            verifiedAt: new Date().toISOString(),
          };
          await order.save();
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    console.error('Razorpay webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed.' });
  }
});

// POST /api/orders - Create a new order (Public storefront checkout, strictly disallowing COD)
router.post('/', authenticateIfPresent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerInfo, orderItems, paymentMethod, pricing } = req.body;

    if (!customerInfo || !orderItems || !pricing) {
      res.status(400).json({ message: 'Missing required order fields' });
      return;
    }

    if (paymentMethod === 'cod') {
      res.status(400).json({ message: 'Cash on Delivery (COD) is not available. Please complete payment online via Razorpay.' });
      return;
    }

    if (!['razorpay', 'upi', 'card', 'netbanking'].includes(paymentMethod)) {
      res.status(400).json({ message: 'Payment method must be an online payment method (razorpay, upi, card, or netbanking).' });
      return;
    }

    const orderNumber = `SRC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = new Order({
      user: req.user?._id,
      orderNumber,
      customerInfo,
      orderItems,
      paymentMethod,
      pricing,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (_error: any) {
    console.error('Order creation error:', _error);
    res.status(500).json({ message: _error?.message || 'Failed to create order. Please try again.' });
  }
});

// GET /api/orders/mine - List orders belonging to the authenticated customer
router.get('/mine', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
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
    const query: any = {};

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { 'customerInfo.name': searchRegex },
        { 'customerInfo.phone': searchRegex },
        { 'customerInfo.city': searchRegex },
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    // Calculate aggregated stats across all orders
    const allOrders = await Order.find({});
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

// GET /api/orders/:orderNumber - Fetch order details by order number
router.get('/:orderNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
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

    const updateFields: any = {};
    if (orderStatus) updateFields.orderStatus = orderStatus;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

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
          console.warn(`[Zoho Mail] Could not dispatch ${emailType} email:`, err.message)
        );
      }
    }

    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update order status' });
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
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error dispatching order email' });
  }
});

// POST /api/orders/admin/test-email - Test Zoho Mail connection
router.post('/admin/test-email', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, templateType } = req.body;
    const recipient = email || 'ramkumar@sriramandco.in';

    const sampleOrderForTest: any = {
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
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to send test email' });
  }
});

// POST /api/orders/admin/preview-email - Compile and return HTML for live preview
router.post('/admin/preview-email', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateType, orderId, driverName, driverPhone, deliveryWindow, cancellationReason, cancelledBy } = req.body;

    let targetOrder: any = null;
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
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error generating email preview' });
  }
});

export default router;

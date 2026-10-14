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

    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update order status' });
  }
});

export default router;

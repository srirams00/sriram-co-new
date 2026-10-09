import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';

const router = Router();

// POST /api/orders - Create a new order
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerInfo, orderItems, paymentMethod, pricing } = req.body;

    if (!customerInfo || !orderItems || !pricing) {
      res.status(400).json({ message: 'Missing required order fields' });
      return;
    }

    if (!['upi', 'card'].includes(paymentMethod)) {
      res.status(400).json({ message: 'Payment method must be UPI or card' });
      return;
    }

    const orderNumber = `SRC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = new Order({
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

// GET /api/orders - List all orders with aggregated statistics
router.get('/', async (req: Request, res: Response): Promise<void> => {
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

// PATCH /api/orders/:id/status - Update order status and/or payment status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
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

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

    const orderNumber = `SRC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = new Order({
      orderNumber,
      customerInfo,
      orderItems,
      paymentMethod: paymentMethod || 'cod',
      pricing,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
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
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving order', error });
  }
});

export default router;

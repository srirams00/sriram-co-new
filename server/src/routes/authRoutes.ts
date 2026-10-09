import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User, IUser } from '../models/User';
import { Order } from '../models/Order';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'sriram_and_co_jwt_secret_dev_key_2026_xyz';

// Strict rate limiter for authentication routes (mitigates brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// Validation schemas
const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please provide a valid email address').max(150),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  phone: z.string().trim().max(20).optional(),
});

const LoginSchema = z.object({
  email: z.string().trim().min(3, 'Email or mobile number is required').max(150),
  password: z.string().min(1, 'Password is required').max(100),
});

const GoogleAuthSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  name: z.string().trim().min(1, 'Name is required'),
  photoUrl: z.string().optional(),
});

// POST /api/auth/google (Google OAuth / Firebase Login)
router.post('/google', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name } = GoogleAuthSchema.parse(req.body);

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // First-time Google user - create customer account
      const randomPassword = `G_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      user = new User({
        name,
        email: email.toLowerCase(),
        password: randomPassword,
        role: 'customer',
        phone: '',
      });
      await user.save();
    }

    const token = generateToken(user._id.toString());

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        address: user.address || {},
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phone } = RegisterSchema.parse(req.body);

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409, 'USER_ALREADY_EXISTS');
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
    });

    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    // Support login via email or mobile phone
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: email }],
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken(user._id.toString());

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me (Current user profile)
router.get('/me', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized, missing token', 401, 'NOT_AUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address || {},
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile (Update current user profile)
router.put('/profile', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized, missing token', 401, 'NOT_AUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const { name, phone, address } = req.body;
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address) {
      user.address = {
        street: address.street ?? user.address?.street ?? '',
        city: address.city ?? user.address?.city ?? '',
        state: address.state ?? user.address?.state ?? 'Tamil Nadu',
        postalCode: address.postalCode ?? user.address?.postalCode ?? '',
        landmark: address.landmark ?? user.address?.landmark ?? '',
      };
    }

    await user.save();

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address || {},
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/customers - List all registered customers with aggregate order statistics
router.get('/customers', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query;
    const query: any = { role: 'customer' };

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { 'address.city': searchRegex },
      ];
    }

    const customers = await User.find(query).sort({ createdAt: -1 });
    const allOrders = await Order.find({});

    const enrichedCustomers = customers.map((c) => {
      const customerOrders = allOrders.filter(
        (o) =>
          (o.user && o.user.toString() === c._id.toString()) ||
          (o.customerInfo?.email && o.customerInfo.email.toLowerCase() === c.email.toLowerCase())
      );

      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
      const ordersCount = customerOrders.length;
      const lastOrder = customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      return {
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        address: c.address || {},
        role: c.role,
        createdAt: c.createdAt,
        ordersCount,
        totalSpent,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
      };
    });

    const totalCustomers = enrichedCustomers.length;
    const activeCustomers = enrichedCustomers.filter((c) => c.ordersCount > 0).length;
    const totalRevenue = enrichedCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

    res.json({
      customers: enrichedCustomers,
      stats: {
        totalCustomers,
        activeCustomers,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

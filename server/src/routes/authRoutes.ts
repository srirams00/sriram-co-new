import { Router, Request, Response, NextFunction } from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User, IUser } from '../models/User.js';
import { Order } from '../models/Order.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAdmin, JWT_SECRET } from '../middleware/authMiddleware.js';

const router = Router();

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

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyCv81XKKvXB6xJg2jjrkXYJIy9BvvKsGLo';

const GoogleAuthSchema = z.object({
  idToken: z.string().min(10, 'Google ID token is required'),
  name: z.string().trim().optional(),
  photoUrl: z.string().optional(),
});

/**
 * Validates a Firebase / Google OAuth ID token against Google Identity Toolkit.
 * Ensures the email is cryptographically signed and verified by Google.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<{ email: string; name?: string; emailVerified: boolean }> {
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new AppError('Invalid or expired Google OAuth token. Authentication rejected.', 401, 'INVALID_OAUTH_TOKEN');
    }

    interface GoogleIdentityUser {
      email?: string;
      displayName?: string;
      emailVerified?: boolean;
    }

    interface GoogleVerifyResponse {
      users?: GoogleIdentityUser[];
    }

    const data = (await response.json()) as GoogleVerifyResponse;
    const verifiedUser = data?.users?.[0];
    if (!verifiedUser || !verifiedUser.email) {
      throw new AppError('Unable to extract verified identity from Google.', 401, 'OAUTH_VERIFICATION_FAILED');
    }

    return {
      email: verifiedUser.email.toLowerCase(),
      name: verifiedUser.displayName,
      emailVerified: Boolean(verifiedUser.emailVerified),
    };
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError('Google authentication service error. Please try again.', 502, 'OAUTH_SERVICE_ERROR');
  }
}

// POST /api/auth/google (Cryptographically verified Google OAuth / Firebase Login)
router.post('/google', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { idToken, name: clientName } = GoogleAuthSchema.parse(req.body);

    // Cryptographically verify token directly with Google Identity Toolkit
    const verifiedOAuth = await verifyGoogleIdToken(idToken);
    const verifiedEmail = verifiedOAuth.email;
    const verifiedName = verifiedOAuth.name || clientName || verifiedEmail.split('@')[0];

    let user = await User.findOne({ email: verifiedEmail });

    if (!user) {
      // First-time Google user - create strictly customer account (no privilege escalation)
      const randomPassword = `G_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      user = new User({
        name: verifiedName,
        email: verifiedEmail,
        password: randomPassword,
        role: 'customer',
        phone: '',
      });
      await user.save();
    } else if (user.role === 'admin' && !verifiedOAuth.emailVerified) {
      throw new AppError('Admin accounts require an email verified by Google.', 403, 'FORBIDDEN');
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
    if (mongoose.connection.readyState !== 1) {
      throw new AppError(
        'Database service is temporarily unavailable. Please verify MongoDB Atlas IP access rules (0.0.0.0/0 required for cloud hosting).',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

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

// POST /api/auth/login (Customer-only storefront authentication)
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError(
        'Database service is temporarily unavailable. Please verify MongoDB Atlas IP access rules (0.0.0.0/0 required for cloud hosting).',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const { email, password } = LoginSchema.parse(req.body);

    // Support login via email or mobile phone
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: email }],
    }).select('+password');

    // Prevent account enumeration & credential sniffing (OWASP ASVS):
    // Always return identical generic 401 error whether the account does not exist,
    // has a mismatched password, or is not an authorized customer account.
    if (!user || user.role !== 'customer') {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if account is temporarily locked due to brute-force attempts
    if (user.isLocked()) {
      const remainingMinutes = Math.max(1, Math.ceil((user.lockUntil!.getTime() - Date.now()) / (60 * 1000)));
      throw new AppError(
        `Account temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        423,
        'ACCOUNT_LOCKED'
      );
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
      }
      await user.save();
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed attempts upon successful authentication
    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
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

// POST /api/auth/admin-login (Protected administrator authentication gateway)
router.post('/admin-login', authLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: email }],
    }).select('+password');

    if (!user || user.role !== 'admin') {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if admin account is temporarily locked
    if (user.isLocked()) {
      const remainingMinutes = Math.max(1, Math.ceil((user.lockUntil!.getTime() - Date.now()) / (60 * 1000)));
      throw new AppError(
        `Account temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        423,
        'ACCOUNT_LOCKED'
      );
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
      }
      await user.save();
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed attempts upon successful authentication
    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
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

// GET /api/auth/customers - List all registered customers with aggregate order statistics (Protected: Admin only)
router.get('/customers', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query;
    const query: FilterQuery<IUser> = { role: 'customer' };

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
    const allOrders = await Order.find({ paymentStatus: 'paid' });

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

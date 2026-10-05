import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'sriram_and_co_jwt_secret_dev_key_2026_xyz';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// Validation schemas
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().min(3, 'Email or mobile number is required'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AppError } from './errorHandler';

export const JWT_SECRET = process.env.JWT_SECRET || 'sriram_and_co_jwt_secret_dev_key_2026_xyz';

export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Middleware to authenticate requests via Bearer JWT token
 */
export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401, 'NOT_AUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Invalid token format', 401, 'INVALID_TOKEN');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('User not found or session expired', 401, 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Token invalid or expired', 401, 'TOKEN_EXPIRED'));
      return;
    }
    next(error);
  }
};

/**
 * Middleware to restrict access strictly to Admin role
 */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  await authenticate(req, res, (err?: any) => {
    if (err) return next(err);

    if (!req.user || req.user.role !== 'admin') {
      return next(new AppError('Forbidden: Admin privileges required', 403, 'FORBIDDEN_ADMIN_ONLY'));
    }

    next();
  });
};

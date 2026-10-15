import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  // 2. Handle known AppError (or duck-typed error with statusCode and code)
  if (err instanceof AppError || (err && typeof err.statusCode === 'number' && typeof err.code === 'string')) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 3. Handle MongoDB Duplicate Key Error (E11000)
  if (err && (err.code === 11000 || err.name === 'MongoServerError' && err.code === 11000)) {
    const isEmail = err.keyPattern?.email || (err.message && err.message.includes('email'));
    const message = isEmail
      ? 'An account with this email address already exists. Please sign in instead.'
      : 'A record with this information already exists.';

    res.status(409).json({
      error: {
        code: 'USER_ALREADY_EXISTS',
        message,
      },
    });
    return;
  }

  // 4. Handle Mongoose Validation Errors
  if (err && err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors)
      .map((e: any) => e.message)
      .filter(Boolean)
      .join('; ');

    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: messages || 'Validation failed for model fields',
      },
    });
    return;
  }

  // 5. Handle Mongoose / MongoDB Connection & Timeout Errors
  if (
    err &&
    (err.name === 'MongooseServerSelectionError' ||
      (err.name === 'MongooseError' && typeof err.message === 'string' && err.message.includes('buffering timed out')))
  ) {
    console.error('Database unreachable or connection timeout:', err.message);
    res.status(503).json({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas IP access rules.',
      },
    });
    return;
  }

  // 6. Handle unhandled server errors (hide stack trace from clients)
  console.error('Unhandled Server Error:', {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
  });
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
};

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  isAppError,
  isMongoDuplicateKeyError,
  isMongooseValidationError,
  isNativeError,
  isRecord,
} from '../utils/typeGuards.js';

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
  err: unknown,
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
  if (err instanceof AppError || isAppError(err)) {
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
  if (isMongoDuplicateKeyError(err)) {
    const isEmail =
      err.keyPattern?.email ||
      (typeof err.message === 'string' && err.message.includes('email'));
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
  if (isMongooseValidationError(err)) {
    const messages = Object.values(err.errors)
      .map((e) => (typeof e?.message === 'string' ? e.message : ''))
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
  if (isRecord(err)) {
    const errName = typeof err.name === 'string' ? err.name : '';
    const errMessage = typeof err.message === 'string' ? err.message : '';

    if (
      errName === 'MongooseServerSelectionError' ||
      (errName === 'MongooseError' && errMessage.includes('buffering timed out'))
    ) {
      console.error('Database unreachable or connection timeout:', errMessage);
      res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas IP access rules.',
        },
      });
      return;
    }
  }

  // 6. Handle unhandled server errors (hide stack trace from clients)
  const nativeErr = isNativeError(err) ? err : null;
  console.error('Unhandled Server Error:', {
    name: nativeErr?.name || (isRecord(err) ? err.name : 'UnknownError'),
    message: nativeErr?.message || (isRecord(err) ? err.message : String(err)),
    stack: nativeErr?.stack,
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

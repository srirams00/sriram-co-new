/**
 * Type Narrowing Guards for Runtime Safety
 * Conforms to typescript-advanced-types standard (Unknown over Any)
 */

export interface AppErrorLike {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface MongoDuplicateKeyError {
  name?: string;
  code: 11000;
  keyPattern?: Record<string, number>;
  message: string;
}

export interface MongooseValidationError {
  name: 'ValidationError';
  errors: Record<string, { message?: string }>;
}

/**
 * Type guard for record objects (non-null, non-array object)
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for standard Error instances
 */
export function isNativeError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for AppError or duck-typed application errors with statusCode and code
 */
export function isAppError(value: unknown): value is AppErrorLike {
  if (!isRecord(value)) return false;
  return (
    typeof value.statusCode === 'number' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
}

/**
 * Type guard for MongoDB Duplicate Key Errors (E11000)
 */
export function isMongoDuplicateKeyError(value: unknown): value is MongoDuplicateKeyError {
  if (!isRecord(value)) return false;
  return value.code === 11000 && typeof value.message === 'string';
}

/**
 * Type guard for Mongoose validation errors
 */
export function isMongooseValidationError(value: unknown): value is MongooseValidationError {
  if (!isRecord(value)) return false;
  return value.name === 'ValidationError' && isRecord(value.errors);
}

/**
 * Safely extracts error message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isNativeError(error)) return error.message;
  if (isRecord(error) && typeof error.message === 'string') return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

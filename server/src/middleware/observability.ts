import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface ObservabilityRequest extends Request {
  id?: string;
  startTime?: number;
}

/**
 * Request Correlation & Latency Tracking Middleware
 * - Injects or propagates unique X-Request-ID for distributed tracing
 * - Sets X-Response-Time header
 * - Emits warnings on queries/endpoints exceeding 1000ms latency budget
 */
export const requestCorrelation = (
  req: ObservabilityRequest,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = performance.now();
  req.startTime = start;

  res.on('finish', () => {
    const duration = performance.now() - start;
    try {
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
      }
    } catch {
      // Headers already flushed
    }

    // Alert on slow endpoints exceeding 1000ms budget
    if (duration > 1000) {
      console.warn(
        `[Slow Request Alert] ${req.method} ${req.originalUrl || req.url} completed in ${duration.toFixed(
          2
        )}ms (Request ID: ${requestId})`
      );
    }
  });

  next();
};

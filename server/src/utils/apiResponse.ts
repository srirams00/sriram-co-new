/**
 * Standardized API Response Formatting Utility.
 * Conforms to Node.js Advanced Patterns & ApiResponse<T> schema.
 */

import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  [key: string]: unknown;
}

export class ApiResponse {
  /**
   * Dispatches a standardized successful response envelope.
   */
  static success<T>(
    res: Response,
    data: T,
    meta?: Record<string, unknown>,
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Dispatches a standardized paginated response with calculated navigation metadata.
   */
  static paginated<T>(
    res: Response,
    items: T[],
    page: number,
    limit: number,
    total: number,
    extraMeta?: Record<string, unknown>
  ): Response {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      ...(extraMeta && extraMeta),
    };

    return res.status(200).json({
      success: true,
      data: items,
      meta: pagination,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Dispatches a standardized error response envelope.
   */
  static error(
    res: Response,
    message: string,
    code = 'INTERNAL_ERROR',
    statusCode = 500,
    details?: unknown
  ): Response {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
    });
  }
}

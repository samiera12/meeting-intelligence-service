import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const traceId = req.traceId || 'unknown';

  if (err instanceof ZodError) {
    logger.warn('Validation error', { traceId, errors: err.issues });
    return res.status(400).json({
      traceId,
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: err.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
  }

  if (err instanceof AppError) {
    logger.warn('App error', { traceId, code: err.code, message: err.message });
    return res.status(err.statusCode).json({
      traceId,
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  logger.error('Unexpected error', { traceId, error: err.message, stack: err.stack });
  return res.status(500).json({
    traceId,
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
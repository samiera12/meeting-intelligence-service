import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function traceIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.traceId = (req.headers['x-trace-id'] as string) || randomUUID();
  res.setHeader('x-trace-id', req.traceId);
  next();
}
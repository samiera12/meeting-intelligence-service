import { Response } from 'express';

export const success = (res: Response, traceId: string, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ traceId, success: true, data });

export const created = (res: Response, traceId: string, data: unknown) =>
  success(res, traceId, data, 201);

export const notFound = (res: Response, traceId: string, message = 'Resource not found') =>
  res.status(404).json({ traceId, success: false, error: { code: 'NOT_FOUND', message } });

export const unauthorized = (res: Response, traceId: string, message = 'Unauthorized') =>
  res.status(401).json({ traceId, success: false, error: { code: 'UNAUTHORIZED', message } });

export const badRequest = (res: Response, traceId: string, message: string) =>
  res.status(400).json({ traceId, success: false, error: { code: 'BAD_REQUEST', message } });
import { Request, Response, NextFunction } from 'express';
import * as meetingsService from './meetings.service';
import { createMeetingSchema, listMeetingsSchema } from './meetings.schema';
import { success, created } from '../../utils/response';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createMeetingSchema.parse(req.body);
    const userId = req.user!.userId;
    const meeting = await meetingsService.createMeeting(body, userId);
    created(res, req.traceId, meeting);
  } catch (err) {
    next(err);
  }
}

export async function analyze(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const result = await meetingsService.analyzeMeeting(req.params.id as string, userId, req.traceId);
    success(res, req.traceId, result);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = listMeetingsSchema.parse(req.query);
    const userId = req.user!.userId;
    const result = await meetingsService.listMeetings(userId, page, limit);
    success(res, req.traceId, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const meeting = await meetingsService.getMeetingById(req.params.id as string, userId);
    success(res, req.traceId, meeting);
  } catch (err) {
    next(err);
  }
}
import { Request, Response, NextFunction } from 'express';
import * as actionItemsService from './actionItems.service';
import {
  createActionItemSchema,
  updateStatusSchema,
  listActionItemsSchema,
} from './actionItems.schema';
import { success, created } from '../../utils/response';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createActionItemSchema.parse(req.body);
    const userId = req.user!.userId;
    const item = await actionItemsService.createActionItem(body, userId);
    created(res, req.traceId, item);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const userId = req.user!.userId;
    const item = await actionItemsService.updateStatus(req.params.id as string, userId, status);
    success(res, req.traceId, item);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = listActionItemsSchema.parse(req.query);
    const userId = req.user!.userId;
    const result = await actionItemsService.listActionItems(userId, filters);
    success(res, req.traceId, result);
  } catch (err) {
    next(err);
  }
}

export async function overdue(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const items = await actionItemsService.getOverdueActionItems(userId);
    success(res, req.traceId, { actionItems: items });
  } catch (err) {
    next(err);
  }
}
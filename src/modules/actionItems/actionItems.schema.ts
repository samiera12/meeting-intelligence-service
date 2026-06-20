import { z } from 'zod';

export const createActionItemSchema = z.object({
  task: z.string().min(1, 'Task is required'),
  assignee: z.string().optional(),
  meetingId: z.string().uuid('meetingId must be a valid UUID').optional(),
  dueDate: z.string().datetime('dueDate must be a valid ISO 8601 date').optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    error: 'Status must be PENDING, IN_PROGRESS, or COMPLETED',
  }),
});

export const listActionItemsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  assignee: z.string().optional(),
  meetingId: z.string().uuid().optional(),
});

export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ListActionItemsInput = z.infer<typeof listActionItemsSchema>;
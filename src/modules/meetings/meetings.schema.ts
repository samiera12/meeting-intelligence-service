import { z } from 'zod';

const transcriptEntrySchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  speaker: z.string().min(1, 'Speaker name is required'),
  text: z.string().min(1, 'Transcript text is required'),
});

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(255),
  participants: z
    .array(z.string().email('Each participant must be a valid email'))
    .min(1, 'At least one participant is required'),
  meetingDate: z.string().datetime('meetingDate must be a valid ISO 8601 date'),
  transcript: z
    .array(transcriptEntrySchema)
    .min(1, 'Transcript must have at least one entry'),
});

export const listMeetingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type ListMeetingsInput = z.infer<typeof listMeetingsSchema>;
import { pool } from '../../db/pool';
import { AppError } from '../../utils/AppError';
import { CreateMeetingInput } from './meetings.schema';
import { analyzeMeeting as callAI } from '../../services/ai.service';
import { logger } from '../../config/logger';

export async function createMeeting(input: CreateMeetingInput, userId: string) {
  const result = await pool.query(
    `INSERT INTO meetings (user_id, title, participants, meeting_date, transcript)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, participants, meeting_date, transcript, created_at`,
    [
      userId,
      input.title,
      JSON.stringify(input.participants),
      input.meetingDate,
      JSON.stringify(input.transcript),
    ]
  );
  return result.rows[0];
}

export async function getMeetingById(meetingId: string, userId: string) {
  const result = await pool.query(
    `SELECT m.id, m.title, m.participants, m.meeting_date, m.transcript, m.created_at,
            ma.summary, ma.action_items AS "analysisActionItems",
            ma.decisions, ma.follow_ups, ma.analyzed_at
     FROM meetings m
     LEFT JOIN meeting_analyses ma ON ma.meeting_id = m.id
     WHERE m.id = $1 AND m.user_id = $2`,
    [meetingId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Meeting not found', 404, 'NOT_FOUND');
  }
  return result.rows[0];
}

export async function listMeetings(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [meetingsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, title, participants, meeting_date, created_at
       FROM meetings WHERE user_id = $1
       ORDER BY meeting_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    pool.query('SELECT COUNT(*) FROM meetings WHERE user_id = $1', [userId]),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);

  return {
    meetings: meetingsResult.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function analyzeMeeting(meetingId: string, userId: string, traceId: string) {
  const meetingResult = await pool.query(
    'SELECT * FROM meetings WHERE id = $1 AND user_id = $2',
    [meetingId, userId]
  );

  if (meetingResult.rows.length === 0) {
    throw new AppError('Meeting not found', 404, 'NOT_FOUND');
  }

  const meeting = meetingResult.rows[0];
  logger.info('Starting meeting analysis', { traceId, meetingId });

  const analysis = await callAI(meeting.transcript, traceId);

  await pool.query(
    `INSERT INTO meeting_analyses (meeting_id, summary, action_items, decisions, follow_ups)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (meeting_id) DO UPDATE SET
       summary = EXCLUDED.summary,
       action_items = EXCLUDED.action_items,
       decisions = EXCLUDED.decisions,
       follow_ups = EXCLUDED.follow_ups,
       analyzed_at = NOW()`,
    [
      meetingId,
      JSON.stringify(analysis.summary),
      JSON.stringify(analysis.actionItems),
      JSON.stringify(analysis.decisions),
      JSON.stringify(analysis.followUps),
    ]
  );

  for (const item of analysis.actionItems) {
    await pool.query(
      `INSERT INTO action_items (meeting_id, user_id, task, assignee, citations)
       VALUES ($1, $2, $3, $4, $5)`,
      [meetingId, userId, item.task, item.assignee || null, JSON.stringify(item.citations || [])]
    );
  }

  logger.info('Meeting analysis complete', {
    traceId,
    meetingId,
    actionItemsCreated: analysis.actionItems.length,
  });

  return analysis;
}
import { pool } from '../../db/pool';
import { AppError } from '../../utils/AppError';
import { CreateActionItemInput, ListActionItemsInput } from './actionItems.schema';

export async function createActionItem(input: CreateActionItemInput, userId: string) {
  const result = await pool.query(
    `INSERT INTO action_items (meeting_id, user_id, task, assignee, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.meetingId || null, userId, input.task, input.assignee || null, input.dueDate || null]
  );
  return result.rows[0];
}

export async function updateStatus(actionItemId: string, userId: string, status: string) {
  const result = await pool.query(
    `UPDATE action_items SET status = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [status, actionItemId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Action item not found', 404, 'NOT_FOUND');
  }
  return result.rows[0];
}

export async function listActionItems(userId: string, filters: ListActionItemsInput) {
  const { page, limit, status, assignee, meetingId } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['user_id = $1'];
  const values: any[] = [userId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (assignee) {
    conditions.push(`assignee ILIKE $${paramIndex++}`);
    values.push(`%${assignee}%`);
  }
  if (meetingId) {
    conditions.push(`meeting_id = $${paramIndex++}`);
    values.push(meetingId);
  }

  const whereClause = conditions.join(' AND ');

  const itemsQuery = `
    SELECT * FROM action_items
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  const countQuery = `SELECT COUNT(*) FROM action_items WHERE ${whereClause}`;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(itemsQuery, [...values, limit, offset]),
    pool.query(countQuery, values),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);

  return {
    actionItems: itemsResult.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getOverdueActionItems(userId: string) {
  const result = await pool.query(
    `SELECT * FROM action_items
     WHERE user_id = $1 AND status != 'COMPLETED' AND due_date < NOW()
     ORDER BY due_date ASC`,
    [userId]
  );
  return result.rows;
}
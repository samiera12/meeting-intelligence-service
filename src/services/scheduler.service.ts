import cron from 'node-cron';
import { pool } from '../db/pool';
import { sendOverdueReminder } from './email.service';
import { logger } from '../config/logger';

interface OverdueRow {
  id: string;
  task: string;
  assignee: string | null;
  status: string;
  due_date: string | null;
}

export async function runReminderJob() {
  logger.info('Reminder job started');

  const overdueResult = await pool.query<OverdueRow>(`
    SELECT id, task, assignee, status, due_date
    FROM action_items
    WHERE status != 'COMPLETED' AND due_date < NOW()
    ORDER BY due_date ASC
  `);

  const overdueItems = overdueResult.rows;
  logger.info(`Found ${overdueItems.length} overdue action item(s)`);

  for (const item of overdueItems) {
    const reminder = await sendOverdueReminder(item);

    await pool.query(
      `INSERT INTO reminder_logs (action_item_id, channel, success, error_message)
       VALUES ($1, 'email', $2, $3)`,
      [item.id, reminder.success, reminder.error || null]
    );
  }

  logger.info('Reminder job completed', { processed: overdueItems.length });
}

export function startScheduler() {
  logger.info('Starting reminder scheduler (runs every hour)');

  cron.schedule('0 * * * *', async () => {
    try {
      await runReminderJob();
    } catch (err: any) {
      logger.error('Reminder job failed', { error: err.message });
    }
  });
}
import { Resend } from 'resend';
import { config } from '../config';
import { logger } from '../config/logger';

const resend = new Resend(config.resend.apiKey);

interface ActionItemForReminder {
  id: string;
  task: string;
  assignee: string | null;
  status: string;
  due_date: string | null;
}

export async function sendOverdueReminder(
  item: ActionItemForReminder
): Promise<{ success: boolean; error?: string }> {
  const dueDate = item.due_date
    ? new Date(item.due_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No due date set';

  const html = `
    <h2>⚠️ Overdue Action Item Reminder</h2>
    <p><strong>Task:</strong> ${item.task}</p>
    <p><strong>Assigned To:</strong> ${item.assignee || 'Unassigned'}</p>
    <p><strong>Due Date:</strong> ${dueDate}</p>
    <p><strong>Status:</strong> ${item.status}</p>
  `;

  try {
    await resend.emails.send({
      from: config.resend.fromEmail,
      to: config.resend.toEmail,
      subject: `Overdue: ${item.task}`,
      html,
    });
    logger.info('Email reminder sent', { actionItemId: item.id });
    return { success: true };
  } catch (err: any) {
    const errorMessage = err.message || 'Unknown email error';
    logger.error('Email reminder failed', { actionItemId: item.id, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
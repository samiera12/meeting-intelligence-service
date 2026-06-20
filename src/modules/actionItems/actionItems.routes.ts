import { Router } from 'express';
import * as actionItemsController from './actionItems.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/action-items/overdue:
 *   get:
 *     summary: Get all overdue action items (status != COMPLETED and due_date in the past)
 *     tags: [Action Items]
 *     responses:
 *       200: { description: List of overdue action items }
 */
router.get('/overdue', actionItemsController.overdue);

/**
 * @openapi
 * /api/action-items:
 *   post:
 *     summary: Create a manual action item
 *     tags: [Action Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task]
 *             properties:
 *               task: { type: string }
 *               assignee: { type: string }
 *               meetingId: { type: string }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201: { description: Action item created }
 *   get:
 *     summary: List action items with optional filters
 *     tags: [Action Items]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, IN_PROGRESS, COMPLETED] }
 *       - in: query
 *         name: assignee
 *         schema: { type: string }
 *       - in: query
 *         name: meetingId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated, filtered list of action items }
 */
router.post('/', actionItemsController.create);
router.get('/', actionItemsController.list);

/**
 * @openapi
 * /api/action-items/{id}/status:
 *   patch:
 *     summary: Update an action item's status
 *     tags: [Action Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PENDING, IN_PROGRESS, COMPLETED] }
 *     responses:
 *       200: { description: Updated action item }
 *       404: { description: Action item not found }
 */
router.patch('/:id/status', actionItemsController.updateStatus);

export default router;
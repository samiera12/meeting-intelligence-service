import { Router } from 'express';
import * as meetingsController from './meetings.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/meetings:
 *   post:
 *     summary: Create a meeting with transcript
 *     tags: [Meetings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, participants, meetingDate, transcript]
 *             properties:
 *               title: { type: string }
 *               participants: { type: array, items: { type: string } }
 *               meetingDate: { type: string, format: date-time }
 *               transcript:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     timestamp: { type: string, example: "00:10" }
 *                     speaker: { type: string }
 *                     text: { type: string }
 *     responses:
 *       201: { description: Meeting created }
 *       400: { description: Validation error }
 *   get:
 *     summary: List meetings (paginated)
 *     tags: [Meetings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated list of meetings }
 */
router.post('/', meetingsController.create);
router.get('/', meetingsController.list);

/**
 * @openapi
 * /api/meetings/{id}:
 *   get:
 *     summary: Get a meeting by ID (includes analysis if present)
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Meeting details }
 *       404: { description: Meeting not found }
 */
router.get('/:id', meetingsController.getById);

/**
 * @openapi
 * /api/meetings/{id}/analyze:
 *   post:
 *     summary: Run AI analysis on a meeting transcript (summary, action items, decisions, follow-ups — all with citations)
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Analysis result, grounded with transcript citations }
 *       404: { description: Meeting not found }
 *       503: { description: AI service unavailable }
 */
router.post('/:id/analyze', meetingsController.analyze);

export default router;
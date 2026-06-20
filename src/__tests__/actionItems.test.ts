import request from 'supertest';
import express from 'express';
import authRoutes from '../modules/auth/auth.routes';
import actionItemsRoutes from '../modules/actionItems/actionItems.routes';
import { errorHandler } from '../middleware/errorHandler';
import { traceIdMiddleware } from '../middleware/traceId';

const app = express();
app.use(express.json());
app.use(traceIdMiddleware);
app.use('/api/auth', authRoutes);
app.use('/api/action-items', actionItemsRoutes);
app.use(errorHandler);

let token: string;
const uniqueEmail = `actionitems_${Date.now()}@example.com`;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Action Item Tester',
    email: uniqueEmail,
    password: 'password123',
  });
  token = res.body.data.token;
});

describe('Action Items', () => {
  let createdId: string;

  it('creates an action item with a past due date', async () => {
    const res = await request(app)
      .post('/api/action-items')
      .set('Authorization', `Bearer ${token}`)
      .send({ task: 'Overdue test task', assignee: 'Bob', dueDate: '2020-01-01T00:00:00Z' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    createdId = res.body.data.id;
  });

  it('rejects creation without a task field', async () => {
    const res = await request(app)
      .post('/api/action-items')
      .set('Authorization', `Bearer ${token}`)
      .send({ assignee: 'Bob' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('detects the item as overdue', async () => {
    const res = await request(app)
      .get('/api/action-items/overdue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = res.body.data.actionItems.find((i: any) => i.id === createdId);
    expect(found).toBeDefined();
  });

  it('updates status to COMPLETED and removes it from overdue list', async () => {
    const updateRes = await request(app)
      .patch(`/api/action-items/${createdId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'COMPLETED' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('COMPLETED');

    const overdueRes = await request(app)
      .get('/api/action-items/overdue')
      .set('Authorization', `Bearer ${token}`);

    const found = overdueRes.body.data.actionItems.find((i: any) => i.id === createdId);
    expect(found).toBeUndefined();
  });

  it('rejects invalid status values', async () => {
    const res = await request(app)
      .patch(`/api/action-items/${createdId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'NOT_A_REAL_STATUS' });

    expect(res.status).toBe(400);
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/action-items');
    expect(res.status).toBe(401);
  });
});
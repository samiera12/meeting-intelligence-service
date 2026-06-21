import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './config/logger';
import { traceIdMiddleware } from './middleware/traceId';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import meetingsRoutes from './modules/meetings/meetings.routes';
import actionItemsRoutes from './modules/actionItems/actionItems.routes';
import { startScheduler } from './services/scheduler.service';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(traceIdMiddleware);
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

app.get('/api/evaluation', (req, res) => {
  res.json({
    candidateName: 'Samiera R Nair',
    email: 'samierarnair@gmail.com',
    repositoryUrl: 'https://github.com/samiera12/meeting-intelligence-service',
    deployedUrl: 'https://meeting-intelligence-service-dn5p.onrender.com',
    externalIntegration: 'Resend (Email API)',
    features: [
      'Authentication (JWT)',
      'Meeting Management',
      'AI Meeting Analysis with Citations',
      'Hallucination Prevention / Grounding',
      'Action Item Management',
      'Overdue Detection',
      'Scheduled Reminder Job',
      'Email Integration (Resend)',
    ],
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/action-items', actionItemsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  startScheduler();
});
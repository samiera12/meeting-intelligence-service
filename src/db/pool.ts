import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../config/logger';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false }, // Render requires SSL, even on free tier
  min: 2,
  max: 10,
});

pool.on('connect', () => logger.info('PostgreSQL client connected'));
pool.on('error', (err) => logger.error('PostgreSQL pool error', { error: err.message }));
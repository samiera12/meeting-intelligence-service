import fs from 'fs';
import path from 'path';
import { pool } from './pool';
import { logger } from '../config/logger';

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  logger.info(`Running ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    logger.info(`Executing migration: ${file}`);
    await pool.query(sql);
    logger.info(`Done: ${file}`);
  }

  logger.info('All migrations complete.');
  await pool.end();
}

migrate().catch((err) => {
  logger.error('Migration failed', { error: err.message });
  process.exit(1);
});
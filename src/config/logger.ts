import { createLogger, format, transports } from 'winston';
import { config } from './index';

export const logger = createLogger({
  level: 'info',
  format:
    config.nodeEnv === 'production'
      ? format.combine(format.timestamp(), format.json())
      : format.combine(
          format.colorize(),
          format.timestamp({ format: 'HH:mm:ss' }),
          format.printf(({ timestamp, level, message, ...meta }) => {
            const extras = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level}] ${message} ${extras}`;
          })
        ),
  transports: [new transports.Console()],
});
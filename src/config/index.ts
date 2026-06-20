import dotenv from 'dotenv';
dotenv.config();

// Fail fast if any required env var is missing
const required = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY', 'RESEND_API_KEY'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL as string,
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY as string,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY as string,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    toEmail: process.env.REMINDER_TO_EMAIL || '',
  },
};
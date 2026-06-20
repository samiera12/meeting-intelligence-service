import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool';
import { config } from '../../config';
import { AppError } from '../../utils/AppError';
import { RegisterInput, LoginInput } from './auth.schema';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

function signToken(user: { id: string; name: string; email: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}

export async function register({ name, email, password }: RegisterInput) {
  const existing = await pool.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
    email,
  ]);

  if (existing.rows.length > 0) {
    throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query<UserRow>(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name, email, passwordHash]
  );

  const user = result.rows[0];
  const token = signToken(user);

  return { user: { id: user.id, name: user.name, email: user.email }, token };
}

export async function login({ email, password }: LoginInput) {
  const result = await pool.query<UserRow>(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken(user);
  return { user: { id: user.id, name: user.name, email: user.email }, token };
}
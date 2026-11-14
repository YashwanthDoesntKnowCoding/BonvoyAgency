const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

function createTokens(user) {
  const payload = { sub: user.user_id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

async function registerUser({ full_name, email, password, phone }) {
  const [existing] = await db.execute('SELECT user_id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length) {
    const err = new Error('User already exists');
    err.code = 'USER_EXISTS';
    err.statusCode = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  let result;
  try {
    [result] = await db.execute(
      'INSERT INTO users (full_name, email, password_hash, phone, role, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [full_name, email, password_hash, phone, 'customer'],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.code = 'USER_EXISTS';
      error.statusCode = 409;
      error.message = 'User already exists';
    }
    throw error;
  }
  const user = { user_id: result.insertId, full_name, email, phone, role: 'customer', is_active: 1 };
  return { user, ...createTokens(user) };
}

async function loginUser({ email, password }) {
  const [rows] = await db.execute(
    'SELECT user_id, full_name, email, password_hash, phone, role, is_active FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  const user = rows[0];
  if (!user) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    err.statusCode = 401;
    throw err;
  }

  if (!user.is_active) {
    const err = new Error('This account is inactive');
    err.code = 'ACCOUNT_INACTIVE';
    err.statusCode = 403;
    throw err;
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    err.statusCode = 401;
    throw err;
  }

  const dto = { ...user, password_hash: undefined };
  return { user: dto, ...createTokens(dto) };
}

async function getUserById(userId) {
  const [rows] = await db.execute(
    'SELECT user_id, full_name, email, phone, role, is_active, created_at FROM users WHERE user_id = ? LIMIT 1',
    [Number(userId)],
  );
  return rows[0] || null;
}

async function updateUserProfile(userId, { full_name, email, phone }) {
  try {
    await db.execute(
      'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE user_id = ?',
      [full_name ?? null, email ?? null, phone ?? null, Number(userId)],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.code = 'USER_EXISTS';
      error.statusCode = 409;
      error.message = 'That email address is already in use';
    }
    throw error;
  }
  return getUserById(userId);
}

async function updatePassword(userId, currentPassword, newPassword) {
  const [rows] = await db.execute('SELECT password_hash FROM users WHERE user_id = ? LIMIT 1', [Number(userId)]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    const error = new Error('Current password is incorrect');
    error.code = 'INVALID_CURRENT_PASSWORD';
    error.statusCode = 400;
    throw error;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [passwordHash, Number(userId)]);
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  updatePassword,
  createTokens,
};

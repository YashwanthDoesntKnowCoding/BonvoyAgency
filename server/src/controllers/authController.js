const { z } = require('zod');
const {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  updatePassword,
} = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const profileSchema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
}).refine((profile) => Object.keys(profile).length > 0, 'At least one profile field is required');
const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return res.status(201).json(successResponse(result, 'Registration successful'));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.code = 'USER_EXISTS';
      error.statusCode = 409;
      error.message = 'User already exists';
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return res.status(200).json(successResponse(result, 'Login successful'));
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json(errorResponse('USER_NOT_FOUND', 'User not found'));
    }
    return res.status(200).json(successResponse({ user }, 'Profile fetched'));
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const payload = profileSchema.parse(req.body);
    const user = await updateUserProfile(req.userId, payload);
    return res.json(successResponse({ user }, 'Profile updated'));
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    await updatePassword(req.userId, currentPassword, newPassword);
    return res.json(successResponse(null, 'Password updated'));
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, me, updateProfile, changePassword };

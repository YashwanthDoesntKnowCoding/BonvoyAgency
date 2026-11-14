const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json(errorResponse('UNAUTHORIZED', 'Missing or invalid token'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    return next();
  } catch (error) {
    return res.status(401).json(errorResponse('UNAUTHORIZED', 'Token expired or invalid'));
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.userRole || req.userRole !== role) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'You do not have access to this resource'));
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };

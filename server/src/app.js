const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const customerRoutes = require('./routes/customerRoutes');
const agentRoutes = require('./routes/agentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundHandler, generalErrorHandler } = require('./middleware/errorHandler');
const { successResponse } = require('./utils/response');
const db = require('./config/db');

const app = express();
const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/api/v1/health', async (req, res) => {
  try {
    await db.execute('SELECT 1');
    res.json(successResponse({ ok: true, database: 'connected', uptime: process.uptime() }, 'Server healthy'));
  } catch (error) {
    console.error('MySQL health check failed:', error.message);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'The application database is unavailable' },
    });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', publicRoutes);
app.use('/api/v1', customerRoutes);
app.use('/api/v1/agent', agentRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFoundHandler);
app.use(generalErrorHandler);

module.exports = app;

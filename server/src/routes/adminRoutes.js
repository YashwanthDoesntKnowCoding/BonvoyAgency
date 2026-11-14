const express = require('express');
const { dashboard, auditLogs } = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));
router.get('/dashboard', dashboard);
router.get('/audit-logs', auditLogs);

module.exports = router;

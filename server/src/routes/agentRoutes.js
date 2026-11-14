const express = require('express');
const { dashboard, bookings } = require('../controllers/agentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('agent'));
router.get('/dashboard', dashboard);
router.get('/bookings', bookings);

module.exports = router;

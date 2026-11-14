const express = require('express');
const { register, login, me, updateProfile, changePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', (req, res) => res.json({ success: true, data: { accessToken: 'demo-access-token' }, message: 'Refresh token accepted' }));
router.post('/logout', (req, res) => res.json({ success: true, data: null, message: 'Logged out' }));
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);
router.patch('/password', requireAuth, changePassword);

module.exports = router;

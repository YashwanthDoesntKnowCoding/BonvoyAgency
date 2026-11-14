const express = require('express');
const {
  quote,
  createBooking,
  getBookings,
  getBookingById,
  payBooking,
  cancelBooking,
  validateCoupon,
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} = require('../controllers/customerController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/bookings/quote', requireAuth, quote);
router.post('/bookings', requireAuth, createBooking);
router.get('/bookings', requireAuth, getBookings);
router.get('/bookings/:id', requireAuth, getBookingById);
router.post('/bookings/:id/pay', requireAuth, payBooking);
router.post('/bookings/:id/cancel', requireAuth, cancelBooking);
router.post('/coupons/validate', requireAuth, validateCoupon);

router.get('/wishlist', requireAuth, getWishlist);
router.post('/wishlist', requireAuth, addWishlistItem);
router.delete('/wishlist/:packageId', requireAuth, removeWishlistItem);

router.get('/reviews', requireAuth, (req, res) => res.json({ success: true, data: [], message: 'Reviews fetched' }));
router.post('/reviews', requireAuth, (req, res) => res.json({ success: true, data: { reviewId: 1 }, message: 'Review submitted' }));
router.delete('/reviews/:id', requireAuth, (req, res) => res.json({ success: true, data: null, message: 'Review deleted' }));

module.exports = router;

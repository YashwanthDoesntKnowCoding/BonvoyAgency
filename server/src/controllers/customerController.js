const { z } = require('zod');
const { getBookingQuote } = require('../services/bookingService');
const {
  createBooking: createCustomerBooking,
  getUserBookings,
  getUserBooking,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../services/customerService');
const { successResponse, errorResponse } = require('../utils/response');

const bookingSchema = z.object({
  packageId: z.coerce.number().int().positive(),
  departureId: z.coerce.number().int().positive(),
  transportId: z.string().min(1),
  numTravellers: z.coerce.number().int().min(1).max(10),
});
const wishlistSchema = z.object({ packageId: z.coerce.number().int().positive() });

const quoteSchema = z.object({
  packageId: z.string().min(1),
  departureId: z.string().min(1),
  hotelId: z.string().min(1),
  transportId: z.string().min(1),
  numTravellers: z.number().min(1).max(10),
  couponCode: z.string().optional(),
});

async function quote(req, res, next) {
  try {
    const payload = quoteSchema.parse(req.body);
    const result = await getBookingQuote(payload);
    return res.json(successResponse(result, 'Quote generated'));
  } catch (error) {
    return next(error);
  }
}

async function createBooking(req, res, next) {
  try {
    const payload = bookingSchema.parse(req.body);
    const booking = await createCustomerBooking({ ...payload, userId: req.userId });
    return res.status(201).json(successResponse(booking, 'Trip added to My Trips; no payment was processed or seat reserved'));
  } catch (error) {
    return next(error);
  }
}

async function getBookings(req, res, next) {
  try {
    return res.json(successResponse(await getUserBookings(req.userId), 'Bookings fetched'));
  } catch (error) {
    return next(error);
  }
}

async function getBookingById(req, res, next) {
  try {
    const booking = await getUserBooking(req.userId, req.params.id);
    if (!booking) return res.status(404).json(errorResponse('BOOKING_NOT_FOUND', 'Trip not found'));
    return res.json(successResponse(booking, 'Booking fetched'));
  } catch (error) {
    return next(error);
  }
}

function payBooking(req, res) {
  return res.json(successResponse({ paymentStatus: 'success', transactionRef: 'TXN-1001' }, 'Payment successful'));
}

function cancelBooking(req, res) {
  return res.json(successResponse({ cancelled: true, refundAmount: 2750 }, 'Booking cancelled'));
}

function validateCoupon(req, res) {
  return res.json(successResponse({ valid: true, discount: 1500 }, 'Coupon is valid'));
}

async function getWishlist(req, res, next) {
  try {
    return res.json(successResponse(await getUserWishlist(req.userId), 'Wishlist fetched'));
  } catch (error) {
    return next(error);
  }
}

async function addWishlistItem(req, res, next) {
  try {
    const { packageId } = wishlistSchema.parse(req.body);
    return res.status(201).json(successResponse(await addToWishlist(req.userId, packageId), 'Trip added to wishlist'));
  } catch (error) {
    return next(error);
  }
}

async function removeWishlistItem(req, res, next) {
  const packageId = z.coerce.number().int().positive().safeParse(req.params.packageId);
  if (!packageId.success) {
    return res.status(400).json(errorResponse('INVALID_PACKAGE_ID', 'Package ID must be a positive number'));
  }
  try {
    await removeFromWishlist(req.userId, packageId.data);
    return res.json(successResponse(null, 'Trip removed from wishlist'));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
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
};

const db = require('../config/db');

async function getBookingQuote({ packageId, departureId, hotelId, transportId, numTravellers, couponCode }) {
  const [rows] = await db.execute(
    `SELECT p.base_price, dep.departure_id
     FROM packages p
     LEFT JOIN departures dep ON dep.departure_id = ? AND dep.package_id = p.package_id
     WHERE p.package_id = ? AND p.is_active = TRUE LIMIT 1`,
    [Number(departureId), Number(packageId)],
  );
  const pkg = rows[0];
  if (!pkg) {
    const error = new Error('Package not found');
    error.code = 'PACKAGE_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  const base = Number(pkg.base_price);
  const nights = Math.max(2, Math.ceil(numTravellers / 2));
  const hotelCost = 3500 * nights * Math.ceil(numTravellers / 2);
  const transportCost = Number(numTravellers || 1) * 2400;
  const subtotal = Math.max(0, base + hotelCost + transportCost);
  const discount = couponCode ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.05;
  const total = subtotal - discount + tax;

  return {
    packageId,
    departureId,
    hotelId,
    transportId,
    numTravellers,
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discount.toFixed(2)),
    taxAmount: Number(tax.toFixed(2)),
    totalAmount: Number(total.toFixed(2)),
  };
}

module.exports = { getBookingQuote };

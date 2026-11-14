const db = require('../config/db');
const { successResponse } = require('../utils/response');

async function dashboard(req, res) {
  const [packageRows] = await db.execute(
    'SELECT COUNT(*) AS packages FROM packages WHERE created_by = ? AND is_active = TRUE',
    [req.userId],
  );
  const [departureRows] = await db.execute(
    `SELECT COUNT(DISTINCT d.departure_id) AS departures
     FROM departures d JOIN packages p ON p.package_id = d.package_id
     WHERE p.created_by = ?`,
    [req.userId],
  );
  const [bookingRows] = await db.execute(
    `SELECT COUNT(*) AS pendingBookings
     FROM bookings b JOIN packages p ON p.package_id = b.package_id
     WHERE p.created_by = ? AND b.status IN ('saved', 'pending')`,
    [req.userId],
  );
  return res.json(successResponse({
    packages: packageRows[0].packages,
    departures: departureRows[0].departures,
    pendingBookings: bookingRows[0].pendingBookings,
  }, 'Agent dashboard loaded'));
}

async function bookings(req, res) {
  const [rows] = await db.execute(
    `SELECT b.booking_ref AS bookingId, b.status, b.created_at AS createdAt,
       b.num_travellers AS numTravellers, b.total_amount AS totalAmount,
       p.title AS packageTitle, u.full_name AS customerName
     FROM bookings b
     JOIN packages p ON p.package_id = b.package_id
     JOIN users u ON u.user_id = b.user_id
     WHERE p.created_by = ?
     ORDER BY b.created_at DESC`,
    [req.userId],
  );
  return res.json(successResponse(rows, 'Bookings queue fetched'));
}

module.exports = { dashboard, bookings };

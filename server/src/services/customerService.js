const db = require('../config/db');
const { getTransportOptions } = require('./catalogService');

function createServiceError(message, code, statusCode) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

async function createBooking({ userId, packageId, departureId, numTravellers, transportId }) {
  const [rows] = await db.execute(
    `SELECT p.package_id, p.title, p.slug, p.base_price, p.route_distance_km,
       d.name AS destination_name, d.state AS destination_state,
       dep.departure_id, dep.start_date, dep.end_date, dep.available_seats, dep.status AS departure_status
     FROM packages p
     INNER JOIN destinations d ON d.destination_id = p.destination_id
     INNER JOIN departures dep ON dep.package_id = p.package_id
     WHERE p.package_id = ? AND dep.departure_id = ? AND p.is_active = TRUE LIMIT 1`,
    [Number(packageId), Number(departureId)],
  );
  const pkg = rows[0];
  if (!pkg) throw createServiceError('Package or departure not found', 'PACKAGE_NOT_FOUND', 404);
  if (pkg.departure_status !== 'open') {
    throw createServiceError('Departure is not available', 'DEPARTURE_NOT_FOUND', 404);
  }
  if (Number(numTravellers) > Number(pkg.available_seats)) {
    throw createServiceError('Not enough seats are available for this departure', 'INSUFFICIENT_SEATS', 409);
  }

  const transport = getTransportOptions(pkg).find((option) => option.id === transportId);
  if (!transport) throw createServiceError('Choose a valid transportation option', 'INVALID_TRANSPORT', 400);

  const subtotal = Math.max(0, (Number(pkg.base_price) + transport.price_adjustment) * Number(numTravellers));
  const taxAmount = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + taxAmount;
  const connection = await db.getConnection();
  let bookingId;
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO bookings
        (user_id, package_id, departure_id, num_travellers, transport_id, transport_label,
         subtotal, tax_amount, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'saved')`,
      [
        Number(userId), pkg.package_id, pkg.departure_id, Number(numTravellers), transport.id,
        transport.label, subtotal, taxAmount, totalAmount,
      ],
    );
    bookingId = `BV-${new Date().getFullYear()}-${String(result.insertId).padStart(5, '0')}`;
    await connection.execute('UPDATE bookings SET booking_ref = ? WHERE booking_id = ?', [bookingId, result.insertId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return {
    bookingId,
    userId: Number(userId),
    packageId: pkg.package_id,
    packageTitle: pkg.title,
    packageSlug: pkg.slug,
    destinationName: pkg.destination_name,
    destinationState: pkg.destination_state,
    departureId: pkg.departure_id,
    startDate: pkg.start_date,
    endDate: pkg.end_date,
    numTravellers: Number(numTravellers),
    transportId: transport.id,
    transportLabel: transport.label,
    subtotal,
    taxAmount,
    totalAmount,
    status: 'saved',
    createdAt: new Date().toISOString(),
  };
}

const bookingSelect = `
  SELECT b.booking_ref AS bookingId, b.user_id AS userId, b.package_id AS packageId,
    p.title AS packageTitle, p.slug AS packageSlug, d.name AS destinationName,
    d.state AS destinationState, b.departure_id AS departureId, dep.start_date AS startDate,
    dep.end_date AS endDate, b.num_travellers AS numTravellers, b.transport_id AS transportId,
    b.transport_label AS transportLabel, b.subtotal, b.tax_amount AS taxAmount,
    b.total_amount AS totalAmount, b.status, b.created_at AS createdAt
  FROM bookings b
  INNER JOIN packages p ON p.package_id = b.package_id
  INNER JOIN destinations d ON d.destination_id = p.destination_id
  INNER JOIN departures dep ON dep.departure_id = b.departure_id`;

async function getUserBookings(userId) {
  const [rows] = await db.execute(`${bookingSelect} WHERE b.user_id = ? ORDER BY b.created_at DESC`, [Number(userId)]);
  return rows;
}

async function getUserBooking(userId, bookingId) {
  const [rows] = await db.execute(`${bookingSelect} WHERE b.user_id = ? AND b.booking_ref = ? LIMIT 1`, [Number(userId), bookingId]);
  return rows[0] || null;
}

async function getUserWishlist(userId) {
  const [rows] = await db.execute(
    `SELECT p.*, d.name AS destination_name, d.state AS destinationState,
       d.image_url AS destination_image_url, d.country, d.region
     FROM wishlist w
     INNER JOIN packages p ON p.package_id = w.package_id
     INNER JOIN destinations d ON d.destination_id = p.destination_id
     WHERE w.user_id = ? AND p.is_active = TRUE
     ORDER BY w.added_at DESC`,
    [Number(userId)],
  );
  return rows.map((pkg) => ({
    ...pkg,
    packageId: pkg.package_id,
    title: pkg.title,
    image_url: pkg.image_url || pkg.destination_image_url,
  }));
}

async function addToWishlist(userId, packageId) {
  const [packages] = await db.execute(
    'SELECT package_id FROM packages WHERE package_id = ? AND is_active = TRUE LIMIT 1',
    [Number(packageId)],
  );
  if (!packages.length) throw createServiceError('Package not found', 'PACKAGE_NOT_FOUND', 404);
  await db.execute(
    'INSERT INTO wishlist (user_id, package_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE added_at = added_at',
    [Number(userId), Number(packageId)],
  );
  return (await getUserWishlist(userId)).find((item) => item.packageId === Number(packageId));
}

async function removeFromWishlist(userId, packageId) {
  await db.execute('DELETE FROM wishlist WHERE user_id = ? AND package_id = ?', [Number(userId), Number(packageId)]);
}

module.exports = {
  createBooking,
  getUserBookings,
  getUserBooking,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
};

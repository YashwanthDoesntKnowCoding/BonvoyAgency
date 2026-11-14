const db = require('../config/db');
const { successResponse } = require('../utils/response');

async function dashboard(req, res) {
  const [[revenue]] = await db.execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS revenue
     FROM bookings WHERE status IN ('confirmed', 'completed')`,
  );
  const [[bookings]] = await db.execute('SELECT COUNT(*) AS bookings FROM bookings');
  const [[packages]] = await db.execute('SELECT COUNT(*) AS activePackages FROM packages WHERE is_active = TRUE');
  const [[users]] = await db.execute('SELECT COUNT(*) AS activeUsers FROM users WHERE is_active = TRUE');
  return res.json(successResponse({
    revenue: Number(revenue.revenue),
    bookings: bookings.bookings,
    activePackages: packages.activePackages,
    activeUsers: users.activeUsers,
  }, 'Admin dashboard loaded'));
}

async function auditLogs(req, res) {
  const [rows] = await db.execute(
    `SELECT audit_id AS log_id, table_name, record_id, action, new_data, changed_at
     FROM audit_logs ORDER BY changed_at DESC LIMIT 100`,
  );
  return res.json(successResponse(rows, 'Audit logs fetched'));
}

module.exports = { dashboard, auditLogs };

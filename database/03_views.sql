USE bonvoyagency;

CREATE OR REPLACE VIEW v_package_listing AS
SELECT
  p.package_id,
  p.title,
  d.name AS destination_name,
  d.state,
  p.base_price,
  ROUND(AVG(r.rating), 2) AS avg_rating,
  COUNT(DISTINCT r.review_id) AS review_count,
  MIN(dep.start_date) AS next_departure
FROM packages p
JOIN destinations d ON d.destination_id = p.destination_id
LEFT JOIN reviews r ON r.package_id = p.package_id
LEFT JOIN departures dep
  ON dep.package_id = p.package_id
  AND dep.start_date >= CURRENT_DATE()
  AND dep.status = 'open'
WHERE p.is_active = TRUE
GROUP BY p.package_id, p.title, d.name, d.state, p.base_price;

CREATE OR REPLACE VIEW v_booking_details AS
SELECT
  b.booking_id,
  b.booking_ref,
  u.full_name AS customer_name,
  p.title AS package_title,
  d.name AS destination_name,
  dep.start_date,
  dep.end_date,
  b.transport_label,
  b.num_travellers,
  b.total_amount,
  b.status,
  b.created_at
FROM bookings b
JOIN users u ON u.user_id = b.user_id
JOIN packages p ON p.package_id = b.package_id
JOIN destinations d ON d.destination_id = p.destination_id
JOIN departures dep ON dep.departure_id = b.departure_id;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  DATE_FORMAT(created_at, '%Y-%m-01') AS month,
  SUM(total_amount) AS revenue
FROM bookings
WHERE status IN ('confirmed', 'completed')
GROUP BY DATE_FORMAT(created_at, '%Y-%m-01');

CREATE OR REPLACE VIEW v_top_destinations AS
SELECT
  d.name,
  COUNT(b.booking_id) AS bookings,
  SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END) AS realized_revenue
FROM destinations d
LEFT JOIN packages p ON p.destination_id = d.destination_id
LEFT JOIN bookings b ON b.package_id = p.package_id
GROUP BY d.destination_id, d.name
ORDER BY bookings DESC;

CREATE OR REPLACE VIEW v_cancellation_rate AS
SELECT
  DATE_FORMAT(created_at, '%Y-%m-01') AS month,
  ROUND(100.0 * SUM(status = 'cancelled') / NULLIF(COUNT(*), 0), 2) AS cancellation_pct
FROM bookings
GROUP BY DATE_FORMAT(created_at, '%Y-%m-01');

CREATE OR REPLACE VIEW v_agent_performance AS
SELECT
  u.user_id,
  u.full_name,
  COUNT(DISTINCT p.package_id) AS packages_managed,
  SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END) AS booked_revenue
FROM users u
LEFT JOIN packages p ON p.created_by = u.user_id
LEFT JOIN bookings b ON b.package_id = p.package_id
WHERE u.role = 'agent'
GROUP BY u.user_id, u.full_name;

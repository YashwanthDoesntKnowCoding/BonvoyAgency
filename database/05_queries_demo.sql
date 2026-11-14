USE bonvoyagency;

-- Relational join: a customer's saved trip with package and destination details.
SELECT booking_ref, customer_name, package_title, destination_name, total_amount, status
FROM v_booking_details
ORDER BY created_at DESC;

-- Aggregate and HAVING: destinations with more than one package.
SELECT d.name, COUNT(p.package_id) AS package_count, AVG(p.base_price) AS average_price
FROM destinations d
JOIN packages p ON p.destination_id = d.destination_id
GROUP BY d.destination_id, d.name
HAVING COUNT(p.package_id) > 1;

-- Subquery: packages priced above the catalog average.
SELECT title, base_price
FROM packages
WHERE base_price > (SELECT AVG(base_price) FROM packages);

-- Window function: order packages by price within each state.
SELECT d.state, p.title, p.base_price,
       RANK() OVER (PARTITION BY d.state ORDER BY p.base_price DESC) AS state_price_rank
FROM packages p
JOIN destinations d ON d.destination_id = p.destination_id;

-- CTE: upcoming departures with seats still available.
WITH upcoming AS (
  SELECT package_id, start_date, available_seats
  FROM departures
  WHERE start_date >= CURRENT_DATE() AND status = 'open'
)
SELECT p.title, u.start_date, u.available_seats
FROM upcoming u
JOIN packages p ON p.package_id = u.package_id
WHERE u.available_seats > 0;

-- EXISTS: customers who have saved at least one trip.
SELECT u.full_name, u.email
FROM users u
WHERE EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = u.user_id);

-- JSON: read destination highlights stored in a native MySQL JSON column.
SELECT name, state, JSON_UNQUOTE(JSON_EXTRACT(highlights, '$[0]')) AS first_highlight
FROM destinations;

-- Database function and views.
SELECT package_id, title, fn_package_avg_rating(package_id) AS average_rating
FROM packages;
SELECT * FROM v_top_destinations;
SELECT * FROM v_monthly_revenue;

-- Index usage and query plan.
EXPLAIN ANALYZE
SELECT package_id, title, base_price
FROM packages
WHERE category = 'heritage' AND base_price BETWEEN 10000 AND 25000
ORDER BY base_price;

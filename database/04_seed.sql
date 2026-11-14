USE bonvoyagency;

-- Seed catalog and demo accounts from the application's single source of seed data:
--   cd server && npm run db:seed
-- The command is idempotent and inserts destinations, packages, departures,
-- itineraries, reviews, hotels, and the three demo accounts.

SELECT COUNT(*) AS destination_count FROM destinations;
SELECT COUNT(*) AS package_count FROM packages;

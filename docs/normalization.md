# Normalization Notes

The schema follows 3NF for the core travel booking workflow:

- Users, packages and destinations are stored once and referenced by foreign keys.
- Hotel and travel options are separate dimension tables so they can be reused by many packages.
- Package-day itineraries, hotel mappings and transport mappings are separate child tables rather than repeating arrays inside packages.
- Bookings keep transaction data separate from travellers and payments, which avoids update anomalies.

The only intentional denormalization is for reporting views, which materialize aggregated revenue and cancellation statistics for management dashboards.

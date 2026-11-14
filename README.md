# Bonvoyagency

Bonvoyagency is a travel and tour management application designed as a DBMS major project with a 3-tier architecture: React frontend, Express backend, and MySQL database.

## Stack

- Frontend: React + Vite + Tailwind-like custom CSS
- Backend: Node.js + Express + mysql2 + JWT + bcrypt
- Database: MySQL 8+

## Project structure

- `client/` — React frontend app
- `server/` — Express REST API
- `database/` — SQL schema, functions, seed scripts and demo queries
- `docs/` — architecture and reference docs

## Local setup (under 10 steps)

1. Install and start MySQL 8.
2. In the `server` folder, copy `.env.example` to `.env` and set your MySQL username/password.
3. In MySQL Workbench, run `database/01_schema.sql`, then `02_functions_triggers.sql` and `03_views.sql`.
4. Seed the catalog and demo accounts:

```bash
cd server
npm install
npm run db:seed
```

5. Start the backend:

```bash
npm run dev
```

6. In another terminal, start the frontend:

```bash
cd client
npm install
npm run dev
```

7. Open the frontend at `http://localhost:5173` (or `5174` if port 5173 is occupied).
8. Use these seeded credentials (all use `Password123!`):

- Admin: aisha@bonvoyagency.com / Password123!
- Agent: rahul@bonvoyagency.com / Password123!
- Customer: neha@bonvoyagency.com / Password123!

9. For the database demo and viva, run examples from `database/05_queries_demo.sql`.

## Available endpoints

- Auth: `/api/v1/auth/*`
- Public: `/api/v1/destinations`, `/api/v1/packages`, `/api/v1/hotels` etc.
- Customer: `/api/v1/bookings/*`, `/api/v1/wishlist/*`
- Agent: `/api/v1/agent/*`
- Admin: `/api/v1/admin/*`
- Health: `/api/v1/health`

## Notes

The API reads the destination, package, departure, itinerary, review, and hotel catalog from MySQL. New accounts, bookings, and wishlist changes are persisted in MySQL. Bookings are saved without payment and do not reserve seats.

### Tour data and imagery

- The sample tour catalog includes Karnataka, Kerala and Tamil Nadu. Prices are illustrative per-person estimates for twin sharing, not live operator quotes; departure dates and seat counts are demo data.
- The booking form includes AC coach, train with local transfer, shared cab and self-arranged travel choices. Transport adjustments and tax are estimates only.
- Road distances are approximate from Bengaluru. Each tour links to Google Maps for current routing, with tourism-source links for destination inspiration.
- Destination photos are from Wikimedia Commons. Image credits and the applicable license links are shown in the app and photo gallery.
- Registration, login, wishlists and trips use MySQL through the API. The seed command is safe to rerun and does not delete customer accounts, bookings, or wishlist entries.
- Confirming a trip adds it to My Trips without opening a payment window, processing payment or reserving a seat.
- MySQL connection settings are read from `server/.env`; see `server/.env.example`. The API health endpoint reports whether MySQL is connected.

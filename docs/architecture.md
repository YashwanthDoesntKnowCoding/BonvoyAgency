# Bonvoyagency Architecture

The application is designed with a strict 3-tier layout:

- Presentation layer: React + Vite SPA in the `client` folder
- Application layer: Express REST API in the `server` folder
- Data layer: MySQL 8 schema, seed, routines, triggers, and views in the `database` folder

## Request flow

Client -> API -> Business validation -> MySQL -> Response

The API centralizes business rules and role checks, while the frontend only handles UI flow and form validation.

## Database notes

- Schema is normalized to 3NF for core booking, package and travel data.
- Denormalized read-only views provide faster admin reporting.
- MySQL JSON columns store destination highlights and image galleries; normalized relational tables store users, packages, departures, bookings, and wishlists.
- Database triggers update departure status and write booking audit events.
- The catalog seed is loaded from `server/src/data/mockData.js` with `npm run db:seed`.

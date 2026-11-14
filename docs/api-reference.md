# API Reference

## Auth

| Method | Route | Purpose |
| --- | --- | --- |
| POST | /api/v1/auth/register | Register a new user |
| POST | /api/v1/auth/login | Authenticate a customer or agent |
| POST | /api/v1/auth/refresh | Refresh the access token |
| POST | /api/v1/auth/logout | Log the user out |
| GET | /api/v1/auth/me | Get the current user |

## Public

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/v1/destinations | List destinations |
| GET | /api/v1/packages | Search and filter packages |
| GET | /api/v1/packages/:slug | Fetch package detail |
| GET | /api/v1/hotels | List hotels |
| GET | /api/v1/meta/filters | Get filters |

## Customer

| Method | Route | Purpose |
| --- | --- | --- |
| POST | /api/v1/bookings/quote | Generate a price preview |
| POST | /api/v1/bookings | Create a booking |
| GET | /api/v1/bookings | Get my bookings |
| POST | /api/v1/bookings/:id/pay | Mock payment |
| POST | /api/v1/bookings/:id/cancel | Cancel a booking |

## Admin

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/v1/admin/dashboard | Summary dashboard |
| GET | /api/v1/admin/audit-logs | Audit log entries |

# AssetFlow

AssetFlow is a full-stack asset and resource management platform built for a hackathon. It helps teams track assets, allocate ownership, prevent booking conflicts, run audits, and manage maintenance workflows from one dashboard.

## Hackathon Summary

- Problem: teams lose visibility on who has what asset, when it is booked, and whether it is in good condition.
- Solution: a role-based platform for complete asset lifecycle management.
- Stack: PostgreSQL (Supabase) + Express + React (Vite) + Node.js.
- Deployment: static frontend + serverless API on Vercel.

## Core Features

- Authentication and role-based access (Admin, Asset Manager, Department Head, Employee).
- Organization setup: departments, categories, and employee management.
- Asset registry with automatic asset tags (`AF-0001`, `AF-0002`, ...).
- Allocation and transfer workflows with conflict detection.
- Booking system with overlap validation (prevents double-booking).
- Maintenance lifecycle: request, approve/reject, assign, in-progress, resolve.
- Audit cycles with discrepancy reporting and close-out actions.
- Dashboard metrics, notifications, reports, and activity logs.

## Project Structure

```text
AssetFlow/
|-- api/
|   `-- [...path].js          # Vercel serverless API entrypoint
|-- backend/
|   |-- src/
|   |   |-- app.js            # Express app for serverless and local reuse
|   |   `-- index.js          # Local API server entrypoint
|   `-- .env.example
|-- database/
|   |-- schema.sql
|   `-- seed.sql
|-- frontend/
|   |-- src/
|   `-- vite.config.js
|-- package.json
`-- vercel.json
```

## Architecture

- Frontend calls `/api/*`.
- In local development, Vite proxies `/api` to `http://localhost:5000`.
- In production (Vercel), `/api/*` is handled by `api/[...path].js`, which forwards to the Express app.
- PostgreSQL is hosted on Supabase and accessed via `DATABASE_URL`.

## Quick Start (Local)

### 1) Database Setup (Supabase)

1. Create a Supabase project.
2. Open SQL Editor and run `database/schema.sql`.
3. Run `database/seed.sql` for demo data and users.
4. Copy the Session pooler connection string (port `5432`).

### 2) Backend Setup

```bash
cd backend
copy .env.example .env
```

Update `backend/.env` values:

```env
PORT=5000
DATABASE_URL=<your-supabase-session-pooler-url>
JWT_SECRET=<strong-random-secret>
```

Then run:

```bash
npm install
npm run dev
```

Backend starts on `http://localhost:5000`.

### 3) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`.

## Root Scripts

Run from repo root:

```bash
npm run dev:backend   # starts backend in watch mode
npm run dev:frontend  # starts frontend dev server
npm run build         # installs frontend deps and builds frontend/dist
```

## Demo Accounts

Seeded users from `database/seed.sql`:

| Email | Password | Role |
|---|---|---|
| admin@assetflow.com | admin123 | Admin |
| manager@assetflow.com | password123 | Asset Manager |
| head@assetflow.com | password123 | Department Head |
| priya@assetflow.com | password123 | Employee |
| raj@assetflow.com | password123 | Employee |

## API Snapshot

All endpoints are under `/api` and use JSON. Protected routes require:

`Authorization: Bearer <token>`

Key endpoint groups:

- `/auth` for signup/login/session.
- `/org` for departments, categories, and employees.
- `/assets` for asset registry and updates.
- `/allocations` and `/allocations/transfers` for asset assignment and transfer flow.
- `/bookings` for reservations and cancellation.
- `/maintenance` for maintenance workflow actions.
- `/audits` for audit cycles, records, discrepancies, and closure.
- `/dashboard`, `/reports`, `/notifications`, `/activity` for reporting and system visibility.

## Deployment (Vercel)

This repository is configured for Vercel:

- Build command: `npm run build`
- Output directory: `frontend/dist`
- API route: `api/[...path].js` exports the Express app
- SPA fallback rewrite is configured in `vercel.json`

Set environment variables in Vercel project settings:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN` (optional, comma-separated)

## Hackathon Pitch

AssetFlow turns scattered spreadsheets and manual handovers into one reliable system for asset ownership, availability, and condition. The product is designed to reduce lost assets, avoid booking collisions, and improve accountability with auditable workflows.

## Future Improvements

- QR-based rapid check-in/check-out flows.
- File/image attachments for maintenance and audit evidence.
- Advanced analytics and exportable compliance reports.
- Real-time notifications and approvals.
- SSO and enterprise access controls.

## License

This project was built for a hackathon prototype/demo.
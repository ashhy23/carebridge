# CareBridge

**AI-powered elderly care coordination platform**

![Phase 1](https://img.shields.io/badge/Phase%201-✅%20Complete-22c55e?style=flat-square)
![Phase 2](https://img.shields.io/badge/Phase%202-✅%20Complete-22c55e?style=flat-square)
![Phase 3](https://img.shields.io/badge/Phase%203-✅%20Complete-22c55e?style=flat-square)
![Phase 4](https://img.shields.io/badge/Phase%204-✅%20Complete-22c55e?style=flat-square)

[![CI](https://github.com/ashhy23/carebridge/actions/workflows/ci.yml/badge.svg)](https://github.com/ashhy23/carebridge/actions/workflows/ci.yml)

---

## About

CareBridge is a full-stack web application that helps families, caregivers, and care coordinators stay on top of an elderly patient's health in one place. Patients log daily vitals; the platform tracks trends, flags abnormal readings automatically, and keeps the care team aligned through shifts, task checklists, and shift notes.

---

## Features

### Patient
- Register and sign in with a dedicated patient account
- Log vitals (heart rate, blood pressure, SpO₂, temperature, glucose, weight)
- View 30-day trend charts with separate Y-axes for metrics on very different scales
- Automatic alert generation when readings fall outside safe thresholds

### Caregiver
- View assigned shifts and advance them through a enforced status workflow (`SCHEDULED → IN_PROGRESS → COMPLETED`)
- Manage a per-shift task checklist — add, toggle complete, and delete tasks
- Write and update end-of-shift care notes
- View vitals trends for linked patients
- Receive real-time alert notifications via a polling badge (30 s interval)
- Mark individual alerts or all alerts as read

### Admin
- Create and schedule shifts for any patient–caregiver pairing
- View all shifts across the organisation
- Monitor all patient alerts platform-wide
- Full read access to shift details, tasks, and vitals (via linked patient context)

### Family (`FAMILY_MEMBER`)
- View vitals trends for their linked patient only
- Receive scoped alert notifications for their linked patient
- Read-only access — no shift or task management

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, React Query, Axios, Recharts |
| **Backend** | Node.js, Express, Prisma ORM v5 |
| **Database** | PostgreSQL on Supabase |
| **Auth** | JWT (15 min access token + 7 day refresh token in httpOnly cookie) |
| **AI** | Claude API + Whisper|
| **DevOps** | Docker + GitHub Actions|

---

## Architecture

CareBridge is a **monorepo** with two independent packages:

```
carebridge/
├── client/          # React SPA (Vite, port 5174)
├── server/          # Express REST API (port 5001)
│   ├── prisma/      # Schema and migrations
│   └── src/
│       ├── routes/  # Resource routers
│       ├── middleware/
│       └── lib/     # Prisma client
└── README.md
```

**How it connects:**

1. The React client calls the Express API over HTTP with Axios (`withCredentials: true` so refresh cookies are sent automatically).
2. The access JWT is stored in memory and attached as a `Bearer` header; the refresh token lives in an httpOnly cookie the browser manages.
3. Express validates tokens via `authenticate` middleware and enforces RBAC with `requireRole`.
4. Prisma ORM handles all database queries against a PostgreSQL instance hosted on Supabase.
5. React Query caches server state on the client and invalidates queries after mutations so the UI updates instantly without a full page reload.

---

## Database Schema

| Model | Description |
|-------|-------------|
| **User** | Core account — email, hashed password, name, and role enum |
| **PatientProfile** | Medical profile linked 1-to-1 with a patient user (DOB, allergies, emergency contact) |
| **CaregiverProfile** | Professional credentials linked 1-to-1 with a caregiver user |
| **FamilyLink** | Join table connecting a family member user to a patient profile |
| **VitalsEntry** | Point-in-time vitals reading (heart rate, BP, SpO₂, temperature, etc.) |
| **Shift** | Scheduled care visit — one caregiver assigned to one patient for a time window |
| **Task** | Checklist item belonging to a shift (medication, mobility, hygiene, etc.) |
| **CareNote** | End-of-shift narrative from the caregiver (1-to-1 with a shift) |
| **Alert** | Vitals threshold notification with type, message, and read status |
| **RefreshToken** | Persisted refresh token for JWT rotation and logout revocation |

---

## API Routes

All routes are prefixed with `/api`. Routes marked 🔒 require a valid access token.

### Auth

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Create account (PATIENT, CAREGIVER, or FAMILY_MEMBER) |
| `POST` | `/auth/login` | Public | Authenticate; returns access token + sets refresh cookie |
| `POST` | `/auth/refresh` | Cookie | Issue a new access token from the httpOnly refresh cookie |
| `POST` | `/auth/logout` | Cookie | Revoke refresh token and clear cookie |
| `GET` | `/auth/me` | 🔒 Any | Return the currently authenticated user |

### Vitals

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/vitals` | 🔒 PATIENT | Log a new vitals entry; auto-generates alerts for abnormal readings |
| `GET` | `/vitals` | 🔒 PATIENT / CAREGIVER / FAMILY_MEMBER | Fetch last 30 vitals entries (caregivers/family require `?patientProfileId=`) |

### Shifts

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/shifts` | 🔒 ADMIN | Create a new shift (optionally with initial care note) |
| `GET` | `/shifts` | 🔒 ADMIN / CAREGIVER | List shifts (caregivers see only their own) |
| `GET` | `/shifts/:id` | 🔒 ADMIN / CAREGIVER | Get shift detail with tasks and care note |
| `PATCH` | `/shifts/:id/status` | 🔒 CAREGIVER | Advance shift status (valid transitions enforced) |
| `PATCH` | `/shifts/:id/notes` | 🔒 CAREGIVER | Create or update the care note for a shift |

### Tasks

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/tasks` | 🔒 CAREGIVER | Add a task to a shift |
| `GET` | `/tasks?shiftId=` | 🔒 CAREGIVER / ADMIN | List tasks for a shift |
| `PATCH` | `/tasks/:id/complete` | 🔒 CAREGIVER | Toggle task completion |
| `DELETE` | `/tasks/:id` | 🔒 CAREGIVER | Delete a task |

### Alerts

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/alerts` | 🔒 CAREGIVER / ADMIN / FAMILY_MEMBER | List alerts (family scoped to linked patient) |
| `GET` | `/alerts/unread-count` | 🔒 CAREGIVER / ADMIN / FAMILY_MEMBER | Lightweight unread count for nav badge |
| `PATCH` | `/alerts/:id/read` | 🔒 CAREGIVER / ADMIN / FAMILY_MEMBER | Mark a single alert as read |
| `PATCH` | `/alerts/read-all` | 🔒 CAREGIVER / ADMIN / FAMILY_MEMBER | Mark all scoped unread alerts as read |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm**
- A **Supabase** (or other) PostgreSQL database
- Two terminal windows

### 1. Clone the repository

```bash
git clone https://github.com/ashhy23/carebridge.git
cd carebridge
```

### 2. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure environment variables

Create `server/.env` (see [Environment Variables](#environment-variables) below).

The client does not require a `.env` file for local development — the API base URL is set in `client/src/lib/api.js`.

### 4. Set up the database

```bash
cd server
npx prisma db push        # sync schema to your database
npx prisma generate       # regenerate the Prisma client
```

> **Note:** If you prefer versioned migrations, use `npx prisma migrate dev` instead of `db push`.

### 5. Start both servers

**Terminal 1 — API server (port 5001):**

```bash
cd server
npm run dev
```

**Terminal 2 — React dev server (port 5174):**

```bash
cd client
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) in your browser.

### 6. Create your first account

Use the register page to create a **Patient**, **Caregiver**, or **Family Member** account. Admin accounts must be created directly in the database.

---

## Environment Variables

### `server/.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase format: `postgresql://user:password@host:5432/postgres`) |
| `JWT_SECRET` | Secret key for signing access tokens (use a long random string) |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens (must differ from `JWT_SECRET`) |
| `PORT` | Port the Express server listens on (default: `5001`) |
| `NODE_ENV` | Environment mode — `development` or `production` |

### `client/.env`

No environment variables are required for local development. The API base URL is configured in `client/src/lib/api.js`:

```
http://localhost:5001/api
```

For production deployments (Phase 4), you may introduce a `VITE_API_URL` variable and read it via `import.meta.env.VITE_API_URL`.

---

## Project Status

| Phase | Status | Scope |
|-------|--------|-------|
| **Phase 1 — Auth & Foundation** | ✅ Complete | Monorepo, Prisma schema (10 models), JWT auth, RBAC middleware, React auth UI, Axios interceptor, PrivateRoute |
| **Phase 2 — Core Care Features** | ✅ Complete | Vitals logging & charts, auto-alerts, shift management, task checklists, care notes, alert badge polling, full RBAC |
| **Phase 3 — AI Features** | ✅ Complete | Claude API care summaries, Whisper voice note transcription |
| **Phase 4 — DevOps** | ✅ Complete | Docker containerisation, GitHub Actions CI/CD pipeline |

### Technical highlights

- **Dual-token JWT auth** — 15 min access token in memory + 7 day refresh token in httpOnly cookie
- **RBAC end-to-end** — `authenticate` + `requireRole` on the backend; role guards on every protected page and nav item
- **Automatic alert generation** — vitals POST triggers threshold checks; one `createMany` call per entry
- **Shift status machine** — only valid transitions (`SCHEDULED → IN_PROGRESS → COMPLETED`) are accepted
- **React Query server state** — cache invalidation after mutations keeps the UI in sync without manual refetches
- **Dual-axis Recharts** — separate Y-axes for vitals with very different numeric scales (e.g. heart rate vs SpO₂)

---

## Author

Built by **Ashitha** as a full stack AI integrated project.

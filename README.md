# Zoryn — Finance Data Processing & Access Control Dashboard

A full-stack MERN application for managing financial records with role-based access control, aggregated analytics, and a clean dashboard UI.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Runtime    | Node.js                                 |
| Backend    | Express.js                              |
| Database   | MongoDB + Mongoose                      |
| Auth       | JWT (Bearer token, 7-day expiry)        |
| Validation | express-validator                       |
| Security   | Helmet, express-mongo-sanitize, rate-limiting |
| Frontend   | React 18 + Vite                         |
| Styling    | Tailwind CSS                            |
| Charts     | Recharts                                |

---

## Project Structure

```
Zoryn/
├── backend/
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── controllers/    # Route handlers (thin — delegate to services)
│   │   ├── middlewares/    # auth, rbac, validation, error handling
│   │   ├── models/         # Mongoose schemas (User, Transaction)
│   │   ├── routes/         # Express routers with validation chains
│   │   ├── scripts/        # Seed script
│   │   ├── services/       # Business logic layer
│   │   └── utils/          # ApiError, ApiResponse, asyncHandler
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance + per-resource API modules
    │   ├── components/     # Layout (Sidebar, Header) + ProtectedRoute
    │   ├── context/        # AuthContext (useReducer)
    │   └── pages/          # Login, Register, Dashboard, Transactions, Users, Profile
    ├── vite.config.js
    └── package.json
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This creates three demo accounts and 120 sample transactions spanning the past year.

### 4. Run in development

```bash
# Terminal 1 — backend (port 5000)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173, proxies /api to backend)
cd frontend
npm run dev
```

Open `http://localhost:5173`

---

## Demo Credentials

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Admin   | admin@zoryn.dev      | admin123    |
| Analyst | analyst@zoryn.dev    | analyst123  |
| Viewer  | viewer@zoryn.dev     | viewer123   |

> These are also available as quick-fill buttons on the login page.

---

## Role Permissions

| Action                         | Viewer | Analyst | Admin |
|--------------------------------|:------:|:-------:|:-----:|
| View dashboard summary         | ✓      | ✓       | ✓     |
| View recent transactions       | ✓      | ✓       | ✓     |
| View weekly comparison         | ✓      | ✓       | ✓     |
| List transactions (with filters)| ✓     | ✓       | ✓     |
| View transaction detail        |        | ✓       | ✓     |
| View category breakdown        |        | ✓       | ✓     |
| View monthly trends            |        | ✓       | ✓     |
| Create/edit/delete transactions|        |         | ✓     |
| Manage users                   |        |         | ✓     |

---

## API Reference

All API responses follow a consistent envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
```

Errors:
```json
{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }
```

### Auth — `/api/auth`

| Method | Path               | Auth | Description             |
|--------|--------------------|------|-------------------------|
| POST   | `/register`        | No   | Register a new account  |
| POST   | `/login`           | No   | Login, returns JWT      |
| GET    | `/me`              | Yes  | Get current user        |
| PUT    | `/me`              | Yes  | Update own profile      |
| PUT    | `/change-password` | Yes  | Change own password     |

### Users — `/api/users` *(admin only)*

| Method | Path    | Description          |
|--------|---------|----------------------|
| GET    | `/`     | List users (paginated, filterable) |
| GET    | `/:id`  | Get user by ID       |
| POST   | `/`     | Create user          |
| PUT    | `/:id`  | Update user          |
| DELETE | `/:id`  | Delete user          |

### Transactions — `/api/transactions`

| Method | Path    | Role            | Description              |
|--------|---------|-----------------|--------------------------|
| GET    | `/`     | all             | List (paginated, filtered)|
| GET    | `/:id`  | analyst, admin  | Get by ID                |
| POST   | `/`     | admin           | Create                   |
| PUT    | `/:id`  | admin           | Update                   |
| DELETE | `/:id`  | admin           | Soft delete              |

**GET `/api/transactions` query params:**
- `page`, `limit` — pagination
- `type` — `income` | `expense`
- `category` — one of the defined categories
- `startDate`, `endDate` — ISO 8601 date range
- `sortBy` — field to sort (default `date`)
- `sortOrder` — `asc` | `desc`

### Dashboard — `/api/dashboard`

| Method | Path          | Role           | Description                    |
|--------|---------------|----------------|--------------------------------|
| GET    | `/summary`    | all            | Totals: income, expense, balance |
| GET    | `/recent`     | all            | Recent transactions (limit)    |
| GET    | `/weekly`     | all            | Current vs last week comparison |
| GET    | `/categories` | analyst, admin | Category-wise totals           |
| GET    | `/trends`     | analyst, admin | Monthly income/expense trends  |

### Health Check

```
GET /api/health
```

---

## Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production (serves frontend dist/)
cd ../backend
NODE_ENV=production node server.js
```

The backend serves the built React app at `/` and all `/api` routes in production mode.

---

## Key Design Decisions & Assumptions

1. **Single JWT access token (7 days)** — A refresh token mechanism would be appropriate for production but is out of scope for this assignment.

2. **Soft delete on transactions** — Transactions are never hard-deleted; `isDeleted: true` is set instead. The `isDeleted` field is excluded from queries by default via Mongoose `select: false`, so deleted records are invisible unless explicitly queried.

3. **Service layer** — Business logic lives in `services/`, keeping controllers thin (parse request → call service → send response). This makes the logic testable without HTTP concerns.

4. **Role hierarchy is flat** — Three discrete roles: `viewer < analyst < admin`. There is no permission inheritance; each route specifies its allowed roles explicitly via the `authorize()` middleware.

5. **Frontend role-gating is soft** — The backend enforces all access control. The frontend only hides UI elements based on role as a UX improvement, not a security measure.

6. **Categories are an enum** — A fixed list of categories is used rather than user-defined categories for simplicity and data consistency. This could easily be moved to a `Category` model.

7. **MongoDB aggregation pipelines** — Dashboard analytics use aggregation rather than loading all records into application memory, making them efficient even at scale.

8. **Rate limiting** — Auth endpoints: 20 req/15min. All API routes: 200 req/15min.

---

## Optional Enhancements Included

- JWT authentication
- Pagination on all list endpoints
- Soft delete with `isDeleted` flag
- Rate limiting (auth + global)
- Input validation with per-field error messages
- Seed script with realistic demo data
- Production-ready static file serving
- Mobile-responsive sidebar with overlay

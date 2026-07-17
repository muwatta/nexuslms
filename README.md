# NexusLMS

NexusLMS is a multi-tenant SaaS learning management system built for schools and educational institutions.
It pairs a Django REST API backend with a React + TypeScript + Vite frontend to support multiple roles, including super admin, school admin, teacher, student, parent, and non-teaching staff.

---

## What this project is

NexusLMS is a **tenant-aware SaaS platform** that provides a unified school management experience with:

- **multi-tenant architecture** — each school is an isolated tenant with its own users, courses, and data
- **subscription billing** — free trial + paid plans (Starter, Professional, Enterprise) via Paystack
- **role-based routing and access control** — 8 roles with permission-based UI and API enforcement
- **user and profile administration** from both UI and backend
- **department-level dashboards** and school administration workflows
- **academic workflows** for courses, enrollments, assignments, quizzes, results, and report cards
- **payment capture and fee tracking**
- **analytics and reporting** endpoints for course/student insights
- **a responsive React frontend** with reusable page components and page-level error handling

---

## Architecture

### Backend (`backend/`)

- Django REST Framework for API endpoints
- `api` app containing models, serializers, views, permissions, and services
- custom authentication with JWT cookies
- **tenant isolation middleware** — resolves school from user profile, attaches to request
- role-aware permissions and group synchronization
- `drf_spectacular` API schema support
- local SQLite support and production readiness for PostgreSQL
- **Redis-backed channel layer** for WebSocket notifications (falls back to InMemory in dev)
- **ASGI/Daphne** — `ASGI_APPLICATION = "nexuslms.asgi.application"` is required in settings
- **WebSocket auth** — `CookieJWTAuthMiddleware` reads JWT from cookies or `?token=` query param

### Frontend (`frontend/`)

- React + TypeScript + Vite
- Tailwind CSS for styling
- lazy-loaded page routes with error boundaries
- protected route wrapper for permission enforcement
- **tenant context** (`useTenant` hook) for school-aware UI
- **billing page** for subscription management with Paystack integration
- reusable layout and navigation components
- support for admin, teacher, student, and parent experiences

### Deployment assets (`docker/`)

- Docker Compose manifests for local and production environment setup
- Kubernetes manifests for backend service deployment

---

## Multi-Tenant SaaS Architecture

### How tenancy works

```
School (tenant)
  ├── User ── 1:1 ── Profile (school FK, role, department)
  ├── Course (school FK)
  ├── Enrollment → Profile → School
  └── Subscription (billing history)
```

- Every school has an isolated data scope via the `school` foreign key on `User`, `Profile`, and `Course`
- `TenantMiddleware` resolves the current school from the authenticated user and attaches it to `request.school`
- Super admins have `request.school = None` (full cross-tenant access)
- School admins and below are scoped to their school's data

### Subscription plans

| Plan | Price/month | Students | Teachers | Courses |
|------|-------------|----------|----------|---------|
| Free Trial | Free (14 days) | 50 | 10 | 30 |
| Starter | ₦15,000 | 200 | 30 | 100 |
| Professional | ₦35,000 | 500 | 80 | 300 |
| Enterprise | ₦80,000 | 5,000 | 500 | 2,000 |

### New API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/school/register/` | Register a new school + admin user |
| GET/POST | `/api/schools/` | List/create schools |
| GET/POST | `/api/subscriptions/` | List/create subscriptions |
| POST | `/api/billing/initialize/` | Initialize Paystack payment |
| POST | `/api/billing/verify/` | Verify payment and activate plan |

---

## Current state

### What has been completed

- **Multi-tenant foundation** — School model connected to User, Profile, Course with tenant isolation middleware
- **Subscription billing** — Subscription model, Paystack init/verify, plan-based limits
- **School registration** — Public endpoint for onboarding new schools
- **Production hardening** — Redis channel layer, registration rate limiting, CORS defaults fixed
- **UX improvements** — useNavigate for SPA navigation, error boundaries on public routes
- Super admin portal and admin dashboard pages
- role-aware routing and protected routes in React
- user management page with standalone layout support
- analytics page with course/student lookup and UX improvements
- backend test suite (37 tests) passing
- frontend production build validation passing
- backend configuration and deployment checks passing

### Recent improvements

- Added multi-tenant architecture with School → User/Profile/Course relationships
- Added Subscription model and Paystack billing integration
- Added TenantMiddleware for request-level tenant resolution
- Added school registration API endpoint for self-service onboarding
- Added frontend TenantContext and Billing page
- Switched InMemoryChannelLayer to Redis (with dev fallback)
- Added rate limiting to registration endpoint
- Fixed CORS and ALLOWED_HOSTS placeholder defaults in production
- Replaced window.location.href with useNavigate() in auth flows
- Added ErrorBoundary wrappers to Login, Signup, ForgotPassword routes
- Removed dead code: ParentDashboard.jsx, LoadingAnimation.tsx
- Fixed Login page broken /register link → /signup
- Fixed logout not clearing rolesAndPermissionsCache
- Fixed registration endpoint allowing role self-assignment (privilege escalation)
- Added dj-database-url to requirements.txt (was silently failing)
- Added .env and .env.example for frontend VITE_API_URL
- **Fixed `ASGI_APPLICATION` missing** — added to `base.py` so Daphne can start
- **Fixed WebSocket auth** — cookie path changed from `/api/` to `/`; token also passed via query parameter as fallback for Vite dev proxy
- **Fixed `access_token` in response bodies** — login and refresh endpoints now return the JWT in the response so the frontend can use it for WebSocket connections
- **Removed dead audit-log POST call** — `SuperAdminPortal` was POSTing to a read-only endpoint, generating 405 errors

---

## Getting started

### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py init_groups --sync-users
python manage.py runserver
```

The backend API will run at `http://localhost:8000`.

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env       # Copy env file (defaults work for dev)
npm run dev
```

The frontend will run at `http://localhost:3000` (proxies `/api` to backend).

### Environment variables

#### Backend (`backend/.env`)

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3          # or postgres://...
REDIS_URL=                                  # optional, falls back to InMemory
PAYSTACK_SECRET_KEY=sk_test_...
GEMINI_API_KEY=...
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=/api    # default, uses Vite proxy in dev
```

### Useful commands

```bash
# Backend checks and tests
cd backend
python manage.py check
python manage.py test api

# Frontend typecheck and build
cd frontend
npm run typecheck
npm run build

# Docker compose development
cd docker
docker compose up --build
```

---

## Project structure

```text
backend/
├── nexuslms/               # Django project config (settings, URLs, ASGI/WSGI)
├── api/                    # Main Django app
│   ├── core/models/        # 23 model classes (User, Profile, School, Course, etc.)
│   ├── views/              # DRF viewsets and API views (20+ modules)
│   ├── serializers/        # DRF serializers (15 modules)
│   ├── academics/          # Results and report cards sub-module
│   ├── tests/              # Test suite (37 tests)
│   ├── management/commands/ # 22 management commands
│   ├── middleware.py        # Rate limiting, security headers
│   ├── tenant_middleware.py # Tenant isolation (request.school)
│   ├── authentication.py   # Cookie-based JWT authentication
│   ├── paystack_client.py  # Paystack API wrapper
│   └── urls.py             # API URL routing
├── Dockerfile              # Production container
└── requirements.txt        # Python dependencies

frontend/
├── src/
│   ├── App.tsx             # All routes, error boundaries, layout
│   ├── api.ts              # Axios instance with auth interceptor
│   ├── hooks/
│   │   ├── useTenant.tsx   # Tenant context (school data)
│   │   ├── useTheme.ts     # Dark mode
│   │   └── useRolesAndPermissions.ts
│   ├── pages/              # 37 page components
│   │   ├── Billing.tsx     # Subscription management
│   │   └── ...
│   ├── components/         # 14 reusable components
│   └── utils/authUtils.ts  # Auth helpers, role routing
├── .env                    # VITE_API_URL config
├── .env.example            # Template for env vars
└── vercel.json             # SPA rewrite rules

docker/
├── docker-compose.yml          # Dev compose
├── docker-compose.prod.yml     # Production compose
└── k8s/                        # Kubernetes manifests

docs/
├── NEXUSLMS_HANDOVER.md        # Source-code handover review
└── ...
```

---

## Contact and contribution

This repository is intended as a working multi-tenant LMS SaaS platform.
Pull requests, feature improvements, and bug fixes are welcome.
If you are maintaining the project locally, use the documentation and notes above to track progress and plan the next milestones.

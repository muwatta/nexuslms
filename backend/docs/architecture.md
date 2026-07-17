# NexusLMS Architecture

## Overview

NexusLMS is a school academic-management and learning platform built for the Nigerian school context. It consists of a Django REST API backend and a React single-page application frontend.

## System Architecture

```
┌──────────────┐     HTTPS      ┌──────────────────┐     SQL      ┌────────────┐
│              │  ────────────>  │                  │  ──────────>  │            │
│  React SPA   │                │  Django API      │              │  PostgreSQL │
│  (Vite)      │  <──────────── │  (Daphne ASGI)   │  <────────── │  (or SQLite│
│              │   JSON/cookies  │                  │              │   in dev)  │
└──────────────┘                └──────────────────┘              └────────────┘
                                        │
                                        │ WebSocket (Redis in prod)
                                        ▼
                                 ┌──────────────────┐
                                 │  Django Channels  │
                                 │  (notifications)  │
                                 └──────────────────┘
                                        │
                                        │ TenantMiddleware
                                        ▼
                                 ┌──────────────────┐
                                 │  School (tenant)  │
                                 │  isolation layer  │
                                 └──────────────────┘
```

## Backend

### Technology Stack

- **Framework:** Django 6 + Django REST Framework
- **Server:** Daphne (ASGI) for HTTP and WebSocket support
- **Auth:** JWT in HttpOnly cookies + `localStorage` profile signal
- **Database:** SQLite (dev) / PostgreSQL (production via `DATABASE_URL`)
- **Realtime:** Django Channels with Redis channel layer (production) or InMemory (dev)
- **Tenancy:** TenantMiddleware resolves school from user profile
- **PDFs:** ReportLab (syllabus, assignments, quizzes, results)
- **Payments:** Paystack API client (transactions + subscriptions)
- **AI:** Google Gemini API

### Project Layout

```
backend/
├── nexuslms/               # Django project configuration
│   ├── settings/           # base.py, dev.py, prod.py
│   ├── urls.py             # Root URL routing
│   ├── asgi.py             # ASGI entry (HTTP + WebSocket)
│   └── wsgi.py             # WSGI entry
├── api/                    # Main Django application
│   ├── core/               # Core business logic
│   │   ├── models/         # All 23 model classes
│   │   ├── services/       # Business services (grading, reports, parent)
│   │   ├── constants.py    # Domain constants (roles, permissions)
│   │   └── permsissions/   # Permission framework (placeholder)
│   ├── models/             # Backwards-compat re-exports from core.models
│   ├── views/              # DRF viewsets and API views (20+ modules)
│   ├── serializers/        # DRF serializers (15 modules)
│   ├── permissions.py      # DRF permission classes (IsAdmin, IsSuperAdmin, etc.)
│   ├── admin/              # Django admin registrations
│   ├── academics/          # Results and report cards sub-module
│   ├── tests/              # Test suite (37 tests)
│   ├── management/commands/ # 22 management commands
│   ├── signals.py          # Auto-enroll, auto-assign, group sync
│   ├── middleware.py        # Rate limiting, security headers
│   ├── tenant_middleware.py # Tenant isolation (request.school resolution)
│   ├── authentication.py   # Cookie-based JWT authentication
│   ├── pagination.py       # Custom pagination classes
│   ├── filters.py          # DRF filter classes
│   ├── pdf_utils.py        # PDF generation utilities
│   ├── paystack_client.py  # Paystack API wrapper (transactions + subscriptions)
│   └── urls.py             # API URL routing (23 router + 23 manual)
├── docs/                   # Internal documentation
├── Dockerfile              # Production container
└── requirements.txt        # Python dependencies
```

### Data Model

Core entities and their relationships:

```
School (tenant) ─── slug, plan, trial_ends_at, max_students/teachers/courses
  ├── User ── 1:1 ── Profile(role, department, class, parent_email, student_id, school FK)
  │                  ├── Enrollment ── Course(school FK)
  │                  ├── Result ── Course ── ReportCard
  │                  ├── AssignmentSubmission ── Assignment ── Course
  │                  ├── QuizSubmission ── Quiz ── Question ── Course
  │                  ├── FeePayment (Paystack reference, auto-status)
  │                  └── Achievement / Project / Milestone
  ├── Subscription(plan, status, Paystack refs, dates)
  └── Course(school FK, title, department, class, instructor)

SubjectAssignment (user + teacher + subject)
InstructorAssignment (profile + course + class)
ChatMessage (sender → recipient)
AuditLog (user, action, model, old/new values)
PasswordResetOTP (user, OTP, expiry)
```

Key models:

| Model | Purpose |
|-------|---------|
| `School` | Multi-tenant root entity (slug, plan, limits, feature flags) |
| `Subscription` | Billing history with Paystack references and plan status |
| `User` | Custom Django user with `role` and `school` FK |
| `Profile` | One-to-one extension: role, department, class, phone, parent_email, school FK |
| `Course` | Subject/class record with assigned instructor and school FK |
| `Enrollment` | Student-course link with academic year, term, status, promotion tracking |
| `Result` | CA + exam grading with draft→submitted→reviewed→published workflow |
| `ReportCard` | Aggregated student results with position and average |
| `Assignment` / `AssignmentSubmission` | Task submission with file upload and grading |
| `Quiz` / `Question` / `QuizSubmission` | Multiple-choice quizzes with auto-scoring |
| `FeePayment` | Fee records with Paystack integration |
| `AuditLog` | System-wide change tracking |

### Authentication Flow

1. Client sends credentials to `/api/auth/login/`
2. Server validates, creates JWT pair, sets HttpOnly cookies
3. Client includes cookies on subsequent requests
4. On 401, client refreshes via `/api/auth/refresh/` (automatic interceptor)
5. Logout blacklists tokens and clears cookies

### Authorization Model

Three layers (only the server-side layer is authoritative):

1. **Django Groups** — synced from Profile.role via signals
2. **DRF Permission Classes** — `IsAdmin`, `IsTeacher`, `IsAdminOrTeacher`, `IsClassTeacher`, `IsSuperAdmin`, etc.
3. **Frontend Permission Hints** — cached role→permission mapping (UI only, not security)

### Tenant Isolation

`TenantMiddleware` resolves `request.school` from the authenticated user's profile:

1. Middleware checks for a valid JWT cookie
2. If authenticated, loads `profile.school` (or `school` FK on User)
3. Sets `request.school` for downstream viewsets
4. Viewsets can filter querysets by `school FK` for tenant scoping

This is the foundation for multi-tenant isolation. Viewsets should apply `queryset = queryset.filter(school=request.school)` where applicable.

### Subscription Billing

`Subscription` model tracks plan-based limits:

- Plans: `free_trial`, `starter`, `billing`, `professional`, `enterprise`
- Limits enforced: max_students, max_teachers, max_courses
- Feature flags: allow_western, allow_arabic, allow_programming
- Billing endpoints: `/api/billing/initialize/` and `/api/billing/verify/`
- Paystack integration via `paystack_client.py`

Result workflow enforcement:
- Subject teacher enters drafts → submits
- Class teacher reviews → reviewed
- School admin publishes → students/parents can view
- Admin generates/publishes report cards

## Frontend

### Technology Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6 (lazy-loaded)
- **State:** localStorage + React context
- **HTTP:** Axios with 401 interceptor
- **Charts:** Recharts
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Project Layout

```
frontend/src/
├── App.tsx              # All routes, error boundaries, layout
├── api.ts               # Axios instance with auth interceptor
├── main.tsx             # Entry point
├── components/          # 15 reusable components
│   ├── Layout.tsx       # Page layout wrapper
│   ├── Navbar.tsx       # Top navigation
│   ├── ProtectedRoute.tsx # Auth + role guard
│   ├── AIChat.tsx       # AI assistant widget
│   └── ...
├── pages/               # 36 page components
│   ├── (public)         # Landing, About, Login, Signup
│   ├── (admin)          # SuperAdminPortal, AdminDashboard, ManageUsers
│   ├── (department)     # WesternDashboard, ArabicDashboard, ProgrammingDashboard
│   ├── (teacher)        # InstructorDashboard, ClassTeacherDashboard
│   ├── (student/parent) # StudentDashboard, ParentPortal
│   └── (feature)        # Courses, Assignments, Quizzes, Payments
├── hooks/               # useRolesAndPermissions, useTheme, useTenant
├── utils/               # authUtils (role resolution, login/logout)
├── data/                # Static marketing content
└── config/              # Contact information
```

### Role-Based Routing

Each role lands on a dedicated dashboard:

| Role | Dashboard Route |
|------|----------------|
| `super_admin` | `/super-admin-portal` |
| `admin` | `/admin-dashboard` |
| `school_admin` | `/{department}-dashboard` |
| `teacher` | `/teacher-dashboard` |
| `student` | `/student-dashboard` |
| `parent` | `/parent-portal` |

Browser route protection is UX, not security. Django view permissions are the authority.

## Deployment

### Development

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

### Docker Compose

```bash
docker compose up          # dev (SQLite)
docker compose -f docker-compose.prod.yml up  # production (Postgres)
```

### Kubernetes

- `docker/k8s/backend-deployment.yaml` — 2 replicas, liveness/readiness probes
- `docker/k8s/backend-service.yaml` — ClusterIP service
- Probes use `/healthz` and `/readyz` endpoints

### Production Requirements

- PostgreSQL database (`DATABASE_URL`)
- Redis (for Channels layer, caching, rate limiting)
- Object storage (for file uploads — currently local filesystem)
- SSL/TLS termination
- Structured logging (stdout → central log aggregator)
- Error tracking (Sentry/OpenTelemetry)

## Known Limitations

1. **Partial multi-tenant isolation** — School FK on User/Profile/Course, TenantMiddleware, and subscription billing are implemented; explicit tenant-scoping in viewsets and cross-tenant tests are still needed
2. **No Paystack webhook** — Payment verification is server-initiated only; webhook for async confirmation is pending
3. **Local file storage** — No object storage for production
4. **No background jobs** — Celery/Redis not configured
5. **Mixed terminology** — "teacher" and "instructor" used interchangeably
6. **No frontend tests** — Zero test coverage for the React app

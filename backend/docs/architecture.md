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
                                       │ WebSocket
                                       ▼
                                ┌──────────────────┐
                                │  Django Channels  │
                                │  (notifications)  │
                                └──────────────────┘
```

## Backend

### Technology Stack

- **Framework:** Django 6 + Django REST Framework
- **Server:** Daphne (ASGI) for HTTP and WebSocket support
- **Auth:** JWT in HttpOnly cookies + `localStorage` profile signal
- **Database:** SQLite (dev) / PostgreSQL (production via `DATABASE_URL`)
- **Realtime:** Django Channels (in-memory channel layer; Redis needed for production)
- **PDFs:** ReportLab (syllabus, assignments, quizzes, results)
- **Payments:** Paystack API client
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
│   │   ├── models/         # All 21 model classes
│   │   ├── services/       # Business services (grading, reports, parent)
│   │   ├── constants.py    # Domain constants
│   │   └── permsissions/   # Permission framework (placeholder)
│   ├── models/             # Backwards-compat re-exports from core.models
│   ├── views/              # DRF viewsets and API views
│   ├── serializers/        # DRF serializers
│   ├── permissions.py      # DRF permission classes
│   ├── admin/              # Django admin registrations
│   ├── academics/          # Results and report cards sub-module
│   ├── tests/              # Test suite (35 tests)
│   ├── management/commands/ # 23 management commands
│   ├── signals.py          # Auto-enroll, auto-assign, group sync
│   ├── middleware.py        # Rate limiting, security headers
│   ├── authentication.py   # Cookie-based JWT authentication
│   ├── pagination.py       # Custom pagination classes
│   ├── filters.py          # DRF filter classes
│   ├── pdf_utils.py        # PDF generation utilities
│   ├── paystack_client.py  # Paystack API wrapper
│   └── urls.py             # API URL routing (21 router + 20 manual)
├── docs/                   # Internal documentation
├── Dockerfile              # Production container
└── requirements.txt        # Python dependencies
```

### Data Model

Core entities and their relationships:

```
User ── 1:1 ── Profile(role, department, class, parent_email, student_id)
                   ├── Enrollment ── Course (academic_year, term, status)
                   ├── Result ── Course ── ReportCard
                   ├── AssignmentSubmission ── Assignment ── Course
                   ├── QuizSubmission ── Quiz ── Question ── Course
                   ├── FeePayment (Paystack reference, auto-status)
                   └── Achievement / Project / Milestone

SubjectAssignment (user + teacher + subject)
InstructorAssignment (profile + course + class)
ChatMessage (sender → recipient)
AuditLog (user, action, model, old/new values)
PasswordResetOTP (user, OTP, expiry)
```

Key models:

| Model | Purpose |
|-------|---------|
| `User` | Custom Django user with `role` field |
| `Profile` | One-to-one extension: role, department, class, phone, parent_email |
| `Course` | Subject/class record with assigned instructor |
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
2. **DRF Permission Classes** — `IsAdmin`, `IsTeacher`, `IsAdminOrTeacher`, `IsClassTeacher`, etc.
3. **Frontend Permission Hints** — cached role→permission mapping (UI only, not security)

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
├── hooks/               # useRolesAndPermissions, useTheme
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

1. **No multi-tenant isolation** — School model exists but is not connected to data
2. **No Paystack webhook** — Payment verification is client-initiated only
3. **In-memory Channels** — Notifications don't survive restarts
4. **Local file storage** — No object storage for production
5. **No background jobs** — Celery/Redis not configured
6. **Mixed terminology** — "teacher" and "instructor" used interchangeably
7. **No frontend tests** — Zero test coverage for the React app

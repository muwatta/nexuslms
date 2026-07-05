# NexusLMS

NexusLMS is a modern learning management system built for schools and educational institutions.
It pairs a Django REST API backend with a React + TypeScript + Vite frontend to support multiple roles, including super admin, school admin, teacher, student, parent, and non-teaching staff.

---

## What this project is

NexusLMS is designed to provide a unified school management experience with:

- role-based routing and access control
- user and profile administration from both UI and backend
- department-level dashboards and school administration workflows
- academic workflows for courses, enrollments, assignments, quizzes, results, and report cards
- payment capture and fee tracking
- analytics and reporting endpoints for course/student insights
- a responsive React frontend with reusable page components and page-level error handling

---

## Architecture

### Backend (`backend/`)

- Django REST Framework for API endpoints
- `api` app containing models, serializers, views, permissions, and services
- custom authentication with JWT cookies
- role-aware permissions and group synchronization
- `drf_spectacular` API schema support
- local SQLite support and production readiness for PostgreSQL

### Frontend (`frontend/`)

- React + TypeScript + Vite
- Tailwind CSS for styling
- lazy-loaded page routes
- protected route wrapper for permission enforcement
- reusable layout and navigation components
- support for admin, teacher, student, and parent experiences

### Deployment assets (`docker/`)

- Docker Compose manifests for local and production environment setup
- Kubernetes manifests for backend service deployment

---

## Current state

### What has been completed

- Super admin portal and admin dashboard pages
- role-aware routing and protected routes in React
- user management page with standalone layout support
- analytics page with course/student lookup and UX improvements
- backend test suite configured and passing for current scenarios
- frontend production build validation passing
- backend configuration and deployment checks identified, including security and schema warnings

### Recent improvements

- fixed duplicate navigation/layout for standalone pages such as `/manage-users`
- enhanced `ManageUsers.tsx` and `Analytics.tsx` for better spacing, error handling, and layout consistency
- resolved backend import/test failure by removing an accidental `backend/__init__.py`
- validated frontend build output and backend test execution

### Where we are now

- Frontend is compiling and building successfully.
- Backend tests are passing in the current environment.
- Deployment checks report warnings, especially around security settings and API schema generation.
- The codebase is stable enough for continued development, but production hardening is still required.

---

## Known issues / cleanup items

- `python manage.py check --deploy` reports security warnings for `DEBUG`, SSL/HSTS, and secure cookies in production
- `drf_spectacular` currently issues schema warnings for custom authentication and serializer method resolution
- there are backend pagination warnings from unordered querysets in some DRF views
- analytics and reporting still need richer visualizations and export capabilities

---

## Next priorities

### Immediate next tasks

1. Harden production settings
   - set `SECURE_HSTS_SECONDS`
   - enable `SECURE_SSL_REDIRECT`
   - enable `SESSION_COOKIE_SECURE` and `CSRF_COOKIE_SECURE`
   - disable `DEBUG` for production
2. Address API schema warnings
   - add `OpenApiAuthenticationExtension` support for `CookieJWTAuthentication`
   - explicitly define serializer classes or schema fields for custom APIViews
3. Expand test coverage
   - add backend tests for critical business flows
   - add frontend tests for layout and page behavior

### Medium-term roadmap

- improve analytics dashboards with charts and export features
- add notifications and communication workflows (email, SMS, announcements)
- improve mobile-responsive pages and accessibility
- add stronger assessment workflows: timed quizzes, grading, and feedback
- add integration support for SSO or video conferencing tools

---

## Getting started

### Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend API will run at `http://localhost:8000`.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`.

### Useful commands

```bash
# Backend checks and tests
cd backend
python manage.py check --deploy
python manage.py test

# Frontend production bundle
cd frontend
npm run build

# Docker compose development
cd docker
docker compose up --build
```

---

## Project structure

```text
backend/        # Django API, models, serializers, permissions, services
frontend/       # React + TypeScript + Vite client app
docker/         # Docker Compose and Kubernetes deployment assets
docs/           # Product and architecture documentation
```

---

## Contact and contribution

This repository is intended as a working LMS platform foundation.
Pull requests, feature improvements, and bug fixes are welcome.
If you are maintaining the project locally, use the documentation and notes above to track progress and plan the next milestones.

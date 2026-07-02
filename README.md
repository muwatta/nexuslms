# NexusLMS

NexusLMS is a modern learning management system designed for schools and educational institutions. It combines a Django REST API backend with a React + Vite frontend to support roles such as super admin, school admin, teacher, student, parent, and non-teaching staff.

## Overview

The platform already provides a strong foundation for school operations, including:

- multi-role authentication and dashboard routing
- user creation, profile management, and role assignment from the app UI
- school/department-based dashboards
- course and enrollment workflows
- assignments, quizzes, and academic reporting
- payments with Paystack integration
- audit-style visibility and role-group synchronization

## Project structure

```text
backend/        # Django REST API, models, services, and permissions
frontend/       # React + TypeScript + Vite client and UI pages
docker/         # Docker Compose and deployment assets
docs/           # Product, architecture, and API documentation
```

## Tech stack

- Backend: Python, Django, Django REST Framework, SimpleJWT
- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- Database: SQLite for local development, PostgreSQL-ready for production
- APIs: DRF, DRF Spectacular, CORS support
- Integrations: Paystack, PDF generation, and analytics views

## Current status

### Completed areas

- role-based access and dashboard routing
- super-admin portal with management actions
- in-app user management and role updates
- teacher, student, and admin dashboard experiences
- payment and academic workflow integration
- modernized frontend UI with a more consistent design system

### What is still left to do

To make NexusLMS feel fully production-ready, the next priorities are:

- stronger automated testing across backend and frontend
- richer notifications and communications (email, SMS, announcements)
- more advanced analytics and reporting exports
- improved assessment tools such as timed quizzes and grading workflows
- better mobile experience and accessibility polish
- deeper integrations with external tools like SSO, video conferencing, and payment providers
- performance hardening and deployment optimization for real-world scale

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- Docker Compose (optional)

## Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API will be available at http://localhost:8000.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173.

## Useful commands

```bash
# Backend tests
cd backend
python manage.py test

# Frontend production build
cd frontend
npm run build

# Docker compose
cd docker
docker compose up --build
```

## Notes

- The frontend and backend are designed to work together as one product experience.
- Many administrative settings can now be handled from the UI rather than relying only on Django admin.
- The project includes both development tooling and deployment assets for local and container-based setup.

## Suggested next roadmap

1. Finish end-to-end testing for major user flows.
2. Expand reporting and analytics dashboards.
3. Improve communication and notification systems.
4. Refine teacher and student workflows for daily classroom use.
5. Prepare the system for a smoother production rollout.

## Contact

For questions, collaboration, or feedback, contact the project maintainer through the repository or the project history.

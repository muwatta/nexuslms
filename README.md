# NexusLMS

NexusLMS is a full-stack learning management system for managing schools, courses, users, assessments, payments, and reporting. The project combines a Django REST API backend with a React + Vite frontend and includes a dedicated super-admin experience for user and role management.

## Overview

The platform currently supports:

- multi-role access for super admins, school admins, instructors, students, and parents
- user and profile management from the app UI, not only from Django admin
- department-based dashboards and school views
- course enrollment and academic workflows
- quizzes, assignments, and reporting
- payment handling with Paystack integration
- audit logging and role-group synchronization

## Project structure

```text
backend/        # Django REST API and business logic
frontend/       # React + TypeScript + Vite client
docker/         # Docker Compose and deployment assets
docs/           # Product and API documentation
```

## Tech stack

- Backend: Python, Django, Django REST Framework, SimpleJWT
- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- Database: SQLite for local development, PostgreSQL-ready for production
- APIs: DRF, DRF Spectacular, CORS support
- Integrations: Paystack, PDF generation, analytics charts

## Current capabilities

### Admin and user management

- super-admin portal with department overview and quick actions
- user management UI for creating and updating users
- role-based access and group synchronization
- audit log visibility for key actions

### Learning workflows

- course and enrollment management
- assessments and quiz flow
- instructor/student dashboards
- analytics and reporting surfaces

### Payments and infrastructure

- Paystack payment integration
- Docker-based deployment setup
- environment-driven configuration for backend services

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- (optional) Docker Compose

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

- The frontend and backend are designed to work together as a single product experience.
- The admin experience has been expanded so many settings can be managed from the UI instead of relying only on Django admin.
- The project includes both local development tooling and deployment assets for containerized use.

## Contact

For questions or collaboration, contact the project maintainer through the repository or the contact details in the project history.

# NexusLMS

> A full-stack monorepo Learning Management System — production-ready Django REST backend with JWT auth, role-based permissions across 5 user types, Paystack payments, auto-graded quizzes, PDF reports, and a React/Vite frontend.

**Backend: Python 35% · Frontend: TypeScript 65%**

---

## 🟢 Status

| Component | Status | Notes |
|---|---|---|
| Backend API | ✅ Production-ready | 8/8 integration tests passing |
| Database Models | ✅ Complete | Users, courses, enrollments, quizzes, payments |
| API Docs | ✅ Live | OpenAPI/Swagger at `/api/schema/` |
| Payment Integration | ✅ Integrated | Paystack with webhook verification |
| Frontend (React/Vite) | 🔄 In Progress | Core pages done, UI refinement ongoing |
| Deployment | ⏳ Planned | Dockerized, PostgreSQL-ready |

---

## 🏗️ Architecture

```
├── backend/        # Django REST API
├── frontend/       # React + Vite SPA
├── docker/         # Docker Compose setup
└── docs/           # Permission groups, API contracts
```

**Backend layers:** Models → Serializers → Views → Services → Tests

**Key design decisions:**
- List endpoints filter inaccessible objects (`404`), detail endpoints enforce object permissions (`403`)
- External services (Paystack, PDF) isolated and mocked in tests for deterministic runs
- JWT short-lived (15min) with refresh rotation and HttpOnly cookies

---

## 👥 Role-Based Permission System

| Role | Scope | Key Actions |
|---|---|---|
| Super Admin | System-wide | Schools, billing, global config |
| School Admin | Institution-wide | Instructors, courses, reports |
| Instructor | Course-wide | Content creation, grading, messaging |
| Student | Enrollment-only | Learn, submit, track progress |
| Parent | View-only (child) | Monitor progress, receive reports |

---

## ⚙️ Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Frontend | React, TypeScript, Vite |
| Database | PostgreSQL (SQLite for local dev) |
| Auth | JWT (SimpleJWT) + role-based permissions |
| Payments | Paystack + webhook verification |
| Async | Celery + RabbitMQ |
| Caching | Redis |
| Storage | AWS S3 + CloudFront |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## ✅ Core Features

- JWT authentication with 5-tier role-based access control
- Course creation, module ordering, and enrollment workflows
- Auto-graded quizzes — timed, ordered, duplicate-submission-proof
- Secure PDF result generation
- Paystack payment tracking with webhook verification
- Analytics endpoints for instructors and students
- OpenAPI/Swagger docs at `/api/schema/`
- Integration tests covering auth, permissions, assessments, analytics, payments

---

## 🚀 Local Development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Environment variables:**

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
PAYSTACK_SECRET_KEY=your-paystack-key
```

**Run tests:**

```bash
python manage.py test
```

**Run with Docker:**

```bash
docker compose up --build
```

---

## 🗺️ Roadmap

| Phase | Feature |
|---|---|
| Now | Frontend assessment workflows, grading dashboard |
| Next | Containerized deployment, production hosting |
| V3 | Live classes (WebRTC), mobile PWA |
| V4 | AI tutor, predictive dropout alerts |

---

## 📬 Contact

**Abdullahi Musliudeen**
[LinkedIn](https://www.linkedin.com/in/abdullahi-musliudeen-64435a239/) · abdullahmusliudeen@gmail.com

---

MIT License

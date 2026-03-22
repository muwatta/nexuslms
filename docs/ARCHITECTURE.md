# Muwatta Academy - System Architecture Overview

## 🏗️ System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      MUWATA ACADEMY LMS                          │
│                    Department-Based Platform                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
│                        http://localhost:5173                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Landing Page (Public)                                           │
│  ├─ Hero Section (Muwatta Academy)                                │
│  ├─ 3 Program Cards (Western, Arabic, Programming)              │
│  └─ Features Section                                             │
│                                                                   │
│  Authentication Pages                                            │
│  ├─ Login Page                                                   │
│  └─ Signup Page (with Department + Profile Fields)              │
│                                                                   │
│  Protected Routes (JWT-Protected)                               │
│  ├─ Department Dashboards                                        │
│  │  ├─ Western Dashboard (Blue, English focus)                   │
│  │  ├─ Arabic Dashboard (Green, Bilingual)                       │
│  │  └─ Programming Dashboard (Dark, Tech focus)                  │
│  ├─ Resource Pages                                               │
│  │  ├─ Courses (course list & enrollment)                        │
│  │  ├─ My Classes (enrollments)                                  │
│  │  ├─ Assignments (assignment list)                             │
│  │  ├─ Achievements (certificates, badges) 🆕                    │
│  │  ├─ Projects (project tracking) 🆕                            │
│  │  ├─ Milestones (progress tracking) 🆕                         │
│  │  ├─ Payments (Paystack integration)                           │
│  │  └─ Analytics (student statistics)                            │
│  └─ Navbar (Navigation + Logout)                                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
           │
           │ HTTP/HTTPS (Axios)
           │ JWT Token in Headers
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Django + DRF)                       │
│                   http://localhost:8000/api                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Authentication Endpoints                                        │
│  ├─ POST /api/token/                (JWT Token)                  │
│  ├─ POST /api/token/refresh/        (Token Refresh)              │
│  └─ POST /api/register/             (User Registration)          │
│                                                                   │
│  Core Resource Endpoints (CRUD)                                 │
│  ├─ /api/profiles/                  (User Profiles)              │
│  ├─ /api/courses/                   (Courses)                    │
│  ├─ /api/enrollments/               (Enrollments)                │
│  ├─ /api/assignments/               (Assignments)                │
│  ├─ /api/assignment-submissions/    (Submissions)                │
│  ├─ /api/quizzes/                   (Quizzes)                    │
│  ├─ /api/quiz-submissions/          (Quiz Responses)             │
│  ├─ /api/payments/                  (Payments)                   │
│  ├─ /api/achievements/              (Achievements) 🆕            │
│  ├─ /api/projects/                  (Projects) 🆕                │
│  └─ /api/milestones/                (Milestones) 🆕              │
│                                                                   │
│  Admin Endpoints                                                 │
│  └─ /admin/                         (Django Admin)               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
           │
           │ ORM (Django Models)
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
│  SQLite (Dev) / PostgreSQL (Production)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Core Tables                                                     │
│  ├─ auth_user        (Django built-in)                           │
│  ├─ api_profile      (Extended user info + 🆕 dept, bio, phone)  │
│  ├─ api_course       (Course definitions)                        │
│  ├─ api_enrollment   (Student enrollments)                       │
│  ├─ api_assignment   (Course assignments)                        │
│  ├─ api_quiz         (Quizzes)                                   │
│  ├─ api_payment      (Paystack transactions)                     │
│  ├─ api_achievement  (Certificates, badges) 🆕                   │
│  ├─ api_project      (Course projects) 🆕                        │
│  └─ api_milestone    (Progress milestones) 🆕                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

```

---

## 👥 User Data Flow

### Student Registration & Login

```
New Student Signup
    ↓
    ├─ Select Department (western/arabic/programming)
    ├─ Select Class Level (B1-B5, JSS1-3, SS1-3, idaady, thanawi)
    ├─ Enter Personal Info (bio, phone, parent_email)
    └─ Create Account
         ↓
    Django Creates:
    ├─ django.contrib.auth.User (username, email, password)
    └─ api.Profile (extends User, adds department, class, bio, etc.)
         ↓
         ▼
    Automatic Dashboard Assignment:
    Loop: Profile.department
    ├─ "western"     → WesternDashboard
    ├─ "arabic"      → ArabicDashboard
    └─ "programming" → ProgrammingDashboard
```

---

## 🏫 Department Structure

### Western School 🌍

```
Western School Dashboard
├─ Courses: English Language, Modern Studies, General Education
├─ Achievements: Language Proficiency, Academic Awards
├─ Theme: Blue (#3D5A80)
├─ Language: English
└─ Icons: 🌍, 📚, ✅, 📊
```

### Arabic School 🕌

```
Arabic School Dashboard (Bilingual)
├─ Courses: Arabic Language, Islamic Studies, Cultural Education
├─ Achievements: Arabic Proficiency, Quranic Memorization
├─ Theme: Green (#059669)
├─ Languages: English + العربية
├─ Display: RTL-friendly (future enhancement)
└─ Icons: 🕌, 📖, 🌟, 🎓
```

### Programming School 💻

```
Programming School Dashboard
├─ Courses: Web Dev, Data Structures, Cloud Computing
├─ Projects: Active coding projects with progress tracking
├─ Achievements: Programming Badges, Project Completions
├─ Theme: Dark/Slate (#1E293B)
├─ Design: Terminal-inspired
├─ Metrics: GitHub repos, Skill points, Project status
└─ Icons: 💻, 🚀, 📦, ⚡
```

---

## 🎯 Achievement System

### Data Model

```
Achievement
├─ id: Primary Key
├─ student: FK → Profile
├─ course: FK → Course
├─ title: CharField (200)
├─ achievement_type: "certificate" | "badge" | "award"
├─ description: TextField
├─ date_earned: DateTime
└─ created_at: DateTime (auto)

Project
├─ id: Primary Key
├─ course: FK → Course
├─ title: CharField (200)
├─ description: TextField
├─ start_date: Date
├─ end_date: Date (nullable)
├─ status: "active" | "completed" | "archived"
└─ created_at: DateTime (auto)

Milestone
├─ id: Primary Key
├─ course: FK → Course
├─ title: CharField (200)
├─ description: TextField
├─ related_to: "enrollment" | "assignment" | "quiz" | "project"
├─ progress_percentage: 0-100
└─ created_at: DateTime (auto)
```

---

## 🔐 Authentication Protocol

```
Unauthenticated User
    ↓
    Lands on Landing Page (/)
    ├─ View programs
    └─ Login/Signup buttons

    Click Login
    ↓
    Submit credentials to POST /api/token/
    ↓
    Backend returns:
    {
      "access": "eyJ...",    ← Short-lived JWT
      "refresh": "eyJ...",   ← Long-lived refresh token
      "user": {...}
    }
    ↓
    Frontend stores in localStorage
    ├─ access_token
    └─ refresh_token
    ↓
    Axios interceptor adds to requests:
    Authorization: Bearer {access_token}
    ↓
    Fetch user profile → Get department
    ↓
    Route to department-specific dashboard

---

Token Expiry (401 Response)
    ↓
    Axios response interceptor triggers
    ↓
    POST /api/token/refresh/
    {
      "refresh": "eyJ..."
    }
    ↓
    Backend returns new access token
    ↓
    Update localStorage
    ↓
    Retry original request
```

---

## 📊 Key Database Relationships

```
User (Django built-in)
  │
  └─→ Profile (1:1) 🆕 ENHANCED
       ├─ department: western|arabic|programming
       ├─ student_class: B1-SS3, idaady, thanawi
       ├─ bio, phone, parent_email
       │
       ├─→ Achievement (1:M) 🆕
       │    └─→ Course (M:1)
       │
       ├─→ Enrollment (1:M)
       │    └─→ Course (M:1)
       │
       ├─→ AssignmentSubmission (1:M)
       │    └─→ Assignment (M:1)
       │         └─→ Course (M:1)
       │
       ├─→ QuizSubmission (1:M)
       │    └─→ Quiz (M:1)
       │         └─→ Course (M:1)
       │
       └─→ Payment (1:M)
            └─→ Course (M:1)

Course
  ├─→ Enrollment (1:M)
  ├─→ Assignment (1:M)
  ├─→ Quiz (1:M)
  ├─→ Achievement (1:M) 🆕
  ├─→ Project (1:M) 🆕
  └─→ Milestone (1:M) 🆕
```

---

## 🔄 Frontend Component Tree

```
App (React Router)
├─ BrowserRouter
│  ├─ Routes
│  │  ├─ / → Landing (Public)
│  │  ├─ /login → Login (Public)
│  │  ├─ /signup → Signup (Public)
│  │  ├─ /dashboard → ProtectedRoute
│  │  │  └─ Dashboard (Routes to dept dashboard)
│  │  │     ├─ WesternDashboard
│  │  │     ├─ ArabicDashboard
│  │  │     └─ ProgrammingDashboard
│  │  ├─ /courses → ProtectedRoute → Courses
│  │  ├─ /enrollments → ProtectedRoute → Enrollments
│  │  ├─ /assignments → ProtectedRoute → Assignments
│  │  ├─ /achievements → ProtectedRoute → ViewAchievements 🆕
│  │  ├─ /projects → ProtectedRoute → ViewProjects 🆕
│  │  ├─ /milestones → ProtectedRoute → ViewMilestones 🆕
│  │  ├─ /payments → ProtectedRoute → Payments
│  │  └─ /analytics → ProtectedRoute → Analytics
│  │
│  └─ Navbar (Master Component)
│     ├─ Logo (Link to Landing)
│     ├─ Auth Links (if !token)
│     │  ├─ Login
│     │  └─ Signup
│     └─ Nav Links (if token)
│        ├─ Dashboard
│        ├─ Courses
│        ├─ My Classes
│        ├─ Assignments
│        ├─ Achievements 🆕
│        ├─ Projects 🆕
│        ├─ Milestones 🆕
│        ├─ Analytics
│        └─ Logout

API Service Layer (api.ts)
├─ Axios instance (baseURL: VITE_API_URL)
├─ Request interceptor (attach JWT)
└─ Response interceptor (refresh on 401)
```

---

## 📈 Registration Form Fields

### All Users

- ✅ Username
- ✅ Email
- ✅ Password
- ✅ Role (student|instructor|admin)

### Students Only (Conditional)

- 🆕 Department (western|arabic|programming)
- 🆕 Student Class (B1-B5, JSS1-3, SS1-3, idaady, thanawi)
- 🆕 Bio (textarea)
- 🆕 Phone (tel type)
- 🆕 Parent Email

### Instructors/Admins Only

- None (basic fields only)

---

## 🚀 Deployment Layers

```
Development
├─ Backend: python manage.py runserver (port 8000)
├─ Frontend: npm run dev (port 5173, Vite)
└─ Database: SQLite (db.sqlite3)

Production (Docker)
├─ Docker Compose
│  ├─ Web Service (Django)
│  │  ├─ Migrations auto-run
│  │  ├─ Gunicorn WSGI server
│  │  ├─ PORT 8000
│  │  └─ Settings: nexuslms.settings.prod
│  │
│  └─ Database Service (PostgreSQL)
│     ├─ PORT 5432
│     ├─ Persistent volume
│     └─ env: DATABASE_URL
│
├─ Frontend Build
│  ├─ npm run build
│  ├─ dist/ folder (static files)
│  └─ Served by web server (nginx/Apache)
│
└─ Environment Variables
   ├─ DATABASE_URL (PostgreSQL)
   ├─ SECRET_KEY
   ├─ DEBUG (False)
   ├─ ALLOWED_HOSTS
   └─ VITE_API_URL (production API)
```

---

## 🛠️ Admin Operations

```
Django Admin Panel (/admin/)
│
├─ Users (built-in)
├─ Profiles 🆕 ENHANCED
│  ├─ List: username, email, department, student_class
│  ├─ Search: username, email
│  └─ Filter: department, student_class
│
├─ Courses
├─ Enrollments
├─ Assignments
├─ Quizzes
├─ Payments
│
├─ Achievements 🆕
│  ├─ List: title, type, student, course, date_earned
│  ├─ Search: title, student__user__username
│  └─ Filter: achievement_type, date_earned, course
│
├─ Projects 🆕
│  ├─ List: title, course, status, start_date, end_date
│  ├─ Search: title, course__title
│  └─ Filter: status, start_date
│
└─ Milestones 🆕
   ├─ List: title, related_to, progress, course
   ├─ Search: title, course__title
   └─ Filter: related_to, progress_percentage
```

---

## ✨ New Features Summary

### Backend 🔧

- 3 new models (Achievement, Project, Milestone)
- Enhanced Profile with department & personal fields
- 3 new viewsets with proper permissions
- 3 new serializers
- Database migration with comprehensive schema updates
- Admin interface fully configured

### Frontend 🎨

- 3 department-specific dashboards
- 3 achievement/project/milestone viewer pages
- Enhanced registration form with department & personal fields
- Improved navbar with new navigation links
- Professional landing page
- Department-aware dashboard routing

### UX/UI 🎯

- Color-coded dashboards by department
- Emojis for visual identification
- Responsive grid layouts
- Progress bars for projects/milestones
- Festival-themed achievements display
- Terminal-inspired programming dashboard

---

## 📊 Metrics & Statistics

### Achievement System

- 3 types: certificate, badge, award
- Displayed in filterable cards
- Date tracking for earned dates
- Category grouping on display page

### Project Tracking

- 3 statuses: active, completed, archived
- Progress percentage calculation
- Timeline visualization
- Status filtering

### Milestone System

- 4 categories: enrollment, assignment, quiz, project
- 0-100% progress tracking
- Grouped display by category
- Statistics calculation (average, completion count)

---

## 🎓 Learning Paths by Department

### Western School Path

```
Student Registration
    ↓ (Select "western")
Western Dashboard
    ↓
Enroll in Courses
    ↓
Complete Assignments
    ↓
Take Quizzes
    ↓
Earn Certificates/Badges
    ↓
View Achievements
```

### Arabic School Path

```
Student Registration
    ↓ (Select "arabic")
Arabic Dashboard (Bilingual)
    ↓
Enroll in Arabic/Islamic Courses
    ↓
Complete Arabic Language Tasks
    ↓
Earn Language Proficiency Badges
    ↓
Track Progress in Arabic Interface
```

### Programming School Path

```
Student Registration
    ↓ (Select "programming")
Programming Dashboard (Tech Design)
    ↓
Enroll in Coding Courses
    ↓
Work on Projects
    ↓
Track Project Status
    ↓
Earn Programming Badges
    ↓
View Skill Metrics & GitHub Integration (future)
```

---

## 🔗 API Specifications

### Response Format

All API responses follow consistent format:

```json
// List/Retrieve
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  "nested": {
    "id": 2,
    "name": "Name"
  },
  "created_at": "2024-01-01T12:00:00Z"
}

// Error
{
  "error": "Error message"
  // or field-specific
  "field_name": ["Error for this field"]
}
```

### Common Query Parameters

- `?limit=10` - Pagination
- `?offset=0` - Pagination offset
- `?ordering=-created_at` - Sort (ascending/descending)
- `?search=query` - Text search
- `?department=western` - Filter by field

---

**Architecture Last Updated**: 2024
**Platform**: Muwatta Academy LMS v2.0
**Status**: Production-Ready

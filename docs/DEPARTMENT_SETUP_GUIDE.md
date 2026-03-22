# Muwatta Academy - Department-Based LMS Platform Update

## Summary of Changes

This update transforms the generic LMS into a professional, department-specific school platform called **Muwatta Academy** with three distinct schools and enhanced student tracking features.

---

## 📚 Backend Changes

### New Models

#### 1. **Achievement System** (`api/models/achievement.py`)

- **Achievement**: Tracks student certificates, badges, and awards
  - Fields: student (FK), course (FK), title, achievement_type, date_earned
  - Types: Certificate, Badge, Award

- **Project**: Course-level project management
  - Fields: course (FK), title, description, start_date, end_date, status
  - Statuses: Active, Completed, Archived

- **Milestone**: Student progress tracking
  - Fields: course (FK), title, progress_percentage, related_to
  - Related to: Enrollment, Assignment, Quiz, Project

### Enhanced Models

#### 2. **Profile Model Updates** (`api/models/profile.py`)

- **New Fields**:
  - `department`: CharField (western, arabic, programming)
  - `bio`: TextField for student bio
  - `phone`: CharField for contact
  - `parent_email`: EmailField for parent communication

- **Enhanced Class Levels**:
  - B1-B5 (Basic levels)
  - JSS1-3 (Junior Secondary School)
  - SS1-3 (Senior Secondary School)
  - Idaady (Intermediate Arabic)
  - Thanawi (Advanced Arabic)

### New API Endpoints

1. **Achievements**
   - `GET /api/achievements/` - List user's achievements
   - `POST /api/achievements/` - Create achievement
   - `GET /api/achievements/{id}/` - Get achievement detail
   - `PUT/PATCH /api/achievements/{id}/` - Update achievement
   - `DELETE /api/achievements/{id}/` - Delete achievement

2. **Projects**
   - `GET /api/projects/` - List projects
   - `POST /api/projects/` - Create project
   - (Full CRUD available)

3. **Milestones**
   - `GET /api/milestones/` - List milestones
   - `POST /api/milestones/` - Create milestone
   - (Full CRUD available)

### Registration Update

The `/api/register/` endpoint now accepts:

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "student|instructor|admin",
  "department": "western|arabic|programming", // Students only
  "student_class": "B1|B2|...|thanawi", // Students only
  "bio": "string", // Students only
  "phone": "string", // Students only
  "parent_email": "string" // Students only
}
```

---

## 🎨 Frontend Changes

### New Components & Pages

#### 1. **Department-Specific Dashboards**

Three distinct dashboard layouts based on student's department:

- **Western School Dashboard** (`frontend/src/pages/WesternDashboard.tsx`)
  - Focus: English, Modern Studies
  - Color scheme: Blue
  - Stats: Courses, Achievements, Assignments due, Quiz average

- **Arabic School Dashboard** (`frontend/src/pages/ArabicDashboard.tsx`)
  - Focus: Arabic language and Islamic studies
  - Bilingual interface: English and Arabic
  - Color scheme: Green
  - Messaging: "جزاك الله خيراً" (May Allah reward you)

- **Programming School Dashboard** (`frontend/src/pages/ProgrammingDashboard.tsx`)
  - Focus: Coding projects and technical skills
  - Terminal-style design (dark theme)
  - Color scheme: Cyan/Purple with tech aesthetics
  - Metrics: Projects, GitHub repos, Skill points

#### 2. **Achievement/Project/Milestone Pages**

- **Achievements** (`frontend/src/pages/ViewAchievements.tsx`)
  - Display certificates, badges, awards
  - Filter by achievement type
  - Visual cards with emoji icons
  - Gold/yellow theme

- **Projects** (`frontend/src/pages/ViewProjects.tsx`)
  - List all course projects
  - Filter by status (active, completed, archived)
  - Progress bars for active projects
  - Timeline visualization

- **Milestones** (`frontend/src/pages/ViewMilestones.tsx`)
  - Track progress across courses
  - Group by category (enrollment, assignment, quiz, project)
  - Statistics: completion rate, progress average
  - Green/teal theme

### Updated Components

#### 1. **Main Dashboard** (`frontend/src/pages/Dashboard.tsx`)

- Now routes to department-specific dashboard based on user's profile
- Fetches user profile and checks `department` field
- Dynamic component rendering

#### 2. **Registration Form** (`frontend/src/pages/Signup.tsx`)

- **Basic Fields**: Username, Email, Password, Role
- **Role-Based Fields** (Students only):
  - Department selection (3 radio buttons with emojis)
  - Class level dropdown (13 options)
  - Bio text area
  - Phone number field
  - Parent email field
- **Styling**: Professional card-based layout with gradients
- **Validation**: Uses backend serializer validation

#### 3. **Navigation Bar** (`frontend/src/components/Navbar.tsx`)

- Elementary icon-based navigation
- Added links: Dashboard, Courses, My Classes, Assignments, **Achievements**, **Projects**, **Milestones**, Analytics, **AI Help**
- Improved styling with gradients and hover effects
- Responsive design

#### 4. **App Router** (`frontend/src/App.tsx`)

- Added routes for achievements, projects, milestones
- Landing page as public home
- Dashboard moved to `/dashboard` (was `/`)
- All content pages now under protected routes

### Landing Page

(`frontend/src/pages/Landing.tsx`)

- Professional hero section with Muwatta Academy branding
- 3 Program cards:
  - 🌍 Western School
  - 🕌 Arabic School
  - 💻 Programming
- Features section highlighting academy strengths
- Call-to-action buttons (Login/Signup)
- Responsive design

---

## 📋 Database Schema Changes

### Migration File: `0003_add_achievements_projects.py`

**Operations**:

1. Add 4 fields to Profile
2. Alter student_class choices (expand to 13 options)
3. Create Achievement table
4. Create Project table
5. Create Milestone table

### Example Data After Migration

```
Profile
├── department: "western" | "arabic" | "programming"
├── student_class: "B1" through "thanawi"
├── bio, phone, parent_email
└── relationships to achievements

Achievement
├── student (FK Profile)
├── course (FK Course)
├── achievement_type: "certificate" | "badge" | "award"
└── date_earned

Project
├── course (FK Course)
├── status: "active" | "completed" | "archived"
├── start_date, end_date
└── description

Milestone
├── course (FK Course)
├── related_to: "enrollment" | "assignment" | "quiz" | "project"
├── progress_percentage (0-100)
└── description
```

---

## 🚀 Installation & Setup Instructions

### Backend Setup

1. **Apply Migrations**

   ```bash
   python manage.py migrate api
   ```

2. **Create Superuser (if needed)**

   ```bash
   python manage.py createsuperuser
   ```

3. **Access Admin Interface**
   - Visit `http://localhost:8000/admin/`
   - Login with superuser credentials
   - Manage Achievement, Project, Milestone records

### Frontend Setup

1. **Install Dependencies** (if not already done)

   ```bash
   cd frontend
   npm install
   ```

2. **Run Development Server**

   ```bash
   npm run dev
   ```

3. **Access Application**
   - Visit `http://localhost:5173` (or shown port)
   - Landing page automatically serves as home

---

## 📝 Usage Guide

### For Students

1. **Registration**
   - Sign up and select your department (Western, Arabic, or Programming)
   - Select your class level from dropdown
   - Provide contact information and parent email

2. **Dashboard**
   - Your specific department dashboard loads automatically
   - View courses, achievements, and progress metrics

3. **Track Progress**
   - View achievements in the Achievements page
   - Track projects and their status in Projects page
   - Monitor milestones and completion progress in Milestones page

### For Instructors/Admins

1. **Django Admin Interface**
   - Create and manage Achievements for students
   - Create Projects for courses
   - Set up Milestones for tracking progress
   - Assign achievements to students

2. **Bulk Operations**
   - Use Django admin's list_display, search_fields, and list_filter features
   - Create achievements in bulk via CSV import (if configured)

---

## 🎯 Key Features by Department

### Western School

- **Focus**: English language, modern studies, general education
- **Dashboard**: Course progress, quiz scores, language certificates
- **Achievements**: Language proficiency certificates, academic awards

### Arabic School

- **Focus**: Arabic language, Islamic studies, cultural education
- **Dashboard**: Bilingual interface (English + Arabic)
- **Achievements**: Arabic proficiency, Quranic memorization badges

### Programming School

- **Focus**: Software development, coding skills, projects
- **Dashboard**: Terminal-inspired tech design
- **Achievements**: Programming badges, project completions
- **Projects**: Active coding projects with status tracking

---

## 🔄 Authentication Flow

1. **Public Access**: Landing page accessible to all
2. **Registration**: Choose department during sign-up
3. **Login**: JWT token-based authentication
4. **Protected Routes**: Automatic token refresh on 401
5. **Dashboard**: Routes to appropriate department-specific view

---

## 🗂️ File Structure

### Backend

```
api/
├── models/
│   ├── achievement.py (NEW)
│   ├── profile.py (UPDATED)
│   └── ...
├── serializers/
│   ├── achievement.py (NEW)
│   └── ...
├── views/
│   ├── achievement.py (NEW)
│   └── ...
└── migrations/
    └── 0003_add_achievements_projects.py (NEW)
```

### Frontend

```
frontend/src/pages/
├── Dashboard.tsx (UPDATED - routes to department dashboards)
├── WesternDashboard.tsx (NEW)
├── ArabicDashboard.tsx (NEW)
├── ProgrammingDashboard.tsx (NEW)
├── ViewAchievements.tsx (NEW)
├── ViewProjects.tsx (NEW)
├── ViewMilestones.tsx (NEW)
├── Signup.tsx (UPDATED - new fields)
└── Landing.tsx (EXISTING)

frontend/src/components/
└── Navbar.tsx (UPDATED - new links)
```

---

## 🔧 Configuration

### Environment Variables

Ensure `.env` file has:

```
VITE_API_URL=http://localhost:8000/api
```

### Django Settings

Already configured for:

- CORS enabled
- Media file handling
- Database (SQLite for dev, PostgreSQL for production)
- JWT authentication with refresh tokens

---

## ✅ Testing Checklist

- [ ] Backend migrations apply successfully
- [ ] Admin interface shows Achievement, Project, Milestone models
- [ ] Frontend npm install completes
- [ ] Landing page loads at `/`
- [ ] Registration form accepts all fields
- [ ] Student can select department during signup
- [ ] Login redirects to department-specific dashboard
- [ ] Achievement/Project/Milestone pages load and display data
- [ ] Navbar shows all navigation links
- [ ] Logout clears tokens and redirects to login

---

## 🐛 Troubleshooting

| Issue                            | Solution                                               |
| -------------------------------- | ------------------------------------------------------ |
| Migration errors                 | Ensure `0002_add_paystack_response` is applied first   |
| New fields not appearing         | Clear browser cache and do fresh login                 |
| Dashboard not loading department | Check user profile in admin - ensure department is set |
| Form validation errors           | Check browser console for specific field errors        |
| 404 on new pages                 | Ensure imports are correct in App.tsx                  |

---

## 📞 Support

For issues or questions:

1. Check Django error logs: `python manage.py runserver`
2. Check browser console for frontend errors
3. Verify database migrations: `python manage.py showmigrations`
4. Check API responses in Network tab (DevTools)

---

## 🎓 Next Steps (Optional Enhancements)

- [ ] Email notifications when achievements earned
- [ ] Instructor dashboard for managing achievements
- [ ] Export certificates as PDF
- [ ] Department-specific resource library
- [ ] Peer comparison analytics (with privacy controls)
- [ ] Mobile app support
- [ ] Real-time notifications via WebSocket

---

**Platform**: Muwatta Academy
**Version**: 2.0 (Department-Based)
**Last Updated**: 2024

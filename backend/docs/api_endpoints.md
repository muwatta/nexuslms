# NexusLMS API Endpoints

Base URL: `/api/`

Authentication: JWT tokens in HttpOnly cookies. Obtain via `/api/auth/login/`.

---

## System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service status |
| GET | `/healthz` | Liveness probe |
| GET | `/readyz` | Readiness probe (DB check) |

## Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login/` | Login, sets JWT cookies | No |
| POST | `/api/auth/refresh/` | Refresh access token | No |
| POST | `/api/auth/logout/` | Blacklist tokens, clear cookies | Yes |
| GET | `/api/auth/status/` | Current user info | Yes |
| POST | `/api/auth/password-reset-request/` | Send OTP to email | No |
| POST | `/api/auth/verify-otp/` | Verify OTP code | No |
| POST | `/api/auth/password-reset-confirm/` | Reset password with OTP | No |
| POST | `/api/register/` | Register new user | No |
| POST | `/api/token/` | Obtain JWT pair (JSON body) | No |
| POST | `/api/token/refresh/` | Refresh JWT (JSON body) | No |

## Permissions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/permissions/me/` | Current user's role and permissions | Yes |
| GET | `/api/roles-and-permissions/` | All roles, permissions, departments | No |

## Profiles

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/profiles/` | List profiles (scoped by role) | Yes |
| POST | `/api/profiles/` | Create profile | Yes |
| GET | `/api/profiles/{id}/` | Retrieve profile | Yes |
| PUT | `/api/profiles/{id}/` | Full update | Yes |
| PATCH | `/api/profiles/{id}/` | Partial update | Yes |
| DELETE | `/api/profiles/{id}/` | Delete profile | Yes |
| GET | `/api/profiles/me/` | Get own profile | Yes |
| PATCH | `/api/profiles/update_me/` | Update own profile | Yes |
| POST | `/api/profiles/{id}/archive/` | Archive profile | Admin |
| POST | `/api/profiles/{id}/restore/` | Restore archived profile | Admin |
| POST | `/api/profiles/{id}/promote/` | Promote student | Admin |
| GET | `/api/profiles/archived/` | List archived profiles | Admin |

## Courses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/courses/` | List courses (scoped by role/dept) | Yes |
| POST | `/api/courses/` | Create course | Admin/Teacher |
| GET | `/api/courses/{id}/` | Retrieve course | Yes |
| PUT | `/api/courses/{id}/` | Full update | Admin/Teacher |
| PATCH | `/api/courses/{id}/` | Partial update | Admin/Teacher |
| DELETE | `/api/courses/{id}/` | Delete course | Admin/Teacher |
| GET | `/api/courses/{id}/syllabus/pdf/` | Download syllabus PDF | Yes |

Filters: `?department=`, `?student_class=`, `?is_active=`, `?instructor=`

## Enrollments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/enrollments/` | List enrollments (scoped) | Yes |
| POST | `/api/enrollments/` | Create enrollment | Yes |
| GET | `/api/enrollments/{id}/` | Retrieve enrollment | Yes |
| PUT | `/api/enrollments/{id}/` | Full update | Yes |
| PATCH | `/api/enrollments/{id}/` | Partial update | Yes |
| DELETE | `/api/enrollments/{id}/` | Delete enrollment | Yes |

Filters: `?student=`, `?course=`, `?academic_year=`, `?status=`

## Quizzes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/quizzes/` | List quizzes | Yes |
| POST | `/api/quizzes/` | Create quiz | Admin/Teacher |
| GET | `/api/quizzes/{id}/` | Retrieve quiz | Yes |
| PUT | `/api/quizzes/{id}/` | Full update | Admin/Teacher |
| PATCH | `/api/quizzes/{id}/` | Partial update | Admin/Teacher |
| DELETE | `/api/quizzes/{id}/` | Delete quiz | Admin/Teacher |

## Questions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/questions/` | List questions | Yes |
| POST | `/api/questions/` | Create question | Admin/Teacher |
| GET | `/api/questions/{id}/` | Retrieve question | Yes |
| PUT | `/api/questions/{id}/` | Full update | Admin/Teacher |
| PATCH | `/api/questions/{id}/` | Partial update | Admin/Teacher |
| DELETE | `/api/questions/{id}/` | Delete question | Admin/Teacher |

## Quiz Submissions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/quiz-submissions/` | List submissions | Yes |
| POST | `/api/quiz-submissions/` | Submit quiz (students) | Yes |
| GET | `/api/quiz-submissions/{id}/` | Retrieve submission | Yes |
| PUT | `/api/quiz-submissions/{id}/` | Full update | Yes |
| PATCH | `/api/quiz-submissions/{id}/` | Partial update | Yes |
| DELETE | `/api/quiz-submissions/{id}/` | Delete submission | Yes |
| POST | `/api/quiz-submissions/{id}/publish/` | Publish result | Instructor/Admin |
| GET | `/api/quiz-submissions/{id}/result/pdf/` | Download result PDF | Yes |

## Assignments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/assignments/` | List assignments | Yes |
| POST | `/api/assignments/` | Create assignment | Admin/Teacher |
| GET | `/api/assignments/{id}/` | Retrieve assignment | Yes |
| PUT | `/api/assignments/{id}/` | Full update | Admin/Teacher |
| PATCH | `/api/assignments/{id}/` | Partial update | Admin/Teacher |
| DELETE | `/api/assignments/{id}/` | Delete assignment | Admin/Teacher |
| GET | `/api/assignments/{id}/download_template/` | CSV template | Admin/Teacher |
| GET | `/api/assignments/{id}/pdf/` | Assignment PDF | Yes |
| POST | `/api/assignments/{id}/upload_results/` | Upload CSV grades | Admin/Teacher |

## Assignment Submissions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/assignment-submissions/` | List submissions | Yes |
| POST | `/api/assignment-submissions/` | Submit assignment (students) | Yes |
| GET | `/api/assignment-submissions/{id}/` | Retrieve submission | Yes |
| PUT | `/api/assignment-submissions/{id}/` | Full update | Admin/Teacher |
| PATCH | `/api/assignment-submissions/{id}/` | Partial update | Admin/Teacher |
| DELETE | `/api/assignment-submissions/{id}/` | Delete submission | Admin/Teacher |
| POST | `/api/assignment-submissions/{id}/publish/` | Publish submission | Admin/Teacher |
| GET | `/api/assignment-submissions/{id}/pdf/` | Submission PDF | Yes |

## Results

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/results/` | List results (scoped) | Yes |
| POST | `/api/results/` | Create result entry | Yes |
| GET | `/api/results/{id}/` | Retrieve result | Yes |
| PUT | `/api/results/{id}/` | Full update (draft only) | Yes |
| PATCH | `/api/results/{id}/` | Partial update (draft only) | Yes |
| DELETE | `/api/results/{id}/` | Delete result | Yes |
| POST | `/api/results/{id}/submit/` | Submit for review | Teacher |
| POST | `/api/results/{id}/review/` | Review result | Teacher/Admin |
| POST | `/api/results/{id}/publish/` | Publish result | Admin |
| GET | `/api/results/class_results/` | Class results | Yes |
| POST | `/api/results/bulk_entry/` | Bulk create/update | Teacher/Admin |
| POST | `/api/results/compute_positions/` | Compute positions | Admin |

Query params: `?term=`, `?academic_year=`, `?course=`, `?student=`, `?status=`, `?student_class=`

## Report Cards

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/report-cards/` | List report cards (scoped) | Yes |
| GET | `/api/report-cards/{id}/` | Retrieve report card | Yes |
| POST | `/api/report-cards/generate/` | Generate for class/term | Admin |
| POST | `/api/report-cards/{id}/publish/` | Publish single card | Admin |
| POST | `/api/report-cards/publish_all/` | Publish all for class/term | Admin |

## Payments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/payments/` | List payments | Yes |
| POST | `/api/payments/` | Initiate payment (Paystack) | Student |
| GET | `/api/payments/{id}/` | Retrieve payment | Yes |
| PUT | `/api/payments/{id}/` | Full update | Admin |
| PATCH | `/api/payments/{id}/` | Partial update | Admin |
| DELETE | `/api/payments/{id}/` | Delete payment | Admin |

## Achievements

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/achievements/` | List achievements | Yes |
| POST | `/api/achievements/` | Create achievement | Admin/Teacher |
| GET | `/api/achievements/{id}/` | Retrieve achievement | Yes |
| PUT | `/api/achievements/{id}/` | Full update | Admin/Teacher |
| PATCH | `/api/achievements/{id}/` | Partial update | Admin/Teacher |
| DELETE | `/api/achievements/{id}/` | Delete achievement | Admin/Teacher |

## Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/` | List projects | Yes |
| POST | `/api/projects/` | Create project | Admin/Teacher |
| GET | `/api/projects/{id}/` | Retrieve project | Yes |
| PUT | `/api/projects/{id}/` | Full update | Admin/Teacher |
| PATCH | `/api/projects/{id}/` | Partial update | Admin/Teacher |
| DELETE | `/api/projects/{id}/` | Delete project | Admin/Teacher |

## Milestones

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/milestones/` | List milestones | Yes |
| POST | `/api/milestones/` | Create milestone | Admin/Teacher |
| GET | `/api/milestones/{id}/` | Retrieve milestone | Yes |
| PUT | `/api/milestones/{id}/` | Full update | Admin/Teacher |
| PATCH | `/api/milestones/{id}/` | Partial update | Admin/Teacher |
| DELETE | `/api/milestones/{id}/` | Delete milestone | Admin/Teacher |

## Subject Assignments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/subject-assignments/` | List subject assignments | Yes |
| POST | `/api/subject-assignments/` | Create assignment | Admin |
| GET | `/api/subject-assignments/{id}/` | Retrieve assignment | Yes |
| PATCH | `/api/subject-assignments/{id}/` | Update assignment | Admin |
| DELETE | `/api/subject-assignments/{id}/` | Delete assignment | Admin |
| GET | `/api/subject-assignments/my_subjects/` | Student's assigned teachers | Yes |
| GET | `/api/subject-assignments/my_students/` | Teacher's assigned students | Yes |

## Audit Logs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/audit-logs/` | List audit logs | Admin |
| GET | `/api/audit-logs/{id}/` | Retrieve audit entry | Admin |

Filters: `?action=`, `?model_name=`, `?user=`, `?start_date=`, `?end_date=`

## Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users/` | List users (scoped) | Admin |
| POST | `/api/admin/users/` | Create user + profile | Admin |
| GET | `/api/admin/users/{id}/` | Retrieve user | Admin |
| PATCH | `/api/admin/users/{id}/` | Update user | Admin |
| DELETE | `/api/admin/users/{id}/` | Delete user | Admin |
| POST | `/api/admin/users/{id}/set_password/` | Set user password | Admin |
| POST | `/api/admin/users/{id}/archive/` | Archive user | Admin |
| POST | `/api/admin/users/{id}/restore/` | Restore user | Admin |
| GET | `/api/admin/users/stats/` | User counts by role/dept | Admin |
| POST | `/api/admin/sync-groups/` | Sync role-to-group mappings | Admin |

## Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/student/{id_or_name}/` | Student analytics | Admin/Teacher |
| GET | `/api/analytics/course/{id_or_title}/` | Course analytics | Admin/Teacher |

## AI

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/ai/chat/` | Send message/image to Gemini AI | Yes |

## Student

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/student/dashboard/` | Full dashboard data | Student |
| GET | `/api/student/announcements/` | Upcoming assignment alerts | Student |
| GET | `/api/student/chat/` | List chat threads | Student |
| GET | `/api/student/chat/?with={id}` | Message thread | Student |
| POST | `/api/student/chat/` | Send message | Student |

## Student Courses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/student/courses/` | List dept courses (with `is_enrolled`) | Student |
| GET | `/api/student/courses/{id}/` | Retrieve course | Student |
| POST | `/api/student/courses/{id}/enroll/` | Enroll in course | Student |
| POST | `/api/student/courses/{id}/drop/` | Drop course | Student |

## Student Enrollments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/student/enrollments/` | List own enrollments | Student |
| GET | `/api/student/enrollments/{id}/` | Retrieve enrollment | Student |

## Instructor

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/instructor/profiles/` | List student profiles | Teacher |
| GET | `/api/instructor/profiles/{id}/` | Retrieve student profile | Teacher |
| GET | `/api/instructor/assignments/` | List assignments | Teacher |
| POST | `/api/instructor/assignments/` | Create assignment | Teacher |
| GET | `/api/instructor/assignments/{id}/` | Retrieve assignment | Teacher |
| PUT | `/api/instructor/assignments/{id}/` | Full update | Teacher |
| PATCH | `/api/instructor/assignments/{id}/` | Partial update | Teacher |
| DELETE | `/api/instructor/assignments/{id}/` | Delete assignment | Teacher |
| GET | `/api/instructor/students/` | List students | Admin/Class Teacher |
| POST | `/api/instructor/students/` | Create student | Admin/Class Teacher |
| GET | `/api/instructor/students/{id}/` | Retrieve student | Admin/Class Teacher |
| PUT | `/api/instructor/students/{id}/` | Full update | Admin/Class Teacher |
| PATCH | `/api/instructor/students/{id}/` | Partial update | Admin/Class Teacher |
| DELETE | `/api/instructor/students/{id}/` | Delete student | Admin |
| GET | `/api/instructor/students/by_class/` | Students by class | Teacher |
| GET | `/api/instructor/results/` | List enrollments | Teacher |
| GET | `/api/instructor/results/{id}/` | Retrieve enrollment | Teacher |
| POST | `/api/instructor/results/{id}/update_result/` | Update score fields | Teacher |

## Parent

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/parent/` | List child's results | Parent |
| GET | `/api/parent/{id}/` | Retrieve specific result | Parent |
| GET | `/api/parent/child_info/` | Get linked child info | Parent |
| GET | `/api/parent/report_cards/` | Get child's report cards | Parent |

## Utility

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/class-choices/` | Valid classes for a department (`?department=western`) | Yes |

## Schools (Multi-Tenant)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/schools/` | List schools (super_admin: all; others: own school) | Yes |
| POST | `/api/schools/` | Create school | Super Admin |
| GET | `/api/schools/{id}/` | Retrieve school | Yes |
| PUT | `/api/schools/{id}/` | Update school | Super Admin |
| PATCH | `/api/schools/{id}/` | Partial update school | Super Admin |
| DELETE | `/api/schools/{id}/` | Delete school | Super Admin |
| POST | `/api/school/register/` | Register new school + admin user | No |

## Subscriptions (Billing)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/subscriptions/` | List subscriptions (super_admin: all; school: own) | Super Admin |
| POST | `/api/subscriptions/` | Create subscription | Super Admin |
| GET | `/api/subscriptions/{id}/` | Retrieve subscription | Super Admin |
| PUT | `/api/subscriptions/{id}/` | Update subscription | Super Admin |
| PATCH | `/api/subscriptions/{id}/` | Partial update subscription | Super Admin |
| DELETE | `/api/subscriptions/{id}/` | Delete subscription | Super Admin |
| POST | `/api/billing/initialize/` | Initialize Paystack subscription payment | Yes (Admin) |
| POST | `/api/billing/verify/` | Verify payment and activate plan | Yes (Admin) |

---

Total: ~190 endpoints across 23 router-registered viewsets + 23 manually registered paths.

"""
Canonical role and permission definitions.

This is the single source of truth for roles, labels, and base permissions.
All other parts of the codebase should reference these constants.
"""

# ─────────────────────────────────────────────────────────────────────────────
# ROLES
# ─────────────────────────────────────────────────────────────────────────────

ROLE_CHOICES = [
    ("super_admin",   "Super Admin"),
    ("admin",         "Admin"),
    ("school_admin",  "School Admin"),
    ("teacher",       "Teacher"),
    ("non_teaching",  "Non-Teaching Staff"),
    ("student",       "Student"),
    ("parent",        "Parent"),
    ("visitor",       "Visitor"),
]

# Maps role code to display label
ROLE_LABELS = {
    code: label for code, label in ROLE_CHOICES
}

# Maps common synonyms to canonical role code
ROLE_ALIASES = {
    "instructor": "teacher",  # Treat "instructor" as alias for "teacher"
    "teaching staff": "teacher",
    "admin staff": "admin",
    "guardian": "parent",
    "learner": "student",
}

# ─────────────────────────────────────────────────────────────────────────────
# PERMISSIONS BY ROLE
# ─────────────────────────────────────────────────────────────────────────────

ROLE_PERMISSIONS = {
    "super_admin": [
        # Admin access
        "admin.access",
        # Course management
        "course.view",
        "course.create",
        "course.edit",
        "course.delete",
        # Assignment management
        "assignment.view",
        "assignment.create",
        "assignment.edit",
        "assignment.delete",
        # Enrollment management
        "enrollment.view",
        "enrollment.create",
        "enrollment.manage",
        # Quiz management
        "quiz.view",
        "quiz.create",
        "quiz.edit",
        "quiz.delete",
        # Analytics
        "analytics.view",
        "analytics.full",
        # Payment management
        "payment.view",
        "payment.manage",
        # User management
        "user.view",
        "user.create",
        "user.edit",
        "user.delete",
        # Grade management
        "grade.view",
        "grade.edit",
        # Department access (all)
        "department.access.western",
        "department.access.arabic",
        "department.access.programming",
        # Audit
        "audit.view",
        # Subject management
        "subject.manage",
        # Teacher assignment
        "teacher.assign",
    ],
    "admin": [
        # Admin access
        "admin.access",
        # Course management
        "course.view",
        "course.create",
        "course.edit",
        "course.delete",
        # Assignment management
        "assignment.view",
        "assignment.create",
        "assignment.edit",
        # Enrollment management
        "enrollment.view",
        "enrollment.create",
        "enrollment.manage",
        # Quiz management
        "quiz.view",
        "quiz.create",
        # Analytics
        "analytics.view",
        # Payment management
        "payment.view",
        # User management
        "user.view",
        "user.create",
        "user.edit",
        # Grade management
        "grade.view",
        "grade.edit",
        # Department access (all)
        "department.access.western",
        "department.access.arabic",
        "department.access.programming",
        # Audit
        "audit.view",
    ],
    "school_admin": [
        # Limited admin access (department-specific)
        "admin.access",
        # Course management (department only)
        "course.view",
        "course.create",
        "course.edit",
        # Assignment management
        "assignment.view",
        "assignment.create",
        "assignment.edit",
        # Enrollment management
        "enrollment.view",
        "enrollment.create",
        "enrollment.manage",
        # Quiz view
        "quiz.view",
        # Analytics
        "analytics.view",
        # Payment view
        "payment.view",
        # User management (department only)
        "user.view",
        "user.create",
        "user.edit",
        # Grade management
        "grade.view",
        "grade.edit",
        # Department access (own department only, enforced by permissions.py)
        "department.access.*",
        # Audit
        "audit.view",
    ],
    "teacher": [
        # Course access
        "course.view",
        # Assignment management
        "assignment.view",
        "assignment.create",
        "assignment.edit",
        # Enrollment view
        "enrollment.view",
        # Quiz management
        "quiz.view",
        "quiz.create",
        "quiz.edit",
        # Analytics (limited to own courses)
        "analytics.view",
        # Grade management
        "grade.view",
        "grade.edit",
        # Subject assignment
        "subject.manage",
    ],
    "student": [
        # Course access
        "course.view",
        # Assignment submission
        "assignment.view",
        # Quiz taking
        "quiz.view",
        "quiz.submit",
        # View own grades
        "grade.view",
        # Chat access
        "chat.access",
    ],
    "parent": [
        # View child's courses
        "course.view",
        # View child's assignments
        "assignment.view",
        # View child's grades
        "grade.view",
        # Chat with teachers
        "chat.access",
    ],
    "visitor": [
        # Public course access
        "course.view",
    ],
    "non_teaching": [
        # Dashboard access
        "analytics.view",
        # Payment management
        "payment.view",
        "payment.manage",
        # User view
        "user.view",
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# DEPARTMENTS
# ─────────────────────────────────────────────────────────────────────────────

DEPARTMENT_CHOICES = [
    ("western",     "Western Education"),
    ("arabic",      "Arabic/Islamic Studies"),
    ("programming", "Digital Technology"),
]

DEPARTMENT_LABELS = {
    code: label for code, label in DEPARTMENT_CHOICES
}

# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZATION FOR FRONTEND
# ─────────────────────────────────────────────────────────────────────────────

def get_roles_for_frontend():
    """
    Export roles and permissions in a format suitable for frontend consumption.
    Used by API endpoint to serve as single source of truth.
    """
    return {
        "roles": [
            {
                "code": code,
                "label": label,
                "permissions": ROLE_PERMISSIONS.get(code, []),
            }
            for code, label in ROLE_CHOICES
        ],
        "departments": [
            {
                "code": code,
                "label": label,
            }
            for code, label in DEPARTMENT_CHOICES
        ],
    }

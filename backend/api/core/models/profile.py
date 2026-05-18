# backend/api/models/profile.py

from django.db import models
from django.conf import settings



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


TEACHER_TYPE_CHOICES = [
    ("class",   "Class Teacher"),    # homeroom / form teacher
    ("subject", "Subject Teacher"),  # subject specialist only
]


DEPARTMENT_CHOICES = [
    ("western",     "Western Education"),
    ("arabic",      "Arabic/Islamic Studies"),
    ("programming", "Digital Technology"),
]


STREAM_CHOICES = [
    ("science",    "Science"),
    ("arts",       "Arts / Humanities"),
    ("commercial", "Commercial / Business"),
    ("technical",  "Technical / Vocational"),
    ("general",    "General"),
]

WESTERN_CLASSES = [
    # Junior Secondary
    ("jss1", "JSS 1"),
    ("jss2", "JSS 2"),
    ("jss3", "JSS 3"),
    # Senior Secondary — streamed
    ("sss1_sci",  "SSS 1 Science"),
    ("sss1_arts", "SSS 1 Arts"),
    ("sss1_com",  "SSS 1 Commercial"),
    ("sss2_sci",  "SSS 2 Science"),
    ("sss2_arts", "SSS 2 Arts"),
    ("sss2_com",  "SSS 2 Commercial"),
    ("sss3_sci",  "SSS 3 Science"),
    ("sss3_arts", "SSS 3 Arts"),
    ("sss3_com",  "SSS 3 Commercial"),
]


ARABIC_CLASSES = [
    # Primary (المرحلة الابتدائية)
    ("ibtidaai_1", "الصف الأول الابتدائي"),
    ("ibtidaai_2", "الصف الثاني الابتدائي"),
    ("ibtidaai_3", "الصف الثالث الابتدائي"),
    ("ibtidaai_4", "الصف الرابع الابتدائي"),
    ("ibtidaai_5", "الصف الخامس الابتدائي"),
    ("ibtidaai_6", "الصف السادس الابتدائي"),
    # Junior Secondary (المرحلة المتوسطة)
    ("mutawassit_1", "الصف الأول المتوسط"),
    ("mutawassit_2", "الصف الثاني المتوسط"),
    ("mutawassit_3", "الصف الثالث المتوسط"),
    # Senior Secondary (المرحلة الثانوية)
    ("thanawi_1", "الصف الأول الثانوي"),
    ("thanawi_2", "الصف الثاني الثانوي"),
    ("thanawi_3", "الصف الثالث الثانوي"),
]

PROGRAMMING_CLASSES = [
    # AI & Machine Learning
    ("ai_ml_beginner",      "AI & ML — Beginner"),
    ("ai_ml_junior",        "AI & ML — Junior"),
    ("ai_ml_intermediate",  "AI & ML — Intermediate"),
    ("ai_ml_advanced",      "AI & ML — Advanced"),
    # Data Science
    ("data_science_beginner",     "Data Science — Beginner"),
    ("data_science_junior",       "Data Science — Junior"),
    ("data_science_intermediate", "Data Science — Intermediate"),
    ("data_science_advanced",     "Data Science — Advanced"),
    # Scratch (young learners)
    ("scratch_beginner",     "Scratch — Beginner"),
    ("scratch_junior",       "Scratch — Junior"),
    ("scratch_intermediate", "Scratch — Intermediate"),
    ("scratch_advanced",     "Scratch — Advanced"),
    # Frontend Development
    ("frontend_beginner",     "Frontend — Beginner"),
    ("frontend_junior",       "Frontend — Junior"),
    ("frontend_intermediate", "Frontend — Intermediate"),
    ("frontend_advanced",     "Frontend — Advanced"),
    # Backend Development
    ("backend_beginner",     "Backend — Beginner"),
    ("backend_junior",       "Backend — Junior"),
    ("backend_intermediate", "Backend — Intermediate"),
    ("backend_advanced",     "Backend — Advanced"),
    # AI Automation
    ("ai_automation_beginner",     "AI Automation — Beginner"),
    ("ai_automation_junior",       "AI Automation — Junior"),
    ("ai_automation_intermediate", "AI Automation — Intermediate"),
    ("ai_automation_advanced",     "AI Automation — Advanced"),
]

ALL_CLASSES = WESTERN_CLASSES + ARABIC_CLASSES + PROGRAMMING_CLASSES


SUBJECT_CHOICES = [

    ("core",                    " ── Core / Compulsory ──"),
    ("english_language",        "English Language"),
    ("mathematics",             "Mathematics"),
    ("civic_education",         "Civic Education"),
    ("digital_technologies",    "Digital Technologies / Computer Studies"),
    ("citizenship_heritage",    "Citizenship and Heritage Studies"),
    ("entrepreneurship",        "Trade / Entrepreneurship Subject"),
    ("science",                 "Science"),
    ("biology",                 "Biology"),
    ("chemistry",               "Chemistry"),
    ("physics",                 "Physics"),
    ("further_mathematics",     "Further Mathematics"),
    ("agricultural_science",    "Agricultural Science"),
    ("geography",               "Geography"),
    ("technical_drawing",       "Technical Drawing"),
    ("food_nutrition",          "Food and Nutrition"),
    ("health_education",        "Health Education"),
    ("physical_health_education","Physical and Health Education"),
    ("arts",                    "Humanities / Art"),
    ("literature_in_english",   "Literature in English"),
    ("government",              "Government"),
    ("nigerian_history",        "Nigerian History"),
    ("christian_religious_studies","Christian Religious Studies (CRS)"),
    ("islamic_religious_studies","Islamic Religious Studies (IRS)"),
    ("visual_arts",             "Visual Arts (Fine Arts)"),
    ("music",                   "Music"),
    ("french",                  "French"),
    ("arabic",                  "Arabic"),
    ("hausa",                   "Hausa"),
    ("igbo",                    "Igbo"),
    ("yoruba",                  "Yoruba"),
    ("home_management",         "Home Management"),
    ("catering_craft",          "Catering Craft"),
    ("commercial",              "Commercial / Business"),
    ("financial_accounting",    "Financial Accounting"),
    ("commerce",                "Commerce"),
    ("economics",               "Economics"),
    ("marketing",               "Marketing"),
    ("business_studies",        "Business Studies"),
    ("technical",               "Technology / Technical"),
    ("basic_electronics",       "Basic Electronics"),
    ("basic_electricity",       "Basic Electricity"),
    ("metalwork",               "Metalwork"),
    ("woodwork",                "Woodwork"),
    ("building_construction",   "Building Construction"),
    ("auto_mechanics",          "Auto Mechanics"),
    ("welding_fabrication",     "Welding and Fabrication"),
    ("computer_studies_ict",    "Computer Studies / ICT"),
    ("jss",                     "JSS General"),
    ("basic_science",           "Basic Science"),
    ("basic_technology",        "Basic Technology"),
    ("social_studies",          "Social Studies"),
    ("cultural_creative_arts",  "Cultural and Creative Arts"),
    ("religious_studies",       "Religious Studies (General)"),
]


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default="student", db_index=True,
    )
    department = models.CharField(
        max_length=20, choices=DEPARTMENT_CHOICES,
        blank=True, null=True, db_index=True,
    )

    teacher_type = models.CharField(
        max_length=20, choices=TEACHER_TYPE_CHOICES, blank=True, null=True,
        help_text="Only relevant when role=teacher.",
    )
    student_class = models.CharField(
        max_length=40,
        choices=ALL_CLASSES,
        blank=True, null=True, db_index=True,
        help_text=(
            "Base class code.  Sections (A, B, C) are stored in class_section. "
            "Auto-enrollment triggers on this field."
        ),
    )

    class_section = models.CharField(
        max_length=10, blank=True, default="",
        help_text=(
            "Optional section label within the base class. "
            "Created by admin when needed (e.g. 'A', 'B'). "
            "Does not affect subject enrollment."
        ),
    )

    stream = models.CharField(
        max_length=15, choices=STREAM_CHOICES, blank=True, null=True,
        help_text="Science / Arts / Commercial stream — SSS students only.",
    )

    bio          = models.TextField(blank=True, default="")
    phone        = models.CharField(max_length=20, blank=True, default="")
    address      = models.TextField(blank=True, default="")
    parent_email = models.EmailField(blank=True, default="")
    avatar       = models.ImageField(upload_to="avatars/", blank=True, null=True)

    student_id = models.CharField(max_length=20, blank=True, default="", unique=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["role", "department"]),
            models.Index(fields=["role", "student_class"]),
            models.Index(fields=["department", "student_class"]),
        ]

    def __str__(self):
        section = f" {self.class_section}" if self.class_section else ""
        cls = f" — {self.student_class}{section}" if self.student_class else ""
        return f"{self.user.username} ({self.get_role_display()}){cls}"


    @property
    def full_class_label(self) -> str:
        """Returns e.g. 'JSS 1 — Section A' or just 'JSS 1'."""
        base = dict(ALL_CLASSES).get(self.student_class or "", self.student_class or "")
        if self.class_section:
            return f"{base} — Section {self.class_section}"
        return base

    @property
    def display_class(self) -> str:
        """Short display: 'JSS 1A' if section exists, else 'JSS 1'."""
        base = dict(ALL_CLASSES).get(self.student_class or "", self.student_class or "")
        if self.class_section:
            return f"{base}{self.class_section}"
        return base

    @staticmethod
    def get_classes_for_department(department: str):
        """Return the valid student_class choices for a given department."""
        mapping = {
            "western":     WESTERN_CLASSES,
            "arabic":      ARABIC_CLASSES,
            "programming": PROGRAMMING_CLASSES,
        }
        return mapping.get(department, [])

    @property
    def is_teacher(self) -> bool:
        return self.role == "teacher"

    @property
    def is_class_teacher(self) -> bool:
        return self.role == "teacher" and self.teacher_type == "class"

    @property
    def is_subject_teacher(self) -> bool:
        return self.role == "teacher" and self.teacher_type == "subject"

    @property
    def is_admin(self) -> bool:
        return self.role in ("admin", "school_admin", "super_admin")

    @property
    def is_student(self) -> bool:
        return self.role == "student"
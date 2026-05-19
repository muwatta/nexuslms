# backend/api/management/commands/check_classes.py

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Show current student class distribution — run before migrating"

    def handle(self, *args, **options):
        from api.core.models import Profile, Course, Enrollment

        self.stdout.write("\n=== STUDENTS ===")
        students = Profile.objects.filter(role="student").order_by("department", "student_class")
        for p in students:
            section = f" | section={p.class_section}" if getattr(p, "class_section", "") else ""
            self.stdout.write(
                f"  {p.user.username:20s} | dept={p.department or '—':12s} | class={p.student_class or 'None':20s}{section}"
            )

        self.stdout.write(f"\n  Total: {students.count()} students")

        self.stdout.write("\n=== COURSES (western only) ===")
        from django.db.models import Count
        course_classes = (
            Course.objects
            .filter(department="western")
            .values("student_class")
            .annotate(count=Count("id"))
            .order_by("student_class")
        )
        for row in course_classes:
            self.stdout.write(f"  {row['student_class']:20s}  {row['count']} courses")

        self.stdout.write("\n=== ENROLLMENTS ===")
        from django.db.models import Count
        enroll_classes = (
            Enrollment.objects
            .values("course__department", "course__student_class")
            .annotate(count=Count("id"))
            .order_by("course__department", "course__student_class")
        )
        for row in enroll_classes:
            self.stdout.write(
                f"  {row['course__department']:12s} | {str(row['course__student_class']):20s} | {row['count']} enrollments"
            )
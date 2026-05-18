# backend/api/management/commands/compute_positions.py

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Compute subject positions and generate report cards for a class/term"

    def add_arguments(self, parser):
        parser.add_argument("--class",  dest="student_class", required=True)
        parser.add_argument("--term",   required=True, help="e.g. 'First Term'")
        parser.add_argument("--year",   dest="academic_year", required=True, help="e.g. 2025/2026")
        parser.add_argument("--publish", action="store_true", help="Also publish all results")

    def handle(self, *args, **options):
        from backend.api.core.models import Result, ReportCard, Profile, Course

        student_class = options["student_class"]
        term          = options["term"]
        academic_year = options["academic_year"]
        do_publish    = options["publish"]

        self.stdout.write(self.style.WARNING(
            f"Computing positions for {student_class} | {term} | {academic_year}..."
        ))

        # Step 1 — compute per-subject positions
        courses = Course.objects.filter(student_class=student_class)
        total_updated = 0

        with transaction.atomic():
            for course in courses:
                results = list(Result.objects.filter(
                    course=course,
                    term=term,
                    academic_year=academic_year,
                    status__in=["reviewed", "published"] if not do_publish
                    else ["draft", "submitted", "reviewed", "published"],
                ).order_by("-total"))

                for pos, result in enumerate(results, start=1):
                    result.position = pos
                    if do_publish:
                        result.status = "published"
                    result.save(update_fields=["position", "status"])
                    total_updated += 1

        self.stdout.write(f"  ✅ {total_updated} subject positions computed")

        # Step 2 — generate report cards
        students = Profile.objects.filter(
            role="student",
            student_class=student_class,
        )

        generated = 0
        with transaction.atomic():
            student_scores = []
            for student in students:
                results = Result.objects.filter(
                    student=student,
                    term=term,
                    academic_year=academic_year,
                    status="published" if not do_publish else "published",
                )
                if not results.exists():
                    continue
                total_score    = sum(r.total for r in results)
                total_subjects = results.count()
                average_score  = round(total_score / total_subjects, 2)
                student_scores.append({
                    "student": student,
                    "total_score": total_score,
                    "total_subjects": total_subjects,
                    "average_score": average_score,
                })

            student_scores.sort(key=lambda x: x["total_score"], reverse=True)
            class_size = len(student_scores)

            for position, data in enumerate(student_scores, start=1):
                ReportCard.objects.update_or_create(
                    student=data["student"],
                    term=term,
                    academic_year=academic_year,
                    defaults={
                        "student_class":     student_class,
                        "total_subjects":    data["total_subjects"],
                        "total_score":       data["total_score"],
                        "average_score":     data["average_score"],
                        "position_in_class": position,
                        "class_size":        class_size,
                    },
                )
                generated += 1

        self.stdout.write(f"  ✅ {generated} report cards generated")
        self.stdout.write(self.style.SUCCESS("Done."))
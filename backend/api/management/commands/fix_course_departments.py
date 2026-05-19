from django.core.management.base import BaseCommand
from api.core.models import Course, Profile

class Command(BaseCommand):
    help = 'Update course departments based on instructor assignments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show changes without applying them',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        courses = Course.objects.all()
        updated = 0
        skipped = 0
        
        for course in courses:
            old_dept = course.department
            
            # If course has instructor, use their department
            if course.instructor and course.instructor.department:
                new_dept = course.instructor.department
                
                if old_dept != new_dept:
                    if not dry_run:
                        course.department = new_dept
                        course.save(update_fields=['department'])
                    
                    updated += 1
                    action = "Would update" if dry_run else "Updated"
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'{action} "{course.title}" from {old_dept} → {new_dept} '
                            f'(instructor: {course.instructor.user.username})'
                        )
                    )
                else:
                    skipped += 1
            else:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Skipped "{course.title}" - no instructor assigned'
                    )
                )
        
        self.stdout.write(self.style.SUCCESS(
            f'\n{"Would update" if dry_run else "Updated"} {updated} of {courses.count()} courses '
            f'({skipped} unchanged/skipped)'
        ))
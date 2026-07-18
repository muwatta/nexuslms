from django.core.management.base import BaseCommand
from api.core.models import Profile


class Command(BaseCommand):
    help = 'Permanently delete profiles archived > 90 days ago (requires is_archived field)'

    def handle(self, *args, **options):
        if not hasattr(Profile, 'is_archived'):
            self.stdout.write(self.style.WARNING(
                'Profile.is_archived field does not exist. '
                'Archiving is not yet implemented.'
            ))
            return
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=90)
        to_delete = Profile.objects.filter(
            is_archived=True,
            archived_at__lt=cutoff
        )
        count = to_delete.count()
        to_delete.delete()
        self.stdout.write(f"Deleted {count} archived profiles")

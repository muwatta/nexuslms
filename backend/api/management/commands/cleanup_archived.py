from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.core.models import Profile

class Command(BaseCommand):
    help = 'Permanently delete profiles archived > 90 days ago'
    
    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=90)
        to_delete = Profile.objects.filter(
            is_archived=True,
            archived_at__lt=cutoff
        )
        count = to_delete.count()
        to_delete.delete()
        self.stdout.write(f"Deleted {count} archived profiles")
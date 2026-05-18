from django.db import models, transaction
from django.utils import timezone

class StudentIDSequence(models.Model):
    """SQLite-safe sequential ID generator"""
    year = models.PositiveSmallIntegerField(unique=True, db_index=True)
    last_number = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-year']
    
    @classmethod
    @transaction.atomic
    def get_next_id(cls, year):
        """Thread-safe sequential ID generation"""
        sequence, _ = cls.objects.select_for_update().get_or_create(
            year=year,
            defaults={'last_number': 0}
        )
        sequence.last_number += 1
        sequence.save()
        return f"ma/{year:02d}/{sequence.last_number:04d}"
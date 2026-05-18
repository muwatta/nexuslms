# backend/api/models/feepayment.py
from django.db import models
from django.conf import settings
from django.utils import timezone

class FeePayment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]
    
    student = models.ForeignKey('api.Profile', on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    academic_year = models.CharField(max_length=9)  # 2024/2025
    term = models.CharField(max_length=20)  # First Term, Second Term, Third Term
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField()
    last_payment_date = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        self.balance = self.total_amount - self.amount_paid
        if self.balance <= 0:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        elif self.due_date and self.due_date < timezone.now().date():
            self.status = 'overdue'
        super().save(*args, **kwargs)
# backend/api/models/password_reset.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class PasswordResetOTP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='password_reset_otp')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)
    is_used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'password_reset_otps'
    
    def __str__(self):
        return f"OTP for {self.user.email}"
    
    def is_expired(self):
        """Check if OTP is expired (10 minutes)"""
        return timezone.now() - self.created_at > timezone.timedelta(minutes=10)
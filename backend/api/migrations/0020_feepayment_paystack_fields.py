import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0019_alter_achievement_options_alter_assignment_options_and_more")]

    operations = [
        migrations.AddField(
            model_name="feepayment",
            name="reference",
            field=models.CharField(default=uuid.uuid4, editable=False, max_length=100, unique=True),
        ),
        migrations.AddField(
            model_name="feepayment",
            name="paystack_response",
            field=models.JSONField(blank=True, null=True),
        ),
    ]

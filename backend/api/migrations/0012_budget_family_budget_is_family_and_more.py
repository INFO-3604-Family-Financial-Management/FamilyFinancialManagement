# Generated by Django 5.2 on 2025-04-10 04:04

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_userprofile_remove_income_user_alter_budget_options_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='budget',
            name='family',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='budgets', to='api.family'),
        ),
        migrations.AddField(
            model_name='budget',
            name='is_family',
            field=models.BooleanField(default=False),
        ),
        migrations.AddIndex(
            model_name='budget',
            index=models.Index(fields=['family', 'is_family'], name='api_budget_family__5f960a_idx'),
        ),
    ]

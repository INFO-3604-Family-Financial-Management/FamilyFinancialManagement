# Generated by Django 5.1.6 on 2025-04-01 21:56

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_contribution'),
    ]

    operations = [
        migrations.AddField(
            model_name='expense',
            name='budget',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.budget'),
        ),
        migrations.AddField(
            model_name='expense',
            name='goal',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.goal'),
        ),
        migrations.AddField(
            model_name='goal',
            name='pinned',
            field=models.BooleanField(default=False),
        ),
    ]

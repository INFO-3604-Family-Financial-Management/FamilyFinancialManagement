# Generated by Django 5.2 on 2025-04-10 19:01

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_budget_family_budget_is_family_and_more'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='budget',
            name='api_budget_family__5f960a_idx',
        ),
    ]

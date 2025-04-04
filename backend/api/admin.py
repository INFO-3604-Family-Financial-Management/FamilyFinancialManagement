from django.contrib import admin
from .models import (
    Expense, Family, UserProfile, Budget, Goal, Contribution, Streak
)

# Register models for admin interface
admin.site.register(Expense)
admin.site.register(Family)
admin.site.register(UserProfile)
admin.site.register(Budget)
admin.site.register(Goal)
admin.site.register(Contribution)
admin.site.register(Streak)
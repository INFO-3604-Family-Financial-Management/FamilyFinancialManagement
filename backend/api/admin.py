from django.contrib import admin
from .models import (
    Expense, Family, Budget, Goal, Income, Streak, Contribution
)

# Register models for admin interface
admin.site.register(Expense)
admin.site.register(Family)
admin.site.register(Budget)
admin.site.register(Goal)
admin.site.register(Income)
admin.site.register(Streak)
admin.site.register(Contribution)
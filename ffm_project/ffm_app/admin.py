from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import FinancialGoal, Expense, Budget, Reminder

admin.site.register(FinancialGoal)
admin.site.register(Expense)
admin.site.register(Budget)
admin.site.register(Reminder)
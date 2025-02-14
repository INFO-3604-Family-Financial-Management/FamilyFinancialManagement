from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User

class FinancialGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    target_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deadline = models.DateField()

    def __str__(self):
        return self.name

class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50)
    date = models.DateField()

    def __str__(self):
        return f"{self.category} - ${self.amount}"

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=50)
    allocated_amount = models.DecimalField(max_digits=10, decimal_places=2)
    #spent_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    month = models.DateField()  # Store as "YYYY-MM-01"

    def __str__(self):
        return f"{self.category} Budget"

class Reminder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    due_date = models.DateField()
    message = models.CharField(max_length=200)

    def __str__(self):
        return self.message
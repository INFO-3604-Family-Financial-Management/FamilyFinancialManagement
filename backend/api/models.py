from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django.contrib.auth.models import User

# Create your models here.

class Family(models.Model):
    name = models.CharField(max_length=255)
    members = models.ManyToManyField(User, related_name='families')

    def __str__(self):
        return self.name

class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.date}"
    
    @staticmethod
    def get_monthly_expenses(user):
        now = timezone.now()
        return Expense.objects.filter(
            user=user,
            date__year=now.year,
            date__month=now.month
        ).aggregate(total=Sum('amount'))['total'] or 0  
    
class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.name} - {self.category}"

    @staticmethod
    def get_monthly_budget(user):
        return Budget.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0

class Goal(models.Model):
    GOAL_TYPE_CHOICES = [
        ('saving', 'Saving'),
        ('spending', 'Spending'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    family = models.ForeignKey(Family, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    goal_type = models.CharField(max_length=10, choices=GOAL_TYPE_CHOICES)
    is_personal = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.name} - {self.goal_type}"
    
class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.date}"

    @staticmethod
    def get_monthly_income(user):
        now = timezone.now()
        return Income.objects.filter(
            user=user,
            date__year=now.year,
            date__month=now.month
        ).aggregate(total=Sum('amount'))['total'] or 0
    
class Streak(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    count = models.IntegerField(default=0)
    last_updated = models.DateField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.count} - {self.last_updated}"

class Contribution(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.goal.name} - {self.amount}"
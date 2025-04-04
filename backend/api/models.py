from django.db import models
from django.db.models import Sum, Q
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal

# Create your models here.

class Family(models.Model):
    name = models.CharField(max_length=255)
    members = models.ManyToManyField(User, related_name='families')
    
    class Meta:
        verbose_name_plural = "Families"

    def __str__(self):
        return self.name
    
    def total_members(self):
        """Return the total number of family members"""
        return self.members.count()
    
    def get_total_family_budget(self):
        """Calculate the total budget for all family members"""
        return Budget.objects.filter(
            user__in=self.members.all()
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    def get_total_family_expenses(self, month=None, year=None):
        """Calculate the total expenses for all family members"""
        now = timezone.now()
        month = month or now.month
        year = year or now.year
        
        return Expense.objects.filter(
            user__in=self.members.all(),
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    def get_total_family_income(self, month=None, year=None):
        """Calculate the total income for all family members"""
        now = timezone.now()
        month = month or now.month
        year = year or now.year
        
        return Income.objects.filter(
            user__in=self.members.all(),
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    def get_family_goals(self):
        """Get all family goals"""
        return Goal.objects.filter(family=self, is_personal=False)

class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    description = models.CharField(max_length=255)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    goal = models.ForeignKey('Goal', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    budget = models.ForeignKey('Budget', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    
    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['budget']),
            models.Index(fields=['goal']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.date}"
    
    def clean(self):
        # Ensure the expense belongs to a budget that is owned by the same user
        if self.budget and self.budget.user != self.user:
            raise ValidationError("Budget must belong to the same user as the expense")
        
        # Ensure the expense belongs to a goal that is either owned by the user
        # or is a family goal where the user is a member
        if self.goal:
            if self.goal.is_personal and self.goal.user != self.user:
                raise ValidationError("Personal goal must belong to the same user as the expense")
            elif not self.goal.is_personal and not self.goal.family.members.filter(id=self.user.id).exists():
                raise ValidationError("Family goal must belong to a family where the user is a member")
    
    @staticmethod
    def get_monthly_expenses(user, month=None, year=None):
        now = timezone.now()
        month = month or now.month
        year = year or now.year
        
        return Expense.objects.filter(
            user=user,
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    @staticmethod
    def get_category_expenses(user, category, month=None, year=None):
        """Get expenses by category for a specific month"""
        now = timezone.now()
        month = month or now.month
        year = year or now.year
        
        return Expense.objects.filter(
            user=user,
            budget__category=category,
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    def save(self, *args, **kwargs):
        # Run full validation before saving
        self.full_clean()
        super().save(*args, **kwargs)
    
class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    category = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.name} - {self.category}"

    @staticmethod
    def get_monthly_budget(user):
        return Budget.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0
    
    def get_used_amount(self, month=None, year=None):
        """Calculate how much of the budget has been used"""
        now = timezone.now()
        month = month or now.month
        year = year or now.year
        
        total_expenses = Expense.objects.filter(
            budget=self,
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return total_expenses
    
    def get_remaining_amount(self, month=None, year=None):
        """Calculate remaining budget"""
        used = self.get_used_amount(month, year)
        return self.amount - used
    
    def get_usage_percentage(self, month=None, year=None):
        """Calculate budget usage as a percentage"""
        used = self.get_used_amount(month, year)
        if self.amount > 0:
            return (used / self.amount) * 100
        return 0

class Goal(models.Model):
    GOAL_TYPE_CHOICES = [
        ('saving', 'Saving'),
        ('spending', 'Spending'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, null=True, blank=True, related_name='goals')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    goal_type = models.CharField(max_length=10, choices=GOAL_TYPE_CHOICES)
    is_personal = models.BooleanField(default=True)
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-pinned', 'name']
        indexes = [
            models.Index(fields=['user', '-pinned']),
            models.Index(fields=['family', 'is_personal']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.name} - {self.goal_type}"
    
    def clean(self):
        # Validate that family goals have a family
        if not self.is_personal and not self.family:
            raise ValidationError("Family goals must have a family assigned")
        
        # Validate that the user is a member of the family for family goals
        if not self.is_personal and self.family and not self.family.members.filter(id=self.user.id).exists():
            raise ValidationError("User must be a member of the family for family goals")
    
    def get_progress(self):
        """Calculate goal progress"""
        if self.goal_type == 'saving':
            # For savings goals, sum all contributions
            contributions = Contribution.objects.filter(goal=self).aggregate(total=Sum('amount'))['total'] or 0
            return contributions
        else:
            # For spending goals, sum all expenses
            expenses = Expense.objects.filter(goal=self).aggregate(total=Sum('amount'))['total'] or 0
            return expenses
    
    def get_progress_percentage(self):
        """Calculate progress as a percentage"""
        progress = self.get_progress()
        if self.amount > 0:
            return (progress / self.amount) * 100
        return 0
    
    def get_remaining_amount(self):
        """Calculate remaining amount to reach the goal"""
        progress = self.get_progress()
        return self.amount - progress
    
    def save(self, *args, **kwargs):
        # Run full validation before saving
        self.full_clean()
        super().save(*args, **kwargs)
    
class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incomes')
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True, null=True)  # New optional field for source of income
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', '-date']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.date}"

    @staticmethod
    def get_monthly_income(user, month=None, year=None):
        now = timezone.now()
        month = month or now.month
        year = year or now.year
        
        return Income.objects.filter(
            user=user,
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    @staticmethod
    def get_annual_income(user, year=None):
        """Calculate total income for a year"""
        now = timezone.now()
        year = year or now.year
        
        return Income.objects.filter(
            user=user,
            date__year=year
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    @staticmethod
    def get_average_monthly_income(user, year=None):
        """Calculate average monthly income"""
        now = timezone.now()
        year = year or now.year
        
        # Get all months with income records
        months = Income.objects.filter(
            user=user,
            date__year=year
        ).dates('date', 'month')
        
        if not months:
            return 0
        
        # Calculate total income for the year
        annual_income = Income.get_annual_income(user, year)
        
        # Return average
        return annual_income / len(months)
    
class Streak(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='streaks')
    count = models.IntegerField(default=0)
    last_updated = models.DateField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.count} - {self.last_updated}"
    
    def update_streak(self):
        """Update the streak counter"""
        today = timezone.now().date()
        
        # If last updated was yesterday, increment streak
        if self.last_updated == today - timezone.timedelta(days=1):
            self.count += 1
        # If last updated was before yesterday, reset streak to 1
        elif self.last_updated < today - timezone.timedelta(days=1):
            self.count = 1
        # If already updated today, do nothing
        
        self.last_updated = today
        self.save()
    
    @staticmethod
    def get_or_create_streak(user):
        """Get or create streak for user"""
        streak, created = Streak.objects.get_or_create(user=user)
        return streak

class Contribution(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contributions')
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='contributions')
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['goal']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.goal.name} - {self.amount}"
    
    def clean(self):
        # Validate that the user can contribute to this goal
        if self.goal.is_personal and self.goal.user != self.user:
            raise ValidationError("Users can only contribute to their own personal goals")
        
        if not self.goal.is_personal and not self.goal.family.members.filter(id=self.user.id).exists():
            raise ValidationError("Users can only contribute to family goals they are members of")
    
    def save(self, *args, **kwargs):
        # Run full validation before saving
        self.full_clean()
        super().save(*args, **kwargs)
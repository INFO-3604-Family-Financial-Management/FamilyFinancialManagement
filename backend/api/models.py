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
    # We'll remove the direct members field and access members through UserProfile
    # This field is kept for backwards compatibility during migration
    members = models.ManyToManyField(User, related_name='families')
    
    class Meta:
        verbose_name_plural = "Families"

    def __str__(self):
        return self.name
    
    def total_members(self):
        """Return the total number of family members"""
        return self.members_profiles.count()
    
    def get_total_family_budget(self):
        """Calculate the total budget for all family members"""
        user_ids = self.members_profiles.values_list('user', flat=True)
        return Budget.objects.filter(
            user__in=user_ids
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    def get_total_family_expenses(self, month=None, year=None):
        """Calculate the total expenses for all family members"""
        now = timezone.now()
        month = month or now.month
        year = year or now.year
        
        user_ids = self.members_profiles.values_list('user', flat=True)
        return Expense.objects.filter(
            user__in=user_ids,
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
    
    def get_total_family_income(self, month=None, year=None):
        """Calculate the total income for all family members"""
        # Get all family members' profiles
        profiles = self.members_profiles.all()
        
        # Sum up the monthly income of all profiles
        total_income = profiles.aggregate(total=Sum('monthly_income'))['total'] or 0
        
        return total_income
    
    def get_family_goals(self):
        """Get all family goals"""
        return Goal.objects.filter(family=self, is_personal=False)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='profile')
    family = models.ForeignKey('Family', on_delete=models.SET_NULL, null=True, blank=True, related_name='members_profiles')
    monthly_income = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        default=Decimal('0.00')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    @staticmethod
    def get_monthly_income(user, month=None, year=None):
        """Get the monthly income for a user"""
        try:
            profile = UserProfile.objects.get(user=user)
            return profile.monthly_income
        except UserProfile.DoesNotExist:
            return Decimal('0.00')
    
    @staticmethod
    def get_annual_income(user, year=None):
        """Calculate total income for a year (monthly_income * 12)"""
        try:
            profile = UserProfile.objects.get(user=user)
            return profile.monthly_income * 12
        except UserProfile.DoesNotExist:
            return Decimal('0.00')

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
            elif not self.goal.is_personal:
                # Check if user's profile is connected to the goal's family
                try:
                    profile = UserProfile.objects.get(user=self.user)
                    if not self.goal.family or profile.family != self.goal.family:
                        raise ValidationError("Family goal must belong to the user's family")
                except UserProfile.DoesNotExist:
                    raise ValidationError("User must have a profile to associate with family goals")
    
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
    is_family = models.BooleanField(default=False)
    family = models.ForeignKey('Family', on_delete=models.CASCADE, null=True, blank=True, related_name='budgets')
    
    class Meta:
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.name} - {self.category}"
    
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
        if not self.is_personal and self.family:
            # Check through UserProfile
            try:
                profile = UserProfile.objects.get(user=self.user)
                if profile.family != self.family:
                    raise ValidationError("User must be a member of the family for family goals")
            except UserProfile.DoesNotExist:
                raise ValidationError("User must have a profile to create family goals")
    
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
    
class Streak(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='streaks')
    count = models.IntegerField(default=0)
    last_updated = models.DateField()
    
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
        
        if not self.goal.is_personal:
            # Check through UserProfile
            try:
                profile = UserProfile.objects.get(user=self.user)
                if not profile.family or profile.family != self.goal.family:
                    raise ValidationError("Users can only contribute to family goals they are members of")
            except UserProfile.DoesNotExist:
                raise ValidationError("User must have a profile to contribute to family goals")
    
    def save(self, *args, **kwargs):
        # Run full validation before saving
        self.full_clean()
        super().save(*args, **kwargs)
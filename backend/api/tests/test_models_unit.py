from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from api.models import (
    Family, UserProfile, Expense, Budget, Goal, Streak, Contribution
)

class FamilyModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        self.family = Family.objects.create(name="Test Family")
        self.profile = UserProfile.objects.create(
            user=self.user,
            family=self.family,
            monthly_income=Decimal("1000.00")
        )
        
    def test_family_creation(self):
        """Test family is created properly"""
        self.assertEqual(self.family.name, "Test Family")
        
    def test_total_members(self):
        """Test total_members method returns correct count"""
        self.assertEqual(self.family.total_members(), 1)
        
    def test_get_total_family_income(self):
        """Test get_total_family_income method returns correct amount"""
        self.assertEqual(self.family.get_total_family_income(), Decimal("1000.00"))
        
    def test_get_total_family_budget(self):
        """Test get_total_family_budget method returns correct amount"""
        Budget.objects.create(
            user=self.user,
            amount=Decimal("200.00"),
            name="Test Budget",
            category="Test"
        )
        
        self.assertEqual(self.family.get_total_family_budget(), Decimal("200.00"))
        
    def test_get_total_family_expenses(self):
        """Test get_total_family_expenses method returns correct amount"""
        Expense.objects.create(
            user=self.user,
            amount=Decimal("50.00"),
            description="Test expense"
        )
        
        current_month = Expense.objects.first().date.month
        current_year = Expense.objects.first().date.year
        
        self.assertEqual(
            self.family.get_total_family_expenses(month=current_month, year=current_year), 
            Decimal("50.00")
        )
        
    def test_get_family_goals(self):
        """Test get_family_goals method returns only family goals"""
        # Create a family goal
        family_goal = Goal.objects.create(
            user=self.user,
            family=self.family,
            name="Family Goal",
            amount=Decimal("1000.00"),
            goal_type="saving",
            is_personal=False
        )
        
        # Create a personal goal
        personal_goal = Goal.objects.create(
            user=self.user,
            name="Personal Goal",
            amount=Decimal("500.00"),
            goal_type="saving",
            is_personal=True
        )
        
        goals = self.family.get_family_goals()
        
        self.assertEqual(len(goals), 1)
        self.assertEqual(goals.first(), family_goal)
        self.assertNotIn(personal_goal, goals)

class UserProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            monthly_income=Decimal("2000.00")
        )
        
    def test_profile_creation(self):
        """Test profile is created properly"""
        self.assertEqual(self.profile.monthly_income, Decimal("2000.00"))
        
    def test_get_monthly_income(self):
        """Test get_monthly_income method returns correct amount"""
        self.assertEqual(
            UserProfile.get_monthly_income(self.user), 
            Decimal("2000.00")
        )
        
    def test_get_annual_income(self):
        """Test get_annual_income method returns correct amount"""
        self.assertEqual(
            UserProfile.get_annual_income(self.user), 
            Decimal("24000.00")
        )

class ExpenseModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        self.expense = Expense.objects.create(
            user=self.user,
            amount=Decimal("50.00"),
            description="Test expense"
        )
        
    def test_expense_creation(self):
        """Test expense is created properly"""
        self.assertEqual(self.expense.description, "Test expense")
        self.assertEqual(self.expense.amount, Decimal("50.00"))
        
    def test_expense_validation(self):
        """Test expense validation logic"""
        with self.assertRaises(ValidationError):
            invalid_expense = Expense(
                user=self.user,
                amount=Decimal("-10.00"),  # Invalid negative amount
                description="Invalid expense"
            )
            invalid_expense.full_clean()
            
    def test_expense_with_budget(self):
        """Test expense linked to budget"""
        budget = Budget.objects.create(
            user=self.user,
            name="Groceries",
            amount=Decimal("200.00"),
            category="Food"
        )
        
        expense = Expense.objects.create(
            user=self.user,
            amount=Decimal("30.00"),
            description="Grocery shopping",
            budget=budget
        )
        
        self.assertEqual(expense.budget, budget)
        
    def test_expense_with_goal(self):
        """Test expense linked to goal"""
        goal = Goal.objects.create(
            user=self.user,
            name="Vacation",
            amount=Decimal("1000.00"),
            goal_type="spending",
            is_personal=True
        )
        
        expense = Expense.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            description="Hotel booking",
            goal=goal
        )
        
        self.assertEqual(expense.goal, goal)
        
    def test_expense_validation_with_budget_from_another_user(self):
        """Test validation prevents linking to another user's budget"""
        another_user = User.objects.create_user(
            username="anotheruser",
            email="another@example.com",
            password="testpassword"
        )
        
        another_budget = Budget.objects.create(
            user=another_user,
            name="Another's Budget",
            amount=Decimal("300.00"),
            category="Other"
        )
        
        with self.assertRaises(ValidationError):
            invalid_expense = Expense(
                user=self.user,
                amount=Decimal("50.00"),
                description="Invalid budget link",
                budget=another_budget
            )
            invalid_expense.clean()
            
    def test_get_monthly_expenses(self):
        """Test get_monthly_expenses static method"""
        # Clear existing expenses
        Expense.objects.all().delete()
        
        # Create expenses in current month
        for i in range(3):
            Expense.objects.create(
                user=self.user,
                amount=Decimal("50.00"),
                description=f"Expense {i}"
            )
        
        current_month = Expense.objects.first().date.month
        current_year = Expense.objects.first().date.year
        
        # Get monthly expenses
        monthly_total = Expense.get_monthly_expenses(
            self.user, month=current_month, year=current_year
        )
        
        self.assertEqual(monthly_total, Decimal("150.00"))  # 3 * 50.00

class BudgetModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        self.budget = Budget.objects.create(
            user=self.user,
            name="Groceries",
            amount=Decimal("200.00"),
            category="Food"
        )
        
    def test_budget_creation(self):
        """Test budget is created properly"""
        self.assertEqual(self.budget.name, "Groceries")
        self.assertEqual(self.budget.amount, Decimal("200.00"))
        self.assertEqual(self.budget.category, "Food")
        
    def test_get_remaining_amount(self):
        """Test get_remaining_amount returns correct value when no expenses"""
        self.assertEqual(self.budget.get_remaining_amount(), Decimal("200.00"))
        
    def test_get_used_amount_with_expenses(self):
        """Test get_used_amount with expenses returns correct value"""
        Expense.objects.create(
            user=self.user,
            amount=Decimal("50.00"),
            description="Grocery shopping",
            budget=self.budget
        )
        self.assertEqual(self.budget.get_used_amount(), Decimal("50.00"))
        self.assertEqual(self.budget.get_remaining_amount(), Decimal("150.00"))
        self.assertEqual(self.budget.get_usage_percentage(), 25)
        
    def test_get_used_amount_multiple_expenses(self):
        """Test get_used_amount with multiple expenses"""
        # Add first expense
        Expense.objects.create(
            user=self.user,
            amount=Decimal("50.00"),
            description="Grocery shopping 1",
            budget=self.budget
        )
        
        # Add second expense
        Expense.objects.create(
            user=self.user,
            amount=Decimal("30.00"),
            description="Grocery shopping 2",
            budget=self.budget
        )
        
        self.assertEqual(self.budget.get_used_amount(), Decimal("80.00"))
        self.assertEqual(self.budget.get_remaining_amount(), Decimal("120.00"))
        self.assertEqual(self.budget.get_usage_percentage(), 40)
        
    def test_budget_ordering(self):
        """Test budget ordering by category and name"""
        Budget.objects.all().delete()
        
        b1 = Budget.objects.create(
            user=self.user,
            name="Groceries",
            amount=Decimal("200.00"),
            category="Food"
        )
        
        b2 = Budget.objects.create(
            user=self.user,
            name="Restaurants",
            amount=Decimal("150.00"),
            category="Food"
        )
        
        b3 = Budget.objects.create(
            user=self.user,
            name="Rent",
            amount=Decimal("1000.00"),
            category="Housing"
        )
        
        budgets = list(Budget.objects.all())
        
        # Should be ordered by category first, then name
        self.assertEqual(budgets[0], b1)  # Food: Groceries
        self.assertEqual(budgets[1], b2)  # Food: Restaurants
        self.assertEqual(budgets[2], b3)  # Housing: Rent

class GoalModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        self.family = Family.objects.create(name="Test Family")
        self.profile = UserProfile.objects.create(
            user=self.user, 
            family=self.family,
            monthly_income=Decimal("1000.00")
        )
        self.personal_goal = Goal.objects.create(
            user=self.user,
            name="Vacation",
            amount=Decimal("1000.00"),
            goal_type="saving",
            is_personal=True
        )
        self.family_goal = Goal.objects.create(
            user=self.user,
            family=self.family,
            name="Family Car",
            amount=Decimal("5000.00"),
            goal_type="saving",
            is_personal=False
        )
        
    def test_goal_creation(self):
        """Test goals are created properly"""
        self.assertEqual(self.personal_goal.name, "Vacation")
        self.assertEqual(self.family_goal.name, "Family Car")
        
    def test_goal_validation(self):
        """Test validation for family goals"""
        with self.assertRaises(ValidationError):
            invalid_goal = Goal(
                user=self.user,
                name="Invalid Goal",
                amount=Decimal("1000.00"),
                goal_type="saving",
                is_personal=False  # Family goal requires family
            )
            invalid_goal.full_clean()
            
    def test_get_progress_for_saving_goal(self):
        """Test goal progress calculation for saving goals"""
        # Add a contribution to the goal
        Contribution.objects.create(
            user=self.user,
            goal=self.personal_goal,
            amount=Decimal("250.00")
        )
        
        self.assertEqual(self.personal_goal.get_progress(), Decimal("250.00"))
        self.assertEqual(self.personal_goal.get_progress_percentage(), 25)
        self.assertEqual(self.personal_goal.get_remaining_amount(), Decimal("750.00"))
        
    def test_get_progress_for_spending_goal(self):
        """Test goal progress calculation for spending goals"""
        # Create a spending goal
        spending_goal = Goal.objects.create(
            user=self.user,
            name="Shopping",
            amount=Decimal("500.00"),
            goal_type="spending",
            is_personal=True
        )

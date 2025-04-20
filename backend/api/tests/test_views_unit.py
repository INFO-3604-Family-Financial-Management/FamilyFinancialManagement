import json
from decimal import Decimal
from django.urls import reverse
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from api.models import (
    Expense, Family, Budget, Goal, Streak, Contribution, UserProfile
)

class BaseAPITestCase(APITestCase):
    """Base test case with common setup functionality"""
    
    def setUp(self):
        # Create a test user
        self.username = 'testuser'
        self.password = 'testpassword123'
        self.user = User.objects.create_user(
            username=self.username, 
            email='test@example.com',
            password=self.password
        )
        
        # Create a profile for the test user
        self.profile = UserProfile.objects.create(
            user=self.user,
            monthly_income=Decimal('2000.00')
        )
        
        # Create a test family
        self.family = Family.objects.create(name='Test Family')
        self.family.members.add(self.user)
        
        # Set up the API client
        self.client = APIClient()
        self.client.login(username=self.username, password=self.password)
        self.client.force_authenticate(user=self.user)
        
        # Create some test data
        self.budget = Budget.objects.create(
            user=self.user,
            name='Groceries',
            amount=Decimal('500.00'),
            category='Food'
        )
        
        self.expense = Expense.objects.create(
            user=self.user,
            amount=Decimal('50.00'),
            description='Weekly groceries',
            date=timezone.now().date(),
            budget=self.budget
        )
        
        self.goal = Goal.objects.create(
            user=self.user,
            name='Vacation',
            amount=Decimal('1000.00'),
            goal_type='saving',
            is_personal=True
        )
        
        self.streak = Streak.objects.create(
            user=self.user,
            count=5,
            last_updated=timezone.now().date()
        )

class UserRegistrationTest(TestCase):
    """Tests for user registration endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.user_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpassword123'
        }
    
    def test_user_registration_success(self):
        """Test successful user registration"""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        # Verify UserProfile is created automatically
        self.assertTrue(UserProfile.objects.filter(user__username='newuser').exists())
    
    def test_user_registration_duplicate_username(self):
        """Test registration with duplicate username"""
        # Create user first
        User.objects.create_user(
            username='newuser', 
            email='existing@example.com',
            password='existingpassword'
        )
        
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_registration_invalid_data(self):
        """Test registration with invalid data"""
        # Missing required field
        invalid_data = {
            'username': 'newuser',
            'password': 'newpassword123'
            # Missing email
        }
        
        response = self.client.post(self.register_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class ExpenseAPITest(BaseAPITestCase):
    """Tests for expense API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.expense_list_url = reverse('expense-list-create')
        self.expense_detail_url = reverse('expense-detail', kwargs={'pk': self.expense.id})
        self.recent_expenses_url = reverse('recent-expenses')
    
    def test_get_expenses_list(self):
        """Test retrieving list of expenses"""
        response = self.client.get(self.expense_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['description'], 'Weekly groceries')
    
    def test_get_expense_detail(self):
        """Test retrieving a specific expense"""
        response = self.client.get(self.expense_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Weekly groceries')
        self.assertEqual(Decimal(response.data['amount']), Decimal('50.00'))
    
    def test_create_expense(self):
        """Test creating a new expense"""
        expense_data = {
            'description': 'Dinner',
            'amount': '75.00',
            'budget': self.budget.id
        }
        
        response = self.client.post(self.expense_list_url, expense_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the expense was created
        self.assertEqual(Expense.objects.count(), 2)
        new_expense = Expense.objects.get(description='Dinner')
        self.assertEqual(new_expense.amount, Decimal('75.00'))
        self.assertEqual(new_expense.budget, self.budget)
    
    def test_update_expense(self):
        """Test updating an expense"""
        updated_data = {
            'description': 'Updated groceries',
            'amount': '60.00'
        }
        
        response = self.client.patch(self.expense_detail_url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh expense from database
        self.expense.refresh_from_db()
        self.assertEqual(self.expense.description, 'Updated groceries')
        self.assertEqual(self.expense.amount, Decimal('60.00'))
    
    def test_delete_expense(self):
        """Test deleting an expense"""
        response = self.client.delete(self.expense_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Expense.objects.filter(id=self.expense.id).exists())
    
    def test_recent_expenses(self):
        """Test retrieving recent expenses"""
        # Create a few more expenses
        for i in range(3):
            Expense.objects.create(
                user=self.user,
                amount=Decimal(f'{(i+1)*10}.00'),
                description=f'Expense {i+1}',
                date=timezone.now().date()
            )
        
        response = self.client.get(self.recent_expenses_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return at most 5 expenses, ordered by most recent
        self.assertLessEqual(len(response.data), 5)

class BudgetAPITest(BaseAPITestCase):
    """Tests for budget API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.budget_list_url = reverse('budget-list-create')
        self.budget_detail_url = reverse('budget-detail', kwargs={'pk': self.budget.id})
        self.family_budget_list_url = reverse('family-budget-list-create')
    
    def test_get_budgets_list(self):
        """Test retrieving list of personal budgets"""
        response = self.client.get(self.budget_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Groceries')
    
    def test_create_budget(self):
        """Test creating a new budget"""
        budget_data = {
            'name': 'Entertainment',
            'category': 'Entertainment',
            'amount': '200.00'
        }
        
        response = self.client.post(self.budget_list_url, budget_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the budget was created
        self.assertEqual(Budget.objects.count(), 2)
        new_budget = Budget.objects.get(name='Entertainment')
        self.assertEqual(new_budget.amount, Decimal('200.00'))
        self.assertEqual(new_budget.user, self.user)
    
    def test_update_budget(self):
        """Test updating a budget"""
        updated_data = {
            'name': 'Food & Groceries',
            'amount': '600.00'
        }
        
        response = self.client.patch(self.budget_detail_url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh budget from database
        self.budget.refresh_from_db()
        self.assertEqual(self.budget.name, 'Food & Groceries')
        self.assertEqual(self.budget.amount, Decimal('600.00'))
    
    def test_create_family_budget(self):
        """Test creating a new family budget"""
        # First update the user profile to have a family
        self.profile.family = self.family
        self.profile.save()
        
        budget_data = {
            'name': 'Family Vacation',
            'category': 'Travel',
            'amount': '1000.00'
        }
        
        response = self.client.post(self.family_budget_list_url, budget_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the family budget was created
        family_budget = Budget.objects.get(name='Family Vacation')
        self.assertEqual(family_budget.amount, Decimal('1000.00'))
        self.assertEqual(family_budget.family, self.family)
        self.assertTrue(family_budget.is_family)

class FamilyAPITest(BaseAPITestCase):
    """Tests for family API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.family_list_url = reverse('family-list-create')
        self.family_detail_url = reverse('family-detail', kwargs={'pk': self.family.id})
        self.family_members_url = reverse('family-member-list')
        self.family_financials_url = reverse('family-finances')
    
    def test_get_user_family(self):
        """Test retrieving the user's family"""
        # Update profile to have the family
        self.profile.family = self.family
        self.profile.save()
        
        response = self.client.get(self.family_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Family')
    
    def test_create_family(self):
        """Test creating a new family"""
        # Clear existing family relationship
        self.profile.family = None
        self.profile.save()
        self.family.members.remove(self.user)
        
        family_data = {
            'name': 'New Family'
        }
        
        response = self.client.post(self.family_list_url, family_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the family was created
        new_family = Family.objects.get(name='New Family')
        self.assertTrue(new_family.members.filter(id=self.user.id).exists())
        
        # Refresh profile
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.family, new_family)
    
    def test_get_family_members(self):
        """Test retrieving family members"""
        # Create another user and add to family
        user2 = User.objects.create_user(
            username='familymember', 
            email='family@example.com',
            password='familypass'
        )
        profile2 = UserProfile.objects.create(
            user=user2,
            family=self.family
        )
        self.family.members.add(user2)
        
        # Update profile to have the family
        self.profile.family = self.family
        self.profile.save()
        
        response = self.client.get(self.family_members_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        usernames = [user['username'] for user in response.data]
        self.assertIn(self.username, usernames)
        self.assertIn('familymember', usernames)
    
    def test_family_finances(self):
        """Test retrieving family financial data"""
        # Add another member with expenses
        user2 = User.objects.create_user(
            username='familymember', 
            email='family@example.com',
            password='familypass'
        )
        profile2 = UserProfile.objects.create(
            user=user2,
            family=self.family,
            monthly_income=Decimal('1500.00')
        )
        self.family.members.add(user2)
        
        # Create some expenses for the family members
        Expense.objects.create(
            user=user2,
            amount=Decimal('75.00'),
            description='Family dinner',
            date=timezone.now().date()
        )
        
        # Update profile to have the family
        self.profile.family = self.family
        self.profile.save()
        
        response = self.client.get(self.family_financials_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['family']['name'], 'Test Family')
        
        # Check finances data
        finances = response.data['finances']
        self.assertEqual(Decimal(finances['total_income']), Decimal('3500.00'))  # 2000 + 1500
        # Total expenses depends on current month so this might need adjustment
        self.assertTrue('total_expenses' in finances)
        self.assertTrue('total_savings' in finances)

class GoalAPITest(BaseAPITestCase):
    """Tests for goal API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.goal_list_url = reverse('goal-list-create')
        self.goal_detail_url = reverse('goal-detail', kwargs={'pk': self.goal.id})
    
    def test_get_goals_list(self):
        """Test retrieving list of goals"""
        response = self.client.get(self.goal_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Vacation')
    
    def test_create_goal(self):
        """Test creating a new goal"""
        goal_data = {
            'name': 'New Car',
            'amount': '10000.00',
            'goal_type': 'saving',
            'is_personal': True
        }
        
        response = self.client.post(self.goal_list_url, goal_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the goal was created
        self.assertEqual(Goal.objects.count(), 2)
        new_goal = Goal.objects.get(name='New Car')
        self.assertEqual(new_goal.amount, Decimal('10000.00'))
        self.assertEqual(new_goal.user, self.user)
    
    def test_create_family_goal(self):
        """Test creating a family goal"""
        # Update profile to have a family
        self.profile.family = self.family
        self.profile.save()
        
        goal_data = {
            'name': 'Family Trip',
            'amount': '5000.00',
            'goal_type': 'saving',
            'is_personal': False,
            'family': self.family.id
        }
        
        response = self.client.post(self.goal_list_url, goal_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the family goal was created
        family_goal = Goal.objects.get(name='Family Trip')
        self.assertEqual(family_goal.amount, Decimal('5000.00'))
        self.assertEqual(family_goal.family, self.family)
        self.assertFalse(family_goal.is_personal)
    
    def test_update_goal(self):
        """Test updating a goal"""
        updated_data = {
            'name': 'Beach Vacation',
            'amount': '1500.00'
        }
        
        response = self.client.patch(self.goal_detail_url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh goal from database
        self.goal.refresh_from_db()
        self.assertEqual(self.goal.name, 'Beach Vacation')
        self.assertEqual(self.goal.amount, Decimal('1500.00'))
    
    def test_pin_goal(self):
        """Test pinning a goal"""
        pin_url = reverse('goal-pin', kwargs={'pk': self.goal.id})
        
        response = self.client.post(pin_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh goal from database
        self.goal.refresh_from_db()
        self.assertTrue(self.goal.pinned)

class StreakAPITest(BaseAPITestCase):
    """Tests for streak API endpoints"""
    
    def setUp(self):
        super().setUp()
        # The URL uses viewset patterns
        self.streak_list_url = reverse('streak-list')
        self.streak_detail_url = reverse('streak-detail', kwargs={'pk': self.streak.id})
        self.update_streak_url = reverse('streak-update-streak', kwargs={'pk': self.streak.id})
    
    def test_get_streaks_list(self):
        """Test retrieving the user's streak"""
        response = self.client.get(self.streak_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['count'], 5)
    
    def test_update_streak(self):
        """Test updating the streak counter"""
        # Set the last updated date to yesterday
        yesterday = timezone.now().date() - timezone.timedelta(days=1)
        self.streak.last_updated = yesterday
        self.streak.save()
        
        response = self.client.post(self.update_streak_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh streak from database
        self.streak.refresh_from_db()
        self.assertEqual(self.streak.count, 6)  # Incremented from 5
        self.assertEqual(self.streak.last_updated, timezone.now().date())
    
    def test_streak_update_same_day(self):
        """Test that streak doesn't update twice on the same day"""
        # Set the last updated date to today
        self.streak.last_updated = timezone.now().date()
        self.streak.save()
        
        response = self.client.post(self.update_streak_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh streak from database
        self.streak.refresh_from_db()
        self.assertEqual(self.streak.count, 5)  # Unchanged
        
    def test_streak_update_after_break(self):
        """Test that streak resets after missing a day"""
        # Set the last updated date to two days ago
        two_days_ago = timezone.now().date() - timezone.timedelta(days=2)
        self.streak.last_updated = two_days_ago
        self.streak.save()
        
        response = self.client.post(self.update_streak_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh streak from database
        self.streak.refresh_from_db()
        self.assertEqual(self.streak.count, 1)  # Reset to 1
        self.assertEqual(self.streak.last_updated, timezone.now().date())

class ContributionAPITest(BaseAPITestCase):
    """Tests for contribution API endpoints"""
    
    def setUp(self):
        super().setUp()
        # Create a saving goal
        self.saving_goal = Goal.objects.create(
            user=self.user,
            name='Emergency Fund',
            amount=Decimal('5000.00'),
            goal_type='saving',
            is_personal=True
        )
        
        # Create a contribution
        self.contribution = Contribution.objects.create(
            user=self.user,
            goal=self.saving_goal,
            amount=Decimal('100.00')
        )
        
        self.contribution_list_url = reverse('contribution-list-create')
        self.contribution_detail_url = reverse('contribution-detail', kwargs={'pk': self.contribution.id})
    
    def test_get_contributions_list(self):
        """Test retrieving list of contributions"""
        response = self.client.get(self.contribution_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(Decimal(response.data[0]['amount']), Decimal('100.00'))
    
    def test_create_contribution(self):
        """Test creating a new contribution"""
        contribution_data = {
            'goal': self.saving_goal.id,
            'amount': '150.00'
        }
        
        response = self.client.post(self.contribution_list_url, contribution_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the contribution was created
        self.assertEqual(Contribution.objects.count(), 2)
        new_contribution = Contribution.objects.filter(amount=Decimal('150.00')).first()
        self.assertEqual(new_contribution.goal, self.saving_goal)
        self.assertEqual(new_contribution.user, self.user)
    
    def test_contribution_goal_validation(self):
        """Test contribution must be linked to a user's goal"""
        # Create another user with a goal
        other_user = User.objects.create_user(
            username='otheruser', 
            email='other@example.com',
            password='otherpass'
        )
        
        other_goal = Goal.objects.create(
            user=other_user,
            name='Other Goal',
            amount=Decimal('1000.00'),
            goal_type='saving',
            is_personal=True
        )
        
        # Try to contribute to the other user's goal
        contribution_data = {
            'goal': other_goal.id,
            'amount': '50.00'
        }
        
        response = self.client.post(self.contribution_list_url, contribution_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_contribution_updates_goal_progress(self):
        """Test that contributions update goal progress"""
        # Create a new contribution
        contribution_data = {
            'goal': self.saving_goal.id,
            'amount': '200.00'
        }
        
        response = self.client.post(self.contribution_list_url, contribution_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check goal progress
        goal_detail_url = reverse('goal-detail', kwargs={'pk': self.saving_goal.id})
        response = self.client.get(goal_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Total progress should be 100 + 200 = 300
        self.assertEqual(Decimal(response.data['progress']), Decimal('300.00'))
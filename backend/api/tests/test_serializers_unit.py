from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone

from api.models import (
    Expense, Family, Budget, Goal, Streak, Contribution, UserProfile
)
from api.serializers import (
    UserSerializer, ExpenseSerializer, FamilySerializer, BudgetSerializer,
    GoalSerializer, ContributionSerializer, StreakSerializer, UserProfileSerializer
)

class UserSerializerTest(TestCase):
    """Tests for the UserSerializer"""
    
    def test_user_serializer_create(self):
        """Test creating a user with the serializer"""
        serializer = UserSerializer(data={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123'
        })
        
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        # Verify user was created
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpassword123'))
        
        # Verify UserProfile was created
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.monthly_income, Decimal('0.00'))
    
    def test_user_serializer_validation(self):
        """Test validation in UserSerializer"""
        # Missing email
        serializer = UserSerializer(data={
            'username': 'testuser',
            'password': 'testpassword123'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        
        # Invalid email format
        serializer = UserSerializer(data={
            'username': 'testuser',
            'email': 'not-an-email',
            'password': 'testpassword123'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

class UserProfileSerializerTest(TestCase):
    """Tests for the UserProfileSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            monthly_income=Decimal('2000.00')
        )
    
    def test_profile_serializer_output(self):
        """Test profile serializer output fields"""
        serializer = UserProfileSerializer(self.profile)
        data = serializer.data
        
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(Decimal(data['monthly_income']), Decimal('2000.00'))
        self.assertIsNone(data['family'])  # No family assigned
    
    def test_profile_serializer_update(self):
        """Test updating a profile with the serializer"""
        # Create a family
        family = Family.objects.create(name='Test Family')
        
        # Update profile
        serializer = UserProfileSerializer(
            self.profile,
            data={'monthly_income': '2500.00', 'family': family.id},
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        updated_profile = serializer.save()
        
        # Verify changes
        self.assertEqual(updated_profile.monthly_income, Decimal('2500.00'))
        self.assertEqual(updated_profile.family, family)

class ExpenseSerializerTest(TestCase):
    """Tests for the ExpenseSerializer"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
        # Create budget and goal
        self.budget = Budget.objects.create(
            user=self.user,
            name='Groceries',
            category='Food',
            amount=Decimal('500.00')
        )
        
        self.goal = Goal.objects.create(
            user=self.user,
            name='Save for groceries',
            amount=Decimal('1000.00'),
            goal_type='spending',
            is_personal=True
        )
        
        # Create expense
        self.expense = Expense.objects.create(
            user=self.user,
            amount=Decimal('50.00'),
            description='Weekly groceries',
            date=timezone.now().date(),
            budget=self.budget,
            goal=self.goal
        )
    
    def test_expense_serializer_output(self):
        """Test expense serializer output fields"""
        serializer = ExpenseSerializer(self.expense)
        data = serializer.data
        
        self.assertEqual(data['description'], 'Weekly groceries')
        self.assertEqual(Decimal(data['amount']), Decimal('50.00'))
        self.assertEqual(data['budget'], self.budget.id)
        self.assertEqual(data['goal'], self.goal.id)
        self.assertEqual(data['user'], self.user.id)
    
    def test_expense_serializer_create(self):
        """Test creating an expense with the serializer"""
        serializer = ExpenseSerializer(data={
            'description': 'Dinner',
            'amount': '75.00',
            'budget': self.budget.id,
            'goal': self.goal.id,
            'user': self.user.id
        })
        
        # Set context with request user
        serializer.context['request'] = type('obj', (object,), {'user': self.user})
        
        self.assertTrue(serializer.is_valid())
        expense = serializer.save()
        
        # Verify expense was created
        self.assertEqual(expense.description, 'Dinner')
        self.assertEqual(expense.amount, Decimal('75.00'))
        self.assertEqual(expense.budget, self.budget)
        self.assertEqual(expense.goal, self.goal)
        self.assertEqual(expense.user, self.user)

class BudgetSerializerTest(TestCase):
    """Tests for the BudgetSerializer"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
        # Create budget
        self.budget = Budget.objects.create(
            user=self.user,
            name='Groceries',
            category='Food',
            amount=Decimal('500.00')
        )
        
        # Create expense linked to budget
        self.expense = Expense.objects.create(
            user=self.user,
            amount=Decimal('50.00'),
            description='Weekly groceries',
            date=timezone.now().date(),
            budget=self.budget
        )
    
    def test_budget_serializer_output(self):
        """Test budget serializer output fields"""
        serializer = BudgetSerializer(self.budget)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Groceries')
        self.assertEqual(data['category'], 'Food')
        self.assertEqual(Decimal(data['amount']), Decimal('500.00'))
        self.assertEqual(data['user'], self.user.id)
        
        # Check calculated fields
        self.assertEqual(Decimal(data['used_amount']), Decimal('50.00'))
        self.assertEqual(Decimal(data['remaining_amount']), Decimal('450.00'))
        self.assertEqual(float(data['usage_percentage']), 10.0)
    
    def test_budget_serializer_create(self):
        """Test creating a budget with the serializer"""
        serializer = BudgetSerializer(data={
            'name': 'Entertainment',
            'category': 'Entertainment',
            'amount': '200.00',
            'user': self.user.id
        })

        serializer.context['request'] = type('obj', (object,), {'user': self.user})

        self.assertTrue(serializer.is_valid())
        budget = serializer.save()

        # Verify budget was created
        self.assertEqual(budget.name, 'Entertainment')
        self.assertEqual(budget.category, 'Entertainment')
        self.assertEqual(budget.amount, Decimal('200.00'))
        self.assertEqual(budget.user, self.user)

class GoalSerializerTest(TestCase):
    """Tests for the GoalSerializer"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        # Create UserProfile for the user to avoid validation errors
        profile = UserProfile.objects.create(user=self.user)
        
        # Create family
        self.family = Family.objects.create(name='Test Family')
        self.family.members.add(self.user)
        # Assign family to user profile to satisfy validation
        profile.family = self.family
        profile.save()
        
        # Create personal goal
        self.personal_goal = Goal.objects.create(
            user=self.user,
            name='Vacation',
            amount=Decimal('1000.00'),
            goal_type='saving',
            is_personal=True
        )
        
        # Create family goal
        self.family_goal = Goal.objects.create(
            user=self.user,
            family=self.family,
            name='Family Trip',
            amount=Decimal('5000.00'),
            goal_type='saving',
            is_personal=False
        )
        
        # Create contribution for personal goal
        self.contribution = Contribution.objects.create(
            user=self.user,
            goal=self.personal_goal,
            amount=Decimal('200.00')
        )
    
    def test_goal_serializer_output(self):
        """Test goal serializer output fields"""
        # Test personal goal
        serializer = GoalSerializer(self.personal_goal)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Vacation')
        self.assertEqual(Decimal(data['amount']), Decimal('1000.00'))
        self.assertEqual(data['goal_type'], 'saving')
        self.assertTrue(data['is_personal'])
        self.assertEqual(data['user'], self.user.id)
        self.assertIsNone(data['family'])
        
        # Check calculated fields
        self.assertEqual(Decimal(data['progress']), Decimal('200.00'))
        self.assertEqual(float(data['progress_percentage']), 20.0)
        self.assertEqual(Decimal(data['remaining_amount']), Decimal('800.00'))
        
        # Test family goal
        serializer = GoalSerializer(self.family_goal)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Family Trip')
        self.assertEqual(Decimal(data['amount']), Decimal('5000.00'))
        self.assertEqual(data['goal_type'], 'saving')
        self.assertFalse(data['is_personal'])
        self.assertEqual(data['user'], self.user.id)
        self.assertEqual(data['family'], self.family.id)
    
    def test_goal_serializer_create(self):
        """Test creating a goal with the serializer"""
        serializer = GoalSerializer(data={
            'name': 'New Car',
            'amount': '15000.00',
            'goal_type': 'saving',
            'is_personal': True
        })
        
        # Set context with request user
        serializer.context['request'] = type('obj', (object,), {'user': self.user})
        
        self.assertTrue(serializer.is_valid())
        goal = serializer.save()
        
        # Verify goal was created
        self.assertEqual(goal.name, 'New Car')
        self.assertEqual(goal.amount, Decimal('15000.00'))
        self.assertEqual(goal.goal_type, 'saving')
        self.assertTrue(goal.is_personal)
        self.assertEqual(goal.user, self.user)

class FamilySerializerTest(TestCase):
    """Tests for the FamilySerializer"""
    
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123'
        )
        
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='password123'
        )
        
        # Create family
        self.family = Family.objects.create(name='Test Family')
        self.family.members.add(self.user1, self.user2)
        
        # Create user profiles
        self.profile1 = UserProfile.objects.create(
            user=self.user1,
            family=self.family,
            monthly_income=Decimal('2000.00')
        )
        
        self.profile2 = UserProfile.objects.create(
            user=self.user2,
            family=self.family,
            monthly_income=Decimal('3000.00')
        )
    
    def test_family_serializer_output(self):
        """Test family serializer output fields"""
        serializer = FamilySerializer(self.family)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Test Family')
        self.assertEqual(data['members_count'], 2)
        self.assertEqual(len(data['members']), 2)
        
        # Check that both users are in members list
        member_ids = [member for member in data['members']]
        self.assertIn(self.user1.id, member_ids)
        self.assertIn(self.user2.id, member_ids)
    
    def test_family_serializer_create(self):
        """Test creating a family with the serializer"""
        serializer = FamilySerializer(data={
            'name': 'New Family',
            'members': [self.user1.id]
        })
        
        self.assertTrue(serializer.is_valid())
        family = serializer.save()
        
        # Verify family was created
        self.assertEqual(family.name, 'New Family')
        self.assertEqual(family.members.count(), 1)
        self.assertTrue(family.members.filter(id=self.user1.id).exists())

class StreakSerializerTest(TestCase):
    """Tests for the StreakSerializer"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
        # Create streak
        self.streak = Streak.objects.create(
            user=self.user,
            count=5,
            last_updated=timezone.now().date()
        )
    
    def test_streak_serializer_output(self):
        """Test streak serializer output fields"""
        serializer = StreakSerializer(self.streak)
        data = serializer.data
        
        self.assertEqual(data['count'], 5)
        self.assertEqual(data['user'], self.user.id)
        self.assertIsNotNone(data['last_updated'])
    
    def test_streak_serializer_update(self):
        """Test updating a streak with the serializer"""
        serializer = StreakSerializer(
            self.streak,
            data={'count': 10},
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        updated_streak = serializer.save()
        
        # Verify changes
        self.assertEqual(updated_streak.count, 10)
        # Last updated should be updated automatically to current date
        self.assertEqual(updated_streak.last_updated, timezone.now().date())

class ContributionSerializerTest(TestCase):
    """Tests for the ContributionSerializer"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
        # Create goal
        self.goal = Goal.objects.create(
            user=self.user,
            name='Vacation',
            amount=Decimal('1000.00'),
            goal_type='saving',
            is_personal=True
        )
        
        # Create contribution
        self.contribution = Contribution.objects.create(
            user=self.user,
            goal=self.goal,
            amount=Decimal('200.00')
        )
    
    def test_contribution_serializer_output(self):
        """Test contribution serializer output fields"""
        serializer = ContributionSerializer(self.contribution)
        data = serializer.data
        
        self.assertEqual(Decimal(data['amount']), Decimal('200.00'))
        self.assertEqual(data['user'], self.user.id)
        self.assertEqual(data['goal'], self.goal.id)
        self.assertIsNotNone(data['date'])
        self.assertIsNotNone(data['created_at'])
    
    def test_contribution_serializer_create(self):
        """Test creating a contribution with the serializer"""
        serializer = ContributionSerializer(data={
            'goal': self.goal.id,
            'amount': '300.00',
            'user': self.user.id
        })
        
        # Set context with request user
        serializer.context['request'] = type('obj', (object,), {'user': self.user})
        
        self.assertTrue(serializer.is_valid())
        contribution = serializer.save()
        
        # Verify contribution was created
        self.assertEqual(contribution.amount, Decimal('300.00'))
        self.assertEqual(contribution.goal, self.goal)
        self.assertEqual(contribution.user, self.user)
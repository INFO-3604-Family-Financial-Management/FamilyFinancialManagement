import logging

from django.db.models import Sum
from django.utils import timezone
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User 
from rest_framework import generics, status, permissions, viewsets
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    UserSerializer, ExpenseSerializer, FamilySerializer, BudgetSerializer, 
    GoalSerializer, ContributionSerializer, StreakSerializer, UserProfileSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import (
    Expense, Family, Budget, Goal, Streak, Contribution, UserProfile
)

# Logger instance for this module
logger = logging.getLogger(__name__)

# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        logger.info(f'Received request to create user: {request.data}')
        
        # Check if email already exists
        email = request.data.get('email')
        if email and User.objects.filter(email=email).exists():
            return Response(
                {'error': 'A user with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        response = super().create(request, *args, **kwargs)
        logger.info(f'Created user: {response.data}')
        return response

class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        goal_id = self.request.data.get('goal')
        budget_id = self.request.data.get('budget')

        goal = Goal.objects.filter(id=goal_id, user=self.request.user).first() if goal_id else None
        budget = Budget.objects.filter(id=budget_id, user=self.request.user).first() if budget_id else None

        expense = serializer.save(user=self.request.user, goal=goal, budget=budget)

        # Update goal progress
        if goal:
            goal.amount -= expense.amount
            goal.save()

        # Update budget progress
        if budget:
            budget.amount -= expense.amount
            budget.save()

class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        expense_description = instance.description
        self.perform_destroy(instance)
        return Response(
            {"message": f"Expense '{expense_description}' successfully deleted"},
            status=status.HTTP_200_OK
        )

class RecentExpensesView(generics.ListAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user).order_by('-created_at')[:5]
    
class FamilyListCreateView(generics.ListCreateAPIView):
    serializer_class = FamilySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return families the user is part of through their UserProfile
        try:
            user_profile = UserProfile.objects.get(user=self.request.user)
            if user_profile.family:
                return Family.objects.filter(id=user_profile.family.id)
        except UserProfile.DoesNotExist:
            pass
        
        # Also include families the user is directly part of (for backward compatibility)
        return Family.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        try:
            # Use transaction to ensure atomicity
            with transaction.atomic():
                # Save the family
                family = serializer.save()
                
                if not family:
                    raise ValueError("Failed to create family")
                
                # Add the creator to the family through their UserProfile
                try:
                    profile, created = UserProfile.objects.get_or_create(user=self.request.user)
                    
                    # Check if user is already part of a family
                    if profile.family and not created:
                        logger.warning(f"User {self.request.user.username} is already part of family {profile.family.name}")
                        # Option: Raise exception or continue
                        # raise ValueError(f"You are already part of family: {profile.family.name}")
                    
                    # Update profile with new family
                    profile.family = family
                    profile.save()
                    
                    # Also add to direct members for backward compatibility
                    family.members.add(self.request.user)
                    
                    logger.info(f"User {self.request.user.username} successfully added to new family {family.name}")
                    
                except UserProfile.DoesNotExist:
                    logger.error(f"Error retrieving profile for user {self.request.user.username}")
                    raise ValueError("Unable to create user profile")
                except Exception as e:
                    logger.error(f"Error adding user to family: {str(e)}")
                    raise ValueError(f"Error adding you to family: {str(e)}")
        
        except Exception as e:
            logger.error(f"Family creation failed: {str(e)}")
            # Re-raise the exception to be handled by the framework
            raise serializer.ValidationError(f"Family creation failed: {str(e)}")

class FamilyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FamilySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        logging.info(f"Filtering families for user: {user.username}")
        
        # Get families through UserProfile
        try:
            profile = UserProfile.objects.get(user=user)
            if profile.family:
                return Family.objects.filter(id=profile.family.id)
        except UserProfile.DoesNotExist:
            pass
            
        # Also include direct membership for backward compatibility
        return Family.objects.filter(members=user)

    def perform_destroy(self, instance):
        # Remove user from family by updating their profile
        try:
            profile = UserProfile.objects.get(user=self.request.user)
            if profile.family == instance:
                profile.family = None
                profile.save()
        except UserProfile.DoesNotExist:
            pass
            
        # Also remove from direct members
        instance.members.remove(self.request.user)
        
        # If no profiles reference this family and no direct members, delete it
        if not instance.members_profiles.exists() and instance.members.count() == 0:
            instance.delete()

class FamilyMemberListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get family through UserProfile
        try:
            profile = UserProfile.objects.get(user=self.request.user)
            if profile.family:
                # Get all users who have profiles associated with this family
                member_profiles = UserProfile.objects.filter(family=profile.family)
                user_ids = member_profiles.values_list('user', flat=True)
                return User.objects.filter(id__in=user_ids)
        except UserProfile.DoesNotExist:
            pass
            
        # Fallback to direct membership
        family = Family.objects.filter(members=self.request.user).first()
        if not family:    
            return User.objects.none()
        return family.members.all()

# Enhanced implementation to handle adding/removing family members
class FamilyMemberManageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        """Add a member to the family"""
        try:
            family = get_object_or_404(Family, pk=pk)
            username = request.data.get('username')
            
            if not username:
                return Response(
                    {"error": "Username is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                user = User.objects.get(username=username)
                
                # Update user's profile to reference this family
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile.family = family
                profile.save()
                
                # Also add to direct members for backward compatibility
                family.members.add(user)
                
                return Response(
                    {"message": f"User {username} added to family"}, 
                    status=status.HTTP_200_OK
                )
            except User.DoesNotExist:
                return Response(
                    {"error": f"User {username} not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Family.DoesNotExist:
            return Response(
                {"error": "Family not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, pk):
        """Remove a member from the family"""
        try:
            family = get_object_or_404(Family, pk=pk)
            username = request.data.get('username')
            
            if not username:
                return Response(
                    {"error": "Username is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                user = User.objects.get(username=username)
                
                # Check if user is in the family (either through profile or direct membership)
                is_member = False
                
                # Check profile
                try:
                    profile = UserProfile.objects.get(user=user)
                    if profile.family == family:
                        profile.family = None
                        profile.save()
                        is_member = True
                except UserProfile.DoesNotExist:
                    pass
                
                # Check direct membership
                if user in family.members.all():
                    family.members.remove(user)
                    is_member = True
                
                if is_member:
                    # If no profiles reference this family and no direct members, delete it
                    if not family.members_profiles.exists() and family.members.count() == 0:
                        family.delete()
                        return Response(
                            {"message": f"User {username} removed from family. Family deleted as it now has no members."}, 
                            status=status.HTTP_200_OK
                        )
                    
                    return Response(
                        {"message": f"User {username} removed from family"}, 
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"error": f"User {username} is not a member of this family"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except User.DoesNotExist:
                return Response(
                    {"error": f"User {username} not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Family.DoesNotExist:
            return Response(
                {"error": "Family not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

class MonthlyBudgetStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        monthly_expenses = Expense.get_monthly_expenses(user)
        monthly_budget = Budget.get_monthly_budget(user)
        
        # Get monthly income from UserProfile
        monthly_income = 0
        try:
            profile = UserProfile.objects.get(user=user)
            monthly_income = profile.monthly_income
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = UserProfile.objects.create(user=user, monthly_income=0)
            
        remaining_budget = monthly_income - monthly_expenses - monthly_budget

        return Response({
            'monthly_expenses': monthly_expenses,
            'monthly_budget': monthly_budget,
            'monthly_income': monthly_income,
            'remaining_budget': remaining_budget
        })
    
    def update_streak(self, user):
        streak, created = Streak.objects.get_or_create(user=user)
        streak.count += 1
        streak.save()
    
class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get user's family
        family = None
        try:
            profile = UserProfile.objects.get(user=user)
            family = profile.family
        except UserProfile.DoesNotExist:
            pass
            
        # Get personal goals
        personal_goals = Goal.objects.filter(user=user)
        
        # Get family goals if user is in a family
        if family:
            family_goals = Goal.objects.filter(family=family, is_personal=False)
            return personal_goals | family_goals
            
        return personal_goals

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        goal = self.get_object()

        # Unpin all other goals for this user
        Goal.objects.filter(user=request.user, pinned=True).update(pinned=False)

        # Pin the selected goal
        goal.pinned = True
        goal.save()
        return Response({'message': f'Goal "{goal.name}" has been pinned.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        goal = self.get_object()

        # Unpin the selected goal
        goal.pinned = False
        goal.save()
        return Response({'message': f'Goal "{goal.name}" has been unpinned.'}, status=status.HTTP_200_OK)
    
class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get user's family
        family = None
        try:
            profile = UserProfile.objects.get(user=user)
            family = profile.family
        except UserProfile.DoesNotExist:
            pass
            
        # Get personal goals
        personal_goals = Goal.objects.filter(user=user)
        
        # Get family goals if user is in a family
        if family:
            family_goals = Goal.objects.filter(family=family, is_personal=False)
            return personal_goals | family_goals
            
        return personal_goals

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get user's family
        family = None
        try:
            profile = UserProfile.objects.get(user=user)
            family = profile.family
        except UserProfile.DoesNotExist:
            pass
            
        # Get personal goals
        personal_goals = Goal.objects.filter(user=user)
        
        # Get family goals if user is in a family
        if family:
            family_goals = Goal.objects.filter(family=family, is_personal=False)
            return personal_goals | family_goals
            
        return personal_goals
    def perform_update(self, serializer):
        instance = serializer.instance
        amount_saved = self.request.data.get('amount_saved')
        
        if amount_saved is not None:
            current_saved = instance.amount_saved if hasattr(instance, 'amount_saved') else 0
            new_saved = current_saved + float(amount_saved)
            
            # Check if it exceeds target
            if hasattr(instance, 'target_amount') and new_saved > instance.target_amount:
                raise serializers.ValidationError("Amount saved exceeds the target amount.")
            
            serializer.save(amount_saved=new_saved)
        else:
            serializer.save()           
class UserProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Make sure there's only one profile per user
        UserProfile.objects.filter(user=self.request.user).delete()
        serializer.save(user=self.request.user)

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Get or create profile for the current user
        try:
            profile = UserProfile.objects.get(user=self.request.user)
            logger.info(f"Found existing profile for user {self.request.user.username}")
            return profile
        except UserProfile.DoesNotExist:
            # Create a new profile if it doesn't exist
            logger.info(f"Creating new profile for user {self.request.user.username}")
            profile = UserProfile.objects.create(
                user=self.request.user,
                monthly_income=0.00
            )
            return profile
        
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Partial update to allow updating just income or family
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # If family is updated, also update the direct relationship for backward compatibility
        if 'family' in request.data:
            family_id = request.data.get('family')
            if family_id:
                try:
                    family = Family.objects.get(id=family_id)
                    family.members.add(self.request.user)
                except Family.DoesNotExist:
                    pass
            else:
                # Remove from current families
                for family in Family.objects.filter(members=self.request.user):
                    family.members.remove(self.request.user)
        
        return Response(serializer.data)

class ContributionListCreateView(generics.ListCreateAPIView):
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contribution.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        contribution = serializer.save(user=self.request.user)
        self.update_budget_and_income(contribution)

    def update_budget_and_income(self, contribution):
        user = contribution.user
        amount = contribution.amount

        # Update monthly budget
        budget, created = Budget.objects.get_or_create(
            user=user,
            name=f"Contribution to {contribution.goal.name}",
            defaults={'amount': amount, 'category': 'Contribution'}
        )
        if not created:
            budget.amount += amount
            budget.save()

        # Subtract from monthly income in user profile
        try:
            profile = UserProfile.objects.get(user=user)
            if profile.monthly_income >= amount:
                profile.monthly_income -= amount
                profile.save()
        except UserProfile.DoesNotExist:
            pass

class ContributionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contribution.objects.filter(user=self.request.user)

class StreakViewSet(viewsets.ModelViewSet):
    serializer_class = StreakSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Streak.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_streak(self, request, pk=None):
        """
        Custom endpoint to update a user's streak according to business logic
        """
        streak = self.get_object()
        
        try:
            # Use the update_streak method from the model
            streak.update_streak()
            serializer = self.get_serializer(streak)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to update streak: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CurrentUserFamilyView(generics.RetrieveAPIView):
    serializer_class = FamilySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        user = self.request.user
        try:
            # First try to get family through UserProfile
            profile = UserProfile.objects.filter(user=user).first()
            if profile and profile.family:
                return profile.family
                
            # Fallback to direct membership
            family = Family.objects.filter(members=user).first()
            if not family:
                return None
            return family
        except Exception as e:
            logger.error(f"Error retrieving user family: {e}")
            return None
        
class FamilyFinancesView(APIView):
    """
    View to get the complete financial data for a family (income, expenses, savings)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the user's profile to find their family
            try:
                profile = UserProfile.objects.get(user=request.user)
                family = profile.family
            except UserProfile.DoesNotExist:
                return Response(
                    {"error": "User profile not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not family:
                return Response(
                    {"error": "User is not part of a family"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the current month and year
            now = timezone.now()
            current_month = now.month
            current_year = now.year
            
            # Get all profiles for family members
            family_profiles = UserProfile.objects.filter(family=family)
            
            # Calculate total family income (sum of all members' monthly incomes)
            total_income = family_profiles.aggregate(
                total=Sum('monthly_income')
            )['total'] or 0
            
            # Get all user IDs in the family
            family_user_ids = family_profiles.values_list('user_id', flat=True)
            
            # Calculate total family expenses for the current month
            total_expenses = Expense.objects.filter(
                user_id__in=family_user_ids,
                date__year=current_year,
                date__month=current_month
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Calculate savings (income - expenses)
            savings = total_income - total_expenses
            if savings < 0:
                savings = 0
            
            # Get family details
            family_data = {
                "id": family.id,
                "name": family.name,
                "member_count": family_profiles.count()
            }
            
            return Response({
                "family": family_data,
                "finances": {
                    "total_income": total_income,
                    "total_expenses": total_expenses,
                    "total_savings": savings,
                    "month": current_month,
                    "year": current_year
                }
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FamilyIncomeView(APIView):
    """
    View to get the total income for a family (sum of all members' monthly incomes)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the user's profile to find their family
            try:
                profile = UserProfile.objects.get(user=request.user)
                family = profile.family
            except UserProfile.DoesNotExist:
                return Response(
                    {"error": "User profile not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not family:
                return Response(
                    {"error": "User is not part of a family"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all profiles for family members
            family_profiles = UserProfile.objects.filter(family=family)
            
            # Calculate total family income
            total_income = family_profiles.aggregate(
                total=Sum('monthly_income')
            )['total'] or 0
            
            return Response({
                "family_id": family.id,
                "family_name": family.name,
                "total_income": total_income
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FamilyExpensesView(APIView):
    """
    View to get the total expenses for a family (sum of all members' expenses for the current month)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the user's profile to find their family
            try:
                profile = UserProfile.objects.get(user=request.user)
                family = profile.family
            except UserProfile.DoesNotExist:
                return Response(
                    {"error": "User profile not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not family:
                return Response(
                    {"error": "User is not part of a family"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the current month and year
            now = timezone.now()
            current_month = now.month
            current_year = now.year
            
            # Get all user IDs in the family
            family_user_ids = UserProfile.objects.filter(
                family=family
            ).values_list('user_id', flat=True)
            
            # Calculate total family expenses for the current month
            total_expenses = Expense.objects.filter(
                user_id__in=family_user_ids,
                date__year=current_year,
                date__month=current_month
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            return Response({
                "family_id": family.id,
                "family_name": family.name,
                "total_expenses": total_expenses,
                "month": current_month,
                "year": current_year
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

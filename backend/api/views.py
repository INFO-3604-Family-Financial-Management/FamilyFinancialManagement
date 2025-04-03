import logging

from django.utils import timezone
from django.shortcuts import render
from django.contrib.auth.models import User 
from rest_framework import generics, status, permissions, viewsets
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer, ExpenseSerializer, FamilySerializer, BudgetSerializer, GoalSerializer, IncomeSerializer
from .serializers import *
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Expense, Family, Budget
from .models import *

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
    queryset = Family.objects.all()
    serializer_class = FamilySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class FamilyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Family.objects.all()
    serializer_class = FamilySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        logging.info(f"Filtering families for user: {user.username}")
        return Family.objects.filter(members=user)

    def perform_destroy(self, instance):
        instance.members.remove(self.request.user)
        if instance.members.count() == 0:
            instance.delete()
        else:
            instance.save()

class FamilyMemberListView(generics.ListAPIView):
    serializer_class = FamilySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.request.user.id
        family_id = Family.objects.filter(members=user_id).first()
        if(not family_id):    
            return User.objects.none()
        return Family.objects.filter(members = user_id)

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
        remaining_budget = monthly_budget - monthly_expenses

        return Response({
            'monthly_expenses': monthly_expenses,
            'monthly_budget': monthly_budget,
            'remaining_budget': remaining_budget
        })
    
class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Goal.objects.filter(user=user) | Goal.objects.filter(family__members=user)

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
        return Goal.objects.filter(user=user) | Goal.objects.filter(family__members=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Goal.objects.filter(user=user) | Goal.objects.filter(family__members=user)

    def update(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                # Lock the goal row for update
                goal = Goal.objects.select_for_update().get(pk=kwargs['pk'], user=request.user)
                
                # Update goal logic
                amount_saved = request.data.get('amount_saved', None)
                if amount_saved is not None:
                    goal.amount_saved += float(amount_saved)
                    if goal.amount_saved > goal.target_amount:
                        return Response(
                            {"error": "Amount saved exceeds the target amount."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Save the updated goal
                goal.save()
                serializer = self.get_serializer(goal)
                return Response(serializer.data, status=status.HTTP_200_OK)
        except Goal.DoesNotExist:
            return Response({"error": "Goal not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating goal: {str(e)}")
            return Response({"error": "An error occurred while updating the goal."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class IncomeListCreateView(generics.ListCreateAPIView):
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MonthlyBudgetStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        monthly_expenses = Expense.get_monthly_expenses(user)
        monthly_budget = Budget.get_monthly_budget(user)
        monthly_income = Income.get_monthly_income(user)
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

        #update monthly budget
        budget, created = Budget.objects.get_or_create(
            user=user,
            name=f"Contribution to {contribution.goal.name}",
            defaults={'amount': amount, 'category': 'Contribution'}
        )
        if not created:
            budget.amount += amount
            budget.save()

        #subtract from monthly income
        income = Income.objects.filter(user=user).first()
        if income:
            income.amount -= amount
            income.save()
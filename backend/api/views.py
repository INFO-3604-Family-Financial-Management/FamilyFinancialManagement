import logging

from django.shortcuts import render
from django.contrib.auth.models import User 
from rest_framework import generics, status, permissions
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
        serializer.save(user=self.request.user)

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
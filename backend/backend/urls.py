from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Create routers
router = DefaultRouter()
router.register(r'goals', GoalViewSet, basename='goal')
streak_router = DefaultRouter()
streak_router.register(r'streaks', StreakViewSet, basename='streak')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Authentication endpoints
    path("api/register/", CreateUserView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api-auth/", include("rest_framework.urls")),
    
    # Expense endpoints
    path('api/expenses/', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('api/expenses/recent/', RecentExpensesView.as_view(), name='recent-expenses'),
    path('api/expenses/<int:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
    path('api/transactions', RecentExpensesView.as_view(), name='view-transactions'),
    
    # Family endpoints
    path('api/families/', FamilyListCreateView.as_view(), name='family-list-create'),
    path('api/families/<int:pk>/', FamilyDetailView.as_view(), name='family-detail'),
    path('api/family/', FamilyMemberListView.as_view(), name='family-member-list'),
    path('api/families/<int:pk>/members/', FamilyMemberManageView.as_view(), name='family-member-manage'),
    
    # Budget endpoints
    path('api/budgets/', BudgetListCreateView.as_view(), name='budget-list-create'),
    path('api/budgets/<int:pk>/', BudgetDetailView.as_view(), name='budget-detail'),
    path('api/monthly-budget-status/', MonthlyBudgetStatusView.as_view(), name='monthly-budget-status'),
    
    # Goal endpoints
    path('api/goals/', GoalListCreateView.as_view(), name='goal-list-create'),
    path('api/goals/<int:pk>/', GoalDetailView.as_view(), name='goal-detail'),
    
    # Income endpoints
    path('api/income/', IncomeListCreateView.as_view(), name='income-list-create'),
    path('api/income/<int:pk>/', IncomeDetailView.as_view(), name='income-detail'),
    
    # Contribution endpoints
    path('api/contributions/', ContributionListCreateView.as_view(), name='contribution-list-create'),
    path('api/contributions/<int:pk>/', ContributionDetailView.as_view(), name='contribution-detail'),
    
    # Include router URLs
    path('api/', include(router.urls)),
    path('api/', include(streak_router.urls)),
]
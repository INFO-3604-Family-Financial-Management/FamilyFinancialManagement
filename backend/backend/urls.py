from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    CreateUserView, ExpenseListCreateView, RecentExpensesView, ExpenseDetailView,
    UserProfileView, UserInfoView, FamilyViewSet, BudgetViewSet, GoalViewSet,
    ContributionViewSet, StreakViewSet
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Set up the router for the ViewSets
router = DefaultRouter()
router.register(r'api/families', FamilyViewSet, basename='family')
router.register(r'api/budgets', BudgetViewSet, basename='budget')
router.register(r'api/goals', GoalViewSet, basename='goal')
router.register(r'api/contributions', ContributionViewSet, basename='contribution')
router.register(r'api/streaks', StreakViewSet, basename='streak')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Authentication endpoints
    path("api/register/", CreateUserView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api-auth/", include("rest_framework.urls")),
    
    # User profile endpoints
    path("api/profile/", UserProfileView.as_view(), name="user-profile"),
    path("api/user-info/", UserInfoView.as_view(), name="user-info"),
    
    # Expense endpoints
    path('api/expenses/', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('api/expenses/recent/', RecentExpensesView.as_view(), name='recent-expenses'),
    path('api/expenses/<int:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
    path('api/transactions', RecentExpensesView.as_view(), name='view-transactions'),
    
    # Include router URLs
] + router.urls
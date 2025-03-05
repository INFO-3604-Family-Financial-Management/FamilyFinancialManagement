
from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView, ExpenseListCreateView, RecentExpensesView, ExpenseDetailView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/register/", CreateUserView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api-auth/", include("rest_framework.urls")),
    path('expenses/', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('expenses/recent/', RecentExpensesView.as_view(), name='recent-expenses'),
    path('expenses/<int:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
]

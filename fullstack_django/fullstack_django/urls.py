from django.contrib import admin
from django.urls import path, re_path, include
from backend_api.views import (
    RegisterView,
    LoginView,
    CalculationView,
    CalculationTypesView,
    UserCalculationsView,
    UserMaterialDeleteView,
    UserMaterialsView
)
from backend_api.views import ReactAppView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from backend_api.views import BudgetView, BudgetDetailView, BudgetCalculationView

urlpatterns = [
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', UserCalculationsView.as_view(), name='user-profile'),
    path('api/calculations/', CalculationView.as_view(), name='calculations'),
    path('api/calculation-types/', CalculationTypesView.as_view(), name='calculation-types'),
    path('api/user/calculations/', UserCalculationsView.as_view(), name='user-calculations'),
    path('api/user/materials/', UserMaterialsView.as_view(), name='user-materials'),
    path('api/user/materials/<int:id>/', UserMaterialDeleteView.as_view(), name='user-material-delete'),
    path('api/user/budgets/', BudgetView.as_view(), name='budget-list'),
    path('api/user/budgets/<int:pk>/', BudgetDetailView.as_view(), name='budget-detail'),
    path('api/user/budgets/<int:budget_id>/calculations/', BudgetCalculationView.as_view(), name='budget-calculations'),
    path('api/user/budgets/<int:budget_id>/calculations/<int:budget_item_id>/', BudgetCalculationView.as_view(), name='budget-calculation-detail'),
    path('api/user/budgets/<int:budget_id>/calculations/<int:budget_item_id>/', BudgetCalculationView.as_view(), name='budget-calculation-detail'),
    re_path(r'^.*$', ReactAppView.as_view()),
]
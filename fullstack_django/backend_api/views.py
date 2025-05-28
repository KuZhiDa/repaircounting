from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password
from .serializer import RegisterSerializer
from rest_framework.permissions import IsAuthenticated
from .models import User, Calculation
from .calculators import *
import json
import logging
from rest_framework.generics import ListCreateAPIView, DestroyAPIView
from .models import UserMaterial

from rest_framework.generics import RetrieveUpdateDestroyAPIView
from django.shortcuts import get_object_or_404
from .models import Calculation
from .serializer import UserMaterialSerializer
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Budget, BudgetItem, Calculation
from .serializer import BudgetSerializer, BudgetItemSerializer
from django.views.generic import TemplateView
import os
from django.conf import settings

logger = logging.getLogger(__name__)

class UserMaterialsView(ListCreateAPIView):
    serializer_class = UserMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserMaterial.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserMaterialDeleteView(DestroyAPIView):
    serializer_class = UserMaterialSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return self.request.user.materials.all()

class RegisterView(APIView):
    def post(self, request):
        try:
            logger.debug(f"Registration attempt with data: {request.data}")
            serializer = RegisterSerializer(data=request.data)
            
            if not serializer.is_valid():
                logger.error(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            user = serializer.save()
            logger.info(f"User created successfully: {user.email}")
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.exception("Registration failed")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class LoginView(APIView):
    def post(self, request):
        try:
            logger.debug(f"Login attempt with data: {request.body}")
            data = json.loads(request.body)
            user = authenticate(
                email=data.get('email'),  # Используем email как username
                password=data.get('password')
            )
            
            if not user:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
                'email': user.email
            })
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CalculationTypesView(APIView):
    def get(self, request):
        logger.debug(f"Registration attempt with data: {get_calculation_types()}")
        try:
            return Response(get_calculation_types())
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CalculationView(APIView):
    CALCULATORS = {
        'repair': {
            'paint': calculate_paint,
            'tiles': calculate_tiles,
            'wallpaper': calculate_wallpaper,
            'laminate': calculate_laminate,
            'plaster': calculate_plaster
        },
        'construction': {
            'foundation': calculate_foundation,
            'bricks': calculate_bricks,
            'roofing': calculate_roofing,
            'insulation': calculate_insulation
        }
    }

    def post(self, request):
        try:
            if not request.user.is_authenticated:
                return Response({'error': 'Auth required'}, status=401)
            
            logger.debug(f"Calculation request data: {request.data}")
            
            data = request.data
            category = data.get('category')
            calc_type = data.get('type')
            params = data.get('params', {})

            if not category:
                return Response({'error': 'Category is required'}, status=400)
            if not calc_type:
                return Response({'error': 'Calculation type is required'}, status=400)

            if category not in self.CALCULATORS:
                return Response({'error': f'Invalid category: {category}'}, status=400)
            
            if calc_type not in self.CALCULATORS[category]:
                return Response({'error': f'Invalid calculation type for category {category}: {calc_type}'}, status=400)
            
            # Проверяем обязательные параметры
            required_fields = get_calculation_types()[category]['calculations'][calc_type]['fields']
            missing_fields = [field['name'] for field in required_fields if field['name'] not in params]
            
            if missing_fields:
                return Response({'error': f'Missing required fields: {missing_fields}'}, status=400)
            
            result = self.CALCULATORS[category][calc_type](params)
            
            calculation = Calculation.objects.create(
                user=request.user,
                category=category,
                calculation_type=calc_type,
                input_data=params,
                result_data=result
            )
            
            logger.info(f"Calculation saved: {calculation.id}")
            
            return Response({
                'id': calculation.id,
                'category': category,
                'type': calc_type,
                'result': calculation.result_data,
                'created_at': calculation.created_at
            }, status=201)
        
        except KeyError as e:
            logger.error(f"Key error in calculation: {str(e)}")
            return Response({'error': f'Missing parameter: {str(e)}'}, status=400)
        except Exception as e:
            logger.exception("Calculation error")
            return Response({'error': str(e)}, status=400)
        
class UserCalculationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        calculations = request.user.calculations.order_by('-created_at')
        return Response([{
            'id': calc.id,
            'category': calc.category,
            'type': calc.calculation_type,
            'created_at': calc.created_at,
            'result': calc.result_data,
            'input_data': calc.input_data
        } for calc in calculations])
    
    
class BudgetView(ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.budgets.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BudgetDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'  # Явно указываем поле для поиска

    def get_queryset(self):
        return self.request.user.budgets.all()

    def perform_destroy(self, instance):
        # Удаляем все связанные элементы сметы перед удалением самой сметы
        instance.budget_items.all().delete()
        instance.delete()

class BudgetCalculationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, budget_id):
        budget = get_object_or_404(Budget, id=budget_id, user=request.user)
        calculation_id = request.data.get('calculation_id')
        calculation = get_object_or_404(Calculation, id=calculation_id, user=request.user)
        
        budget_item, created = BudgetItem.objects.get_or_create(
            budget=budget,
            calculation=calculation,
            defaults={
                'planned_cost': request.data.get('planned_cost'),
                'actual_cost': request.data.get('actual_cost'),
                'notes': request.data.get('notes', '')
            }
        )
        
        if not created:
            budget_item.planned_cost = request.data.get('planned_cost', budget_item.planned_cost)
            budget_item.actual_cost = request.data.get('actual_cost', budget_item.actual_cost)
            budget_item.notes = request.data.get('notes', budget_item.notes)
            budget_item.save()
        
        return Response(BudgetItemSerializer(budget_item).data, status=200)

    def delete(self, request, budget_id, budget_item_id):
        budget = get_object_or_404(Budget, id=budget_id, user=request.user)
        
        try:
            budget_item = BudgetItem.objects.get(
                id=budget_item_id,
                budget=budget
            )
            budget_item.delete()
            return Response({'status': 'calculation removed from budget'}, status=200)
        except BudgetItem.DoesNotExist:
            return Response({'error': 'Budget item not found'}, status=404)

class ReactAppView(TemplateView):
    def get_template_names(self):
        return [os.path.join(settings.BASE_DIR, 'build', 'index.html')]
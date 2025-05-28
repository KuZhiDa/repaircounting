from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserMaterial  # Добавлен импорт
from .models import Budget  # Добавляем в импорты
from rest_framework import serializers
from .models import Budget, BudgetItem, Calculation
from django.db.models import Sum


User = get_user_model()

class UserMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserMaterial
        fields = ['id', 'name', 'quantity', 'unit', 'created_at']
        read_only_fields = ['id', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists"})
            
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    

class BudgetItemSerializer(serializers.ModelSerializer):
    calculation_details = serializers.SerializerMethodField()
    
    class Meta:
        model = BudgetItem
        fields = ['id', 'calculation', 'calculation_details', 'planned_cost', 'actual_cost', 'notes']
        read_only_fields = ['id', 'calculation_details']
    
    def get_calculation_details(self, obj):
        return {
            'id': obj.calculation.id,
            'type': obj.calculation.calculation_type,
            'category': obj.calculation.category,
            'created_at': obj.calculation.created_at,
            'result_data': obj.calculation.result_data
        }

class BudgetSerializer(serializers.ModelSerializer):
    items = BudgetItemSerializer(source='budget_items', many=True, read_only=True)
    total_planned = serializers.SerializerMethodField()
    total_actual = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = ['id', 'title', 'description', 'items', 'total_planned', 'total_actual', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'items', 'total_planned', 'total_actual']
    
    def get_total_planned(self, obj):
        return obj.budget_items.aggregate(total=Sum('planned_cost'))['total'] or 0
    
    def get_total_actual(self, obj):
        return obj.budget_items.aggregate(total=Sum('actual_cost'))['total'] or 0
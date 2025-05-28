from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Sum

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    # Убираем username из обязательных полей
    username = None
    email = models.EmailField(unique=True, verbose_name='Email')
    # Делаем email уникальным и основным полем для аутентификации
    email = models.EmailField(
        _('email address'),
        unique=True,
        error_messages={
            'unique': _('Пользователь с таким email уже существует.'),
        }
    )

    # Настраиваем поля модели
    USERNAME_FIELD = 'email'  # Используем email для входа
    REQUIRED_FIELDS = []  # Убираем username из обязательных полей
    objects = UserManager()
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        db_table = 'users'  # Меняем название таблицы

    def __str__(self):
        return self.email

class Calculation(models.Model):
    CATEGORY_CHOICES = [
        ('repair', 'Ремонт'),
        ('construction', 'Строительство')
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='calculations',
        verbose_name='Пользователь'
    )
    category = models.CharField(
        'Категория',
        max_length=20,
        choices=CATEGORY_CHOICES
    )
    calculation_type = models.CharField(
        'Тип расчета',
        max_length=100
    )
    input_data = models.JSONField(
        'Входные данные',
        default=dict
    )
    result_data = models.JSONField(
        'Результаты расчета',
        default=dict
    )
    created_at = models.DateTimeField(
        'Дата создания',
        auto_now_add=True
    )

    class Meta:
        verbose_name = 'Расчет'
        verbose_name_plural = 'Расчеты'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.calculation_type}'

class UserMaterial(models.Model):
    UNIT_CHOICES = [
        ('кг', 'Килограммы'),
        ('м', 'Метры'),
        ('м²', 'Квадратные метры'),
        ('м³', 'Кубические метры'),
        ('шт', 'Штуки'),
        ('рулон', 'Рулоны'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='materials'
    )
    name = models.CharField('Название', max_length=100)
    quantity = models.FloatField('Количество')
    unit = models.CharField('Единица измерения', max_length=10, choices=UNIT_CHOICES)
    created_at = models.DateTimeField('Дата добавления', auto_now_add=True)

    class Meta:
        verbose_name = 'Материал пользователя'
        verbose_name_plural = 'Материалы пользователей'
        ordering = ['-created_at']

        # Добавляем в models.py после класса UserMaterial

# Добавляем после класса Calculation
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Sum

User = get_user_model()

class Budget(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    title = models.CharField('Название сметы', max_length=100)
    description = models.TextField('Описание', blank=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    class Meta:
        verbose_name = 'Смета'
        verbose_name_plural = 'Сметы'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} - {self.user.email}'

    @property
    def total_planned(self):
        return self.budget_items.aggregate(total=Sum('planned_cost'))['total'] or 0
    
    @property
    def total_actual(self):
        return self.budget_items.aggregate(total=Sum('actual_cost'))['total'] or 0

class BudgetItem(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='budget_items')
    calculation = models.ForeignKey('Calculation', on_delete=models.SET_NULL, null=True, blank=True)
    planned_cost = models.DecimalField('Плановая стоимость', max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField('Фактическая стоимость', max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField('Примечания', blank=True)
    
    class Meta:
        unique_together = ('budget', 'calculation')

    def __str__(self):
        calc_type = self.calculation.calculation_type if self.calculation else 'No calculation'
        return f'{self.budget.title} - {calc_type}'
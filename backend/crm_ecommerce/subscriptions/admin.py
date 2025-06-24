from django.contrib import admin
from .models import Plan, Subscription

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'plan_type', 'price', 'duration_months', 'is_active')
    list_filter = ('plan_type', 'is_active', 'has_crm', 'has_ecommerce')
    search_fields = ('name', 'description')
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'description', 'price', 'plan_type', 'duration_months', 'is_active')
        }),
        ('Límites', {
            'fields': ('max_products', 'max_users', 'max_storage')
        }),
        ('Características', {
            'fields': ('has_crm', 'has_ecommerce', 'has_analytics', 'has_api_access')
        }),
    )

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'plan', 'status', 'start_date', 'end_date', 'is_active')
    list_filter = ('status', 'plan__plan_type')
    search_fields = ('tenant__name', 'plan__name')
    readonly_fields = ('products_count', 'users_count', 'storage_used')
    fieldsets = (
        ('Información de Suscripción', {
            'fields': ('tenant', 'plan', 'status', 'start_date', 'end_date', 'trial_end_date')
        }),
        ('Métricas de Uso', {
            'fields': ('products_count', 'users_count', 'storage_used')
        }),
        ('Información de Pago', {
            'fields': ('payment_method', 'last_payment_date', 'next_payment_date')
        }),
    ) 
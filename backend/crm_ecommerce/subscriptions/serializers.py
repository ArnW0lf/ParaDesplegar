from rest_framework import serializers
from .models import Plan, Subscription

class PlanSerializer(serializers.ModelSerializer):
    price_per_month = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'description', 'price', 'plan_type',
            'duration_months', 'max_products', 'max_users',
            'max_storage', 'has_crm', 'has_ecommerce',
            'has_analytics', 'has_api_access', 'is_active',
            'price_per_month'
        ]

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = PlanSerializer(source='plan', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_trial = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'tenant', 'plan', 'plan_details', 'status',
            'start_date', 'end_date', 'trial_end_date',
            'products_count', 'users_count', 'storage_used',
            'payment_method', 'last_payment_date', 'next_payment_date',
            'is_active', 'is_trial'
        ]
        read_only_fields = [
            'tenant', 'products_count', 'users_count',
            'storage_used', 'last_payment_date', 'next_payment_date'
        ] 
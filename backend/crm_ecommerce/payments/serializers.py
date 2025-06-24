from rest_framework import serializers
from .models import PaymentMethod, PaymentTransaction

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'name', 'payment_type', 'is_active', 'status', 'credentials',
            'instructions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        payment_type = data.get('payment_type')
        credentials = data.get('credentials', {})

        if payment_type == 'paypal':
            if not credentials.get('client_id') or not credentials.get('client_secret'):
                raise serializers.ValidationError('PayPal requiere client_id y client_secret')
        elif payment_type == 'stripe':
            if not credentials.get('public_key') or not credentials.get('secret_key'):
                raise serializers.ValidationError('Stripe requiere public_key y secret_key')

        # Validar que el nombre no esté vacío
        if 'name' in data and not data['name'].strip():
            raise serializers.ValidationError({'name': 'El nombre no puede estar vacío'})
        return data

class PaymentTransactionSerializer(serializers.ModelSerializer):
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'payment_method', 'payment_method_name', 'amount',
            'currency', 'status', 'transaction_id', 'payment_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'transaction_id'] 
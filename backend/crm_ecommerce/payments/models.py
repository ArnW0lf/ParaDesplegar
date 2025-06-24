from django.db import models
from tienda.models import Tienda
from tenants.models import Tenant

class PaymentMethod(models.Model):
    PAYMENT_TYPES = [
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('credit_card', 'Tarjeta de Crédito'),
        ('debit_card', 'Tarjeta de Débito'),
        ('bank_transfer', 'Transferencia Bancaria'),
        ('cash', 'Efectivo'),
        ('crypto', 'Criptomonedas'),
    ]

    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('pending', 'Pendiente'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payment_methods')
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE, related_name='payment_methods')
    name = models.CharField(max_length=100)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    credentials = models.JSONField(null=True, blank=True, default=dict)  # Para almacenar credenciales de forma segura
    instructions = models.TextField(blank=True, help_text="Instrucciones para el cliente sobre cómo realizar el pago")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['tenant', 'tienda', 'payment_type']

    def __str__(self):
        return f"{self.name} - {self.get_payment_type_display()}"

    def clean(self):
        # Validar credenciales según el tipo de pago
        if self.payment_type == 'paypal':
            required_fields = ['client_id', 'client_secret']
            if not all(field in self.credentials for field in required_fields):
                raise models.ValidationError('PayPal requiere client_id y client_secret')
        elif self.payment_type == 'stripe':
            required_fields = ['public_key', 'secret_key']
            if not all(field in self.credentials for field in required_fields):
                raise models.ValidationError('Stripe requiere public_key y secret_key')

class PaymentTransaction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
        ('refunded', 'Reembolsado'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payment_transactions')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='BOB')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, unique=True)
    payment_details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transacción {self.transaction_id} - {self.amount} {self.currency}" 
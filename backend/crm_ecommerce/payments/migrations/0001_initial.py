# Generated by Django 5.2 on 2025-06-21 19:35

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('tenants', '0001_initial'),
        ('tienda', '0002_alter_pedido_cliente_tienda_publica'),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentMethod',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('payment_type', models.CharField(choices=[('paypal', 'PayPal'), ('stripe', 'Stripe'), ('credit_card', 'Tarjeta de Crédito'), ('debit_card', 'Tarjeta de Débito'), ('bank_transfer', 'Transferencia Bancaria'), ('cash', 'Efectivo'), ('crypto', 'Criptomonedas')], max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('status', models.CharField(choices=[('active', 'Activo'), ('inactive', 'Inactivo'), ('pending', 'Pendiente')], default='pending', max_length=10)),
                ('credentials', models.JSONField(blank=True, default=dict, null=True)),
                ('instructions', models.TextField(blank=True, help_text='Instrucciones para el cliente sobre cómo realizar el pago')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_methods', to='tenants.tenant')),
                ('tienda', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_methods', to='tienda.tienda')),
            ],
            options={
                'unique_together': {('tenant', 'tienda', 'payment_type')},
            },
        ),
        migrations.CreateModel(
            name='PaymentTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='BOB', max_length=3)),
                ('status', models.CharField(choices=[('pending', 'Pendiente'), ('completed', 'Completado'), ('failed', 'Fallido'), ('refunded', 'Reembolsado')], default='pending', max_length=10)),
                ('transaction_id', models.CharField(max_length=100, unique=True)),
                ('payment_details', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('payment_method', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='payments.paymentmethod')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_transactions', to='tenants.tenant')),
            ],
        ),
    ]

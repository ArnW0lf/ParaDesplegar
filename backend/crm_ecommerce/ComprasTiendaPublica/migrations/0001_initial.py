# Generated by Django 5.2 on 2025-06-21 19:34

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('UsersTiendaPublica', '0002_initial'),
        ('tienda', '0002_alter_pedido_cliente_tienda_publica'),
    ]

    operations = [
        migrations.CreateModel(
            name='PedidoPublico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo_seguimiento', models.CharField(blank=True, max_length=100, null=True)),
                ('nombre', models.CharField(max_length=100)),
                ('apellido', models.CharField(max_length=100)),
                ('ci', models.CharField(max_length=20)),
                ('ciudad', models.CharField(max_length=50)),
                ('provincia', models.CharField(max_length=50)),
                ('direccion', models.TextField()),
                ('referencia', models.TextField(blank=True)),
                ('telefono', models.CharField(max_length=20)),
                ('correo', models.EmailField(max_length=254)),
                ('notas', models.TextField(blank=True)),
                ('metodo_pago', models.CharField(max_length=50)),
                ('total', models.DecimalField(decimal_places=2, max_digits=10)),
                ('fecha', models.DateTimeField(auto_now_add=True)),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('confirmado', 'Confirmado'), ('en_proceso', 'En Proceso'), ('enviado', 'Enviado'), ('entregado', 'Entregado'), ('cancelado', 'Cancelado')], default='pendiente', max_length=20)),
                ('tienda', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pedidos_publicos', to='tienda.tienda')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pedidos', to='UsersTiendaPublica.userstiendapublica')),
            ],
        ),
        migrations.CreateModel(
            name='DetallePedidoPublico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre_producto', models.CharField(max_length=100)),
                ('cantidad', models.PositiveIntegerField()),
                ('precio_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=10)),
                ('pedido', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles', to='ComprasTiendaPublica.pedidopublico')),
            ],
        ),
    ]

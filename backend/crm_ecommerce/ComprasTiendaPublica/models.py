from django.db import models
from UsersTiendaPublica.models import UsersTiendaPublica
from tienda.models import Tienda

class PedidoPublico(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('en_proceso', 'En Proceso'),
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]

    codigo_seguimiento = models.CharField(max_length=100, blank=True, null=True)  # nuevo campo
    usuario = models.ForeignKey(UsersTiendaPublica, on_delete=models.CASCADE, related_name='pedidos')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    ci = models.CharField(max_length=20)
    ciudad = models.CharField(max_length=50)
    provincia = models.CharField(max_length=50)
    direccion = models.TextField()
    referencia = models.TextField(blank=True)
    telefono = models.CharField(max_length=20)
    correo = models.EmailField()
    notas = models.TextField(blank=True)
    metodo_pago = models.CharField(max_length=50)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE, related_name='pedidos_publicos')
    def __str__(self):
        return f"Pedido de {self.nombre} {self.apellido} ({self.fecha.date()})"

class DetallePedidoPublico(models.Model):
    pedido = models.ForeignKey(PedidoPublico, on_delete=models.CASCADE, related_name='detalles')
    nombre_producto = models.CharField(max_length=100)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.nombre_producto} x {self.cantidad}"

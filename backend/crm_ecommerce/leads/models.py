from django.db import models
from django.contrib.auth import get_user_model
from tenants.models import Tenant

User = get_user_model()

class Lead(models.Model):
    ESTADOS = [
        ('nuevo', 'Nuevo'),
        ('contactado', 'Contactado'),
        ('calificado', 'Calificado'),
        ('propuesta', 'Propuesta'),
        ('negociacion', 'Negociación'),
        ('ganado', 'Ganado'),
        ('perdido', 'Perdido'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    nombre = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='nuevo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)
    notas = models.TextField(blank=True, null=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    tienda = models.ForeignKey('tienda.Tienda', on_delete=models.SET_NULL, null=True, blank=True)
    valor_estimado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    probabilidad = models.IntegerField(default=0)  # 0-100%
    fuente = models.CharField(max_length=50, choices=[
        ('ecommerce', 'Tienda Online'),
        ('manual', 'Lead Manual'),
        ('otro', 'Otro')
    ], default='ecommerce')
    
    # Métricas de seguimiento
    total_compras = models.IntegerField(default=0)
    valor_total_compras = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ultima_compra = models.DateTimeField(null=True, blank=True)
    frecuencia_compra = models.IntegerField(default=0)  # días entre compras

    class Meta:
        ordering = ['-fecha_creacion']
        unique_together = ('usuario', 'email')

    def __str__(self):
        return f"{self.nombre} - {self.estado}"

class InteraccionLead(models.Model):
    TIPOS = [
        ('llamada', 'Llamada'),
        ('email', 'Email'),
        ('reunion', 'Reunión'),
        ('compra', 'Compra'),
        ('otro', 'Otro'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='interacciones')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    descripcion = models.TextField()
    valor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.lead.nombre} - {self.tipo} - {self.fecha}" 
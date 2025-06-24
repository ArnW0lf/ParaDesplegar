# tienda/models.py
from django.db import models
from users.models import CustomUser
from tenants.models import Tenant
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify
import os
from django.core.exceptions import ValidationError

def get_default_logo():
    return 'logos/default_logo.png'

class Tienda(models.Model):
    THEME_CHOICES = [
        ('default', 'Default'),
        ('modern', 'Moderno'),
        ('minimal', 'Minimalista'),
        ('corporate', 'Corporativo'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tiendas', null=True, blank=True)
    usuario = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True, default=get_default_logo)
    descripcion = models.TextField(blank=True)
    tema = models.CharField(max_length=20, choices=THEME_CHOICES, default='default')
    publicado = models.BooleanField(default=False)
    color_primario = models.CharField(max_length=7, default='#3B82F6')  # Color en formato HEX
    color_secundario = models.CharField(max_length=7, default='#1E40AF')
    color_texto = models.CharField(max_length=7, default='#1F2937')
    color_fondo = models.CharField(max_length=7, default='#F3F4F6')
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    class Meta:
        unique_together = ['tenant', 'slug']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.usuario.username
        if not self.tenant and hasattr(self.usuario, 'tenant'):
            self.tenant = self.usuario.tenant
        if not self.logo:
            self.logo = get_default_logo()
        super().save(*args, **kwargs)

    def __str__(self):
        tenant_name = self.tenant.name if self.tenant else "Sin tenant"
        return f"Tienda de {self.usuario.username} en {tenant_name}"

@receiver(post_save, sender=CustomUser)
def crear_tienda_por_defecto(sender, instance, created, **kwargs):
    if created and instance.role == 'vendedor' and instance.tenant:
        # Crear una tienda por defecto para el vendedor
        Tienda.objects.create(
            tenant=instance.tenant,
            usuario=instance,
            nombre=f"Tienda de {instance.username}",
            descripcion="Bienvenido a mi tienda",
            slug=slugify(instance.username)
        )

class Categoria(models.Model):
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE, related_name='categorias')
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    imagen = models.ImageField(upload_to='categorias/', null=True, blank=True)

    def __str__(self):
        return self.nombre

class ProductoManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(eliminado=False)

class Producto(models.Model):
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE, related_name='productos')
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    eliminado = models.BooleanField(default=False)
    
    objects = ProductoManager()  # Filtra automáticamente los productos no eliminados
    all_objects = models.Manager()  # Para acceder a todos los productos, incluyendo eliminados

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return self.nombre
        
    def delete(self, *args, **kwargs):
        """
        Sobrescribes el método delete para realizar una eliminación lógica.
        """
        self.eliminado = True
        self.save()

class CarritoItem(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

class Notificacion(models.Model):
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.CharField(max_length=255)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notificación: {self.mensaje[:30]}..."

class Pedido(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('en_proceso', 'En Proceso'),
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]

    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta de Crédito/Débito'),
        ('transferencia', 'Transferencia Bancaria'),
    ]

    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE, related_name='pedidos')
    cliente = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='pedidos', null=True, blank=True)
    cliente_tienda_publica = models.ForeignKey('UsersTiendaPublica.UsersTiendaPublica', on_delete=models.CASCADE, related_name='pedidos_tienda', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    direccion_entrega = models.TextField()
    telefono = models.CharField(max_length=20)
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    notas = models.TextField(blank=True)
    codigo_seguimiento = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        if self.cliente:
            return f"Pedido #{self.id} - {self.cliente.username}"
        return f"Pedido #{self.id} - {self.cliente_tienda_publica.email}"

    def clean(self):
        if not self.cliente and not self.cliente_tienda_publica:
            raise ValidationError('Debe especificar un cliente (CustomUser o UsersTiendaPublica)')
        if self.cliente and self.cliente_tienda_publica:
            raise ValidationError('No puede especificar ambos tipos de cliente')

class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True, blank=True)
    nombre_producto = models.CharField(max_length=200, blank=True, null=True)  # Store product name for historical reference
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

    def save(self, *args, **kwargs):
        # Save product name when first creating the record
        if self.producto and not self.nombre_producto:
            self.nombre_producto = self.producto.nombre
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        product_name = self.nombre_producto or (self.producto.nombre if self.producto else 'Producto Eliminado')
        return f"{self.cantidad}x {product_name}"

class NotificacionPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"Notificación para Pedido #{self.pedido.id}"

from django.db import models
from django.utils.translation import gettext_lazy as _
from tienda.models import Tienda

class StoreStyle(models.Model):
    VISTA_CHOICES = [
        ('grid', _('Cuadrícula')),
        ('list', _('Lista')),
        ('detallada', _('Detallada')),
        ('masonry', _('Masonry')),
    ]

    TEMA_CHOICES = [
        ('claro', _('Claro')),
        ('oscuro', _('Oscuro')),
    ]

    PLANTILLA_CHOICES = [
        ('clasico', _('Clásico')),
        ('urbano', _('Urbano')),
        ('corporativo', _('Corporativo')),
    ]

    tienda = models.OneToOneField(Tienda, on_delete=models.CASCADE, related_name='style')
    color_primario = models.CharField(_('Color Primario'), max_length=20, default="#3498db")
    color_secundario = models.CharField(_('Color Secundario'), max_length=20, default="#2ecc71")
    color_texto = models.CharField(_('Color de Texto'), max_length=20, default="#333333")
    color_fondo = models.CharField(_('Color de Fondo'), max_length=20, default="#ffffff")
    tipo_fuente = models.CharField(_('Tipo de Fuente'), max_length=100, default="Arial")
    tema = models.CharField(_('Tema'), max_length=10, choices=TEMA_CHOICES, default='claro')
    vista_producto = models.CharField(_('Vista de Producto'), max_length=10, choices=VISTA_CHOICES, default='grid')

   
    tema_plantilla = models.CharField(_('Tema de Plantilla'), max_length=20, choices=PLANTILLA_CHOICES, default='clasico')
    

    def __str__(self):
        return f"Estilo de {self.tienda.nombre}"


class BloqueBienvenida(models.Model):
    TIPO_CHOICES = [
        ('apilado', 'Apilado'),
        ('en_linea', 'En Línea'),
    ]

    style = models.ForeignKey(StoreStyle, on_delete=models.CASCADE, related_name='bloques')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    imagen = models.ImageField(upload_to='bloques/', blank=True, null=True)

    def __str__(self):
        return self.titulo or f"Bloque ({self.tipo})"

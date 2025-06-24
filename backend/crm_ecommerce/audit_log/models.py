from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('login', 'Inicio de sesión'),
        ('logout', 'Cierre de sesión'),
        ('create', 'Creación'),
        ('update', 'Actualización'),
        ('delete', 'Eliminación'),
        ('view', 'Consulta'),
        ('export', 'Exportación'),
        ('import', 'Importación'),
        ('other', 'Otro')
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='audit_logs',
        verbose_name=_('Tenant')
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # Campos para relacionar con cualquier modelo
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True
    )
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Campos adicionales para almacenar datos específicos
    metadata = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Registro de Auditoría'
        verbose_name_plural = 'Registros de Auditoría'
        indexes = [
            models.Index(fields=['user', 'action', 'created_at']),
            models.Index(fields=['tenant', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} - {self.created_at}" 
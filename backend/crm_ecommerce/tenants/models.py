from django.db import models
from django.utils.translation import gettext_lazy as _

class Tenant(models.Model):
    name = models.CharField(_('Nombre'), max_length=100)
    schema_name = models.CharField(_('Nombre del Schema'), max_length=63, unique=True)
    domain = models.CharField(_('Dominio'), max_length=100, unique=True)
    is_active = models.BooleanField(_('Activo'), default=True)
    created_at = models.DateTimeField(_('Fecha de creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de actualización'), auto_now=True)

    class Meta:
        verbose_name = _('Tenant')
        verbose_name_plural = _('Tenants')
        db_table = 'tenants_tenant'  # Especificamos el nombre de la tabla

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Asegurarse de que el schema_name esté en minúsculas
        self.schema_name = self.schema_name.lower()
        super().save(*args, **kwargs)


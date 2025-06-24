from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from tenants.models import Tenant

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('vendedor', 'Vendedor'),
        ('stock', 'Encargado de Stock'),
        ('crm', 'CRM Manager'),
        ('marketing', 'Marketing'),
        ('cliente', 'Cliente'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cliente')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='users')

    # Nuevos campos:
    email = models.EmailField()
    company_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True)
    company_size = models.CharField(max_length=50, blank=True, null=True)
    interest = models.CharField(max_length=255, blank=True, null=True)

    # Nuevos campos para el perfil
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    preferred_language = models.CharField(max_length=10, default='es', help_text=_('Código de idioma preferido (ej: es, en)'))
    bio = models.TextField(max_length=500, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Campo para almacenar el ID de cliente de Stripe
    stripe_customer_id = models.CharField(max_length=100, blank=True, null=True, 
                                       help_text=_('ID de cliente en Stripe para pagos recurrentes'))

    def __str__(self):
        return f"{self.username} ({self.role})"

    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        unique_together = ('email', 'tenant')

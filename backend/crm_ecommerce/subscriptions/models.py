from django.db import models
from django.utils.translation import gettext_lazy as _
from tenants.models import Tenant
from django.utils import timezone

class Plan(models.Model):
    PLAN_TYPES = (
        ('mensual', 'Mensual'),
        ('anual', 'Anual'),
    )

    name = models.CharField(_('Nombre del Plan'), max_length=100)
    description = models.TextField(_('Descripción'))
    price = models.DecimalField(_('Precio'), max_digits=10, decimal_places=2)
    plan_type = models.CharField(_('Tipo de Plan'), max_length=20, choices=PLAN_TYPES)
    duration_months = models.IntegerField(_('Duración en Meses'))
    
    # Límites del plan
    max_products = models.IntegerField(_('Máximo de Productos'), default=100)
    max_users = models.IntegerField(_('Máximo de Usuarios'), default=5)
    max_storage = models.IntegerField(_('Almacenamiento en GB'), default=5)
    
    # Características
    has_crm = models.BooleanField(_('Incluye CRM'), default=True)
    has_ecommerce = models.BooleanField(_('Incluye Ecommerce'), default=True)
    has_analytics = models.BooleanField(_('Incluye Analytics'), default=False)
    has_api_access = models.BooleanField(_('Acceso a API'), default=False)
    
    is_active = models.BooleanField(_('Activo'), default=True)
    created_at = models.DateTimeField(_('Fecha de creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de actualización'), auto_now=True)

    class Meta:
        verbose_name = _('Plan')
        verbose_name_plural = _('Planes')

    def __str__(self):
        return f"{self.name} ({self.get_plan_type_display()})"

    @property
    def price_per_month(self):
        if self.plan_type == 'anual':
            return self.price / 12
        return self.price

class Subscription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Activa'),
        ('cancelled', 'Cancelada'),
        ('expired', 'Expirada'),
        ('trial', 'Prueba'),
    )

    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='trial')
    
    start_date = models.DateTimeField(_('Fecha de inicio'))
    end_date = models.DateTimeField(_('Fecha de fin'))
    trial_end_date = models.DateTimeField(_('Fin del período de prueba'), null=True, blank=True)
    
    # Métricas de uso
    products_count = models.IntegerField(_('Número de productos'), default=0)
    users_count = models.IntegerField(_('Número de usuarios'), default=0)
    storage_used = models.DecimalField(_('Almacenamiento usado (GB)'), max_digits=10, decimal_places=2, default=0)
    
    # Información de pago
    payment_method = models.CharField(_('Método de pago'), max_length=50, blank=True)
    last_payment_date = models.DateTimeField(_('Último pago'), null=True, blank=True)
    next_payment_date = models.DateTimeField(_('Próximo pago'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('Fecha de creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de actualización'), auto_now=True)

    class Meta:
        verbose_name = _('Suscripción')
        verbose_name_plural = _('Suscripciones')

    def __str__(self):
        return f"{self.tenant.name} - {self.plan.name}"

    @property
    def is_active(self):
        return self.status == 'active' and self.end_date > timezone.now()

    @property
    def is_trial(self):
        return self.status == 'trial' and self.trial_end_date > timezone.now()

    def can_add_product(self):
        return self.products_count < self.plan.max_products

    def can_add_user(self):
        return self.users_count < self.plan.max_users

    def can_use_storage(self, size_gb):
        return (self.storage_used + size_gb) <= self.plan.max_storage 
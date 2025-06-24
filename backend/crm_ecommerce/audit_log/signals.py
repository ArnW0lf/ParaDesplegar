from django.db.models.signals import post_save
from django.dispatch import receiver
from tenants.models import Tenant
from .secure_audit_service import secure_audit_logger

@receiver(post_save, sender=Tenant)
def setup_tenant_logger(sender, instance, created, **kwargs):
    """
    Configura el logger para un nuevo tenant cuando se crea.
    """
    if created and hasattr(secure_audit_logger, '_add_tenant_handler'):
        secure_audit_logger._add_tenant_handler(instance.id)

from django.apps import AppConfig
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class AuditLogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit_log'
    verbose_name = 'Auditoría del Sistema'
    
    def ready(self):
        # Solo registrar señales si no estamos en una migración
        from django.db import connection
        from django.db.utils import OperationalError
        
        try:
            # Verificar si las tablas necesarias existen
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM django_migrations WHERE app = 'audit_log'")
                exists = cursor.fetchone()
                
            if exists:
                from . import signals  # noqa
                logger.info("Señales de auditoría registradas correctamente")
                
                # Configurar loggers para tenants existentes
                # Solo configurar loggers si no estamos en modo test
                if not getattr(settings, 'TESTING', False):
                    self._setup_tenant_loggers()
                    
        except Exception as e:
            logger.warning(f"No se pudieron registrar las señales de auditoría: {str(e)}")
    
    def _setup_tenant_loggers(self):
        """Configura los loggers para los tenants existentes"""
        try:
            from .secure_audit_service import secure_audit_logger
            from tenants.models import Tenant
            
            for tenant in Tenant.objects.all().only('id'):
                secure_audit_logger._add_tenant_handler(tenant.id)
                
        except Exception as e:
            logger.error(f"Error configurando loggers de tenant: {str(e)}")

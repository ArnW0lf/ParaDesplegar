import os
from django.conf import settings

# Configuración de directorios de logs
AUDIT_LOG_DIR = getattr(settings, 'AUDIT_LOG_DIR', os.path.join(settings.BASE_DIR, 'logs/audit'))

# Configuración de rotación de logs
MAX_LOG_SIZE = getattr(settings, 'AUDIT_MAX_LOG_SIZE', 10 * 1024 * 1024)  # 10MB
BACKUP_COUNT = getattr(settings, 'AUDIT_BACKUP_COUNT', 5)

# Niveles de log
LOG_LEVEL = getattr(settings, 'AUDIT_LOG_LEVEL', 'INFO')

# Configuración de firmas
SIGNING_KEY = getattr(settings, 'AUDIT_SIGNING_KEY', settings.SECRET_KEY)
SIGNING_SALT = getattr(settings, 'AUDIT_SIGNING_SALT', 'audit.log.salt')

# Configuración de la base de datos
ENABLE_DB_LOGGING = getattr(settings, 'AUDIT_ENABLE_DB_LOGGING', True)

# Configuración de retención
RETENTION_DAYS = getattr(settings, 'AUDIT_RETENTION_DAYS', 365)  # 1 año por defecto

# Configuración de notificaciones
ENABLE_EMAIL_NOTIFICATIONS = getattr(settings, 'AUDIT_ENABLE_EMAIL_NOTIFICATIONS', False)
ADMIN_EMAIL = getattr(settings, 'AUDIT_ADMIN_EMAIL', 'admin@example.com')

# Configuración de compresión
ENABLE_LOG_COMPRESSION = getattr(settings, 'AUDIT_ENABLE_LOG_COMPRESSION', True)
COMPRESSION_LEVEL = getattr(settings, 'AUDIT_COMPRESSION_LEVEL', 6)  # Nivel de compresión (1-9)

# Configuración de auditoría de seguridad
ENABLE_INTEGRITY_CHECKS = getattr(settings, 'AUDIT_ENABLE_INTEGRITY_CHECKS', True)
CHECKSUM_ALGORITHM = getattr(settings, 'AUDIT_CHECKSUM_ALGORITHM', 'sha256')

# Configuración de exportación
ENABLE_EXPORT = getattr(settings, 'AUDIT_ENABLE_EXPORT', True)
EXPORT_FORMATS = getattr(settings, 'AUDIT_EXPORT_FORMATS', ['json', 'csv'])

# Configuración de privacidad
MASK_SENSITIVE_DATA = getattr(settings, 'AUDIT_MASK_SENSITIVE_DATA', True)
SENSITIVE_FIELDS = getattr(settings, 'AUDIT_SENSITIVE_FIELDS', [
    'password', 'token', 'api_key', 'secret', 'authorization'
])

import os
import json
import hashlib
import logging
from pathlib import Path
from django.conf import settings
from django.core.signing import Signer
from .models import AuditLog
from django.contrib.contenttypes.models import ContentType
from datetime import datetime

# Configuración de logging
AUDIT_LOG_DIR = getattr(settings, 'AUDIT_LOG_DIR', '/var/log/audit_logs')
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'
SECRET_KEY = getattr(settings, 'SECRET_KEY', 'your-secret-key')

# Asegurarse de que el directorio de logs exista
os.makedirs(AUDIT_LOG_DIR, exist_ok=True, mode=0o750)

class SecureAuditLogger:
    """
    Servicio seguro de auditoría que escribe en archivos de solo anexado
    y mantiene un hash de verificación.
    """
    _instance = None
    _signer = Signer(sep='::')
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SecureAuditLogger, cls).__new__(cls)
            cls._instance._setup_logger()
        return cls._instance
    
    def _setup_logger(self):
        """Configura el logger seguro"""
        # Crear directorio principal de logs si no existe
        os.makedirs(AUDIT_LOG_DIR, exist_ok=True, mode=0o750)
        
        # Configurar logger principal
        self.logger = logging.getLogger('secure_audit')
        self.logger.setLevel(logging.INFO)
        
        # Formato que incluirá el hash de verificación
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        
        # Manejador para el archivo de auditoría global
        global_log_path = os.path.join(AUDIT_LOG_DIR, 'audit_global.log')
        global_handler = logging.FileHandler(global_log_path, mode='a', encoding='utf-8')
        global_handler.setFormatter(formatter)
        self.logger.addHandler(global_handler)
        
        # Diccionario para almacenar los manejadores por tenant
        self.tenant_handlers = {}
        
        # Configurar logger para cada tenant existente
        try:
            from django.apps import apps
            if apps.is_installed('tenants'):
                from tenants.models import Tenant
                for tenant in Tenant.objects.all():
                    self._add_tenant_handler(tenant.id)
        except Exception as e:
            self.logger.error(f"Error configurando loggers de tenant: {str(e)}")
    
    def _add_tenant_handler(self, tenant_id):
        """Agrega un manejador de logs para un tenant específico"""
        if tenant_id in self.tenant_handlers:
            return
            
        try:
            # Crear directorio del tenant si no existe
            tenant_dir = os.path.join(AUDIT_LOG_DIR, 'tenants')
            os.makedirs(tenant_dir, exist_ok=True, mode=0o750)
            
            # Configurar el manejador específico para este tenant
            log_file = os.path.join(tenant_dir, f'tenant_{tenant_id}.log')
            handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
            handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
            
            # Crear un logger específico para este tenant
            logger = logging.getLogger(f'secure_audit.tenant_{tenant_id}')
            logger.setLevel(logging.INFO)
            logger.propagate = False  # Evitar que los logs se propaguen al logger raíz
            logger.addHandler(handler)
            
            # Almacenar el manejador para referencia futura
            self.tenant_handlers[tenant_id] = {
                'handler': handler,
                'logger': logger,
                'file': log_file
            }
            
        except Exception as e:
            logging.error(f"Error al configurar logger para tenant {tenant_id}: {str(e)}")
    
    def _get_tenant_log_path(self, tenant_id):
        """Obtiene la ruta del archivo de log para un tenant específico"""
        return os.path.join(self.tenant_log_dir, f'tenant_{tenant_id}.log')
    
    def _sign_data(self, data):
        """Firma los datos para verificación posterior"""
        if isinstance(data, dict):
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)
        return self._signer.sign(data_str)
    
    def log_action(self, user, tenant, action, description, **kwargs):
        """
        Registra una acción de auditoría de forma segura.
        
        Args:
            user: Usuario que realiza la acción
            tenant: Tenant relacionado
            action: Tipo de acción (login, create, update, etc.)
            description: Descripción detallada de la acción
            **kwargs: Datos adicionales a registrar
        """
        try:
            # Crear el objeto de auditoría en la base de datos
            audit_data = {
                'user_id': str(user.id) if user else None,
                'user_username': str(user.username) if user else 'system',
                'tenant_id': str(tenant.id) if tenant else None,
                'tenant_name': str(tenant.name) if tenant else 'system',
                'action': action,
                'description': description,
                'timestamp': datetime.utcnow().isoformat(),
                'ip_address': kwargs.get('ip_address'),
                'user_agent': kwargs.get('user_agent'),
                'metadata': kwargs.get('metadata', {})
            }
            
            # Registrar en el archivo de log global
            log_entry = json.dumps(audit_data, ensure_ascii=False)
            signed_entry = self._sign_data(log_entry)
            self.logger.info(signed_entry)
            
            # Registrar en el archivo específico del tenant si existe
            if tenant:
                tenant_log_path = self._get_tenant_log_path(tenant.id)
                with open(tenant_log_path, 'a', encoding='utf-8') as f:
                    f.write(signed_entry + '\n')
            
            # También guardar en la base de datos para consultas rápidas
            # (opcional, dependiendo de tus requisitos de rendimiento)
            if kwargs.get('save_to_db', True):
                content_object = kwargs.get('content_object')
                content_type = ContentType.objects.get_for_model(content_object) if content_object else None
                object_id = content_object.id if content_object else None
                
                AuditLog.objects.create(
                    user=user,
                    tenant=tenant,
                    action=action,
                    description=description,
                    ip_address=kwargs.get('ip_address'),
                    user_agent=kwargs.get('user_agent'),
                    content_type=content_type,
                    object_id=object_id,
                    metadata=kwargs.get('metadata', {})
                )
            
            return True
        except Exception as e:
            self.logger.error(f"Error al registrar acción de auditoría: {str(e)}")
            return False
    
    def verify_log_integrity(self, log_file_path):
        """
        Verifica la integridad de un archivo de log.
        Devuelve (es_válido, entradas_inválidas)
        """
        invalid_entries = []
        
        try:
            with open(log_file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                        
                    try:
                        # Verificar la firma
                        self._signer.unsign(line)
                    except Exception as e:
                        invalid_entries.append({
                            'line': line_num,
                            'error': str(e),
                            'content': line[:100] + '...' if len(line) > 100 else line
                        })
            
            return len(invalid_entries) == 0, invalid_entries
        except Exception as e:
            return False, [{'error': f'Error al leer el archivo: {str(e)}'}]

# Instancia global para usar en toda la aplicación
secure_audit_logger = SecureAuditLogger()

from django.core.management.base import BaseCommand
import logging
import os
import glob
from django.conf import settings

class Command(BaseCommand):
    help = 'Verifica la configuración de los logs de auditoría'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=int,
            help='ID del tenant específico a verificar',
            default=None
        )

    def handle(self, *args, **options):
        self.stdout.write("=== Verificación de Logs de Auditoría ===\n")
        
        # Verificar directorio de logs
        audit_dir = getattr(settings, 'AUDIT_LOG_DIR', os.path.join(settings.BASE_DIR, 'logs/audit'))
        self.stdout.write(f"Directorio de auditoría: {audit_dir}")
        
        if not os.path.exists(audit_dir):
            self.stdout.write(self.style.WARNING("✗ Directorio de auditoría no existe"))
            if self.style.NOTICE == self.style.ERROR:  # Si no hay soporte para colores
                self.stdout.write("  Ejecute 'python manage.py migrate' para crearlo")
            else:
                self.stdout.write(self.style.NOTICE("  Ejecute 'python manage.py migrate' para crearlo"))
            return
            
        self.stdout.write(self.style.SUCCESS("✓ Directorio de auditoría existe"))
        
        # Verificar archivo global
        global_log = os.path.join(audit_dir, 'audit_global.log')
        self.stdout.write(f"\nLog global: {global_log}")
        if os.path.exists(global_log):
            size = os.path.getsize(global_log) / (1024 * 1024)  # Tamaño en MB
            self.stdout.write(self.style.SUCCESS(f"  ✓ Existe (Tamaño: {size:.2f} MB)"))
            
            # Mostrar las últimas líneas del log global
            try:
                with open(global_log, 'r', encoding='utf-8') as f:
                    lines = f.readlines()[-5:]  # Últimas 5 líneas
                    if lines:
                        self.stdout.write("\n  Últimas entradas:")
                        for line in lines:
                            self.stdout.write(f"  - {line.strip()}")
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  No se pudo leer el archivo de log: {str(e)}"))
        else:
            self.stdout.write(self.style.WARNING("  ✗ No existe"))
        
        # Verificar directorio de tenants
        tenants_dir = os.path.join(audit_dir, 'tenants')
        self.stdout.write(f"\nDirectorio de tenants: {tenants_dir}")
        
        if not os.path.exists(tenants_dir):
            self.stdout.write(self.style.WARNING("  ✗ No existe"))
            if self.style.NOTICE == self.style.ERROR:  # Si no hay soporte para colores
                self.stdout.write("  Se creará automáticamente cuando se registre el primer log de un tenant")
            else:
                self.stdout.write(self.style.NOTICE("  Se creará automáticamente cuando se registre el primer log de un tenant"))
        else:
            tenant_logs = glob.glob(os.path.join(tenants_dir, 'tenant_*.log'))
            self.stdout.write(self.style.SUCCESS(f"  ✓ Existe con {len(tenant_logs)} archivos de tenant"))
            
            # Mostrar información de logs de tenants
            if tenant_logs:
                self.stdout.write("\nResumen de logs por tenant:")
                tenant_logs.sort(key=os.path.getmtime, reverse=True)  # Ordenar por fecha de modificación
                
                # Mostrar solo los 5 más recientes por defecto
                for log_path in tenant_logs[:5]:
                    self._show_tenant_log_info(log_path)
                
                if len(tenant_logs) > 5:
                    self.stdout.write(f"  ... y {len(tenant_logs) - 5} más")
                    
                    # Mostrar logs de un tenant específico si se solicita
                    tenant_id = options.get('tenant_id')
                    if tenant_id:
                        specific_log = os.path.join(tenants_dir, f'tenant_{tenant_id}.log')
                        if os.path.exists(specific_log):
                            self.stdout.write(f"\nMostrando información para tenant {tenant_id}:")
                            self._show_tenant_log_info(specific_log, show_content=True)
                        else:
                            self.stdout.write(self.style.WARNING(f"\nNo se encontró el log para el tenant {tenant_id}"))
        
        # Verificar configuración de logging
        self.stdout.write("\n=== Configuración de Logging ===")
        log_level = getattr(settings, 'AUDIT_LOG_LEVEL', 'INFO')
        self.stdout.write(f"Nivel de log: {log_level}")
        
        # Verificar si el logger está configurado correctamente
        audit_logger = logging.getLogger('audit')
        if audit_logger.handlers:
            self.stdout.write(self.style.SUCCESS("✓ Logger 'audit' configurado correctamente"))
        else:
            self.stdout.write(self.style.WARNING("✗ Logger 'audit' no tiene manejadores configurados"))
        
        # Verificar si hay al menos un logger de tenant configurado
        tenant_logger = logging.getLogger('audit.tenant')
        has_tenant_loggers = any(
            name.startswith('audit.tenant_') 
            for name in logging.root.manager.loggerDict 
            if name.startswith('audit.tenant_')
        )
        
        if has_tenant_loggers:
            tenant_count = len([
                name for name in logging.root.manager.loggerDict 
                if name.startswith('audit.tenant_')
            ])
            self.stdout.write(self.style.SUCCESS(f"✓ {tenant_count} loggers de tenant configurados"))
        else:
            self.stdout.write(self.style.WARNING("✗ No hay loggers de tenant configurados"))
            self.stdout.write(self.style.NOTICE("  Los loggers de tenant se crearán automáticamente cuando se registre el primer log"))
        
        self.stdout.write("\n=== Verificación completada ===")
        self.stdout.write("\nUso avanzado:")
        self.stdout.write("  Para ver detalles de un tenant específico: python manage.py check_audit_logs --tenant-id <id>")
        self.stdout.write("  Para ver logs en tiempo real: tail -f logs/audit/tenants/tenant_<id>.log")
    
    def _show_tenant_log_info(self, log_path, show_content=False):
        """Muestra información sobre un archivo de log de tenant"""
        try:
            size = os.path.getsize(log_path) / (1024 * 1024)  # Tamaño en MB
            mtime = os.path.getmtime(log_path)
            from datetime import datetime
            mtime_str = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
            
            tenant_id = os.path.basename(log_path).replace('tenant_', '').replace('.log', '')
            
            self.stdout.write(f"\n  Tenant {tenant_id}:")
            self.stdout.write(f"    - Archivo: {os.path.basename(log_path)}")
            self.stdout.write(f"    - Tamaño: {size:.2f} MB")
            self.stdout.write(f"    - Última modificación: {mtime_str}")
            
            if show_content:
                try:
                    with open(log_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()[-5:]  # Últimas 5 líneas
                        if lines:
                            self.stdout.write("    Últimas entradas:")
                            for line in lines:
                                self.stdout.write(f"    - {line.strip()}")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"    No se pudo leer el archivo: {str(e)}"))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  Error al obtener información del archivo {log_path}: {str(e)}"))

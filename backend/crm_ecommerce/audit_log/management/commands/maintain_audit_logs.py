import os
import gzip
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone

class Command(BaseCommand):
    help = 'Mantiene los logs de auditoría: rotación, compresión y limpieza'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra lo que se haría sin realizar cambios reales',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        self.stdout.write(self.style.SUCCESS('Iniciando mantenimiento de logs de auditoría...'))
        
        # Comprimir logs antiguos
        self.compress_old_logs(dry_run)
        
        # Eliminar logs muy antiguos
        self.cleanup_old_logs(dry_run)
        
        # Verificar integridad de logs
        self.verify_logs_integrity(dry_run)
        
        self.stdout.write(self.style.SUCCESS('Mantenimiento completado'))
    
    def compress_old_logs(self, dry_run=False):
        """Comprime los archivos de log que no están siendo escritos actualmente"""
        self.stdout.write('\nComprimiendo logs antiguos...')
        
        # Buscar archivos .log que no sean el actual
        for log_file in Path(settings.AUDIT_LOG_DIR).rglob('*.log'):
            # No comprimir el archivo de log actual
            if log_file.name == 'audit_global.log':
                continue
                
            # Si ya está comprimido, saltar
            if log_file.suffix == '.gz':
                continue
                
            # Comprimir el archivo
            compressed_file = f"{log_file}.gz"
            
            self.stdout.write(f"  Comprimiendo {log_file}...")
            
            if not dry_run:
                try:
                    with open(log_file, 'rb') as f_in:
                        with gzip.open(compressed_file, 'wb') as f_out:
                            shutil.copyfileobj(f_in, f_out)
                    
                    # Verificar que el archivo comprimido sea válido
                    with gzip.open(compressed_file, 'rb') as f_test:
                        f_test.read()
                    
                    # Eliminar el archivo original si la compresión fue exitosa
                    os.remove(log_file)
                    self.stdout.write(self.style.SUCCESS(f"    ✓ Comprimido: {compressed_file}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"    ✗ Error al comprimir {log_file}: {str(e)}"))
                    if os.path.exists(compressed_file):
                        os.remove(compressed_file)
    
    def cleanup_old_logs(self, dry_run=False):
        """Elimina logs más antiguos que el período de retención"""
        self.stdout.write('\nLimpiando logs antiguos...')
        retention_days = getattr(settings, 'AUDIT_RETENTION_DAYS', 365)
        cutoff_date = timezone.now() - timedelta(days=retention_days)
        
        for log_file in Path(settings.AUDIT_LOG_DIR).rglob('*'):
            # Obtener la fecha de modificación del archivo
            mtime = datetime.fromtimestamp(log_file.stat().st_mtime, tz=timezone.utc)
            
            if mtime < cutoff_date:
                self.stdout.write(f"  Eliminando {log_file} (última modificación: {mtime.date()})")
                if not dry_run:
                    try:
                        if log_file.is_file():
                            log_file.unlink()
                        elif log_file.is_dir() and not any(log_file.iterdir()):
                            log_file.rmdir()
                        self.stdout.write(self.style.SUCCESS(f"    ✓ Eliminado: {log_file}"))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"    ✗ Error al eliminar {log_file}: {str(e)}"))
    
    def verify_logs_integrity(self, dry_run=False):
        """Verifica la integridad de los logs"""
        if not getattr(settings, 'AUDIT_ENABLE_INTEGRITY_CHECKS', True):
            return
            
        self.stdout.write('\nVerificando integridad de los logs...')
        
        from django.core.signing import Signer
        signer = Signer(
            key=getattr(settings, 'AUDIT_SIGNING_KEY', settings.SECRET_KEY),
            salt=getattr(settings, 'AUDIT_SIGNING_SALT', 'audit.log.salt'),
            sep='::'
        )
        
        for log_file in Path(settings.AUDIT_LOG_DIR).rglob('*.log*'):
            self.stdout.write(f"  Verificando {log_file}...")
            
            try:
                if log_file.suffix == '.gz':
                    import gzip
                    with gzip.open(log_file, 'rt', encoding='utf-8') as f:
                        lines = f.readlines()
                else:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                
                invalid_lines = 0
                for i, line in enumerate(lines, 1):
                    line = line.strip()
                    if not line:
                        continue
                        
                    try:
                        # Verificar la firma
                        signer.unsign(line)
                    except Exception as e:
                        invalid_lines += 1
                        self.stdout.write(self.style.WARNING(
                            f"    Línea {i} inválida: {str(e)[:100]}..."
                        ))
                
                if invalid_lines == 0:
                    self.stdout.write(self.style.SUCCESS(f"    ✓ {len(lines)} líneas verificadas sin errores"))
                else:
                    self.stdout.write(self.style.ERROR(
                        f"    ✗ {invalid_lines}/{len(lines)} líneas inválidas encontradas"
                    ))
                        
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"    ✗ Error al verificar {log_file}: {str(e)}"))

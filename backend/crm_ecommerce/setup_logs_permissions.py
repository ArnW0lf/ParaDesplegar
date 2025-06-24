#!/usr/bin/env python3
"""
Script para configurar los permisos de los directorios de logs.
Debe ejecutarse con privilegios de administrador.
"""
import os
import sys
import stat
from pathlib import Path

def setup_permissions():
    # Obtener la ruta base del proyecto
    base_dir = Path(__file__).parent.absolute()
    logs_dir = base_dir / 'logs'
    audit_logs_dir = logs_dir / 'audit'
    
    try:
        # Crear directorios si no existen
        logs_dir.mkdir(mode=0o750, exist_ok=True)
        audit_logs_dir.mkdir(mode=0o750, exist_ok=True)
        
        # Obtener el usuario y grupo que ejecuta el script
        import pwd
        import grp
        
        # Usuario y grupo actuales
        uid = os.getuid()
        gid = os.getgid()
        
        # Cambiar propietario de los directorios
        os.chown(logs_dir, uid, gid)
        os.chown(audit_logs_dir, uid, gid)
        
        # Configurar permisos
        os.chmod(logs_dir, 0o750)
        os.chmod(audit_logs_dir, 0o750)
        
        # Configurar permisos para los archivos existentes
        for root, dirs, files in os.walk(logs_dir):
            for d in dirs:
                os.chmod(os.path.join(root, d), 0o750)
            for f in files:
                os.chmod(os.path.join(root, f), 0o640)
        
        print("Permisos configurados correctamente.")
        return 0
    except Exception as e:
        print(f"Error al configurar permisos: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    if os.name != 'posix':
        print("Este script solo es compatible con sistemas operativos tipo Unix.")
        sys.exit(1)
        
    if os.geteuid() != 0:
        print("Este script debe ejecutarse como administrador (root).")
        sys.exit(1)
        
    sys.exit(setup_permissions())

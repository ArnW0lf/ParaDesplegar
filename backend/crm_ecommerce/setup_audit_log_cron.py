#!/usr/bin/env python3
"""
Script para configurar una tarea programada (cron) para el mantenimiento de logs de auditoría.
"""
import os
import sys
import getpass
from pathlib import Path

def setup_cron_job():
    # Obtener la ruta base del proyecto
    base_dir = Path(__file__).parent.absolute()
    manage_py = base_dir / 'manage.py'
    
    # Comando a ejecutar
    python_path = sys.executable
    command = f'cd {base_dir} && {python_path} {manage_py} maintain_audit_logs'
    
    # Configuración del cron job (ejecutar diariamente a la 1 AM)
    cron_time = '0 1 * * *'
    cron_job = f"{cron_time} {command} > /dev/null 2>&1\n"
    
    # Obtener el usuario actual
    username = getpass.getuser()
    
    # Agregar el trabajo cron al crontab del usuario
    try:
        from crontab import CronTab
        
        cron = CronTab(user=username)
        
        # Verificar si el trabajo ya existe
        job_exists = any(cron.find_command('maintain_audit_logs'))
        
        if not job_exists:
            job = cron.new(command=command, comment='Mantenimiento diario de logs de auditoría')
            job.setall(cron_time)
            cron.write()
            print("Tarea programada configurada correctamente.")
        else:
            print("La tarea programada ya existe.")
            
        return 0
    except ImportError:
        print("Instalando dependencia python-crontab...")
        os.system(f"{python_path} -m pip install python-crontab")
        
        try:
            from crontab import CronTab
            return setup_cron_job()
        except Exception as e:
            print(f"No se pudo configurar la tarea programada automáticamente: {e}")
            print(f"Por favor, agregue manualmente la siguiente línea al crontab:")
            print(f"{cron_job}")
            return 1
    except Exception as e:
        print(f"Error al configurar la tarea programada: {e}")
        print(f"Por favor, agregue manualmente la siguiente línea al crontab:")
        print(f"{cron_job}")
        return 1

if __name__ == "__main__":
    if os.name != 'posix':
        print("Este script solo es compatible con sistemas operativos tipo Unix.")
        sys.exit(1)
        
    sys.exit(setup_cron_job())

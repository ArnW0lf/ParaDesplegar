from django.db import connection
from django.conf import settings
from .models import Tenant
from threading import local

_thread_locals = local()

def create_schema(schema_name):
    """Crea un nuevo schema en la base de datos."""
    with connection.cursor() as cursor:
        cursor.execute(f'CREATE SCHEMA IF NOT EXISTS {schema_name}')

def delete_schema(schema_name):
    """Elimina un schema de la base de datos."""
    with connection.cursor() as cursor:
        cursor.execute(f'DROP SCHEMA IF EXISTS {schema_name} CASCADE')

def set_schema(schema_name):
    """Establece el schema actual para la conexión."""
    with connection.cursor() as cursor:
        cursor.execute(f'SET search_path TO {schema_name}, public')

def get_schema_name():
    """Obtiene el nombre del schema actual."""
    with connection.cursor() as cursor:
        cursor.execute('SHOW search_path')
        return cursor.fetchone()[0]

def set_current_tenant(tenant):
    """Establece el tenant actual en el thread local."""
    _thread_locals.tenant = tenant

def get_current_tenant():
    """Obtiene el tenant actual del thread local."""
    return getattr(_thread_locals, 'tenant', None) 
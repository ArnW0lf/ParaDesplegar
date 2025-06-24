from django.core.management.base import BaseCommand
from tenants.models import Tenant
from tenants.utils import create_schema

class Command(BaseCommand):
    help = 'Crea el tenant inicial del sistema'

    def handle(self, *args, **options):
        try:
            # Crear el schema público si no existe
            create_schema('public')
            
            # Crear el tenant principal
            tenant = Tenant.objects.create(
                name='Tenant Principal',
                schema_name='public',
                domain='localhost',
                is_active=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Tenant inicial creado exitosamente: {tenant.name}')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error al crear el tenant inicial: {str(e)}')
            ) 
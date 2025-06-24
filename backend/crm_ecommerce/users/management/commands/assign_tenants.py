from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tenants.models import Tenant
from tenants.utils import create_schema
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Asigna tenants a usuarios que no tienen uno asignado'

    def handle(self, *args, **options):
        users_without_tenant = User.objects.filter(tenant__isnull=True)
        self.stdout.write(f'Encontrados {users_without_tenant.count()} usuarios sin tenant')

        for user in users_without_tenant:
            try:
                # Generar un identificador único para el tenant
                unique_id = str(uuid.uuid4())[:8]
                company_name = user.company_name or user.username
                
                # Crear nombres únicos para el schema y dominio
                schema_name = f"{company_name.lower().replace(' ', '_')}_{unique_id}"
                domain = f"{schema_name}.localhost"
                
                # Crear el schema para el tenant
                create_schema(schema_name)
                
                # Crear el tenant
                tenant = Tenant.objects.create(
                    name=company_name,
                    schema_name=schema_name,
                    domain=domain,
                    is_active=True
                )
                
                # Asignar el tenant al usuario
                user.tenant = tenant
                user.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Tenant asignado exitosamente a {user.username}'
                    )
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error al asignar tenant a {user.username}: {str(e)}'
                    )
                ) 
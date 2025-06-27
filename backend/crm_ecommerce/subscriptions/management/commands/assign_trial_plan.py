from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import connection
from tenants.models import Tenant
from subscriptions.models import Plan, Subscription
from tenants.utils import set_schema

import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Asigna un plan de prueba a los tenants que no tengan suscripción'

    def add_arguments(self, parser):
        parser.add_argument(
            '--plan-id',
            type=int,
            help='ID del plan a asignar como prueba',
        )
        parser.add_argument(
            '--all-tenants',
            action='store_true',
            help='Forzar la actualización de todos los tenants, incluso los que ya tienen suscripción',
        )

    def handle(self, *args, **options):
        plan_id = options.get('plan_id')
        all_tenants = options.get('all_tenants')
        
        # Asegurarse de que estamos en el esquema público para crear/obtener el plan
        set_schema('public')
        
        # Obtener o crear un plan de prueba si no se especifica
        if plan_id:
            try:
                plan = Plan.objects.get(id=plan_id, is_active=True)
                self.stdout.write(self.style.SUCCESS(f'Usando plan existente: {plan.name} (ID: {plan.id})'))
            except Plan.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'No se encontró un plan activo con ID {plan_id}'))
                return
        else:
            # Intentar encontrar un plan de prueba existente
            trial_plans = Plan.objects.filter(
                name__icontains='prueba',
                is_active=True
            )
            
            if trial_plans.exists():
                plan = trial_plans.first()
                self.stdout.write(self.style.SUCCESS(f'Usando plan de prueba existente: {plan.name} (ID: {plan.id})'))
            else:
                # Crear un plan de prueba por defecto si no existe
                plan = Plan.objects.create(
                    name='Plan de Prueba',
                    description='Plan de prueba gratuito por 30 días',
                    price=0,
                    plan_type='mensual',
                    duration_months=1,
                    max_products=50,
                    max_users=2,
                    max_storage=5,
                    has_crm=True,
                    has_ecommerce=True,
                    has_analytics=False,
                    has_api_access=False,
                    is_active=True
                )
                self.stdout.write(self.style.SUCCESS(f'Creado nuevo plan de prueba: {plan.name} (ID: {plan.id})'))
        
        # Obtener todos los tenants
        tenants = Tenant.objects.all()
        self.stdout.write(f'Procesando {tenants.count()} tenants...')
        
        updated_count = 0
        created_count = 0
        
        for tenant in tenants:
            try:
                # Cambiar al esquema del tenant
                self.stdout.write(f'Procesando tenant: {tenant.name} (Schema: {tenant.schema_name})...')
                set_schema(tenant.schema_name)
                
                # Verificar si el tenant ya tiene una suscripción
                subscription = Subscription.objects.filter(tenant=tenant).first()
                
                if subscription and not all_tenants:
                    self.stdout.write(f'  ✓ {tenant.name}: Ya tiene una suscripción (ID: {subscription.id})')
                    continue
                
                # Calcular fechas
                now = timezone.now()
                end_date = now + timezone.timedelta(days=30)  # 30 días de prueba
                
                # Crear o actualizar la suscripción
                subscription_data = {
                    'plan': plan,
                    'status': 'trial',
                    'start_date': now,
                    'end_date': end_date,
                    'trial_end_date': end_date,
                    'payment_method': 'system',
                    'last_payment_date': now,
                    'next_payment_date': end_date,
                }
                
                if subscription:
                    # Actualizar suscripción existente
                    for key, value in subscription_data.items():
                        setattr(subscription, key, value)
                    subscription.save()
                    updated_count += 1
                    self.stdout.write(self.style.SUCCESS(f'  ↻ {tenant.name}: Suscripción actualizada'))
                else:
                    # Crear nueva suscripción
                    Subscription.objects.create(tenant=tenant, **subscription_data)
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f'  + {tenant.name}: Nueva suscripción creada'))
                    
            except Exception as e:
                logger.error(f'Error procesando tenant {tenant.name}: {str(e)}')
                self.stdout.write(self.style.ERROR(f'  ✗ {tenant.name}: Error al procesar - {str(e)}'))
                continue
            finally:
                # Volver al esquema público después de cada iteración
                set_schema('public')
        
        # Mostrar resumen
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS('Resumen de la operación:'))
        self.stdout.write(f'  • Plan asignado: {plan.name} (ID: {plan.id})')
        self.stdout.write(f'  • Tenants procesados: {tenants.count()}')
        self.stdout.write(f'  • Nuevas suscripciones: {created_count}')
        self.stdout.write(f'  • Suscripciones actualizadas: {updated_count}')
        self.stdout.write(f'  • Sin cambios: {tenants.count() - created_count - updated_count}')
        self.stdout.write('=' * 50)

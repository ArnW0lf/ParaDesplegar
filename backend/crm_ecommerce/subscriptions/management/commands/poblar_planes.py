from django.core.management.base import BaseCommand
from subscriptions.models import Plan

class Command(BaseCommand):
    help = 'Popula la base de datos con planes de suscripción'

    def handle(self, *args, **options):
        planes = [
    # Planes mensuales
    {
        "name": "Básico Mensual",
        "description": "Ideal para emprendedores que recién comienzan.",
        "price": 9.99,
        "plan_type": "mensual",
        "duration_months": 1,
        "max_products": 50,
        "max_users": 2,
        "max_storage": 2,
        "has_crm": False,
        "has_ecommerce": True,
        "has_analytics": False,
        "has_api_access": False,
    },
    {
        "name": "Estándar Mensual",
        "description": "Para negocios en crecimiento con funciones adicionales.",
        "price": 19.99,
        "plan_type": "mensual",
        "duration_months": 1,
        "max_products": 200,
        "max_users": 5,
        "max_storage": 5,
        "has_crm": True,
        "has_ecommerce": True,
        "has_analytics": True,
        "has_api_access": False,
    },
    {
        "name": "Premium Mensual",
        "description": "Todas las funciones disponibles, ideal para empresas establecidas.",
        "price": 29.99,
        "plan_type": "mensual",
        "duration_months": 1,
        "max_products": 1000,
        "max_users": 20,
        "max_storage": 20,
        "has_crm": True,
        "has_ecommerce": True,
        "has_analytics": True,
        "has_api_access": True,
    },

    # Planes anuales
    {
        "name": "Básico Anual",
        "description": "Versión anual del plan básico con descuento.",
        "price": 99.99,
        "plan_type": "anual",
        "duration_months": 12,
        "max_products": 50,
        "max_users": 2,
        "max_storage": 2,
        "has_crm": False,
        "has_ecommerce": True,
        "has_analytics": False,
        "has_api_access": False,
    },
    {
        "name": "Estándar Anual",
        "description": "Plan estándar con todos los beneficios durante un año.",
        "price": 199.99,
        "plan_type": "anual",
        "duration_months": 12,
        "max_products": 200,
        "max_users": 5,
        "max_storage": 5,
        "has_crm": True,
        "has_ecommerce": True,
        "has_analytics": True,
        "has_api_access": False,
    },
    {
        "name": "Premium Anual",
        "description": "Acceso completo a todas las herramientas premium por un año.",
        "price": 299.99,
        "plan_type": "anual",
        "duration_months": 12,
        "max_products": 1000,
        "max_users": 20,
        "max_storage": 20,
        "has_crm": True,
        "has_ecommerce": True,
        "has_analytics": True,
        "has_api_access": True,
    },
]

        for data in planes:
            plan, created = Plan.objects.update_or_create(
                name=data["name"],
                defaults=data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Plan creado: {plan.name}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Plan actualizado: {plan.name}'))

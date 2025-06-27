import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import connection
from tenants.models import Tenant
from tenants.utils import set_schema, set_current_tenant

User = get_user_model()

class Command(BaseCommand):
    help = 'Crea tenants de ejemplo con usuarios (solo clientes, cada uno con su propio tenant)'

    def handle(self, *args, **options):
        # Lista de empresas realistas con más presencia en Bolivia
        empresas = [
            # Empresas de Bolivia
            {
                'name': 'TecnoAndina',
                'domain': 'tecnoandina',
                'sector': 'Tecnología',
                'country': 'Bolivia',
                'city': 'La Paz',
                'company_size': '51-200 empleados'
            },
            {
                'name': 'Moda Boliviana',
                'domain': 'modaboliviana',
                'sector': 'Moda',
                'country': 'Bolivia',
                'city': 'Santa Cruz',
                'company_size': '11-50 empleados'
            },
            {
                'name': 'Alimentos del Altiplano',
                'domain': 'alimentosaltiplano',
                'sector': 'Alimentación',
                'country': 'Bolivia',
                'city': 'El Alto',
                'company_size': '1-10 empleados'
            },
            {
                'name': 'Construcciones Bolivianas',
                'domain': 'construccionesbolivianas',
                'sector': 'Construcción',
                'country': 'Bolivia',
                'city': 'Cochabamba',
                'company_size': '51-200 empleados'
            },
            {
                'name': 'Consultores Andinos',
                'domain': 'consultoresandinos',
                'sector': 'Consultoría',
                'country': 'Bolivia',
                'city': 'Sucre',
                'company_size': '11-50 empleados'
            },
            # Otras empresas de países vecinos
            {
                'name': 'TecnoChile',
                'domain': 'tecnocasa',
                'sector': 'Tecnología',
                'country': 'Chile',
                'city': 'Santiago',
                'company_size': '51-200 empleados'
            },
            {
                'name': 'Moda Argentina',
                'domain': 'modaargentina',
                'sector': 'Moda',
                'country': 'Argentina',
                'city': 'Buenos Aires',
                'company_size': '11-50 empleados'
            },
            {
                'name': 'Alimentos Peruanos',
                'domain': 'alimentosperu',
                'sector': 'Alimentación',
                'country': 'Perú',
                'city': 'Lima',
                'company_size': '1-10 empleados'
            },
        ]


        # Nombres y apellidos comunes en Bolivia y países vecinos
        nombres_hombres = [
            'Juan', 'Carlos', 'Luis', 'Miguel', 'Jorge', 'Fernando', 'Ricardo', 'Eduardo', 
            'Roberto', 'Daniel', 'José', 'Mario', 'Andrés', 'Pablo', 'Diego', 'Sergio', 'Gabriel',
            'Álvaro', 'Raúl', 'Mauricio', 'Javier', 'Alejandro', 'Santiago', 'Felipe', 'Hugo',
            'Oscar', 'Rodrigo', 'Gustavo', 'Mauricio', 'René', 'Rolando', 'Víctor', 'Walter',
            'Boris', 'Iván', 'Jhonny', 'Mijael', 'Ronald', 'Saúl', 'Vladimir', 'William'
        ]
        
        nombres_mujeres = [
            'María', 'Ana', 'Laura', 'Patricia', 'Sofía', 'Valentina', 'Camila', 'Isabella', 
            'Lucía', 'Valeria', 'Gabriela', 'Andrea', 'Carolina', 'Daniela', 'Elena', 'Fernanda',
            'Gabriela', 'Jimena', 'Karina', 'Lorena', 'Mariana', 'Natalia', 'Paola', 'Rocío',
            'Silvia', 'Tatiana', 'Verónica', 'Ximena', 'Yanet', 'Zulema', 'Adriana', 'Beatriz',
            'Claudia', 'Diana', 'Elizabeth', 'Fabiola', 'Gloria', 'Irene', 'Jessica', 'Karen'
        ]
        
        apellidos = [
            'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 
            'Pérez', 'Gómez', 'Martín', 'Flores', 'Quispe', 'Mamani', 'Choque', 'Cruz', 'Quisbert',
            'Rojas', 'Vargas', 'Aguilar', 'Alvarez', 'Arce', 'Arias', 'Bustamante', 'Cárdenas',
            'Castillo', 'Chávez', 'Cortez', 'Delgado', 'Díaz', 'Escobar', 'Espinoza', 'Fernández',
            'Gutiérrez', 'Herrera', 'Jiménez', 'Lima', 'Mendoza', 'Miranda', 'Molina', 'Montaño',
            'Moreno', 'Núñez', 'Ortiz', 'Pacheco', 'Paredes', 'Peña', 'Quiroga', 'Ramírez', 'Reyes',
            'Ríos', 'Rivera', 'Rocha', 'Romero', 'Salazar', 'Salinas', 'Soria', 'Tapia', 'Torres',
            'Valdez', 'Vega', 'Villarroel', 'Zambrano', 'Zarate'
        ]

        for empresa in empresas:
            # Verificar si el tenant ya existe
            tenant_domain = f"{empresa['domain']}.localhost"
            tenant, created = Tenant.objects.get_or_create(
                name=empresa['name'],
                defaults={
                    'schema_name': empresa['domain'],
                    'domain': tenant_domain,
                    'is_active': True
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'Creado tenant: {tenant.name}'))
            else:
                self.stdout.write(self.style.NOTICE(f'El tenant {tenant.name} ya existe, verificando usuarios...'))

            # Configurar el esquema para este tenant
            set_schema(tenant.schema_name)
            set_current_tenant(tenant)
            
            # Crear usuario cliente (único usuario por tenant)
            nombre_cliente = random.choice(nombres_hombres + nombres_mujeres)
            apellido1_cliente = random.choice(apellidos)
            apellido2_cliente = random.choice(apellidos)
            email_cliente = f"{nombre_cliente.lower()}.{apellido1_cliente.lower()}.cliente@{empresa['domain']}.com"
            username_cliente = f"{nombre_cliente.lower()}.{apellido1_cliente.lower()}.cliente"
            
            if not User.objects.filter(username=username_cliente).exists():
                cliente = User.objects.create_user(
                    username=username_cliente,
                    email=email_cliente,
                    password='patito123',
                    first_name=nombre_cliente,
                    last_name=f"{apellido1_cliente} {apellido2_cliente}",
                    role='cliente',
                    company_name=empresa['name'],
                    phone=f"+591 7{random.randint(10, 99)} {random.randint(10000, 99999)}",
                    country=empresa['country'],
                    city=empresa['city'],
                    company_size=empresa['company_size'],
                    address=f"Calle {random.choice(['Mayor', 'Principal', 'Real', 'Nueva'])} {random.randint(1, 100)}",
                    postal_code=f"{random.randint(1000, 9999)}",
                    birth_date=date.today() - timedelta(days=random.randint(7300, 14600)),
                    bio=f"Cliente de {empresa['name']} en el sector de {empresa['sector']}.",
                    tenant=tenant,
                    is_active=True,
                    is_staff=True  # Para que pueda acceder al admin
                )
                # Asegurarse de que el email sea único
                cliente.email = f"{username_cliente}@{empresa['domain']}.com"
                cliente.save()
                self.stdout.write(self.style.SUCCESS(f'  - Creado cliente: {cliente.get_full_name()} ({cliente.email})'))
            else:
                self.stdout.write(self.style.NOTICE(f'  - El cliente {username_cliente} ya existe'))

        # Restaurar al esquema público al finalizar
        set_schema('public')
        set_current_tenant(None)
        self.stdout.write(self.style.SUCCESS('\nProceso completado. Contraseña para todos los usuarios: patito123'))

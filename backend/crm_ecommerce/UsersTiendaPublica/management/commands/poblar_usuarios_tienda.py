from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from tienda.models import Tienda
from UsersTiendaPublica.models import UsersTiendaPublica
import random
from faker import Faker

class Command(BaseCommand):
    help = 'Crea usuarios de tienda pública de ejemplo para cada tienda existente'

    def handle(self, *args, **options):
        fake = Faker('es_ES')
        
        # Obtener todas las tiendas activas
        tiendas = Tienda.objects.filter(publicado=True)
        
        if not tiendas.exists():
            self.stdout.write(self.style.WARNING('No hay tiendas activas. Crea tiendas primero.'))
            return
        
        total_usuarios = 0
        
        for tienda in tiendas:
            self.stdout.write(self.style.SUCCESS(f'\nProcesando tienda: {tienda.nombre}'))
            
            # Crear entre 5 y 15 usuarios por tienda
            num_usuarios = random.randint(5, 15)
            
            for i in range(num_usuarios):
                # Generar datos aleatorios
                first_name = fake.first_name()
                last_name = fake.last_name()
                email = f"{first_name.lower()}.{last_name.lower()}{i}@{tienda.slug}.com"
                password = 'password123'  # Contraseña por defecto
                
                # Crear el usuario
                try:
                    usuario = UsersTiendaPublica.objects.create_user(
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        password=password,
                        tienda=tienda
                    )
                    
                    self.stdout.write(self.style.SUCCESS(f'  - Usuario creado: {email}'))
                    total_usuarios += 1
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  - Error al crear usuario: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(
            f'\n¡Proceso completado!\n'
            f'- Tiendas procesadas: {tiendas.count()}\n'
            f'- Usuarios creados: {total_usuarios}'
        ))

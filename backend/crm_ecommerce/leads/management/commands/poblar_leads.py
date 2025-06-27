from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from leads.models import Lead, InteraccionLead
from tenants.models import Tenant
from tienda.models import Tienda, Producto
import random
from decimal import Decimal
from datetime import timedelta, datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Crea leads de ejemplo para los tenants existentes'

    def crear_interaccion(self, lead, tipo, descripcion, valor=None, fecha=None):
        """Crea una interacción para un lead"""
        if fecha is None:
            fecha = timezone.now() - timedelta(days=random.randint(0, 30))
            
        return InteraccionLead.objects.create(
            lead=lead,
            tipo=tipo,
            descripcion=descripcion,
            valor=valor,
            fecha=fecha
        )
        
    def actualizar_metricas_lead(self, lead):
        """Actualiza las métricas de un lead basado en sus interacciones"""
        interacciones = lead.interacciones.all()
        compras = interacciones.filter(tipo='compra')
        
        # Actualizar total de compras y valor total
        total_compras = compras.count()
        valor_total = sum([i.valor for i in compras if i.valor] or [0])
        
        # Calcular frecuencia de compra (días entre compras)
        fechas_compras = sorted([i.fecha for i in compras])
        if len(fechas_compras) > 1:
            diferencia_total = (max(fechas_compras) - min(fechas_compras)).days
            frecuencia = diferencia_total / (len(fechas_compras) - 1) if len(fechas_compras) > 1 else 0
        else:
            frecuencia = 0
        
        # Actualizar lead
        lead.total_compras = total_compras
        lead.valor_total_compras = valor_total
        lead.ultima_compra = fechas_compras[-1] if fechas_compras else None
        lead.frecuencia_compra = int(frecuencia)
        lead.save()

    def handle(self, *args, **options):
        # Obtener todos los tenants activos
        tenants = Tenant.objects.filter(is_active=True)
        
        if not tenants.exists():
            self.stdout.write(self.style.WARNING('No se encontraron tenants activos. Ejecuta primero el comando para crear usuarios y tenants.'))
            return

        # Datos de ejemplo para los leads
        nombres = [
            'Juan Pérez', 'María González', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez',
            'Laura Sánchez', 'Pedro Ramírez', 'Sofía Torres', 'Diego Herrera', 'Valentina Díaz',
            'Andrés Castro', 'Camila Rojas', 'Jorge Mendoza', 'Daniela Vargas', 'Fernando Silva',
            'Gabriela Muñoz', 'Ricardo Flores', 'Carolina Rivas', 'Mauricio Peña', 'Alejandra Cruz'
        ]
        
        empresas = [
            'TechCorp', 'InnovaSoft', 'GlobalTech', 'DigitalMind', 'Future Systems',
            'CloudNine', 'DataSphere', 'WebCrafters', 'ByteForce', 'NetMasters'
        ]
        
        fuentes = [
            'web', 'referido', 'publicidad', 'redes_sociales', 'evento', 'otro'
        ]
        
        tipos_interaccion = ['llamada', 'email', 'reunion', 'compra', 'otro']
        
        total_leads = 0
        total_interacciones = 0
        
        for tenant in tenants:
            self.stdout.write(self.style.SUCCESS(f'\nProcesando tenant: {tenant.name}'))
            
            # Obtener usuarios, tiendas y productos del tenant actual
            usuarios = list(User.objects.filter(tenant=tenant)[:3])  # Tomar hasta 3 usuarios para asignar
            tiendas = list(Tienda.objects.filter(tenant=tenant))
            
            if not tiendas:
                self.stdout.write(self.style.WARNING(f'No hay tiendas en el tenant {tenant.name}. Saltando...'))
                continue
                
            # Obtener productos de todas las tiendas del tenant
            productos = list(Producto.objects.filter(tienda__in=tiendas))
            
            # Crear 5 leads por tenant
            for i in range(5):
                # Crear datos básicos del lead
                nombre = random.choice(nombres)
                partes_nombre = nombre.split()
                email = f"{partes_nombre[0].lower()}.{partes_nombre[1].lower()}{i}@{tenant.domain.split('.')[0]}.com"
                estado = random.choice(['nuevo', 'contactado', 'calificado', 'en_proceso', 'perdido'])
                tienda = random.choice(tiendas) if tiendas else None
                
                # Crear el lead
                lead = Lead.objects.create(
                    usuario=random.choice(usuarios) if usuarios else None,
                    nombre=f"{nombre} - {random.choice(empresas)}",
                    email=email,
                    telefono=f"+5917{random.randint(1000000, 9999999)}",
                    estado=estado,
                    notas=f"Lead generado automáticamente para {tenant.name}. Interesado en {random.choice(['productos', 'servicios', 'soporte', 'cotización'])}.",
                    tenant=tenant,
                    tienda=tienda,
                    valor_estimado=Decimal(random.randint(100, 10000)),
                    probabilidad=random.choice([10, 25, 50, 75, 90]),
                    fuente=random.choice(fuentes)
                )
                
                self.stdout.write(self.style.SUCCESS(f'  - Lead creado: {lead.nombre} ({lead.estado})'))
                total_leads += 1
                
                # Crear interacciones para el lead
                num_interacciones = random.randint(1, 8)  # Entre 1 y 8 interacciones por lead
                fechas_interacciones = sorted([timezone.now() - timedelta(days=random.randint(0, 90)) for _ in range(num_interacciones)])
                
                for j, fecha in enumerate(fechas_interacciones):
                    # Determinar el tipo de interacción
                    if j == 0:
                        # Primera interacción siempre es contacto inicial
                        tipo = 'email' if random.random() > 0.5 else 'llamada'
                        descripcion = f"Contacto inicial vía {tipo}"
                        valor = None
                    elif j == num_interacciones - 1 and estado in ['ganado', 'perdido']:
                        # Última interacción si el lead está cerrado
                        tipo = 'compra' if estado == 'ganado' else 'otro'
                        if tipo == 'compra':
                            producto = random.choice(productos) if productos else None
                            valor = Decimal(random.randint(50, 2000))
                            descripcion = f"Compra realizada: {producto.nombre if producto else 'Producto varios'}"
                        else:
                            valor = None
                            descripcion = "Lead marcado como perdido"
                    else:
                        # Interacciones intermedias
                        tipo = random.choice(tipos_interaccion)
                        if tipo == 'llamada':
                            descripcion = random.choice([
                                "Llamada de seguimiento",
                                "Llamada para aclarar dudas",
                                "Llamada de prospección"
                            ])
                            valor = None
                        elif tipo == 'email':
                            descripcion = random.choice([
                                "Email con información adicional",
                                "Seguimiento por email",
                                "Envío de cotización"
                            ])
                            valor = None
                        elif tipo == 'reunion':
                            descripcion = random.choice([
                                "Reunión de presentación",
                                "Reunión de seguimiento",
                                "Demostración de producto"
                            ])
                            valor = None
                        elif tipo == 'compra':
                            producto = random.choice(productos) if productos else None
                            valor = Decimal(random.randint(50, 2000))
                            descripcion = f"Compra realizada: {producto.nombre if producto else 'Producto varios'}"
                        else:  # otro
                            descripcion = random.choice([
                                "Visita a la tienda física",
                                "Consulta por WhatsApp",
                                "Chat en vivo en el sitio web"
                            ])
                            valor = None
                    
                    # Crear la interacción
                    self.crear_interaccion(lead, tipo, descripcion, valor, fecha)
                    total_interacciones += 1
                
                # Actualizar métricas del lead
                self.actualizar_metricas_lead(lead)
        
        self.stdout.write(self.style.SUCCESS(
            f'\n¡Proceso completado!\n'
            f'- Leads creados: {total_leads}\n'
            f'- Interacciones creadas: {total_interacciones}'
        ))

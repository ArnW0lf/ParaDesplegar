from django.core.management.base import BaseCommand
from UsersTiendaPublica.models import UsersTiendaPublica
from ComprasTiendaPublica.models import PedidoPublico, DetallePedidoPublico
from tienda.models import Tienda, Producto
from payments.models import PaymentMethod
from django.utils import timezone
from datetime import timedelta
import random
from faker import Faker

class Command(BaseCommand):
    help = 'Crea ventas de ejemplo para los últimos 30 días para usuarios de tienda pública'

    def handle(self, *args, **options):
        fake = Faker('es_ES')
        
        # Obtener todas las tiendas activas
        tiendas = Tienda.objects.filter(publicado=True)
        
        if not tiendas.exists():
            self.stdout.write(self.style.WARNING('No hay tiendas activas. Crea tiendas primero.'))
            return
        
        total_ventas = 0
        total_detalles = 0
        
        for tienda in tiendas:
            self.stdout.write(self.style.SUCCESS(f'\nProcesando tienda: {tienda.nombre}'))
            
            # Obtener usuarios de esta tienda
            usuarios = UsersTiendaPublica.objects.filter(tienda=tienda)
            
            if not usuarios.exists():
                self.stdout.write(self.style.WARNING(f'No hay usuarios para la tienda {tienda.nombre}. Ejecuta primero poblar_usuarios_tienda.'))
                continue
                
            # Obtener productos de esta tienda
            productos = list(Producto.objects.filter(tienda=tienda, stock__gt=0))
            
            if not productos:
                self.stdout.write(self.style.WARNING(f'No hay productos para la tienda {tienda.nombre}.'))
                continue
            
            # Crear entre 5 y 15 ventas por tienda en los últimos 30 días
            num_ventas = random.randint(5, 15)
            
            # Generar fechas distribuidas en el último mes
            hoy = timezone.now()
            fecha_inicio = hoy - timedelta(days=30)
            
            # Crear una lista de fechas distribuidas
            dias = sorted([random.randint(0, 29) for _ in range(num_ventas)])
            
            for i in range(num_ventas):
                # Seleccionar un usuario aleatorio
                usuario = random.choice(usuarios)
                
                # Calcular la fecha de venta distribuida en el último mes
                dias_desde_inicio = dias[i] if i < len(dias) else random.randint(0, 29)
                fecha_venta = fecha_inicio + timedelta(days=dias_desde_inicio)
                
                # Añadir variación de horas, minutos y segundos
                fecha_venta += timedelta(
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                
                # Obtener métodos de pago activos para la tienda
                metodos_pago = list(PaymentMethod.objects.filter(
                    tienda=tienda,
                    is_active=True,
                    status='active'
                ))
                
                if not metodos_pago:
                    self.stdout.write(self.style.WARNING('  - No hay métodos de pago configurados para esta tienda. Ejecuta primero poblar_metodos_pago.'))
                    continue
                    
                # Crear el pedido
                try:
                    # Datos de envío ficticios
                    nombre = usuario.first_name or fake.first_name()
                    apellido = usuario.last_name or fake.last_name()
                    
                    # Seleccionar un método de pago aleatorio
                    metodo_pago = random.choice(metodos_pago)
                    
                    # Mapear tipos de pago del modelo PaymentMethod a los del PedidoPublico
                    tipo_pago_map = {
                        'paypal': 'tarjeta',
                        'credit_card': 'tarjeta',
                        'debit_card': 'tarjeta',
                        'bank_transfer': 'transferencia',
                        'cash': 'efectivo',
                        'crypto': 'transferencia'
                    }
                    
                    metodo_pago_pedido = tipo_pago_map.get(metodo_pago.payment_type, 'efectivo')
                    
                    pedido = PedidoPublico.objects.create(
                        codigo_seguimiento=f'PED-{random.randint(1000, 9999)}-{random.randint(100, 999)}',
                        usuario=usuario,
                        nombre=nombre,
                        apellido=apellido,
                        ci=str(random.randint(1000000, 9999999)),
                        ciudad=fake.city(),
                        provincia=fake.state(),
                        direccion=fake.street_address(),
                        referencia=fake.sentence(),
                        telefono=fake.phone_number(),
                        correo=usuario.email or f"{nombre.lower()}.{apellido.lower()}@ejemplo.com",
                        notas=f'Instrucciones de pago: {metodo_pago.instructions}',
                        metodo_pago=metodo_pago_pedido,
                        total=0,  # Se actualizará con los detalles
                        estado=random.choices(
                            ['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'],
                            weights=[10, 20, 20, 20, 25, 5]  # Probabilidades de cada estado
                        )[0],
                        tienda=tienda,
                        fecha=fecha_venta
                    )
                    
                    # Filtrar solo productos con stock disponible
                    productos_con_stock = [p for p in productos if p.stock > 0]
                    
                    if not productos_con_stock:
                        self.stdout.write(self.style.WARNING('  - No hay productos con stock disponible para esta tienda'))
                        pedido.delete()
                        continue
                    
                    # Crear entre 1 y 5 productos por pedido (máximo los disponibles)
                    num_productos = min(random.randint(1, 5), len(productos_con_stock))
                    productos_pedido = random.sample(productos_con_stock, num_productos)
                    
                    total_pedido = 0
                    detalles_creados = 0
                    
                    for producto in productos_pedido:
                        try:
                            # Asegurarse de que la cantidad no exceda el stock
                            cantidad_maxima = min(5, producto.stock)
                            if cantidad_maxima < 1:
                                continue
                                
                            cantidad = random.randint(1, cantidad_maxima)
                            precio = float(producto.precio) * (1 - random.uniform(0, 0.2))  # Hasta 20% de descuento
                            subtotal = cantidad * precio
                            
                            DetallePedidoPublico.objects.create(
                                pedido=pedido,
                                nombre_producto=producto.nombre,
                                cantidad=cantidad,
                                precio_unitario=precio,
                                subtotal=subtotal
                            )
                            
                            total_pedido += subtotal
                            total_detalles += 1
                            detalles_creados += 1
                            
                            # Actualizar stock
                            producto.stock -= cantidad
                            producto.save()
                            
                        except Exception as e:
                            self.stdout.write(self.style.WARNING(f'  - Error al crear detalle: {str(e)}'))
                            continue
                    
                    # Si no se crearon detalles, eliminar el pedido
                    if detalles_creados == 0:
                        pedido.delete()
                        continue
                    
                    # Actualizar el total del pedido
                    pedido.total = total_pedido
                    pedido.save()
                    
                    self.stdout.write(self.style.SUCCESS(f'  - Venta creada: {pedido.codigo_seguimiento} - ${total_pedido:.2f}'))
                    total_ventas += 1
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  - Error al crear venta: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(
            f'\n¡Proceso completado!\n'
            f'- Ventas creadas: {total_ventas}\n'
            f'- Detalles de venta creados: {total_detalles}'
        ))

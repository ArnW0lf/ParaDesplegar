from django.core.management.base import BaseCommand
from tienda.models import Tienda
from payments.models import PaymentMethod
from django.utils import timezone

class Command(BaseCommand):
    help = 'Crea métodos de pago de ejemplo para las tiendas existentes'

    def handle(self, *args, **options):
        # Métodos de pago disponibles con sus configuraciones
        metodos_pago = [
            {
                'name': 'PayPal',
                'payment_type': 'paypal',
                'is_active': True,
                'status': 'active',
                'credentials': {
                    'client_id': f'paypal_client_{int(timezone.now().timestamp())}',
                    'client_secret': f'paypal_secret_{int(timezone.now().timestamp())}'
                },
                'instructions': 'Puede pagar con su cuenta de PayPal de forma segura.'
            },
            {
                'name': 'Tarjeta de Crédito',
                'payment_type': 'credit_card',
                'is_active': True,
                'status': 'active',
                'credentials': {},
                'instructions': 'Aceptamos todas las tarjetas de crédito principales.'
            },
            {
                'name': 'Transferencia Bancaria',
                'payment_type': 'bank_transfer',
                'is_active': True,
                'status': 'active',
                'credentials': {
                    'bank_name': 'Banco de Ejemplo',
                    'account_number': '123-456-789',
                    'account_holder': 'Tienda Ejemplo S.A.',
                    'routing_number': '987654321'
                },
                'instructions': 'Realice la transferencia a nuestra cuenta bancaria. Su pedido se procesará una vez recibido el pago.'
            },
            {
                'name': 'Efectivo',
                'payment_type': 'cash',
                'is_active': True,
                'status': 'active',
                'credentials': {},
                'instructions': 'Pago en efectivo al momento de la entrega.'
            }
        ]

        # Obtener todas las tiendas activas
        tiendas = Tienda.objects.filter(publicado=True)
        
        if not tiendas.exists():
            self.stdout.write(self.style.WARNING('No hay tiendas activas. Crea tiendas primero.'))
            return

        total_creados = 0

        for tienda in tiendas:
            self.stdout.write(self.style.SUCCESS(f'\nProcesando tienda: {tienda.nombre}'))
            
            for metodo_data in metodos_pago:
                try:
                    # Verificar si ya existe un método de este tipo para la tienda
                    if not PaymentMethod.objects.filter(
                        tienda=tienda,
                        payment_type=metodo_data['payment_type']
                    ).exists():
                        
                        PaymentMethod.objects.create(
                            tenant=tienda.tenant,
                            tienda=tienda,
                            name=metodo_data['name'],
                            payment_type=metodo_data['payment_type'],
                            is_active=metodo_data['is_active'],
                            status=metodo_data['status'],
                            credentials=metodo_data['credentials'],
                            instructions=metodo_data['instructions']
                        )
                        self.stdout.write(f"  - Método de pago creado: {metodo_data['name']}")
                        total_creados += 1
                    else:
                        self.stdout.write(f"  - El método de pago {metodo_data['name']} ya existe para esta tienda")
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  - Error al crear método de pago {metodo_data['name']}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f'\n¡Proceso completado!\n- Métodos de pago creados: {total_creados}'))

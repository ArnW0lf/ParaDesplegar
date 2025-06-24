from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, action
from .models import PedidoPublico
from .serializers import PedidoPublicoSerializer
from users.models import CustomUser
from UsersTiendaPublica.models import UsersTiendaPublica
from tienda.models import Tienda, Pedido, DetallePedido, Producto
from tenants.utils import get_current_tenant

@api_view(['POST'])
def agregar_codigo_seguimiento(request, pedido_id):
    try:
        pedido = PedidoPublico.objects.get(id=pedido_id)
        tenant = get_current_tenant()
        tienda = Tienda.objects.get(tenant=tenant)

        # Verificar que el pedido pertenece a la tienda actual
        if pedido.tienda != tienda:
            return Response({"error": "Este pedido no pertenece a esta tienda"}, status=403)

        if isinstance(request.user, CustomUser):
            codigo = request.data.get('codigo_seguimiento')
            if not codigo:
                return Response({"error": "Código vacío"}, status=status.HTTP_400_BAD_REQUEST)
            pedido.codigo_seguimiento = codigo
            pedido.save()
            return Response({'message': 'Código de seguimiento agregado correctamente'})
        elif pedido.usuario != request.user:
            return Response({"error": "No tienes permiso para modificar este pedido"}, status=403)
    except PedidoPublico.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'}, status=404)
    except Tienda.DoesNotExist:
        return Response({'error': 'Tienda no encontrada'}, status=404)

class PedidoPublicoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoPublicoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant = get_current_tenant()
        try:
            tienda = Tienda.objects.get(tenant=tenant)
        except Tienda.DoesNotExist:
            return PedidoPublico.objects.none()

        if isinstance(self.request.user, CustomUser):
            return PedidoPublico.objects.filter(tienda=tienda).order_by('-fecha')
        return PedidoPublico.objects.filter(usuario=self.request.user, tienda=tienda).order_by('-fecha')

    @action(detail=False, methods=['get'])
    def por_tienda(self, request):
        try:
            tenant = get_current_tenant()
            if not tenant:
                return Response(
                    {"error": "No se encontró el tenant"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            tienda = Tienda.objects.filter(tenant=tenant).first()
            if not tienda:
                return Response(
                    {"error": "No se encontró la tienda asociada al tenant"},
                    status=status.HTTP_404_NOT_FOUND
                )

            productos_nombres = list(Producto.objects.filter(tienda=tienda).values_list('nombre', flat=True))
            if not productos_nombres:
                return Response([])

            # Obtener todos los pedidos de la tienda, independientemente de si los productos existen
            print(f"Buscando pedidos para la tienda: {tienda.id}")
            pedidos = PedidoPublico.objects.filter(
                tienda=tienda
            ).order_by('-fecha')
            
            print(f"Total de pedidos encontrados: {pedidos.count()}")
            
            # Imprimir información de cada pedido para depuración
            for pedido in pedidos:
                print(f"Pedido ID: {pedido.id}, Estado: {pedido.estado}, Fecha: {pedido.fecha}")
                for detalle in pedido.detalles.all():
                    print(f"  - Producto: {detalle.nombre_producto}, Cantidad: {detalle.cantidad}")
            
            serializer = self.get_serializer(pedidos, many=True)
            serialized_data = serializer.data
            print(f"Datos serializados: {serialized_data}")
            return Response(serialized_data)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=True, methods=['post'])
    def actualizar_estado(self, request, pk=None):
        try:
            pedido = self.get_object()
            if not isinstance(request.user, CustomUser):
                return Response({"error": "Solo los vendedores pueden actualizar el estado"}, status=403)

            nuevo_estado = request.data.get('estado')
            if not nuevo_estado:
                return Response({"error": "Estado no proporcionado"}, status=400)

            pedido.estado = nuevo_estado
            pedido.save()
            return Response(self.get_serializer(pedido).data)
        except PedidoPublico.DoesNotExist:
            return Response({"error": "Pedido no encontrado"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class GuardarCompraView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            slug = request.data.get('slug')
            if not slug:
                return Response({"error": "No se pudo determinar la tienda"}, status=400)

            try:
                tienda = Tienda.objects.get(slug=slug)
            except Tienda.DoesNotExist:
                return Response({"error": "Tienda no encontrada"}, status=404)

            usuario_id = request.data.get('usuario')
            if not usuario_id:
                return Response({"error": "Usuario no proporcionado"}, status=400)

            try:
                usuario_tienda = UsersTiendaPublica.objects.get(id=usuario_id)
            except UsersTiendaPublica.DoesNotExist:
                return Response({"error": "Usuario de tienda pública no encontrado"}, status=404)

            data = request.data.copy()
            data['usuario'] = usuario_tienda.id
            data['tienda'] = tienda.id

            serializer = PedidoPublicoSerializer(data=data)
            if not serializer.is_valid():
                print("Errores del serializador:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            pedido_publico = serializer.save()

            # Si usas también el modelo Pedido (interno) y DetallePedido
            pedido = Pedido.objects.create(
                tienda=tienda,
                cliente_tienda_publica=usuario_tienda,
                total=pedido_publico.total,
                direccion_entrega=pedido_publico.direccion,
                telefono=pedido_publico.telefono,
                metodo_pago=pedido_publico.metodo_pago,
                notas=pedido_publico.notas
            )

            for detalle in pedido_publico.detalles.all():
                try:
                    # Intentar obtener el producto, pero no es crítico si no existe
                    producto = Producto.objects.filter(
                        tienda=tienda,
                        nombre=detalle.nombre_producto,
                        eliminado=False
                    ).first()
                    
                    # Crear el detalle del pedido con o sin el producto
                    DetallePedido.objects.create(
                        pedido=pedido,
                        producto=producto,  # Puede ser None si el producto no existe
                        nombre_producto=detalle.nombre_producto,  # Guardar el nombre del producto
                        cantidad=detalle.cantidad,
                        precio_unitario=detalle.precio_unitario,
                        subtotal=detalle.subtotal
                    )
                except Exception as e:
                    print(f"Error al crear detalle de pedido: {str(e)}")
                    # Continuar con el siguiente detalle aunque falle uno

            return Response({
                'message': 'Compra guardada con éxito',
                'pedido_id': pedido.id
            }, status=201)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

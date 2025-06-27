from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Tienda, Categoria, Producto, CarritoItem, Pedido, NotificacionPedido
from .serializers import TiendaSerializer, CategoriaSerializer, ProductoSerializer, PedidoSerializer, NotificacionPedidoSerializer
from users.models import CustomUser
from tenants.utils import get_current_tenant
import logging
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError
from users.permissions import IsSeller
from users.permissions import IsStockManager
from rest_framework import serializers 

logger = logging.getLogger(__name__)

class TiendaViewSet(viewsets.ModelViewSet):
    queryset = Tienda.objects.all()
    serializer_class = TiendaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='tienda-por-usuario')
    def tienda_por_usuario(self, request):
        """
        Retorna la tienda asociada al usuario. Si no tiene una, busca por el tenant.
        Útil para usuarios internos de la tienda (como stock, crm, etc.).
        """
        tenant = get_current_tenant()
        if not tenant:
            return Response({"error": "No se encontró el tenant"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Primero, buscar si el usuario tiene una tienda directamente
            tienda = Tienda.objects.filter(tenant=tenant).first()


            # Si no tiene, buscar una tienda del tenant (para usuarios internos asignados al tenant)
            if not tienda:
                tienda = Tienda.objects.filter(tenant=tenant).first()

            if tienda:
                serializer = self.get_serializer(tienda)
                return Response(serializer.data)

            return Response({"error": "No se encontró la tienda"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def get_queryset(self):
        tenant = get_current_tenant()
        logger.info(f"Tenant actual: {tenant}")
        if not tenant:
            logger.warning("No se encontró tenant")
            return Tienda.objects.none()
        if self.action in ['public_store', 'public_products', 'public_categories']:
            return Tienda.objects.filter(tenant=tenant, publicado=True)
        return Tienda.objects.filter(tenant=tenant)

    def create(self, request, *args, **kwargs):
        tenant = get_current_tenant()
        if not tenant:
            return Response({"error": "No se encontró el tenant"}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar si el usuario ya tiene una tienda
        if Tienda.objects.filter(tenant=tenant, usuario=request.user).exists():
            return Response(
                {"error": "Ya tienes una tienda creada"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear el slug a partir del nombre
        nombre = request.data.get('nombre', '')
        slug = slugify(nombre)
        
        # Verificar si el slug ya existe en el tenant
        if Tienda.objects.filter(tenant=tenant, slug=slug).exists():
            # Agregar un número al final del slug si ya existe
            base_slug = slug
            counter = 1
            while Tienda.objects.filter(tenant=tenant, slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

        # Crear la tienda
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                tenant=tenant,
                usuario=request.user,
                slug=slug
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'patch'])
    def config(self, request):
        logger.info("="*50)
        logger.info("INICIO DE CONFIG")
        logger.info("="*50)
        
        user = request.user
        if not hasattr(user, 'tenant') or not user.tenant:
            logger.warning("Config - Usuario sin tenant asignado")
            return Response(
                {"error": "Este usuario no tiene una tienda asignada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        tenant = user.tenant
        logger.info(f"Config - Tenant actual: {tenant}")

        logger.info(f"Config - Usuario actual: {request.user.username}")
        logger.info(f"Config - Método: {request.method}")
        logger.info(f"Config - Headers: {request.headers}")
        logger.info(f"Config - Content-Type: {request.content_type}")
        logger.info(f"Config - Datos recibidos (request.data): {request.data}")
        logger.info(f"Config - Files recibidos (request.FILES): {request.FILES}")
        logger.info(f"Config - Query params: {request.query_params}")
        
        if not tenant:
            logger.warning("Config - No se encontró tenant")
            return Response({"error": "No se encontró el tenant"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tienda = Tienda.objects.filter(tenant=tenant).first()

            if not tienda:
                logger.warning(f"Config - No se encontró tienda para el tenant {tenant.name}")
                return Response({"error": "No se encontró la tienda"}, status=status.HTTP_404_NOT_FOUND)

            logger.info(f"Config - Tienda encontrada: {tienda.nombre}")
            logger.info(f"Config - Estado actual de la tienda: {self.get_serializer(tienda).data}")

            if request.method == 'PATCH':
                logger.info("="*50)
                logger.info("INICIO DE ACTUALIZACIÓN PATCH")
                logger.info("="*50)
                
                # Create a mutable copy of the data
                data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
                logger.info(f"Config - Datos originales copiados: {data}")
                
                # Handle the published field
                if 'publicado' in data:
                    logger.info(f"Config - Valor original de publicado: {data['publicado']}")
                    if isinstance(data['publicado'], str):
                        data['publicado'] = data['publicado'].lower() == 'true'
                    else:
                        data['publicado'] = bool(data['publicado'])
                    logger.info(f"Config - Valor procesado de publicado: {data['publicado']}")
                
                # Handle logo file upload
                if 'logo' in request.FILES:
                    logger.info(f"Config - Nuevo logo recibido: {request.FILES['logo']}")
                    # The file will be handled by the serializer's update method
                elif 'logo' in data and data['logo'] is None:
                    logger.info("Config - Logo enviado como null, se eliminará el logo actual")
                    # The None value will be handled by the serializer's update method
                
                # Ensure optional fields are not None
                for field in ['descripcion', 'tema', 'color_primario', 'color_secundario', 'color_texto', 'color_fondo']:
                    if field in data and data[field] is None:
                        logger.info(f"Config - Campo {field} es None, estableciendo como vacío")
                        data[field] = ''
                
                logger.info(f"Config - Datos finales a procesar: {data}")
                
                # Create the serializer with the data and files
                serializer = self.get_serializer(
                    tienda, 
                    data=data, 
                    partial=True,
                    context={'request': request}  # Pass the request to access FILES in the serializer
                )
                logger.info("Config - Serializador creado")
                
                if serializer.is_valid():
                    logger.info(f"Config - Datos válidos: {serializer.validated_data}")
                    try:
                        # Actualizar la tienda
                        logger.info("Config - Iniciando actualización de campos")
                        for key, value in serializer.validated_data.items():
                            logger.info(f"Config - Actualizando campo {key}: {value}")
                            setattr(tienda, key, value)
                        
                        logger.info("Config - Guardando tienda")
                        tienda.save()
                        
                        # Serializar la tienda actualizada
                        response_serializer = self.get_serializer(tienda)
                        logger.info(f"Config - Tienda actualizada: {response_serializer.data}")
                        logger.info("Config - Tienda actualizada exitosamente")
                        return Response(response_serializer.data)
                    except Exception as e:
                        logger.error(f"Config - Error al guardar: {str(e)}")
                        logger.error(f"Config - Tipo de error: {type(e)}")
                        logger.error(f"Config - Detalles del error: {e.__dict__}")
                        return Response({"error": f"Error al guardar los cambios: {str(e)}"}, 
                                     status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                else:
                    logger.warning(f"Config - Errores de validación: {serializer.errors}")
                    logger.warning(f"Config - Datos inválidos: {data}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                serializer = self.get_serializer(tienda)
                logger.info(f"Config - Datos de tienda obtenidos: {serializer.data}")
                return Response(serializer.data)
                
        except Tienda.DoesNotExist:
            logger.warning(f"Config - No se encontró tienda para el usuario {request.user.username} en el tenant {tenant.name}")
            return Response({"error": "No se encontró la tienda"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Config - Error general: {str(e)}")
            logger.error(f"Config - Tipo de error: {type(e)}")
            logger.error(f"Config - Detalles del error: {e.__dict__}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            logger.info("="*50)
            logger.info("FIN DE CONFIG")
            logger.info("="*50)

    @action(detail=False, methods=['get'], url_path='(?P<slug>[^/.]+)/public_store', permission_classes=[permissions.AllowAny])
    def public_store(self, request, slug=None):
        try:
            tienda = Tienda.objects.get(slug=slug, publicado=True)
            serializer = self.get_serializer(tienda)
            return Response(serializer.data)
        except Tienda.DoesNotExist:
            return Response({"error": "No se encontró la tienda"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='(?P<slug>[^/.]+)/public_products', permission_classes=[permissions.AllowAny])
    def public_products(self, request, slug=None):
        try:
            tienda = Tienda.objects.get(slug=slug, publicado=True)
            productos = Producto.objects.filter(tienda=tienda)
            serializer = ProductoSerializer(productos, many=True)
            return Response(serializer.data)
        except Tienda.DoesNotExist:
            return Response({"error": "No se encontró la tienda"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='(?P<slug>[^/.]+)/public_categories', permission_classes=[permissions.AllowAny])
    def public_categories(self, request, slug=None):
        logger.info(f"Public Categories - Buscando tienda con slug: {slug}")
        try:
            tienda = Tienda.objects.get(slug=slug, publicado=True)
            logger.info(f"Public Categories - Tienda encontrada: {tienda.nombre}")
            
            categorias = Categoria.objects.filter(tienda=tienda)
            logger.info(f"Public Categories - Número de categorías encontradas: {categorias.count()}")
            logger.info(f"Public Categories - Categorías: {[c.nombre for c in categorias]}")
            
            serializer = CategoriaSerializer(categorias, many=True)
            return Response(serializer.data)
        except Tienda.DoesNotExist:
            logger.warning(f"Public Categories - No se encontró la tienda con slug: {slug}")
            return Response({"error": "No se encontró la tienda"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Public Categories - Error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticated, IsStockManager]

    def get_queryset(self):
        tenant = get_current_tenant()
        if not tenant:
            return Categoria.objects.none()
        return Categoria.objects.filter(tienda__tenant=tenant)

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        if not tenant:
            return Response({"error": "No se encontró el tenant"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            tienda = Tienda.objects.filter(tenant=tenant).first()

            serializer.save(tienda=tienda)
        except Tienda.DoesNotExist:
            return Response({"error": "No se encontró la tienda"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAuthenticated, IsStockManager]

    def get_queryset(self):
        tenant = get_current_tenant()
        if not tenant:
            return Producto.objects.none()
            
        # Si es una solicitud de administrador y se solicita ver eliminados, mostrarlos todos
        if self.request.user.is_staff and self.request.query_params.get('show_deleted'):
            return Producto.all_objects.filter(tienda__tenant=tenant)
            
        # Para usuarios normales, solo mostrar productos no eliminados
        return Producto.objects.filter(tienda__tenant=tenant)

    def perform_create(self, serializer):
        logger.info(f"🔍 Debug - Datos recibidos en perform_create: {self.request.data}")
        tenant = get_current_tenant()
        if not tenant:
            raise serializers.ValidationError({"error": "No se encontró el tenant"})
        try:
            tienda = Tienda.objects.filter(tenant=tenant).first()
            if not tienda:
                raise serializers.ValidationError({"error": "No se encontró la tienda"})
                
            instance = serializer.save(tienda=tienda)
            logger.info(f"Debug - Producto creado con ID: {instance.id}, Stock: {instance.stock}")
            return instance
        except Exception as e:
            logger.error(f"Error al crear producto: {str(e)}")
            raise

    def perform_update(self, serializer):
        logger.info(f"Debug - Datos recibidos en perform_update: {self.request.data}")
        instance = serializer.save()
        logger.info(f"Debug - Producto actualizado con ID: {instance.id}, Stock: {instance.stock}")
        return instance

    def perform_destroy(self, instance):
        """
        Realiza una eliminación lógica del producto.
        """
        try:
            # Actualizamos los detalles de pedido para que guarden el nombre del producto
            from .models import DetallePedido
            detalles_pedido = DetallePedido.objects.filter(producto=instance)
            for detalle in detalles_pedido:
                if not detalle.nombre_producto:
                    detalle.nombre_producto = instance.nombre
                    detalle.save()
            
            # Realizamos la eliminación lógica
            instance.eliminado = True
            instance.save()
            logger.info(f"Producto {instance.id} marcado como eliminado lógicamente")
            
        except Exception as e:
            logger.error(f"Error al eliminar el producto {instance.id}: {str(e)}")
            raise

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        """Obtener productos con stock bajo (menos de 5 unidades)"""
        try:
            tenant = get_current_tenant()
            if not tenant:
                return Response({"error": "No se encontró el tenant"}, status=status.HTTP_400_BAD_REQUEST)
            
            low_stock_products = Producto.objects.filter(
                tienda__tenant=tenant,
                stock__lt=5
            )
            serializer = self.get_serializer(low_stock_products, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]


    def get_queryset(self):
        tenant = get_current_tenant()
        if not tenant:
            return Pedido.objects.none()
        
        # Si es un vendedor, ver solo pedidos de su tienda
        if self.request.user.role == 'vendedor':
           return Pedido.objects.filter(tienda__tenant=tenant)
        # Si es un cliente, ver solo sus pedidos
        return Pedido.objects.filter(tienda__tenant=tenant)

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        if not tenant:
            raise ValidationError("No se encontró el tenant")
        
        # Obtener la tienda del vendedor
        tienda = Tienda.objects.filter(tenant=tenant).first()
        serializer.save(tienda=tienda, cliente=self.request.user)

    @action(detail=True, methods=['post'])
    def actualizar_estado(self, request, pk=None):
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in dict(Pedido.ESTADO_CHOICES):
            return Response(
                {"error": "Estado no válido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pedido.estado = nuevo_estado
        pedido.save()
        
        # Crear notificación
        NotificacionPedido.objects.create(
            pedido=pedido,
            mensaje=f"El estado de tu pedido ha sido actualizado a: {pedido.get_estado_display()}"
        )
        
        return Response(self.get_serializer(pedido).data)

    @action(detail=True, methods=['post'])
    def agregar_codigo_seguimiento(self, request, pk=None):
        pedido = self.get_object()
        codigo = request.data.get('codigo_seguimiento')
        
        if not codigo:
            return Response(
                {"error": "Código de seguimiento requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pedido.codigo_seguimiento = codigo
        pedido.save()
        
        # Crear notificación
        NotificacionPedido.objects.create(
            pedido=pedido,
            mensaje=f"Se ha agregado un código de seguimiento a tu pedido: {codigo}"
        )
        
        return Response(self.get_serializer(pedido).data)

class NotificacionPedidoViewSet(viewsets.ModelViewSet):
    serializer_class = NotificacionPedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = get_current_tenant()
        if not tenant:
            return NotificacionPedido.objects.none()
        
        return NotificacionPedido.objects.filter(
            pedido__tienda__tenant=tenant,
            pedido__cliente=self.request.user
        ).order_by('-fecha')

    @action(detail=True, methods=['post'])
    def marcar_como_leido(self, request, pk=None):
        notificacion = self.get_object()
        notificacion.leido = True
        notificacion.save()
        return Response(self.get_serializer(notificacion).data)
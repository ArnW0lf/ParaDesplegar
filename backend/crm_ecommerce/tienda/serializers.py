from rest_framework import serializers
from .models import Tienda, Categoria, Producto, DetallePedido, Pedido, NotificacionPedido
import logging

logger = logging.getLogger(__name__)

class TiendaSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Tienda
        fields = [
            'id', 'nombre', 'logo', 'descripcion', 'tema',
            'color_primario', 'color_secundario', 'color_texto',
            'color_fondo', 'slug', 'publicado'
        ]
        read_only_fields = ['slug']
        
    def update(self, instance, validated_data):
        # Handle file upload separately
        logo = validated_data.pop('logo', None)
        instance = super().update(instance, validated_data)
        
        # If logo is None and we want to clear the existing logo
        if logo is None and 'logo' in self.initial_data:
            instance.logo = None
            instance.save()
        # If a new logo was provided
        elif logo is not None:
            instance.logo = logo
            instance.save()
            
        return instance

    def validate_publicado(self, value):
        logger.info(f"Validando campo publicado: {value}")
        if isinstance(value, str):
            result = value.lower() == 'true'
            logger.info(f"Convertido de string a booleano: {result}")
            return result
        logger.info(f"Valor booleano directo: {bool(value)}")
        return bool(value)

    def validate(self, data):
        logger.info("="*50)
        logger.info("INICIO DE VALIDACIÓN")
        logger.info(f"Datos a validar: {data}")
        
        # Validar que el nombre no esté vacío
        if 'nombre' in data:
            logger.info(f"Validando nombre: {data['nombre']}")
            if not data['nombre'].strip():
                logger.warning("Nombre está vacío")
                raise serializers.ValidationError({'nombre': 'El nombre no puede estar vacío'})
        
        # Validar que la descripción no sea demasiado larga
        if 'descripcion' in data:
            logger.info(f"Validando descripción (longitud: {len(data['descripcion'])})")
            if len(data['descripcion']) > 500:
                logger.warning("Descripción demasiado larga")
                raise serializers.ValidationError({'descripcion': 'La descripción no puede tener más de 500 caracteres'})
        
        # Validar los colores
        color_fields = ['color_primario', 'color_secundario', 'color_texto', 'color_fondo']
        for field in color_fields:
            if field in data and data[field]:
                logger.info(f"Validando color {field}: {data[field]}")
                if not data[field].startswith('#'):
                    data[field] = f"#{data[field]}"
                    logger.info(f"Color {field} actualizado: {data[field]}")
        
        logger.info("Validación completada exitosamente")
        logger.info("="*50)
        return data

    def to_representation(self, instance):
        logger.info("="*50)
        logger.info("INICIO DE REPRESENTACIÓN")
        logger.info(f"Instancia a representar: {instance}")
        
        data = super().to_representation(instance)
        logger.info(f"Datos base: {data}")
        
        # Asegurarse de que el campo publicado sea un booleano
        data['publicado'] = bool(data['publicado'])
        logger.info(f"Campo publicado convertido: {data['publicado']}")
        
        # Asegurarse de que los campos opcionales no sean None
        for field in ['descripcion', 'tema', 'color_primario', 'color_secundario', 'color_texto', 'color_fondo']:
            if data[field] is None:
                logger.info(f"Campo {field} es None, estableciendo como vacío")
                data[field] = ''
        
        logger.info(f"Datos finales: {data}")
        logger.info("="*50)
        return data

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'imagen']

class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio',
            'stock', 'categoria', 'categoria_nombre', 'imagen'
        ]

    def validate_stock(self, value):
        logger.info(f"Debug - Stock recibido en serializer: {value}")
        logger.info(f"Debug - Tipo de dato del stock: {type(value)}")
        return value

    def create(self, validated_data):
        logger.info(f"Debug - Creando producto con datos: {validated_data}")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        logger.info(f"Debug - Actualizando producto {instance.id} con datos: {validated_data}")
        return super().update(instance, validated_data)

class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.SerializerMethodField()
    producto_imagen = serializers.SerializerMethodField()
    producto_eliminado = serializers.SerializerMethodField()

    class Meta:
        model = DetallePedido
        fields = [
            'id', 'producto', 'producto_nombre', 'producto_imagen', 
            'cantidad', 'precio_unitario', 'subtotal', 'producto_eliminado'
        ]
    
    def get_producto_nombre(self, obj):
        # Usar el nombre guardado en el detalle si el producto no existe o está eliminado
        if obj.producto is None or (hasattr(obj.producto, 'eliminado') and obj.producto.eliminado):
            return obj.nombre_producto or "Producto no disponible"
        return obj.producto.nombre
    
    def get_producto_imagen(self, obj):
        # Devolver la imagen del producto si existe y no está eliminado
        if obj.producto and (not hasattr(obj.producto, 'eliminado') or not obj.producto.eliminado):
            return obj.producto.imagen.url if obj.producto.imagen else None
        return None
    
    def get_producto_eliminado(self, obj):
        # Indicar si el producto ha sido eliminado lógicamente
        return obj.producto is None or (hasattr(obj.producto, 'eliminado') and obj.producto.eliminado)

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.username', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    tienda_nombre = serializers.CharField(source='tienda.nombre', read_only=True)  # NUEVO

    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cliente_nombre', 'fecha_creacion', 'fecha_actualizacion',
            'estado', 'estado_display', 'total', 'direccion_entrega', 'telefono',
            'metodo_pago', 'metodo_pago_display', 'notas', 'codigo_seguimiento',
            'detalles', 'tienda_nombre'  # Asegúrate de incluir aquí
        ]
        read_only_fields = ['total']


class NotificacionPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificacionPedido
        fields = ['id', 'pedido', 'mensaje', 'fecha', 'leido']

from rest_framework import serializers
from tienda.models import Tienda
from UsersTiendaPublica.models import UsersTiendaPublica
from .models import PedidoPublico, DetallePedidoPublico

class DetallePedidoPublicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePedidoPublico
        exclude = ['pedido']

class PedidoPublicoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoPublicoSerializer(many=True)
    usuario = serializers.PrimaryKeyRelatedField(queryset=UsersTiendaPublica.objects.all())
    cliente_nombre = serializers.SerializerMethodField(read_only=True)
    direccion_entrega = serializers.CharField(source='direccion', read_only=True)
    fecha_creacion = serializers.DateTimeField(source='fecha', format="%Y-%m-%d %H:%M:%S", read_only=True)
    metodo_pago_display = serializers.SerializerMethodField(read_only=True)

    tienda = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=Tienda.objects.all(),
        write_only=True
    )

    class Meta:
        model = PedidoPublico
        fields = [
            'id', 'nombre', 'apellido', 'ci', 'ciudad', 'provincia', 'direccion',
            'referencia', 'telefono', 'correo', 'notas', 'metodo_pago', 'total',
            'fecha', 'estado', 'codigo_seguimiento', 'usuario', 'detalles',
            'cliente_nombre', 'direccion_entrega', 'fecha_creacion',
            'metodo_pago_display', 'tienda'
        ]
        read_only_fields = ('estado', 'codigo_seguimiento')

    def get_cliente_nombre(self, obj):
        return f"{obj.nombre} {obj.apellido}"

    def get_metodo_pago_display(self, obj):
        mapa = {
            'transferencia': 'Transferencia Bancaria',
            'efectivo': 'Pago en Efectivo',
            'qr': 'Pago con QR',
            'tarjeta': 'Tarjeta de Débito/Crédito',
        }
        return mapa.get(obj.metodo_pago.lower(), obj.metodo_pago.capitalize())

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        usuario = validated_data.get('usuario')
        tienda = validated_data.get('tienda')

        if not usuario:
            raise serializers.ValidationError({"usuario": ["Usuario no proporcionado"]})
        if not tienda:
            raise serializers.ValidationError({"tienda": ["Tienda no proporcionada"]})

        pedido = PedidoPublico.objects.create(**validated_data)

        for detalle in detalles_data:
            DetallePedidoPublico.objects.create(pedido=pedido, **detalle)

        return pedido

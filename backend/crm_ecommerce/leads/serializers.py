from rest_framework import serializers
from .models import Lead, InteraccionLead

class InteraccionLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteraccionLead
        fields = '__all__'

class LeadSerializer(serializers.ModelSerializer):
    interacciones = InteraccionLeadSerializer(many=True, read_only=True)
    estado_display = serializers.SerializerMethodField()
    ultima_interaccion = serializers.SerializerMethodField()
    tenant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'usuario', 'nombre', 'email', 'telefono', 'estado', 'estado_display',
            'fecha_creacion', 'ultima_actualizacion', 'notas', 'tienda', 'tenant',
            'valor_estimado', 'probabilidad', 'fuente', 'total_compras',
            'valor_total_compras', 'ultima_compra', 'frecuencia_compra',
            'interacciones', 'ultima_interaccion'
        ]
        read_only_fields = ('tenant',)

    def get_estado_display(self, obj):
        return dict(Lead.ESTADOS).get(obj.estado, obj.estado)

    def get_ultima_interaccion(self, obj):
        ultima = obj.interacciones.first()
        if ultima:
            return {
                'tipo': ultima.tipo,
                'fecha': ultima.fecha,
                'descripcion': ultima.descripcion
            }
        return None

    def create(self, validated_data):
        # Asignar automáticamente el tenant del usuario actual
        request = self.context.get('request')
        if request and hasattr(request, 'user') and hasattr(request.user, 'tenant'):
            validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)
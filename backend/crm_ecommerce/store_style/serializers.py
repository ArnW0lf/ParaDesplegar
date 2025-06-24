from rest_framework import serializers
from .models import StoreStyle, BloqueBienvenida
from tienda.models import Tienda

class BloqueBienvenidaSerializer(serializers.ModelSerializer):
    style = serializers.PrimaryKeyRelatedField(queryset=StoreStyle.objects.all(), required=True)
    imagen = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = BloqueBienvenida
        fields = ['id', 'tipo', 'titulo', 'descripcion', 'imagen', 'style']


class StoreStyleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    bloques = BloqueBienvenidaSerializer(many=True, required=False)

    class Meta:
        model = StoreStyle
        fields = [
            'id',
            'color_primario',
            'color_secundario',
            'color_texto',
            'color_fondo',
            'tipo_fuente',
            'tema',
            'vista_producto',
            'tema_plantilla',
            'bloques',
        ]

    def update(self, instance, validated_data):
        bloques_data = validated_data.pop('bloques', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if bloques_data is not None:
            ids_recibidos = []
            for bloque_data in bloques_data:
                bloque_id = bloque_data.get("id")
                bloque_data.pop("style", None)

                if bloque_id:
                    try:
                        bloque = BloqueBienvenida.objects.get(id=bloque_id, style=instance)
                        for attr, val in bloque_data.items():
                            setattr(bloque, attr, val)
                        bloque.save()
                        ids_recibidos.append(bloque.id)
                    except BloqueBienvenida.DoesNotExist:
                        pass
                else:
                    nuevo = BloqueBienvenida.objects.create(style=instance, **bloque_data)
                    ids_recibidos.append(nuevo.id)

            instance.bloques.exclude(id__in=ids_recibidos).delete()

        return instance


class StorePublicSerializer(serializers.ModelSerializer):
    style = serializers.SerializerMethodField()

    class Meta:
        model = Tienda
        fields = ['nombre', 'logo', 'style']

    def get_style(self, obj):
        if hasattr(obj, 'style'):
            bloques = obj.style.bloques.all()
            return {
                'color_primario': obj.style.color_primario,
                'color_secundario': obj.style.color_secundario,
                'color_texto': obj.style.color_texto,
                'color_fondo': obj.style.color_fondo,
                'tipo_fuente': obj.style.tipo_fuente,
                'tema': obj.style.tema,
                'vista_producto': obj.style.vista_producto,
                'tema_plantilla': obj.style.tema_plantilla,
                'bloques_bienvenida': BloqueBienvenidaSerializer(bloques, many=True).data,
            }
        return {}

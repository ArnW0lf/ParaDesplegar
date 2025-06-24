from rest_framework import serializers
from .models import Category
import logging

logger = logging.getLogger(__name__)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']
        read_only_fields = ['id']

    def validate_name(self, value):
        logger.info(f"Validando nombre de categoría: {value}")
        if not value or not value.strip():
            raise serializers.ValidationError("El nombre de la categoría no puede estar vacío")
        return value.strip()

    def create(self, validated_data):
        logger.info(f"Creando categoría con datos: {validated_data}")
        request = self.context.get('request')
        tenant = getattr(request, 'tenant', None)
        
        logger.info(f"Tenant obtenido: {tenant}")
        
        if not tenant:
            logger.error("No se pudo determinar el tenant")
            raise serializers.ValidationError("No se pudo determinar el tenant")
        
        # Verificar si ya existe una categoría con el mismo nombre para este tenant
        if Category.objects.filter(tenant=tenant, name=validated_data['name']).exists():
            logger.error(f"Ya existe una categoría con el nombre: {validated_data['name']}")
            raise serializers.ValidationError("Ya existe una categoría con este nombre")
        
        try:
            category = Category.objects.create(tenant=tenant, **validated_data)
            logger.info(f"Categoría creada exitosamente: {category}")
            return category
        except Exception as e:
            logger.error(f"Error al crear la categoría: {str(e)}")
            raise serializers.ValidationError(f"Error al crear la categoría: {str(e)}")

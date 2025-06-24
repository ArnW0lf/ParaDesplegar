# UsersTiendaPublica/serializers.py

from rest_framework import serializers
from .models import UsersTiendaPublica
from tienda.models import Tienda

class UsersTiendaPublicaSerializer(serializers.ModelSerializer):
    tienda_slug = serializers.CharField(write_only=True)

    class Meta:
        model = UsersTiendaPublica
        fields = ['email', 'first_name', 'last_name', 'password', 'tienda_slug']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        slug = data.get('tienda_slug')
        email = data.get('email')

        try:
            tienda = Tienda.objects.get(slug=slug)
        except Tienda.DoesNotExist:
            raise serializers.ValidationError("La tienda especificada no existe.")

        if UsersTiendaPublica.objects.filter(email=email, tienda=tienda).exists():
            raise serializers.ValidationError("Este correo ya está registrado en esta tienda.")

        return data

    def create(self, validated_data):
        slug = validated_data.pop('tienda_slug')
        tienda = Tienda.objects.get(slug=slug)
        return UsersTiendaPublica.objects.create_user(
            tienda=tienda,
            **validated_data
        )

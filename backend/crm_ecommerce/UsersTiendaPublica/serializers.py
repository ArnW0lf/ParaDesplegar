# UsersTiendaPublica/serializers.py

from rest_framework import serializers
from .models import UsersTiendaPublica
from tienda.models import Tienda
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    tienda_slug = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        slug = attrs.get("tienda_slug")

        try:
            tienda = Tienda.objects.get(slug=slug)
        except Tienda.DoesNotExist:
            raise serializers.ValidationError({"tienda_slug": ["Tienda no encontrada."]})

        try:
            user = UsersTiendaPublica.objects.get(email=email, tienda=tienda)
        except UsersTiendaPublica.DoesNotExist:
            raise serializers.ValidationError({"email": ["Usuario no registrado en esta tienda."]})

        if not user.check_password(password):
            raise serializers.ValidationError({"password": ["Contraseña incorrecta."]})

        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user_id": user.id,
            "email": user.email,
            "slug": tienda.slug,
            "message": "Login exitoso",
        }


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

class TokenPublicUserSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Incluye user_id y correo
        token['user_id'] = user.id
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_id'] = self.user.id
        data['email'] = self.user.email
        return data
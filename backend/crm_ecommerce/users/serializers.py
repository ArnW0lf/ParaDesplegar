from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    tenant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'password', 'first_name', 'last_name', 'role',
            'company_name', 'phone', 'country', 'language', 'company_size', 'interest',
            'profile_picture', 'preferred_language', 'bio', 'birth_date', 'address',
            'city', 'postal_code', 'updated_at', 'tenant'
        )
        read_only_fields = ('id', 'tenant', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        tenant = getattr(request.user, 'tenant', None) if request else None

        user = CustomUser.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'cliente'),
            company_name=validated_data.get('company_name', ''),
            phone=validated_data.get('phone', ''),
            country=validated_data.get('country', ''),
            language=validated_data.get('language', ''),
            company_size=validated_data.get('company_size', ''),
            interest=validated_data.get('interest', ''),
            profile_picture=validated_data.get('profile_picture'),
            preferred_language=validated_data.get('preferred_language', 'es'),
            bio=validated_data.get('bio', ''),
            birth_date=validated_data.get('birth_date'),
            address=validated_data.get('address', ''),
            city=validated_data.get('city', ''),
            postal_code=validated_data.get('postal_code', ''),
            tenant=tenant
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    tenant_id = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'profile_picture', 'preferred_language', 'bio', 'birth_date',
            'address', 'city', 'postal_code', 'phone', 'country',
            'company_name', 'company_size', 'interest', 'updated_at', 'role',
            'tenant_id'
        )
        read_only_fields = ('id', 'username', 'email', 'updated_at', 'tenant_id')

    def get_tenant_id(self, obj):
        return obj.tenant_id if hasattr(obj, 'tenant_id') else None

class UserProfilePictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('profile_picture',)

class UsuarioInternoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate_email(self, value):
        request = self.context.get('request')
        tenant = getattr(request.user, 'tenant', None)

        if CustomUser.objects.filter(email=value, tenant=tenant).exists():
            raise serializers.ValidationError("Ya existe un usuario con este correo en esta tienda.")

        return value

    def create(self, validated_data):
        request = self.context.get('request')
        tenant = getattr(request.user, 'tenant', None)

        user = CustomUser.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            role=validated_data['role'],
            tenant=tenant
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
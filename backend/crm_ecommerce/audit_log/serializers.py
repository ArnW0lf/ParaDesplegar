from rest_framework import serializers
from .models import AuditLog
from django.contrib.auth import get_user_model

User = get_user_model()

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user',
            'user_name',
            'action',
            'action_display',
            'description',
            'ip_address',
            'user_agent',
            'metadata',
            'created_at',
            'tenant'
        ]
        read_only_fields = ('tenant',)
    
    def create(self, validated_data):
        # Obtener el tenant del usuario autenticado
        request = self.context.get('request')
        if request and hasattr(request, 'user') and hasattr(request.user, 'tenant'):
            validated_data['tenant'] = request.user.tenant
        
        # Obtener la dirección IP del usuario
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            validated_data['ip_address'] = ip
            
            # Obtener el user_agent
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT')
        
        # Si no se proporciona un usuario, usar el usuario autenticado
        if 'user' not in validated_data and request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        return super().create(validated_data)

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return "Usuario eliminado"

    def get_action_display(self, obj):
        return obj.get_action_display() 
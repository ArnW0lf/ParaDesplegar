from rest_framework import serializers
from .models import Backup

class BackupSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    tenant_id = serializers.IntegerField(source='user.tenant_id', read_only=True)
    
    class Meta:
        model = Backup
        fields = ['id', 'user', 'user_id', 'username', 'email', 'tenant_id', 'created_at', 'status', 'file', 'size', 'description']
        read_only_fields = ['id', 'user', 'user_id', 'username', 'email', 'tenant_id', 'created_at', 'status', 'file', 'size']


class BackupAdminSerializer(BackupSerializer):
    """Serializador para administradores con más información"""
    user_info = serializers.SerializerMethodField()
    
    class Meta(BackupSerializer.Meta):
        fields = BackupSerializer.Meta.fields + ['user_info']
    
    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'name': f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        }
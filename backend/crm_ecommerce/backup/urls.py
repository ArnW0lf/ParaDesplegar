from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .views import BackupViewSet

User = get_user_model()

router = DefaultRouter()
router.register(r'backups', BackupViewSet, basename='backup')

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users_for_backup(request):
    """Lista de usuarios para el selector de administrador"""
    users = User.objects.filter(is_active=True).values('id', 'email', 'first_name', 'last_name')
    return Response(users)

urlpatterns = [
    path('', include(router.urls)),
    path('admin/users/', list_users_for_backup, name='backup-admin-users'),
]

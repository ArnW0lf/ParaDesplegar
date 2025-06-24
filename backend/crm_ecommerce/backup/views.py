from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Backup
from .serializers import BackupSerializer, BackupAdminSerializer
from django.core.exceptions import PermissionDenied

class IsAdminOrSelf(permissions.BasePermission):
    """
    Permite a los administradores realizar cualquier acción y a los usuarios normales
    solo ver y modificar sus propios recursos.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Los administradores pueden ver/modificar cualquier backup
        if request.user.is_staff or request.user.has_perm('backup.can_manage_all_backups'):
            return True
        # Los usuarios solo pueden ver/modificar sus propios backups
        return obj.user == request.user

class BackupViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite gestionar los backups.
    Los administradores pueden ver y gestionar todos los backups.
    Los usuarios normales solo pueden ver y gestionar sus propios backups.
    """
    permission_classes = [IsAdminOrSelf]
    filterset_fields = ['user', 'status', 'backup_type', 'created_at']
    search_fields = ['description', 'user__email', 'notes']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at', 'user__email', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Usar AdminBackupSerializer para administradores, BackupSerializer para usuarios normales"""
        if self.request.user.is_staff or self.request.user.has_perm('backup.can_manage_all_backups'):
            return BackupAdminSerializer
        return BackupSerializer

    def get_queryset(self):
        """
        Los administradores ven todos los backups, los usuarios solo los suyos.
        Permite filtrar por usuario para administradores.
        """
        queryset = Backup.objects.all()
        
        # Si no es administrador, filtrar solo los backups del usuario
        if not (self.request.user.is_staff or self.request.user.has_perm('backup.can_manage_all_backups')):
            queryset = queryset.filter(user=self.request.user)
        
        # Filtrar por usuario si se especifica (solo para administradores)
        user_id = self.request.query_params.get('user_id')
        if user_id and (self.request.user.is_staff or self.request.user.has_perm('backup.can_manage_all_backups')):
            queryset = queryset.filter(user_id=user_id)
            
        return queryset.select_related('user', 'created_by')

    def perform_create(self, serializer):
        """
        Crear un nuevo backup.
        Los administradores pueden crear backups para cualquier usuario.
        """
        if self.request.user.is_staff or self.request.user.has_perm('backup.can_manage_all_backups'):
            # Si es administrador, usar el user_id proporcionado o el usuario actual
            user_id = self.request.data.get('user')
            if not user_id:
                user = self.request.user
            else:
                user = get_user_model().objects.get(pk=user_id)
        else:
            # Usuario normal solo puede crear backups para sí mismo
            user = self.request.user
            
        backup = serializer.save(
            user=user,
            created_by=self.request.user,
            backup_type='admin' if (self.request.user.is_staff or self.request.user.has_perm('backup.can_manage_all_backups')) else 'manual'
        )
        
        # Generar el archivo ZIP
        try:
            backup.create_backup_zip()
        except Exception as e:
            backup.delete()  # Eliminar el backup si falla la creación del ZIP
            raise e  # Propagar el error para que DRF lo maneje
            
    def destroy(self, request, *args, **kwargs):
        """Eliminar un backup"""
        try:
            instance = self.get_object()
            
            # Verificar que el usuario puede eliminar este backup
            if instance.user != request.user:
                raise PermissionDenied("No tienes permiso para eliminar este backup")
                
            # Eliminar el archivo asociado si existe
            if instance.file:
                instance.file.delete(save=False)
                
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaurar un backup"""
        backup = self.get_object()
        
        # Verificar que el usuario puede restaurar este backup
        if backup.user != request.user:
            raise PermissionDenied("Solo el usuario que creó el backup puede restaurarlo")
            
        try:
            backup.restore_backup()
            return Response({'message': 'Backup restaurado exitosamente'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def restore_from_file(self, request):
        """Restaurar un backup desde un archivo ZIP"""
        try:
            # Verificar que el usuario está autenticado
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Usuario no autenticado'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Verificar que se ha subido un archivo
            file = request.FILES.get('file')
            if not file:
                return Response(
                    {'error': 'No se ha proporcionado un archivo ZIP'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar que el archivo es un ZIP
            if not file.name.endswith('.zip'):
                return Response(
                    {'error': 'Solo se aceptan archivos ZIP'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear un Backup temporal para la restauración
            backup = Backup.objects.create(
                user=request.user,
                status='pending',
                file=file,
                description='Restauración manual'
            )

            # Intentar restaurar el backup
            try:
                backup.restore_backup()
                return Response(
                    {'success': True, 'message': 'Restauración completada exitosamente'},
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                # Si falla la restauración, eliminar el backup temporal
                backup.delete()
                raise e

        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Descargar un backup específico"""
        backup = self.get_object()
        
        # Verificar que el usuario esté autenticado y tenga permisos
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Se requiere autenticación'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        if backup.user != request.user:
            return Response(
                {'error': 'No tienes permisos para descargar este backup'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verificar que el archivo existe
        if not backup.file:
            return Response(
                {'error': 'El archivo de backup no existe'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Abrir el archivo en modo binario
            file_handle = backup.file.open('rb')
            
            # Crear una respuesta con el archivo
            from wsgiref.util import FileWrapper
            from django.http import HttpResponse
            
            response = HttpResponse(
                FileWrapper(file_handle),
                content_type='application/zip'
            )
            
            # Configurar los encabezados para la descarga
            filename = backup.file.name.split('/')[-1]
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = backup.file.size
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al leer el archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from .models import AuditLog
from .serializers import AuditLogSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import mixins

class AuditLogViewSet(mixins.CreateModelMixin,
                     mixins.RetrieveModelMixin,
                     mixins.ListModelMixin,
                     viewsets.GenericViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        """Extra contexto para el serializador."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        # Obtener el tenant del usuario actual
        tenant = self.request.user.tenant
        
        # Filtrar por tenant
        queryset = AuditLog.objects.filter(tenant=tenant)
        
        # Filtrar por tipo de acción
        action_type = self.request.query_params.get('action', None)
        if action_type:
            queryset = queryset.filter(action=action_type)
            
        # Filtrar por rango de fechas
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
            
        # Filtrar por usuario (solo usuarios del mismo tenant)
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id, user__tenant=tenant)
            
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'])
    def actions(self, request):
        """Obtener los tipos de acciones disponibles"""
        actions = dict(AuditLog.ACTION_CHOICES)
        return Response(actions)

    @action(detail=False, methods=['get'])
    def report(self, request):
        """Generar reporte de actividad"""
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        queryset = self.get_queryset()
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
            
        total_actions = queryset.count()
        actions_by_type = queryset.values('action').annotate(count=Count('id'))
        actions_by_user = queryset.values('user__username').annotate(count=Count('id'))
        
        return Response({
            'total_actions': total_actions,
            'actions_by_type': {item['action']: item['count'] for item in actions_by_type},
            'actions_by_user': {item['user__username']: item['count'] for item in actions_by_user}
        })

    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        """Obtener actividad de un usuario específico"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'error': 'Se requiere el ID del usuario'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verificar que el usuario pertenezca al mismo tenant
        tenant = self.request.user.tenant
        queryset = self.get_queryset().filter(user_id=user_id, user__tenant=tenant)
        
        if not queryset.exists():
            return Response(
                {'error': 'Usuario no encontrado o no pertenece a tu organización'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data) 
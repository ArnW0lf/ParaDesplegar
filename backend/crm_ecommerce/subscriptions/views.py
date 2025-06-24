from datetime import timedelta
from django.db import connection
from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer

# Vista base para planes
class BasePlanView(generics.ListAPIView):
    """
    Vista base para listar planes (pública)
    """
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Plan.objects.filter(is_active=True).order_by('price')

# Vista para la API tradicional
@api_view(['GET'])
@permission_classes([AllowAny])
def public_plans(request):
    """
    Endpoint para obtener la lista de planes públicos
    """
    plans = Plan.objects.filter(is_active=True).order_by('price')
    serializer = PlanSerializer(plans, many=True)
    return Response(serializer.data)

# Vista para administrar planes (requiere autenticación)
class PlanViewSet(viewsets.ModelViewSet):
    """
    Vista para gestionar planes (requiere autenticación)
    """
    queryset = Plan.objects.none()  # Se sobrescribe en get_queryset
    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Plan.objects.filter(is_active=True).order_by('price')

# Vista para gestionar suscripciones
class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    Vista para gestionar suscripciones
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        # Calcular fechas de inicio y fin
        start_date = timezone.now()
        plan = serializer.validated_data['plan']
        
        if plan.plan_type == 'mensual':
            end_date = start_date + timedelta(days=30)
        else:  # anual
            end_date = start_date + timedelta(days=365)


        # Crear suscripción con período de prueba
        trial_end_date = start_date + timedelta(days=14)  # 14 días de prueba
        
        serializer.save(
            tenant=self.request.tenant,
            start_date=start_date,
            end_date=end_date,
            trial_end_date=trial_end_date,
            status='trial'
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        subscription = self.get_object()
        subscription.status = 'cancelled'
        subscription.save()
        return Response({'status': 'subscription cancelled'})

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        subscription = self.get_object()
        plan = subscription.plan
        
        # Calcular nueva fecha de fin
        if plan.plan_type == 'mensual':
            new_end_date = subscription.end_date + timedelta(days=30)
        else:  # anual
            new_end_date = subscription.end_date + timedelta(days=365)
        
        subscription.end_date = new_end_date
        subscription.status = 'active'
        subscription.save()
        
        return Response({'status': 'subscription renewed'})

    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        subscription = self.get_object()
        return Response({
            'products_count': subscription.products_count,
            'max_products': subscription.plan.max_products,
            'users_count': subscription.users_count,
            'max_users': subscription.plan.max_users,
            'storage_used': subscription.storage_used,
            'max_storage': subscription.plan.max_storage,
        })
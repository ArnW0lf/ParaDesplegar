from datetime import datetime, timedelta
from django.db import connection, transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from tenants.utils import set_schema, get_schema_name
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
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo muestra las suscripciones del tenant actual
        if hasattr(self.request, 'tenant') and self.request.tenant:
            return Subscription.objects.filter(tenant=self.request.tenant)
        return Subscription.objects.none()

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Obtiene la suscripción actual del tenant"""
        subscription = self.get_queryset().first()
        if not subscription:
            return Response(
                {'detail': 'No se encontró ninguna suscripción para este tenant'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def cancel(self, request):
        """Cancela la suscripción actual"""
        subscription = self.get_queryset().first()
        if not subscription:
            return Response(
                {'detail': 'No se encontró ninguna suscripción para cancelar'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        subscription.status = 'cancelled'
        subscription.save()
        
        return Response({
            'status': 'success',
            'message': 'Suscripción cancelada exitosamente',
            'subscription': self.get_serializer(subscription).data
        })

    @action(detail=False, methods=['get'])
    def usage(self, request):
        """Obtiene el uso actual de la suscripción"""
        subscription = self.get_queryset().first()
        if not subscription:
            return Response(
                {'detail': 'No se encontró ninguna suscripción'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'products': {
                'used': subscription.products_count,
                'limit': subscription.plan.max_products,
                'remaining': max(0, subscription.plan.max_products - subscription.products_count)
            },
            'users': {
                'used': subscription.users_count,
                'limit': subscription.plan.max_users,
                'remaining': max(0, subscription.plan.max_users - subscription.users_count)
            },
            'storage': {
                'used': float(subscription.storage_used),
                'limit': subscription.plan.max_storage,
                'remaining': max(0, subscription.plan.max_storage - float(subscription.storage_used))
            },
            'is_trial': subscription.is_trial,
            'trial_end_date': subscription.trial_end_date,
            'end_date': subscription.end_date,
            'status': subscription.status
        })

class SimulatePaymentView(APIView):
    """
    Vista para simular pagos en modo sandbox
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        plan_id = request.data.get('plan_id')
        
        if not plan_id:
            return Response(
                {'error': 'plan_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que el usuario tenga un tenant asignado
        if not hasattr(request, 'tenant') or not request.tenant:
            return Response(
                {'error': 'No se encontró un tenant asociado a tu cuenta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Cambiar al esquema público para buscar el plan
            current_schema = get_schema_name()
            set_schema('public')
            plan = Plan.objects.get(id=plan_id, is_active=True)
            # Volver al esquema del tenant
            set_schema(current_schema)
        except Plan.DoesNotExist:
            # Asegurarse de volver al esquema original en caso de error
            if 'current_schema' in locals():
                set_schema(current_schema)
            return Response(
                {'error': 'Plan no encontrado o inactivo'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Usamos una transacción atómica
        with transaction.atomic():
            # Calculamos las fechas
            now = timezone.now()
            
            # Si es un plan de prueba, establecemos 30 días de prueba
            is_trial = plan.name.lower() == 'prueba' or 'free' in plan.name.lower()
            
            if is_trial:
                end_date = now + timedelta(days=30)
                status_value = 'trial'
                trial_end_date = end_date
            else:
                # Para planes pagos, establecemos la duración según el tipo de plan
                months = plan.duration_months or 1
                end_date = now + timedelta(days=30 * months)
                status_value = 'active'
                trial_end_date = None
            
            # Creamos o actualizamos la suscripción
            subscription, created = Subscription.objects.update_or_create(
                tenant=request.tenant,
                defaults={
                    'plan': plan,
                    'status': status_value,
                    'start_date': now,
                    'end_date': end_date,
                    'trial_end_date': trial_end_date,
                    'payment_method': 'sandbox',
                    'last_payment_date': now,
                    'next_payment_date': end_date,
                }
            )
            
            # Actualizamos el tenant si es necesario
            tenant = request.tenant
            if not tenant.is_active:
                tenant.is_active = True
                tenant.save()
            
            serializer = SubscriptionSerializer(subscription)
            return Response({
                'status': 'success',
                'message': 'Pago simulado exitosamente' if not is_trial else 'Prueba activada exitosamente',
                'subscription': serializer.data,
                'is_trial': is_trial,
                'trial_end_date': trial_end_date.isoformat() if trial_end_date else None,
                'end_date': end_date.isoformat(),
            })
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request, 'tenant') and self.request.tenant:
            return Subscription.objects.filter(tenant=self.request.tenant)
        return Subscription.objects.none()

    def perform_create(self, serializer):
        # Verificar que el usuario tenga un tenant asignado
        if not hasattr(self.request, 'tenant') or not self.request.tenant:
            raise serializers.ValidationError('No se encontró un tenant asociado a tu cuenta')
            
        # Calcular fechas de inicio y fin
        start_date = timezone.now()
        plan = serializer.validated_data['plan']
        
        if plan.plan_type == 'mensual':
            end_date = start_date + timedelta(days=30)
        else:  # anual
            end_date = start_date + timedelta(days=365)

        # Crear suscripción con período de prueba
        trial_end_date = start_date + timedelta(days=14)  # 14 días de prueba
        
        # Guardar la suscripción
        subscription = serializer.save(
            tenant=self.request.tenant,
            start_date=start_date,
            end_date=end_date,
            trial_end_date=trial_end_date,
            status='trial',
            payment_method='manual',
            last_payment_date=start_date,
            next_payment_date=end_date
        )
        
        # Si el tenant no está activo, activarlo
        if not self.request.tenant.is_active:
            self.request.tenant.is_active = True
            self.request.tenant.save()
            
        return subscription

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
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PaymentMethod, PaymentTransaction
from .serializers import PaymentMethodSerializer, PaymentTransactionSerializer
from tenants.utils import get_current_tenant
from tienda.models import Tienda
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

class PaymentMethodViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = get_current_tenant()
        if not tenant:
            logger.warning("No se encontró tenant en PaymentMethodViewSet")
            return PaymentMethod.objects.none()
        
        # Solo obtener métodos de pago de la tienda del usuario actual
        return PaymentMethod.objects.filter(
            tenant=tenant,
            tienda__usuario=self.request.user
        )

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        if not tenant:
            raise permissions.PermissionDenied("No se encontró el tenant")
        
        # Verificar que el usuario tenga una tienda
        try:
            tienda = Tienda.objects.get(tenant=tenant, usuario=self.request.user)
            serializer.save(tenant=tenant, tienda=tienda)
        except Tienda.DoesNotExist:
            raise permissions.PermissionDenied("No tienes una tienda configurada")

    def perform_update(self, serializer):
        tenant = get_current_tenant()
        if not tenant:
            raise permissions.PermissionDenied("No se encontró el tenant")
        
        # Verificar que el método de pago pertenezca a la tienda del usuario
        payment_method = self.get_object()
        if payment_method.tenant != tenant or payment_method.tienda.usuario != self.request.user:
            raise permissions.PermissionDenied("No tienes permiso para modificar este método de pago")
        
        serializer.save()

class PaymentTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = get_current_tenant()
        if not tenant:
            logger.warning("No se encontró tenant en PaymentTransactionViewSet")
            return PaymentTransaction.objects.none()
        
        # Solo obtener transacciones de la tienda del usuario actual
        return PaymentTransaction.objects.filter(
            tenant=tenant,
            payment_method__tienda__usuario=self.request.user
        )

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        if not tenant:
            raise permissions.PermissionDenied("No se encontró el tenant")
        
        # Verificar que el método de pago pertenezca a la tienda del usuario
        payment_method = serializer.validated_data['payment_method']
        if payment_method.tenant != tenant or payment_method.tienda.usuario != self.request.user:
            raise permissions.PermissionDenied("No tienes permiso para usar este método de pago")
        
        serializer.save(tenant=tenant) 

@api_view(['GET'])
@permission_classes([AllowAny])
def metodos_pago_publicos(request, slug):
    try:
        tienda = Tienda.objects.get(slug=slug, publicado=True)
        metodos = PaymentMethod.objects.filter(tienda=tienda, is_active=True)
        serializer = PaymentMethodSerializer(metodos, many=True)
        return Response(serializer.data)
    except Tienda.DoesNotExist:
        return Response({"error": "Tienda no encontrada"}, status=404)

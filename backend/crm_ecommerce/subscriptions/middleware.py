from django.http import JsonResponse
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class SubscriptionMiddleware:
    """
    Middleware para verificar la suscripción del tenant en rutas específicas.
    Solo se activa para rutas que comienzan con '/api/subscriptions/'.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Solo verificar suscripciones en rutas que comienzan con /api/subscriptions/
        # excepto las rutas públicas
        if not request.path.startswith('/api/subscriptions/'):
            return self.get_response(request)
            
        # Rutas públicas que no requieren verificación de suscripción
        public_paths = [
            '/api/subscriptions/plans/public/',
            '/api/subscriptions/plans/base/'
        ]
        
        # Si la ruta es pública, continuar sin verificación
        if any(request.path.startswith(path) for path in public_paths):
            return self.get_response(request)
            
        # Verificar autenticación
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return JsonResponse(
                {'error': 'Se requiere autenticación'},
                status=401
            )
            
        # Verificar tenant
        if not hasattr(request, 'tenant') or not request.tenant:
            logger.warning(f'Usuario {request.user.username} no tiene tenant asignado')
            return JsonResponse(
                {'error': 'No se encontró un tenant asociado a tu cuenta'},
                status=403
            )
            
        # Verificar suscripción
        if hasattr(request.tenant, 'subscription'):
            subscription = request.tenant.subscription
            
            # Si la suscripción está activa o en prueba, permitir acceso
            if (subscription.status == 'active' and subscription.end_date > timezone.now()) or \
               (subscription.status == 'trial' and subscription.trial_end_date > timezone.now()):
                return self.get_response(request)
                
        # Si no hay suscripción o no es válida, denegar acceso
        return JsonResponse(
            {'error': 'Se requiere una suscripción activa'},
            status=402
        )

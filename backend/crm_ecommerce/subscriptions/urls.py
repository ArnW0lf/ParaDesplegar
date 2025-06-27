from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlanViewSet, 
    SubscriptionViewSet, 
    public_plans, 
    BasePlanView,
    SimulatePaymentView
)

# Configuración del router para las vistas que requieren autenticación
router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

# URLs públicas
public_urls = [
    # Versión 1 de la API pública (basada en función)
    path('plans/public/', public_plans, name='public-plans'),
    
    # Versión 2 de la API pública (basada en clase)
    path('plans/base/', BasePlanView.as_view(), name='base-plans'),
]

# URLs que requieren autenticación
urlpatterns = [
    # Incluye todas las rutas del router
    path('', include(router.urls)),
    
    # Ruta para simular pagos en modo sandbox
    path('simulate-payment/', SimulatePaymentView.as_view(), name='simulate-payment'),
]

# Agregar URLs públicas al final para que no sean anuladas
urlpatterns = public_urls + urlpatterns
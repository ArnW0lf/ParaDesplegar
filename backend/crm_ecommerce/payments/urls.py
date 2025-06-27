from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentMethodViewSet, PaymentTransactionViewSet
from .views import metodos_pago_publicos

router = DefaultRouter()
router.register(r'methods', PaymentMethodViewSet, basename='payment-method')
router.register(r'transactions', PaymentTransactionViewSet, basename='payment-transaction')

app_name = 'payments'

urlpatterns = [
    path('metodos-publicos/<slug:slug>/', metodos_pago_publicos),

    path('', include(router.urls)),
]

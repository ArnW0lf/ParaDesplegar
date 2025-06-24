from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentMethodViewSet, PaymentTransactionViewSet

router = DefaultRouter()
router.register(r'methods', PaymentMethodViewSet, basename='payment-method')
router.register(r'transactions', PaymentTransactionViewSet, basename='payment-transaction')

app_name = 'payments'

urlpatterns = [
    path('', include(router.urls)),
] 
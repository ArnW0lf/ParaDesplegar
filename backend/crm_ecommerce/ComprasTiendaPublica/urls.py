from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PedidoPublicoViewSet, GuardarCompraView, agregar_codigo_seguimiento

router = DefaultRouter()
router.register(r'', PedidoPublicoViewSet, basename='pedidos-publicos')

urlpatterns = [
    path('', include(router.urls)),
    path('guardar/', GuardarCompraView.as_view(), name='guardar-compra'),
    path('pedidos-publicos/<int:pedido_id>/agregar_codigo_seguimiento/', agregar_codigo_seguimiento),
]


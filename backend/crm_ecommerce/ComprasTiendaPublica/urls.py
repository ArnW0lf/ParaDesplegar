from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PedidoPublicoViewSet,
    GuardarCompraView,
    agregar_codigo_seguimiento,
    mis_pedidos
)

router = DefaultRouter()
router.register(r'pedidos-publicos', PedidoPublicoViewSet, basename='pedidos-publicos')

urlpatterns = [
    path('pedidos-publicos/mis-pedidos/', mis_pedidos, name='mis-pedidos'),  # 👈 debe ir primero
    path('guardar/', GuardarCompraView.as_view(), name='guardar-compra'),
    path('pedidos-publicos/<int:pedido_id>/agregar_codigo_seguimiento/', agregar_codigo_seguimiento),
    path('', include(router.urls)),  # 👈 esto debe ir al final
]

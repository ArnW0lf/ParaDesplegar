from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TiendaViewSet, CategoriaViewSet, ProductoViewSet,
    PedidoViewSet, NotificacionPedidoViewSet
)

router = DefaultRouter()
router.register(r'tiendas', TiendaViewSet, basename='tienda')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'pedidos', PedidoViewSet, basename='pedido')
router.register(r'notificaciones-pedido', NotificacionPedidoViewSet, basename='notificacion-pedido')

# Agregar rutas personalizadas para las acciones del TiendaViewSet
tienda_urls = [
    path('tiendas/config/', TiendaViewSet.as_view({
        'get': 'config',
        'patch': 'config'
    }), name='tienda-config'),
    path('tiendas/<str:pk>/public_store/', TiendaViewSet.as_view({
        'get': 'public_store'
    }), name='tienda-public-store'),
    path('tiendas/<str:pk>/public_products/', TiendaViewSet.as_view({
        'get': 'public_products'
    }), name='tienda-public-products'),
    path('tiendas/<str:pk>/public_categories/', TiendaViewSet.as_view({
        'get': 'public_categories'
    }), name='tienda-public-categories'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('', include(tienda_urls)),
]

from rest_framework.routers import DefaultRouter
from .views import StoreStyleViewSet, PublicStoreWithStyleView, BloqueBienvenidaViewSet
from django.urls import path, include
from store_style.views import estilo_publico

router = DefaultRouter()
router.register(r'bloques', BloqueBienvenidaViewSet, basename='bloques')
router.register(r'privado', StoreStyleViewSet, basename='store-style')  # cambia el path a evitar conflicto con /estilos-publicos/

urlpatterns = [
    path('tiendas/<slug:slug>/public_store/', PublicStoreWithStyleView.as_view(), name='store-style-public'),
    path('estilos-publicos/<slug:slug>/', estilo_publico, name='estilo-publico'),
    path('', include(router.urls)),
]


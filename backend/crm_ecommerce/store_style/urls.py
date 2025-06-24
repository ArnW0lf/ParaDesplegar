from rest_framework.routers import DefaultRouter
from .views import StoreStyleViewSet, PublicStoreWithStyleView, BloqueBienvenidaViewSet
from django.urls import path, include

router = DefaultRouter()
router = DefaultRouter()
router.register(r'bloques', BloqueBienvenidaViewSet, basename='bloques')  # primero
router.register(r'', StoreStyleViewSet, basename='store-style')  # después

urlpatterns = [
    path('tiendas/<slug:slug>/public_store/', PublicStoreWithStyleView.as_view(), name='store-style-public'),
    path('', include(router.urls)),
]

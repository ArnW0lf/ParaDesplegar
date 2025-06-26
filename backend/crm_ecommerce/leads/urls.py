from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, LeadInteraccionesView, LeadEmailsView, CrearLeadDesdeTiendaView

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')

# URLs que no requieren autenticación
public_urls = [
    path('leads/crear-desde-tienda/', CrearLeadDesdeTiendaView.as_view(), name='crear-lead-desde-tienda'),
]

# URLs que requieren autenticación
auth_urls = [
    path('', include(router.urls)),
    path('leads/<int:lead_id>/interacciones/', LeadInteraccionesView.as_view(), name='lead-interacciones'),
    path('leads/emails/', LeadEmailsView.as_view(), name='lead-emails'),
]

urlpatterns = public_urls + auth_urls
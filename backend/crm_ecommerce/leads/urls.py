from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, LeadInteraccionesView, LeadEmailsView

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')

urlpatterns = [
    path('', include(router.urls)),
    path('leads/<int:lead_id>/interacciones/', LeadInteraccionesView.as_view(), name='lead-interacciones'),
    path('leads/emails/', LeadEmailsView.as_view(), name='lead-emails'),
]
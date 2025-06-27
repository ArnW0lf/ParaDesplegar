"""
URL configuration for crm_ecommerce project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import CustomTokenObtainPairView, RegisterView

# URLs públicas que no requieren tenant
public_urls = [
    path('api/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/subscriptions/', include('subscriptions.urls')),  # Incluye todas las rutas de suscripciones
]

# URLs que requieren autenticación
auth_required_urls = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/tiendas/', include('tienda.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),  # Otras rutas de suscripciones
    path('api/categories/', include('Category.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/users-public/', include('UsersTiendaPublica.urls')),
    path('api/', include('ComprasTiendaPublica.urls')),

    path('api/', include('leads.urls')),
    path('api/audit-logs/', include('audit_log.urls')),
    path('api/', include('backup.urls')),
    path('api/store-style/', include('store_style.urls')),
]

urlpatterns = public_urls + auth_required_urls

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

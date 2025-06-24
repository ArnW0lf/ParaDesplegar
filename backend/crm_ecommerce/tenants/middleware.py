from django.db import connection
from django.conf import settings
from .models import Tenant
from .utils import set_schema, set_current_tenant, get_current_tenant
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
import logging
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)
User = get_user_model()

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        # Lista de rutas que no requieren tenant
        public_paths = [
            '/api/subscriptions/plans/public/',
        ]
        # Intentar obtener el usuario autenticado
        try:
            # Verificar si hay un token en el header
            auth_header = request.headers.get('Authorization', '')
            logger.info(f"Auth header recibido: {auth_header}")
            
            if auth_header.startswith('Bearer '):
                try:
                    # Obtener el usuario del token
                    auth_tuple = self.jwt_auth.authenticate(request)
                    if auth_tuple is not None:
                        user, _ = auth_tuple
                        logger.info(f"Usuario autenticado: {user.username}")
                        
                        # Verificar si el usuario tiene un tenant asignado
                        if hasattr(user, 'tenant') and user.tenant:
                            logger.info(f"Tenant encontrado: {user.tenant.name}")
                            request.tenant = user.tenant
                            set_current_tenant(user.tenant)
                            set_schema(user.tenant.schema_name)
                        else:
                            logger.warning(f"Usuario {user.username} no tiene tenant asignado")
                            request.tenant = None
                            set_current_tenant(None)
                            set_schema('public')
                except (InvalidToken, TokenError) as e:
                    logger.error(f"Error de token: {str(e)}")
                    request.tenant = None
                    set_current_tenant(None)
                    set_schema('public')
                except Exception as e:
                    logger.error(f"Error al autenticar: {str(e)}")
                    request.tenant = None
                    set_current_tenant(None)
                    set_schema('public')
            else:
                logger.info("No se encontró token Bearer en el header")
                request.tenant = None
                set_current_tenant(None)
                set_schema('public')
                
        except Exception as e:
            logger.error(f"Error en TenantMiddleware: {str(e)}")
            request.tenant = None
            set_current_tenant(None)
            set_schema('public')

        response = self.get_response(request)
        return response 
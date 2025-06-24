from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken
from .models import AuditLog
import json
import logging
import jwt

logger = logging.getLogger(__name__)

User = get_user_model()

class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        """Store request body for later use"""
        if request.method == 'POST':
            try:
                request._audit_log_body = request.body
            except Exception:
                request._audit_log_body = None
        return None

    def process_response(self, request, response):
        try:
            # Obtener el token del header de autorización para requests autenticados
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    # Decodificar el token para obtener el ID del usuario
                    decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                    user_id = decoded_token.get('user_id')
                    
                    if user_id:
                        user = User.objects.get(id=user_id)
                        # Registrar todas las peticiones GET y POST
                        if request.method in ['GET', 'POST']:
                            action = 'view' if request.method == 'GET' else 'create'
                            description = f'{request.method} request to {request.path}'
                            
                            # Guardar los parámetros de la request en metadata si es POST
                            metadata = None
                            if request.method == 'POST' and hasattr(request, '_audit_log_body'):
                                try:
                                    metadata = json.loads(request._audit_log_body)
                                except:
                                    metadata = str(request._audit_log_body)
                            
                            AuditLog.objects.create(
                                user=user,
                                tenant=user.tenant,
                                action=action,
                                description=description,
                                ip_address=self.get_client_ip(request),
                                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                                metadata=metadata
                            )
                            
                            logger.info(f"Audit log created for user {user.username}: {description}")
                except jwt.ExpiredSignatureError:
                    logger.warning("Expired token detected")
                except jwt.InvalidTokenError as e:
                    logger.error(f"Invalid token: {str(e)}")
                except Exception as e:
                    logger.error(f"Error processing request: {str(e)}")
            
            return response
        except Exception as e:
            logger.error(f"Middleware error: {str(e)}")
            return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 
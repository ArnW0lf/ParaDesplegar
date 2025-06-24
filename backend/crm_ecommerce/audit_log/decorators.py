from functools import wraps
from .services import AuditLogService

def log_action(action_type, description_template=None):
    """
    Decorador para registrar acciones en la bitácora.
    
    Uso:
    @log_action('USER_CREATE', 'Usuario {user.username} creado')
    def create_user(request, *args, **kwargs):
        ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Ejecutar la vista original
            response = view_func(request, *args, **kwargs)
            
            # Obtener la descripción
            description = description_template
            if description_template:
                # Reemplazar variables en la descripción
                context = {
                    'user': request.user,
                    'request': request,
                    **kwargs
                }
                try:
                    description = description_template.format(**context)
                except KeyError:
                    description = description_template
            
            # Registrar la acción
            AuditLogService.log_action(
                user=request.user,
                tenant=request.user.tenant,
                action=action_type,
                description=description,
                ip_address=request._audit_log_info['ip_address'],
                user_agent=request._audit_log_info['user_agent']
            )
            
            return response
        return wrapped_view
    return decorator

def log_model_action(action_type, description_template=None):
    """
    Decorador para registrar acciones en modelos específicos.
    
    Uso:
    @log_model_action('STORE_UPDATE', 'Tienda {instance.nombre} actualizada')
    def update_store(request, *args, **kwargs):
        ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Ejecutar la vista original
            response = view_func(request, *args, **kwargs)
            
            # Obtener la instancia del modelo
            instance = kwargs.get('instance')
            if not instance:
                return response
            
            # Obtener la descripción
            description = description_template
            if description_template:
                # Reemplazar variables en la descripción
                context = {
                    'instance': instance,
                    'user': request.user,
                    'request': request,
                    **kwargs
                }
                try:
                    description = description_template.format(**context)
                except KeyError:
                    description = description_template
            
            # Registrar la acción
            AuditLogService.log_action(
                user=request.user,
                tenant=request.user.tenant,
                action=action_type,
                description=description,
                ip_address=request._audit_log_info['ip_address'],
                user_agent=request._audit_log_info['user_agent'],
                content_object=instance
            )
            
            return response
        return wrapped_view
    return decorator 
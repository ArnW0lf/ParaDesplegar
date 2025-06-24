import os
import json
import shutil
import importlib
from datetime import datetime, date, time
from django.apps import apps
from django.db import connection, models
from django.conf import settings
from django.core import serializers
from django.core.exceptions import AppRegistryNotReady, ImproperlyConfigured

class CustomJSONEncoder(json.JSONEncoder):
    """
    Serializador JSON personalizado que maneja varios tipos de datos comunes en Django
    """
    def default(self, obj):
        # Manejar fechas y horas
        if isinstance(obj, (datetime, date, time)):
            return obj.isoformat()
        # Manejar Decimal
        elif hasattr(obj, 'to_integral_value'):  # Para objetos Decimal
            return float(obj)
        # Manejar UUID
        elif hasattr(obj, 'hex'):
            return str(obj)
        # Manejar modelos de Django
        elif hasattr(obj, '__dict__'):
            return str(obj)
        # Manejar otros objetos que podrían tener isoformat
        elif hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return super().default(obj)

# Configurar el modelo de usuario personalizado
AUTH_USER_MODEL = getattr(settings, 'AUTH_USER_MODEL', 'users.CustomUser')

def get_user_models():
    """
    Obtiene todos los modelos relacionados con el usuario
    """
    user_models = []
    
    # Modelos principales
    user_models.extend([
        ('users', 'CustomUser', {'pk': models.F('pk')}),
        ('tienda', 'Tienda', {'usuario': models.F('pk')}),
        ('leads', 'Lead', {'usuario': models.F('pk')}),
        ('leads', 'InteraccionLead', {'lead__usuario': models.F('pk')}),
    ])
    
    # Intentar agregar modelos de tienda si existen
    try:
        from tienda.models import Producto, Categoria, Pedido, DetallePedido, NotificacionPedido
        
        # Agregar modelos de tienda con sus relaciones
        user_models.extend([
            ('tienda', 'Producto', {'tienda__usuario': models.F('pk')}),
            ('tienda', 'Categoria', {'tienda__usuario': models.F('pk')}),
            ('tienda', 'Pedido', {'tienda__usuario': models.F('pk')}),
            ('tienda', 'DetallePedido', {'pedido__tienda__usuario': models.F('pk')}),
            ('tienda', 'NotificacionPedido', {'pedido__tienda__usuario': models.F('pk')}),
            ('tienda', 'Notificacion', {'tienda__usuario': models.F('pk')}),
        ])
    except (ImportError, AppRegistryNotReady) as e:
        print(f"Advertencia: No se pudieron cargar los modelos de tienda: {e}")
    
    # Omitir modelos de pagos temporalmente
    print("Omitiendo modelos de pagos temporalmente")
    
    # Agregar modelos de ComprasTiendaPublica
    try:
        from ComprasTiendaPublica.models import PedidoPublico, DetallePedidoPublico
        user_models.extend([
            ('ComprasTiendaPublica', 'PedidoPublico', {'tienda__usuario': models.F('pk')}),
            ('ComprasTiendaPublica', 'DetallePedidoPublico', {'pedido__tienda__usuario': models.F('pk')}),
        ])
    except (ImportError, AppRegistryNotReady) as e:
        print(f"Advertencia: No se pudieron cargar los modelos de ComprasTiendaPublica: {e}")
    
    # Agregar modelos de UsersTiendaPublica
    try:
        from UsersTiendaPublica.models import UsersTiendaPublica
        user_models.append(('UsersTiendaPublica', 'UsersTiendaPublica', {'tienda__usuario': models.F('pk')}))
    except (ImportError, AppRegistryNotReady) as e:
        print(f"Advertencia: No se pudo cargar el modelo UsersTiendaPublica: {e}")
    
    return user_models

def generate_json_backup(user):
    """
    Genera archivos JSON con los datos del usuario
    """
    try:
        backup_data = {
            'metadata': {
                'version': '2.0.0',
                'created_at': datetime.now().isoformat(),
                'user': {
                    'id': user.id,
                    'username': user.email,  # Asumiendo que usas email como username
                    'email': user.email
                }
            },
            'data': {}
        }
    except Exception as e:
        print(f"Error al crear metadatos del backup: {str(e)}")
        backup_data = {'metadata': {'error': str(e)}, 'data': {}}

    # Obtener los modelos a respaldar
    models_to_backup = get_user_models()

    # Procesar cada modelo
    for app_label, model_name, filters in models_to_backup:
        try:
            # Obtener el modelo
            try:
                model = apps.get_model(app_label, model_name)
            except LookupError:
                print(f"Modelo no encontrado: {app_label}.{model_name}")
                continue
                
            # Aplicar los filtros dinámicos
            filter_kwargs = {}
            for key, value in filters.items():
                if isinstance(value, models.F):
                    filter_kwargs[key] = user.pk
                else:
                    filter_kwargs[key] = value
                    
            # Manejar el caso especial de listas para filtros 'in'
            if any(key.endswith('__in') for key in filter_kwargs.keys()):
                for key in list(filter_kwargs.keys()):
                    if key.endswith('__in') and not filter_kwargs[key]:
                        # Si la lista está vacía, no hay nada que filtrar
                        return
            
            # Obtener los datos
            queryset = model.objects.filter(**filter_kwargs)
            if not queryset.exists():
                continue

            # Serializar los datos
            model_key = f"{app_label}_{model_name}"
            
            # Usar el serializador personalizado para manejar fechas
            serialized_data = []
            for obj in queryset:
                # Convertir el objeto a diccionario
                obj_dict = {}
                for field in obj._meta.fields:
                    try:
                        value = getattr(obj, field.name)
                        # Manejar fechas y objetos similares
                        if hasattr(value, 'isoformat'):
                            value = value.isoformat()
                        elif hasattr(value, '__dict__'):
                            value = str(value)
                        obj_dict[field.name] = value
                    except Exception as e:
                        print(f"Error al serializar campo {field.name} de {app_label}.{model_name}: {str(e)}")
                
                # Agregar el ID
                obj_dict['id'] = obj.pk
                serialized_data.append(obj_dict)
            
            backup_data['data'][model_key] = serialized_data

        except Exception as e:
            print(f"Error al procesar {app_label}.{model_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            continue

    return backup_data

def save_media_files(zipf, user):
    """
    Guarda los archivos multimedia del usuario en el ZIP
    """
    media_files = []
    media_root = settings.MEDIA_ROOT
    
    # Buscar archivos de productos
    try:
        from tienda.models import Producto
        for producto in Producto.objects.filter(tienda__usuario=user):
            if producto.imagen:
                img_path = os.path.join(media_root, str(producto.imagen))
                if os.path.exists(img_path):
                    arcname = f"media/productos/{os.path.basename(str(producto.imagen))}"
                    media_files.append((img_path, arcname))
    except Exception as e:
        print(f"Advertencia al procesar imágenes de productos: {str(e)}")
    
    # Buscar logos de tienda
    try:
        from tienda.models import Tienda
        for tienda in Tienda.objects.filter(usuario=user):
            if tienda.logo and tienda.logo.name != 'logos/default_logo.png':
                logo_path = os.path.join(media_root, str(tienda.logo))
                if os.path.exists(logo_path):
                    arcname = f"media/logos/{os.path.basename(str(tienda.logo))}"
                    media_files.append((logo_path, arcname))
    except Exception as e:
        print(f"Advertencia al procesar logos de tienda: {str(e)}")
    
    # Buscar imágenes de categorías
    try:
        from tienda.models import Categoria
        for categoria in Categoria.objects.filter(tienda__usuario=user):
            if categoria.imagen:
                img_path = os.path.join(media_root, str(categoria.imagen))
                if os.path.exists(img_path):
                    arcname = f"media/categorias/{os.path.basename(str(categoria.imagen))}"
                    media_files.append((img_path, arcname))
    except Exception as e:
        print(f"Advertencia al procesar imágenes de categorías: {str(e)}")
    
    # Buscar archivos adjuntos de leads
    try:
        from leads.models import Lead, ArchivoAdjunto
        for lead in Lead.objects.filter(usuario=user):
            for adjunto in lead.archivos.all():
                if adjunto.archivo:
                    file_path = os.path.join(media_root, str(adjunto.archivo))
                    if os.path.exists(file_path):
                        arcname = f"media/adjuntos/{os.path.basename(str(adjunto.archivo))}"
                        media_files.append((file_path, arcname))
    except Exception as e:
        print(f"Advertencia al procesar archivos adjuntos: {str(e)}")
    
    # Buscar archivos de pedidos públicos si existen
    try:
        from ComprasTiendaPublica.models import PedidoPublico
        for pedido in PedidoPublico.objects.filter(tienda__usuario=user):
            # Si hay archivos adjuntos en el futuro, se pueden agregar aquí
            pass
    except Exception as e:
        print(f"Advertencia al procesar archivos de pedidos públicos: {str(e)}")
    
    # Agregar archivos al ZIP
    for file_path, arcname in media_files:
        try:
            zipf.write(file_path, arcname)
        except Exception as e:
            print(f"Error al agregar archivo {file_path} al backup: {str(e)}")
    
    return len(media_files)

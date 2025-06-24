from django.db import models, transaction, connection
from django.utils import timezone
from django.conf import settings
from django.core import serializers
from django.core.files.storage import default_storage
import os
import zipfile
from io import BytesIO
from datetime import datetime
import tempfile
import json
from django.core.exceptions import ObjectDoesNotExist
from django.utils.timezone import now
from django.apps import apps
from .backup_utils import generate_json_backup, save_media_files, CustomJSONEncoder

class Backup(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('completed', 'Completado'),
        ('failed', 'Fallido')
    ]
    
    TYPE_CHOICES = [
        ('automatic', 'Automático'),
        ('manual', 'Manual'),
        ('admin', 'Administrador')
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='backups',
        verbose_name='Usuario'
    )
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    status = models.CharField(
        'Estado', 
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    backup_type = models.CharField(
        'Tipo de respaldo',
        max_length=20,
        choices=TYPE_CHOICES,
        default='manual'
    )
    file = models.FileField(
        'Archivo', 
        upload_to='backups/', 
        null=True, 
        blank=True
    )
    size = models.BigIntegerField('Tamaño (bytes)', null=True, blank=True)
    description = models.TextField('Descripción', blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_backups',
        verbose_name='Creado por'
    )
    notes = models.TextField('Notas administrativas', blank=True)

    class Meta:
        verbose_name = 'Respaldo'
        verbose_name_plural = 'Respaldos'
        ordering = ['-created_at']
        permissions = [
            ('can_manage_all_backups', 'Puede gestionar todos los respaldos'),
        ]

    def __str__(self):
        return f"Backup {self.id} - {self.user.email} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"

    def save(self, *args, **kwargs):
        is_new = not self.pk
        
        if is_new and not self.created_by:
            self.created_by = self.user
            
        # Guardar el modelo primero para tener un ID
        super().save(*args, **kwargs)
        
        # Si es un nuevo registro y no se ha generado el archivo, generarlo
        if is_new and not self.file:
            try:
                self.create_backup_zip()
            except Exception as e:
                # Si hay un error, actualizar el estado a fallido
                self.status = 'failed'
                super().save(update_fields=['status'])
                raise e

    @property
    def size_mb(self):
        if self.size:
            return round(self.size / (1024 * 1024), 2)
        return 0

    def download_response(self):
        from django.http import FileResponse
        from wsgiref.util import FileWrapper
        import os
        
        if not self.file:
            return None
            
        response = FileResponse(
            FileWrapper(self.file),
            content_type='application/zip'
        )
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(self.file.name)}"'
        return response

    @staticmethod
    def get_backup_filename(user_id):
        """Genera un nombre único para el archivo de backup"""
        timestamp = now().strftime("%Y%m%d_%H%M%S")
        return f'backup_{user_id}_{timestamp}.zip'

    def create_backup_zip(self):
        """
        Crear un archivo ZIP con archivos JSON que contienen todos los datos del usuario.
        
        Returns:
            bool: True si el backup se creó correctamente, False en caso contrario.
        """
        self.status = 'pending'
        self.save(update_fields=['status'])
        
        try:
            # 1. Generar los datos del backup en formato JSON
            backup_data = generate_json_backup(self.user)
            if not backup_data or 'metadata' not in backup_data:
                raise ValueError("No se pudieron generar los datos del backup")
            
            # 2. Crear el archivo ZIP en memoria
            buffer = BytesIO()
            with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # 3. Agregar el archivo JSON con los datos
                zipf.writestr('data.json', json.dumps(backup_data, indent=2, ensure_ascii=False, cls=CustomJSONEncoder))
                
                # 4. Guardar archivos multimedia
                media_count = 0
                try:
                    media_count = save_media_files(zipf, self.user)
                except Exception as e:
                    print(f"Advertencia: No se pudieron guardar los archivos multimedia: {str(e)}")
                
                # 5. Actualizar metadatos
                backup_data['metadata'].update({
                    'media_files_count': media_count,
                    'format': 'json',
                    'database': settings.DATABASES['default']['NAME'],
                    'created_at': now().isoformat(),
                    'backup_type': self.backup_type,
                    'created_by': str(self.created_by) if self.created_by else 'system'
                })
                
                # 6. Guardar metadatos actualizados
                zipf.writestr('metadata.json', json.dumps(backup_data['metadata'], indent=2, ensure_ascii=False))

            # 7. Guardar el archivo ZIP en el almacenamiento
            filename = self.get_backup_filename(self.user.id)
            buffer.seek(0)  # Volver al inicio del buffer
            self.file.save(filename, buffer)
            self.size = buffer.tell()
            self.status = 'completed'
            self.save(update_fields=['file', 'size', 'status'])
            return True
                
        except Exception as e:
            # Registrar el error en los logs
            import traceback
            error_details = f"{str(e)}\n\nTraceback:\n{traceback.format_exc()}"
            print(f"Error al crear backup: {error_details}")
            
            # Actualizar el estado y guardar el error
            self.status = 'failed'
            self.notes = f"Error: {str(e)}\n\nDetalles:\n{error_details}"
            self.save(update_fields=['status', 'notes'])
            
            # Relanzar la excepción para que el llamador pueda manejarla
            raise

    def download_url(self):
        """Obtener la URL de descarga del backup"""
        if self.file:
            return self.file.url
        return None

    def restore_backup(self):
        """
        Restaura un backup desde un archivo ZIP que contiene archivos JSON
        """
        if not self.file:
            raise ValueError("No se puede restaurar un backup sin archivo")

        # Leer el archivo ZIP
        with default_storage.open(self.file.name, 'rb') as f:
            with zipfile.ZipFile(f, 'r') as zipf:
                # 1. Verificar que el archivo de datos existe
                if 'data.json' not in zipf.namelist():
                    raise ValueError("El archivo de backup no contiene datos JSON válidos")
                
                # 2. Leer metadatos
                metadata = {}
                if 'metadata.json' in zipf.namelist():
                    try:
                        metadata = json.loads(zipf.read('metadata.json').decode('utf-8'))
                    except json.JSONDecodeError as e:
                        print(f"Error al decodificar metadatos: {str(e)}")
                
                # 3. Verificar que el backup pertenece al usuario actual
                backup_user_id = metadata.get('user', {}).get('id')
                if backup_user_id and int(backup_user_id) != self.user.id:
                    raise ValueError("El backup no pertenece a este usuario")
                
                # 4. Leer los datos del backup
                try:
                    backup_data = json.loads(zipf.read('data.json').decode('utf-8'))
                except json.JSONDecodeError as e:
                    raise ValueError(f"Error al decodificar el archivo de datos: {str(e)}")
                
                # 5. Procesar la restauración en una transacción
                with transaction.atomic():
                    try:
                        # Deshabilitar triggers temporalmente para evitar problemas con claves foráneas
                        with connection.cursor() as cursor:
                            cursor.execute("SET session_replication_role = 'replica';")
                        
                        # Orden de restauración para respetar las relaciones
                        # Primero modelos de autenticación y luego los que dependen de ellos
                        restore_order = [
                            # Modelos de autenticación
                            ('auth_user', 'auth', 'User'),
                            
                            # Modelos de tienda (dependen de User)
                            ('tienda_tienda', 'tienda', 'Tienda'),
                            ('tienda_categoria', 'tienda', 'Categoria'),
                            ('tienda_producto', 'tienda', 'Producto'),
                            
                            # Modelos de pedidos (dependen de Tienda y Producto)
                            ('tienda_pedido', 'tienda', 'Pedido'),
                            ('tienda_detallepedido', 'tienda', 'DetallePedido'),
                            ('tienda_notificacionpedido', 'tienda', 'NotificacionPedido'),
                            
                            # Modelos de leads (dependen de Tienda)
                            ('leads_lead', 'leads', 'Lead'),
                            ('leads_interaccionlead', 'leads', 'InteraccionLead'),
                            
                            # Modelos de compras públicas (dependen de Tienda)
                            ('ComprasTiendaPublica_pedidopublico', 'ComprasTiendaPublica', 'PedidoPublico'),
                            ('ComprasTiendaPublica_detallepedidopublico', 'ComprasTiendaPublica', 'DetallePedidoPublico'),
                            
                            # Modelos de usuarios públicos (dependen de Tienda)
                            ('UsersTiendaPublica_userstiendapublica', 'UsersTiendaPublica', 'UsersTiendaPublica'),
                            
                            # Modelos de pagos (dependen de Tienda)
                            ('payments_paymentmethod', 'payments', 'PaymentMethod'),
                            ('payments_paymenttransaction', 'payments', 'PaymentTransaction'),
                        ]
                        
                        # Diccionario para mapear IDs antiguos a nuevos
                        id_mapping = {}
                        
                        # Restaurar datos en el orden correcto
                        for model_key, app_label, model_name in restore_order:
                            if model_key in backup_data.get('data', {}):
                                try:
                                    model = apps.get_model(app_label, model_name)
                                    model_data = backup_data['data'][model_key]
                                    
                                    if not isinstance(model_data, list):
                                        print(f"Advertencia: Datos inválidos para {model_key}, se esperaba una lista")
                                        continue
                                    
                                    print(f"Restaurando {len(model_data)} registros de {model_key}...")
                                    
                                    # Inicializar mapeo de IDs para este modelo
                                    if model_key not in id_mapping:
                                        id_mapping[model_key] = {}
                                    
                                    for item in model_data:
                                        try:
                                            # Hacer una copia para no modificar el original
                                            item_data = item.copy()
                                            
                                            # Guardar el ID original
                                            original_id = item_data.pop('id', None)
                                            
                                            # Reemplazar claves foráneas usando el mapeo
                                            for field in model._meta.fields:
                                                if field.is_relation and field.name + '_id' in item_data:
                                                    related_model = field.related_model
                                                    if related_model:
                                                        related_key = f"{related_model._meta.app_label}_{related_model._meta.model_name}"
                                                        old_related_id = item_data[field.name + '_id']
                                                        if related_key in id_mapping and old_related_id in id_mapping[related_key]:
                                                            item_data[field.name + '_id'] = id_mapping[related_key][old_related_id]
                                            
                                            # Crear el objeto
                                            obj = model(**item_data)
                                            obj.save()
                                            
                                            # Guardar el mapeo de ID antiguo a nuevo
                                            if original_id is not None:
                                                id_mapping[model_key][original_id] = obj.id
                                                
                                        except Exception as e:
                                            print(f"Error al restaurar registro en {model_key}: {str(e)}")
                                            continue
                                            
                                except Exception as e:
                                    print(f"Error al procesar {model_key}: {str(e)}")
                                    continue
                        
                        # Procesar archivos multimedia
                        if 'media' in zipf.namelist():
                            media_dir = settings.MEDIA_ROOT
                            os.makedirs(media_dir, exist_ok=True)
                            
                            # Extraer archivos multimedia
                            for file_info in zipf.infolist():
                                if file_info.filename.startswith('media/') and not file_info.is_dir():
                                    try:
                                        # Crear directorios necesarios
                                        dest_path = os.path.join(media_dir, os.path.basename(file_info.filename))
                                        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                                        
                                        # Extraer el archivo
                                        with zipf.open(file_info) as source, open(dest_path, 'wb') as target:
                                            shutil.copyfileobj(source, target)
                                            
                                    except Exception as e:
                                        print(f"Error al extraer archivo {file_info.filename}: {str(e)}")
                                        continue
                        
                        # Volver a habilitar triggers
                        with connection.cursor() as cursor:
                            cursor.execute("SET session_replication_role = 'origin';")
                        
                        print("Restauración completada exitosamente")
                            
                    except Exception as e:
                        # Si hay un error, hacer rollback de la transacción
                        print(f"Error durante la restauración: {str(e)}")
                        raise ValueError(f"Error al restaurar el backup: {str(e)}")
                
                # Actualizar estado del backup
                self.status = 'completed'
                self.save()
                return True

        return False
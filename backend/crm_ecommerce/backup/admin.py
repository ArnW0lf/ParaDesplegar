from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import path, reverse
from django.shortcuts import render, get_object_or_404
from django.utils.html import format_html
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
import os

from .models import Backup
from .backup_utils import generate_json_backup, save_media_files

User = get_user_model()

class BackupAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'backup_type_display', 'status_display', 'size_mb_display', 'created_at_formatted', 'actions_column')
    list_filter = ('status', 'backup_type', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'description', 'notes')
    readonly_fields = ('status', 'size', 'created_at', 'created_by')
    fieldsets = (
        ('Información del Respaldo', {
            'fields': ('user', 'backup_type', 'status', 'size', 'description', 'notes')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    actions = ['download_selected_backups', 'create_backup_action']
    
    class Media:
        css = {
            'all': (
                'css/backup_admin.css',
            )
        }
        js = (
            'js/backup_admin.js',
        )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Si es una edición
            return self.readonly_fields + ('backup_type', 'user')
        return self.readonly_fields
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo objeto
            obj.created_by = request.user
            if not obj.backup_type:
                obj.backup_type = 'admin' if request.user.is_staff else 'manual'
        
        # Guardar el modelo (esto activará el método save() personalizado que crea el backup)
        super().save_model(request, obj, form, change)
        
        # Si es un nuevo backup, mostramos un mensaje de éxito
        if not change and obj.status == 'completed':
            self.message_user(
                request,
                f'Backup creado exitosamente. Tamaño: {obj.size_mb:.2f} MB',
                messages.SUCCESS
            )
        elif not change and obj.status == 'failed':
            self.message_user(
                request,
                'Error al crear el backup. Por favor, intente nuevamente.',
                messages.ERROR
            )
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:backup_id>/download/',
                self.admin_site.admin_view(self.download_backup),
                name='backup-download',
            ),
            path(
                '<int:backup_id>/restore/confirm/',
                self.admin_site.admin_view(self.confirm_restore),
                name='backup-restore-confirm',
            ),
            path(
                '<int:backup_id>/restore/execute/',
                self.admin_site.admin_view(self.execute_restore),
                name='backup-restore-execute',
            ),
            path(
                'create-backup-for-user/',
                self.admin_site.admin_view(self.create_backup_for_user),
                name='create-backup-for-user',
            ),
        ]
        return custom_urls + urls
    
    def download_backup(self, request, backup_id):
        backup = get_object_or_404(Backup, id=backup_id)
        if not request.user.is_staff and request.user != backup.user and request.user != backup.created_by:
            self.message_user(request, 'No tiene permiso para descargar este respaldo.', level=messages.ERROR)
            return HttpResponseRedirect(reverse('admin:backup_backup_changelist'))
        
        response = backup.download_response()
        if response is None:
            self.message_user(request, 'No se pudo generar el archivo de respaldo.', level=messages.ERROR)
            return HttpResponseRedirect(reverse('admin:backup_backup_changelist'))
        return response
    
    def confirm_restore(self, request, backup_id):
        backup = get_object_or_404(Backup, id=backup_id)
        if not request.user.is_staff and request.user != backup.user and request.user != backup.created_by:
            self.message_user(request, 'No tiene permiso para restaurar este respaldo.', level=messages.ERROR)
            return HttpResponseRedirect(reverse('admin:backup_backup_changelist'))
        
        return render(request, 'admin/backup/confirm_restore.html', {
            'title': 'Confirmar restauración',
            'backup': backup,
            'opts': self.model._meta,
        })
    
    def execute_restore(self, request, backup_id):
        if request.method != 'POST':
            return HttpResponseRedirect(reverse('admin:backup_backup_changelist'))
            
        backup = get_object_or_404(Backup, id=backup_id)
        if not request.user.is_staff and request.user != backup.user and request.user != backup.created_by:
            self.message_user(request, 'No tiene permiso para restaurar este respaldo.', level=messages.ERROR)
            return HttpResponseRedirect(reverse('admin:backup_backup_changelist'))
        
        try:
            backup.restore_from_zip()
            self.message_user(request, 'Respaldo restaurado exitosamente.', level=messages.SUCCESS)
        except Exception as e:
            self.message_user(request, f'Error al restaurar el respaldo: {str(e)}', level=messages.ERROR)
        
        return HttpResponseRedirect(reverse('admin:backup_backup_changelist'))
    
    def create_backup_for_user(self, request):
        if request.method == 'POST':
            user_id = request.POST.get('user')
            description = request.POST.get('description', '')
            notes = request.POST.get('notes', '')
            
            try:
                user = User.objects.get(id=user_id, is_active=True)
                backup = Backup.objects.create(
                    user=user,
                    created_by=request.user,
                    backup_type='admin',
                    description=description,
                    notes=notes
                )
                
                # Generar el archivo ZIP
                try:
                    backup.create_backup_zip()
                    self.message_user(request, 'Respaldo creado exitosamente.', level=messages.SUCCESS)
                except Exception as e:
                    backup.delete()
                    raise e
                    
                return HttpResponseRedirect(reverse('admin:backup_backup_change', args=[backup.id]))
                
            except User.DoesNotExist:
                self.message_user(request, 'Usuario no encontrado.', level=messages.ERROR)
            except Exception as e:
                self.message_user(request, f'Error al crear el respaldo: {str(e)}', level=messages.ERROR)
        
        # Obtener usuarios activos para el select
        users = User.objects.filter(is_active=True).order_by('email')
        
        return render(request, 'admin/backup/create_backup.html', {
            'title': 'Crear respaldo para usuario',
            'opts': self.model._meta,
            'users': users,
        })
    
    # Métodos para personalizar la visualización en el listado
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Usuario'
    user_email.admin_order_field = 'user__email'
    
    def backup_type_display(self, obj):
        return dict(Backup.TYPE_CHOICES).get(obj.backup_type, obj.backup_type)
    backup_type_display.short_description = 'Tipo'
    backup_type_display.admin_order_field = 'backup_type'
    
    def status_display(self, obj):
        status_colors = {
            'pending': 'orange',
            'completed': 'green',
            'failed': 'red',
        }
        color = status_colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            dict(Backup.STATUS_CHOICES).get(obj.status, obj.status).capitalize()
        )
    status_display.short_description = 'Estado'
    status_display.admin_order_field = 'status'
    
    def size_mb_display(self, obj):
        if obj.size:
            return f'{obj.size_mb:.2f} MB'
        return 'N/A'
    size_mb_display.short_description = 'Tamaño'
    
    def created_at_formatted(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_formatted.short_description = 'Creado'
    created_at_formatted.admin_order_field = 'created_at'
    
    def actions_column(self, obj):
        links = []
        if obj.file:
            download_url = reverse('admin:backup-download', args=[obj.id])
            restore_url = reverse('admin:backup-restore-confirm', args=[obj.id])
            links.append(f'<a href="{download_url}" class="button">Descargar</a>')
            links.append(f'<a href="{restore_url}" class="button">Restaurar</a>')
        return format_html(' '.join(links))
    actions_column.short_description = 'Acciones'
    actions_column.allow_tags = True

admin.site.register(Backup, BackupAdmin)

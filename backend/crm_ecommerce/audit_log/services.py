from django.contrib.contenttypes.models import ContentType
from .models import AuditLog
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta

class AuditLogService:
    @staticmethod
    def log_action(
        user,
        tenant,
        action,
        description,
        ip_address=None,
        user_agent=None,
        content_object=None,
        metadata=None
    ):
        """
        Registra una acción en la bitácora.
        """
        content_type = None
        object_id = None
        
        if content_object:
            content_type = ContentType.objects.get_for_model(content_object)
            object_id = content_object.id

        return AuditLog.objects.create(
            user=user,
            tenant=tenant,
            action=action,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            content_type=content_type,
            object_id=object_id,
            metadata=metadata or {}
        )

    @staticmethod
    def get_user_logs(user, start_date=None, end_date=None, action=None):
        """
        Obtiene los registros de auditoría de un usuario específico.
        """
        query = Q(user=user)
        
        if start_date:
            query &= Q(created_at__gte=start_date)
        if end_date:
            query &= Q(created_at__lte=end_date)
        if action:
            query &= Q(action=action)
            
        return AuditLog.objects.filter(query)

    @staticmethod
    def get_tenant_logs(tenant, start_date=None, end_date=None, action=None):
        """
        Obtiene los registros de auditoría de un tenant específico.
        """
        query = Q(tenant=tenant)
        
        if start_date:
            query &= Q(created_at__gte=start_date)
        if end_date:
            query &= Q(created_at__lte=end_date)
        if action:
            query &= Q(action=action)
            
        return AuditLog.objects.filter(query)

    @staticmethod
    def get_object_logs(content_object, start_date=None, end_date=None, action=None):
        """
        Obtiene los registros de auditoría relacionados con un objeto específico.
        """
        content_type = ContentType.objects.get_for_model(content_object)
        query = Q(content_type=content_type, object_id=content_object.id)
        
        if start_date:
            query &= Q(created_at__gte=start_date)
        if end_date:
            query &= Q(created_at__lte=end_date)
        if action:
            query &= Q(action=action)
            
        return AuditLog.objects.filter(query)

    @staticmethod
    def generate_activity_report(tenant, start_date=None, end_date=None):
        """
        Genera un reporte de actividad para un tenant.
        """
        if not start_date:
            start_date = timezone.now() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now()

        logs = AuditLog.objects.filter(
            tenant=tenant,
            created_at__range=[start_date, end_date]
        )

        report = {
            'total_actions': logs.count(),
            'actions_by_type': {},
            'actions_by_user': {},
            'actions_by_date': {},
        }

        for log in logs:
            # Acciones por tipo
            report['actions_by_type'][log.action] = report['actions_by_type'].get(log.action, 0) + 1
            
            # Acciones por usuario
            if log.user:
                username = log.user.username
                report['actions_by_user'][username] = report['actions_by_user'].get(username, 0) + 1
            
            # Acciones por fecha
            date_str = log.created_at.strftime('%Y-%m-%d')
            report['actions_by_date'][date_str] = report['actions_by_date'].get(date_str, 0) + 1

        return report 
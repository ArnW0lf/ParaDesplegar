from rest_framework.permissions import BasePermission
from tienda.models import Tienda
from tenants.utils import get_current_tenant

def is_store_owner(user):
    tenant = get_current_tenant()
    if not tenant:
        return False
    return Tienda.objects.filter(usuario=user, tenant=tenant).exists()

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsStockManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.role in ['stock', 'admin'] or
                (request.user.role == 'cliente' and is_store_owner(request.user))
            )
        )

class IsCRMManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.role in ['crm', 'admin'] or
                (request.user.role == 'cliente' and is_store_owner(request.user))
            )
        )

class IsMarketing(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.role in ['marketing', 'admin'] or
                (request.user.role == 'cliente' and is_store_owner(request.user))
            )
        )

class IsSeller(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.role in ['vendedor', 'admin'] or
                (request.user.role == 'cliente' and is_store_owner(request.user))
            )
        )

class IsMarketingReadOnly(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.role == 'marketing' or
                (request.user.role == 'cliente' and is_store_owner(request.user))
            ) and
            request.method in ['GET', 'HEAD', 'OPTIONS']
        )

from django.contrib import admin
from .models import Tenant

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'schema_name', 'domain', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'schema_name', 'domain')
    ordering = ('name',) 
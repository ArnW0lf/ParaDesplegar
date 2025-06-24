from django.contrib import admin
from .models import Lead, InteraccionLead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'email', 'estado', 'tienda', 'usuario', 'fecha_creacion', 'valor_estimado', 'probabilidad')
    list_filter = ('estado', 'tienda', 'usuario', 'fuente')
    search_fields = ('nombre', 'email', 'tienda__nombre', 'usuario__username')
    readonly_fields = ('fecha_creacion', 'ultima_actualizacion', 'ultima_compra')
    date_hierarchy = 'fecha_creacion'
    ordering = ('-fecha_creacion',)
    fieldsets = (
        (None, {
            'fields': ('nombre', 'email', 'estado', 'usuario', 'tienda', 'fuente')
        }),
        ('Detalles Comerciales', {
            'fields': ('valor_estimado', 'probabilidad', 'notas')
        }),
        ('Métricas de Seguimiento', {
            'fields': ('total_compras', 'valor_total_compras', 'ultima_compra', 'frecuencia_compra')
        }),
        ('Tiempos', {
            'fields': ('fecha_creacion', 'ultima_actualizacion')
        }),
    )


@admin.register(InteraccionLead)
class InteraccionLeadAdmin(admin.ModelAdmin):
    list_display = ('lead', 'tipo', 'fecha', 'valor')
    list_filter = ('tipo', 'fecha')
    search_fields = ('lead__nombre', 'descripcion')
    date_hierarchy = 'fecha'

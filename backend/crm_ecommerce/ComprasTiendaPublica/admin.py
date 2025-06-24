from django.contrib import admin
from .models import PedidoPublico, DetallePedidoPublico

class DetallePedidoPublicoInline(admin.TabularInline):
    model = DetallePedidoPublico
    extra = 0
    readonly_fields = ('nombre_producto', 'cantidad', 'precio_unitario', 'subtotal')

@admin.register(PedidoPublico)
class PedidoPublicoAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'nombre', 'apellido', 'telefono', 'correo',
        'metodo_pago', 'total', 'estado', 'fecha', 'tienda'
    )
    list_filter = ('estado', 'metodo_pago', 'fecha', 'tienda')
    search_fields = ('nombre', 'apellido', 'telefono', 'correo', 'codigo_seguimiento')
    readonly_fields = ('fecha',)
    inlines = [DetallePedidoPublicoInline]
    ordering = ('-fecha',)

@admin.register(DetallePedidoPublico)
class DetallePedidoPublicoAdmin(admin.ModelAdmin):
    list_display = (
        'pedido', 'nombre_producto', 'cantidad',
        'precio_unitario', 'subtotal'
    )
    search_fields = ('nombre_producto',)

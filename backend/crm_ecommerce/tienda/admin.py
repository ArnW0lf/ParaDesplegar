from django.contrib import admin
from .models import Tienda, Categoria, Producto, CarritoItem, Notificacion

@admin.register(Tienda)
class TiendaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'nombre', 'publicado')
    search_fields = ('nombre', 'usuario__username')

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tienda')
    search_fields = ('nombre',)
    list_filter = ('tienda',)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tienda', 'precio', 'stock')
    search_fields = ('nombre',)
    list_filter = ('tienda', 'categoria')

@admin.register(CarritoItem)
class CarritoItemAdmin(admin.ModelAdmin):
    list_display = ('producto', 'cantidad')
    list_filter = ('producto',)

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('tienda', 'mensaje', 'fecha')
    list_filter = ('tienda', 'fecha')

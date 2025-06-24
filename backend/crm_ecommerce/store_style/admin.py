from django.contrib import admin
from .models import StoreStyle, BloqueBienvenida

class BloqueBienvenidaInline(admin.TabularInline):
    model = BloqueBienvenida
    extra = 1
    fields = ('tipo', 'titulo', 'descripcion', 'imagen')
    show_change_link = False

@admin.register(StoreStyle)
class StoreStyleAdmin(admin.ModelAdmin):
    list_display = ('tienda', 'tema', 'tema_plantilla', 'vista_producto')
    search_fields = ('tienda__nombre',)
    list_filter = ('tema', 'tema_plantilla', 'vista_producto')
    inlines = [BloqueBienvenidaInline]

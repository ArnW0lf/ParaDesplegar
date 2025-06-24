from django.contrib import admin
from .models import UsersTiendaPublica

@admin.register(UsersTiendaPublica)
class UsersTiendaPublicaAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'tienda', 'is_active')
    list_filter = ('tienda', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')

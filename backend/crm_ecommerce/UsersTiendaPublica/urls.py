from django.urls import path
from .views import (
    LoginUsersTiendaPublicaView,  # ← esta es la correcta para tienda_slug
    RegisterUsersTiendaPublicaView,
    UsersTiendaPublicaProfileView,
)

urlpatterns = [
    path("login/", LoginUsersTiendaPublicaView.as_view(), name="login-publico"),
    path("register/", RegisterUsersTiendaPublicaView.as_view(), name="register-publico"),
    path("profile/<int:pk>/", UsersTiendaPublicaProfileView.as_view(), name="profile-publico"),
]

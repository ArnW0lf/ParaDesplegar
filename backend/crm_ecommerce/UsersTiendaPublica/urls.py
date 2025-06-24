# UsersTiendaPublica/urls.py

from django.urls import path
from .views import RegisterUsersTiendaPublicaView, LoginUsersTiendaPublicaView, UsersTiendaPublicaProfileView


urlpatterns = [
    path('register/', RegisterUsersTiendaPublicaView.as_view()),
    path('login/', LoginUsersTiendaPublicaView.as_view()),
    path('profile/<int:pk>/', UsersTiendaPublicaProfileView.as_view(), name='profile')

]

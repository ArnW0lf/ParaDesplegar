from django.urls import path
from .views import (
    ProfileView, UpdateProfileView, CustomizeCompanyView,
    UpdateProfilePictureView, UpdatePasswordView, CrearUsuarioInternoView,
    LogoutView, CustomTokenObtainPairView
)
from .password_reset import ResetPasswordView, ResetPasswordConfirmView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    path('profile/picture/', UpdateProfilePictureView.as_view(), name='update-picture'),
    path('profile/password/', UpdatePasswordView.as_view(), name='update-password'),
    path('company/customize/', CustomizeCompanyView.as_view(), name='customize-company'),
    path('password-reset/', ResetPasswordView.as_view(), name='password-reset'),
    path('password-reset/confirm/', ResetPasswordConfirmView.as_view(), name='password-reset-confirm'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('crear-usuario-interno/', CrearUsuarioInternoView.as_view(), name='crear-usuario-interno'),
    path('logout/', LogoutView.as_view(), name='logout'),
]

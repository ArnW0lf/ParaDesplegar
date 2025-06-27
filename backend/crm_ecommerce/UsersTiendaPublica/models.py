# UsersTiendaPublica/models.py

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group, Permission
from tienda.models import Tienda  # Ajusta si la ruta es distinta

class UsersTiendaPublicaManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password=None, tienda=None):
        if not email:
            raise ValueError("El email es obligatorio")
        email = self.normalize_email(email)
        user = self.model(email=email, first_name=first_name, last_name=last_name, tienda=tienda)
        user.set_password(password)
        user.save(using=self._db)
        return user

class UsersTiendaPublica(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        related_name='users_tienda_publica_groups'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        related_name='users_tienda_publica_permissions'
    )

    objects = UsersTiendaPublicaManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'

    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.email} - {self.tienda.nombre}"

    class Meta:
        unique_together = ('email', 'tienda')  # 👈 clave única por tienda

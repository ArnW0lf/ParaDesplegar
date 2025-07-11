# Generated by Django 5.2 on 2025-06-21 18:57

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('UsersTiendaPublica', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
        ('tienda', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userstiendapublica',
            name='tienda',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tienda.tienda'),
        ),
        migrations.AddField(
            model_name='userstiendapublica',
            name='user_permissions',
            field=models.ManyToManyField(blank=True, related_name='users_tienda_publica_permissions', to='auth.permission', verbose_name='user permissions'),
        ),
        migrations.AlterUniqueTogether(
            name='userstiendapublica',
            unique_together={('email', 'tienda')},
        ),
    ]

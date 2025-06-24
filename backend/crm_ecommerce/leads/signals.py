from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Lead, InteraccionLead
from ComprasTiendaPublica.models import PedidoPublico
from UsersTiendaPublica.models import UsersTiendaPublica
from tienda.models import Tienda

User = get_user_model()

@receiver(post_save, sender=User)
def crear_lead_desde_usuario(sender, instance, created, **kwargs):
    if created:
        try:
            # Buscar la tienda cuyo dueño sea el mismo tenant.owner
            tienda = Tienda.objects.filter(usuario__tenant=instance.tenant).first()
            if tienda:
                Lead.objects.create(
                    usuario=instance,
                    nombre=instance.get_full_name() or instance.username,
                    email=instance.email,
                    estado='nuevo',
                    tienda=tienda
                )
            else:
                print("⚠ No se encontró una tienda para el tenant del usuario")
        except Exception as e:
            print(f"❌ Error al crear Lead desde usuario: {str(e)}")

@receiver(post_save, sender=UsersTiendaPublica)
def crear_lead_desde_usuario_publico(sender, instance, created, **kwargs):
    if created:
        try:
            Lead.objects.create(
                usuario=instance,
                nombre=f"{instance.first_name} {instance.last_name}",
                email=instance.email,
                estado='nuevo',
                tienda=instance.tienda,
                fuente='tienda_publica'
            )
        except Exception as e:
            print(f"Error al crear Lead desde usuario público: {str(e)}")

@receiver(post_save, sender=PedidoPublico)
def registrar_interaccion_compra(sender, instance, created, **kwargs):
    if created:
        try:
            # Intentar obtener el lead por email
            lead = Lead.objects.get(email=instance.correo)
            InteraccionLead.objects.create(
                lead=lead,
                tipo='compra',
                descripcion=f'Compra realizada por valor de ${instance.total}',
                valor=instance.total
            )
        except Lead.DoesNotExist:
            # Si no existe el lead, crearlo
            try:
                tienda = instance.usuario.tienda
                lead = Lead.objects.create(
                    usuario=None,  # No asociamos con CustomUser
                    nombre=f"{instance.nombre} {instance.apellido}",
                    email=instance.correo,
                    estado='nuevo',
                    tienda=tienda,
                    fuente='ecommerce'
                )
                InteraccionLead.objects.create(
                    lead=lead,
                    tipo='compra',
                    descripcion=f'Compra realizada por valor de ${instance.total}',
                    valor=instance.total
                )
            except Exception as e:
                print(f"Error al crear lead: {str(e)}")
                pass
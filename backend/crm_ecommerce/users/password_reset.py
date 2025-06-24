from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .models import CustomUser

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'detail': 'El correo electrónico es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'No existe una cuenta con este correo electrónico'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generar token único
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Construir URL de reseteo
        reset_url = f"{settings.FRONTEND_URL}/reset-password-confirm/{uid}/{token}"

        # Enviar correo electrónico
        subject = 'Recuperación de contraseña'
        message = f'''
        Hola {user.first_name},

        Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace para crear una nueva contraseña:

        {reset_url}

        Si no solicitaste este cambio, puedes ignorar este correo.

        Saludos,
        El equipo de soporte
        '''

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response(
                {'detail': 'Se han enviado las instrucciones a tu correo electrónico'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': 'Error al enviar el correo electrónico'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not all([uid, token, new_password]):
            return Response(
                {'detail': 'Todos los campos son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(pk=uid)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Token inválido o expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Actualizar contraseña
        user.set_password(new_password)
        user.save()

        return Response(
            {'detail': 'Contraseña actualizada exitosamente'},
            status=status.HTTP_200_OK
        )
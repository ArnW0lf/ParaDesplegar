from rest_framework import generics, status
from .models import CustomUser
from .serializers import UserSerializer, UserProfileSerializer, UserProfilePictureSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from tenants.models import Tenant
from tenants.utils import create_schema
from tienda.models import Tienda
from django.utils.text import slugify
import os
import uuid
from rest_framework import status, permissions
from .serializers import UsuarioInternoSerializer
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                user = CustomUser.objects.get(username=request.data['username'])
                user_data = UserProfileSerializer(user).data
                response.data['user'] = user_data
            except CustomUser.DoesNotExist:
                pass
        return response

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Generar un identificador único para el tenant
                unique_id = str(uuid.uuid4())[:8]
                company_name = serializer.validated_data['company_name']
                
                # Crear nombres únicos para el schema y dominio
                schema_name = f"{company_name.lower().replace(' ', '_')}_{unique_id}"
                domain = f"{schema_name}.localhost"
                
                # Crear el schema para el tenant
                create_schema(schema_name)
                
                # Crear el tenant
                tenant = Tenant.objects.create(
                    name=company_name,
                    schema_name=schema_name,
                    domain=domain,
                    is_active=True
                )
                
                # Crear el usuario con el tenant asignado
                user = CustomUser.objects.create(
                    username=serializer.validated_data['username'],
                    email=serializer.validated_data['email'],
                    first_name=serializer.validated_data.get('first_name', ''),
                    last_name=serializer.validated_data.get('last_name', ''),
                    role=serializer.validated_data.get('role', 'cliente'),
                    company_name=company_name,
                    phone=serializer.validated_data.get('phone', ''),
                    country=serializer.validated_data.get('country', ''),
                    language=serializer.validated_data.get('language', ''),
                    company_size=serializer.validated_data.get('company_size', ''),
                    interest=serializer.validated_data.get('interest', ''),
                    tenant=tenant  # Asignar el tenant directamente
                )
                user.set_password(serializer.validated_data['password'])
                user.save()

                # Si el usuario es vendedor, crear una tienda por defecto
                if user.role == 'vendedor':
                    Tienda.objects.create(
                        tenant=tenant,
                        usuario=user,
                        nombre=f"Tienda de {user.username}",
                        descripcion="Bienvenido a mi tienda",
                        slug=slugify(user.username)
                    )

                # Generar token para el usuario recién creado
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(user)
                
                # Enviar correo de bienvenida
                try:
                    subject = '¡Bienvenido a Nuestra Plataforma!'
                    from_email = settings.DEFAULT_FROM_EMAIL
                    to_email = [user.email]
                    
                    # Verificar si la plantilla existe
                    template_path = os.path.join(settings.BASE_DIR, 'templates', 'emails', 'welcome_email.html')
                    if not os.path.exists(template_path):
                        print(f"Error: No se encontró la plantilla en {template_path}")
                    else:
                        try:
                            # Renderizar la plantilla HTML
                            html_content = render_to_string('emails/welcome_email.html', {
                                'user': user,
                                'company_name': company_name,
                            })
                            
                            # Crear el mensaje de correo
                            msg = EmailMultiAlternatives(subject, '', from_email, to_email)
                            msg.attach_alternative(html_content, "text/html")
                            
                            # Configurar el contenido alternativo en texto plano
                            text_content = f"""
                            ¡Bienvenido a Nuestra Plataforma!
                            
                            Hola {user.first_name or user.username},
                            
                            Gracias por registrarte en nuestra plataforma. Estamos encantados de darte la bienvenida.
                            
                            Saludos,
                            El Equipo de Soporte
                            """
                            msg.body = text_content
                            
                            # Intentar enviar el correo
                            msg.send(fail_silently=False)
                            print(f"Correo de bienvenida enviado a {to_email}")
                            
                        except Exception as e:
                            import traceback
                            error_details = traceback.format_exc()
                            print(f"Error al enviar correo de bienvenida: {str(e)}")
                            print(f"Detalles del error: {error_details}")
                            
                except Exception as e:
                    import traceback
                    error_details = traceback.format_exc()
                    print(f"Error general al procesar el correo de bienvenida: {str(e)}")
                    print(f"Detalles del error: {error_details}")
                
                return Response({
                    'message': 'Usuario registrado exitosamente',
                    'user': UserProfileSerializer(user).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'error': f'Error al crear el usuario: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Vista para el perfil del usuario logueado
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def put(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UpdateProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        user = request.user
        serializer = UserProfilePictureSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Eliminar la imagen anterior si existe
            if user.profile_picture:
                try:
                    os.remove(user.profile_picture.path)
                except:
                    pass
            
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UpdatePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not user.check_password(current_password):
            return Response(
                {"error": "La contraseña actual es incorrecta"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {"message": "Contraseña actualizada correctamente"},
            status=status.HTTP_200_OK
        )

class CustomizeCompanyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        # Aquí podrías guardar el logo, colores, nombre de empresa, etc.
        return Response({
            "message": "Personalización de empresa recibida",
            "data": data
        })
    

from rest_framework.response import Response
from rest_framework import status

class CrearUsuarioInternoView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UsuarioInternoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Errores de validación:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Obtener el token del header de autorización
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                # Aquí podrías agregar el token a una lista negra si lo necesitas
                # Por ahora solo devolvemos una respuesta exitosa
                return Response({
                    'message': 'Sesión cerrada exitosamente'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'No se encontró el token de autenticación'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

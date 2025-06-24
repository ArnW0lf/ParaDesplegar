# UsersTiendaPublica/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UsersTiendaPublicaSerializer
from .models import UsersTiendaPublica
from tienda.models import Tienda
from rest_framework.authtoken.models import Token
from .serializers import UsersTiendaPublicaSerializer
from rest_framework.generics import RetrieveUpdateAPIView



class RegisterUsersTiendaPublicaView(APIView):
    def post(self, request):
        serializer = UsersTiendaPublicaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Usuario registrado con éxito'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginUsersTiendaPublicaView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        slug = request.data.get("slug")

        try:
            tienda = Tienda.objects.get(slug=slug)
        except Tienda.DoesNotExist:
            return Response({'error': 'Tienda no encontrada'}, status=404)

        try:
            user = UsersTiendaPublica.objects.get(email=email, tienda=tienda)
        except UsersTiendaPublica.DoesNotExist:
            return Response({'error': 'Usuario no registrado en esta tienda'}, status=404)

        if not user.check_password(password):
            return Response({'error': 'Contraseña incorrecta'}, status=400)

        return Response({
            'message': 'Login exitoso',
            'email': user.email,
            'slug': tienda.slug,
            'user_id': user.id
        }, status=200)
    

class UsersTiendaPublicaProfileView(RetrieveUpdateAPIView):
    queryset = UsersTiendaPublica.objects.all()
    serializer_class = UsersTiendaPublicaSerializer
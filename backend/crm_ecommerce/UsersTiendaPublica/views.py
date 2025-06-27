# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CustomTokenObtainSerializer
from .serializers import UsersTiendaPublicaSerializer
from rest_framework.generics import RetrieveUpdateAPIView
from .models import UsersTiendaPublica
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import TokenPublicUserSerializer

class LoginUsersTiendaPublicaView(APIView):
    def post(self, request):
        serializer = CustomTokenObtainSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterUsersTiendaPublicaView(APIView):
    def post(self, request):
        serializer = UsersTiendaPublicaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Usuario registrado con éxito'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginPublicUserView(TokenObtainPairView):
    serializer_class = TokenPublicUserSerializer    

class UsersTiendaPublicaProfileView(RetrieveUpdateAPIView):
    queryset = UsersTiendaPublica.objects.all()
    serializer_class = UsersTiendaPublicaSerializer
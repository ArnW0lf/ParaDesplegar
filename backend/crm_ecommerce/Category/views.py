from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Category
from .serializers import CategorySerializer
from rest_framework.permissions import AllowAny
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)
        logger.info(f"Obteniendo categorías para tenant: {tenant}")
        if not tenant:
            logger.error("No se pudo obtener el tenant de la request")
            return Category.objects.none()
        return Category.objects.filter(tenant=tenant)

    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None)
        logger.info(f"Creando categoría para tenant: {tenant}")
        if not tenant:
            logger.error("No se pudo obtener el tenant de la request")
            raise serializers.ValidationError("No se pudo determinar el tenant")
        serializer.save(tenant=tenant)

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Datos recibidos: {request.data}")
            logger.info(f"Tenant actual: {request.tenant}")
            
            if not request.tenant:
                logger.error("No se pudo obtener el tenant de la request")
                return Response(
                    {'detail': 'No se pudo determinar el tenant'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Asegurarse de que el tenant no esté en los datos de entrada
            data = request.data.copy()
            if 'tenant' in data:
                del data['tenant']
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            
            # Crear la categoría directamente
            try:
                category = Category.objects.create(
                    name=serializer.validated_data['name'],
                    tenant=request.tenant
                )
                response_serializer = self.get_serializer(category)
                headers = self.get_success_headers(response_serializer.data)
                
                logger.info(f"Categoría creada: {response_serializer.data}")
                return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            except Exception as e:
                logger.error(f"Error al crear la categoría: {str(e)}")
                return Response(
                    {'detail': f'Error al crear la categoría: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            logger.error(f"Error en create: {str(e)}")
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            return Category.objects.none()
        return Category.objects.filter(tenant=tenant)

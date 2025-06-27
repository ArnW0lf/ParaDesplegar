from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import StoreStyle, BloqueBienvenida
from .serializers import StoreStyleSerializer, StorePublicSerializer, BloqueBienvenidaSerializer
from tienda.models import Tienda
from tenants.utils import get_current_tenant
from django.core.files.storage import default_storage
from rest_framework.permissions import AllowAny
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

class StoreStyleViewSet(viewsets.ModelViewSet):
    """
    Vista para gestionar los estilos de la tienda del usuario autenticado.
    """
    serializer_class = StoreStyleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = get_current_tenant()
        if not tenant:
            return StoreStyle.objects.none()
        return StoreStyle.objects.filter(tienda__tenant=tenant)

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        tienda = Tienda.objects.filter(tenant=tenant, usuario=self.request.user).first()
        serializer.save(tienda=tienda)

    @action(detail=False, methods=['get', 'patch'], url_path='mi-estilo')
    def mi_estilo(self, request):
        tenant = get_current_tenant()
        tienda = Tienda.objects.filter(tenant=tenant, usuario=request.user).first()

        if not tienda:
            return Response({"error": "No se encontró la tienda"}, status=404)

        estilo, _ = StoreStyle.objects.get_or_create(tienda=tienda)

        if request.method == 'GET':
            serializer = self.get_serializer(estilo)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            bloques_data = request.data.pop("bloques_bienvenida", None)
            serializer = self.get_serializer(estilo, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()

                if bloques_data is not None:
                    with transaction.atomic():
                        ids_recibidos = []
                        for bloque_data in bloques_data:
                            bloque_id = bloque_data.get("id")
                            bloque_data.pop("style", None)
                            if bloque_id:
                                try:
                                    bloque = BloqueBienvenida.objects.get(id=bloque_id, style=estilo)
                                    for attr, val in bloque_data.items():
                                        if attr != "id":
                                            setattr(bloque, attr, val)
                                    bloque.save()
                                    ids_recibidos.append(bloque.id)
                                except BloqueBienvenida.DoesNotExist:
                                    pass
                            else:
                                nuevo = BloqueBienvenida.objects.create(style=estilo, **bloque_data)
                                ids_recibidos.append(nuevo.id)

                        estilo.bloques.exclude(id__in=ids_recibidos).delete()

                return Response(serializer.data)
            return Response(serializer.errors, status=400)


    
    @action(detail=False, methods=['post'], url_path='upload-imagen', permission_classes=[AllowAny])
    def upload_bloque_image(self, request):
        """
        Permite subir imágenes para los bloques de bienvenida (sin autenticación).
        """
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No se envió ningún archivo"}, status=400)

        filename = default_storage.save(f"bloques/{file.name}", file)
        file_url = default_storage.url(filename)

        return Response({"url": request.build_absolute_uri(file_url)})


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def estilo_publico(request, slug):
    print("🔍 Entró a estilo_publico con slug:", slug)  # <--- agregado

    try:
        tienda = Tienda.objects.get(slug=slug, publicado=True)
    except Tienda.DoesNotExist:
        print("❌ Tienda no encontrada:", slug)
        return Response({"error": "Tienda no encontrada o no publicada"}, status=404)

    estilo, _ = StoreStyle.objects.get_or_create(tienda=tienda)
    print("✅ Estilo encontrado o creado para tienda:", tienda.nombre)

    if request.method == 'GET':
        serializer = StoreStyleSerializer(estilo)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        bloques_data = request.data.pop("bloques_bienvenida", None)
        serializer = StoreStyleSerializer(estilo, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()

            if bloques_data is not None:
                with transaction.atomic():
                    ids_recibidos = []
                    for bloque_data in bloques_data:
                        bloque_id = bloque_data.get("id")
                        bloque_data.pop("style", None)

                        if bloque_id:
                            try:
                                bloque = BloqueBienvenida.objects.get(id=bloque_id, style=estilo)
                                for attr, val in bloque_data.items():
                                    if attr != "id":
                                        setattr(bloque, attr, val)
                                bloque.save()
                                ids_recibidos.append(bloque.id)
                            except BloqueBienvenida.DoesNotExist:
                                pass
                        else:
                            nuevo = BloqueBienvenida.objects.create(style=estilo, **bloque_data)
                            ids_recibidos.append(nuevo.id)

                    estilo.bloques.exclude(id__in=ids_recibidos).delete()

            return Response(serializer.data)
        return Response(serializer.errors, status=400)

   

class PublicStoreWithStyleView(APIView):
    """
    Vista pública que retorna los datos generales y estilo de una tienda por su slug.
    """
    def get(self, request, slug):
        try:
            tienda = Tienda.objects.get(slug=slug)
        except Tienda.DoesNotExist:
            return Response({"detail": "Tienda no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        serializer = StorePublicSerializer(tienda)
        return Response(serializer.data)


class BloqueBienvenidaViewSet(viewsets.ModelViewSet):
    """
    CRUD para bloques de bienvenida de la tienda del usuario autenticado.
    """
    serializer_class = BloqueBienvenidaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = get_current_tenant()
        tienda = Tienda.objects.filter(tenant=tenant, usuario=self.request.user).first()
        if not tienda or not hasattr(tienda, 'style'):
            return BloqueBienvenida.objects.none()
        return tienda.style.bloques.all()

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        tienda = Tienda.objects.filter(tenant=tenant, usuario=self.request.user).first()
        if not tienda:
            return
        style = getattr(tienda, 'style', None)
        if not style:
            style = StoreStyle.objects.create(tienda=tienda)
        serializer.save(style=style)

    def perform_update(self, serializer):
        # Asegura que no se cambie de StoreStyle a otro inyectado
        instance = serializer.instance
        serializer.save(style=instance.style)

    def perform_destroy(self, instance):
        instance.delete()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Errores de validación en bloque:", serializer.errors)
            return Response(serializer.errors, status=400)

        self.perform_create(serializer)
        return Response(serializer.data, status=201)

    @action(detail=False, methods=['post'], url_path='crear-multiples')
    def crear_multiples_bloques(self, request):
        """
        Crea múltiples bloques para la tienda autenticada.
        Espera una lista de bloques en el cuerpo de la solicitud.
        """
        tenant = get_current_tenant()
        tienda = Tienda.objects.filter(tenant=tenant, usuario=request.user).first()
        if not tienda:
            return Response({"error": "Tienda no encontrada"}, status=404)

        style = getattr(tienda, 'style', None)
        if not style:
            style = StoreStyle.objects.create(tienda=tienda)

        bloques_data = request.data
        if not isinstance(bloques_data, list):
            return Response({"error": "Debe enviar una lista de bloques."}, status=400)

        creados = []
        errores = []

        for bloque in bloques_data:
            bloque['style'] = style.id  # Asignar automáticamente
            serializer = self.get_serializer(data=bloque)
            if serializer.is_valid():
                serializer.save()
                creados.append(serializer.data)
            else:
                errores.append(serializer.errors)

        return Response({
            "creados": creados,
            "errores": errores
        }, status=201 if creados else 400)
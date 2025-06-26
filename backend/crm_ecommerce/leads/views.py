from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Sum
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from tenants.utils import get_current_tenant, set_current_tenant

from .models import Lead, InteraccionLead
from .serializers import LeadSerializer, InteraccionLeadSerializer
from users.permissions import IsCRMManager, IsMarketingReadOnly
from users.permissions import IsMarketing
from rest_framework.exceptions import ValidationError


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    queryset = Lead.objects.all()
    permission_classes = [IsAuthenticated, IsCRMManager | IsMarketingReadOnly]

    def get_queryset(self):
        tenant = get_current_tenant()
        queryset = Lead.objects.filter(tenant=tenant)
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
        orden = self.request.query_params.get('orden', '-fecha_creacion')
        if orden:
            queryset = queryset.order_by(orden)
        return queryset
    
    @action(detail=True, methods=['post'])
    def actualizar_estado(self, request, pk=None):
        lead = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in dict(Lead.ESTADOS):
            return Response(
                {"error": "Estado no válido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lead.estado = nuevo_estado
        lead.save()
        
        return Response(self.get_serializer(lead).data)
    
    @action(detail=False, methods=['get'])
    def metricas(self, request):
        tenant = get_current_tenant()
        leads = Lead.objects.filter(tenant=tenant)
        
        return Response({
            'total_leads': leads.count(),
            'leads_por_estado': {
                estado: leads.filter(estado=estado).count()
                for estado, _ in Lead.ESTADOS
            },
            'valor_total_pipeline': leads.aggregate(
                total=Sum('valor_estimado')
            )['total'] or 0,
            'leads_activos': leads.filter(
                ultima_actualizacion__gte=timezone.now() - timezone.timedelta(days=30)
            ).count(),
            'valor_total_compras': leads.aggregate(
                total=Sum('valor_total_compras')
            )['total'] or 0,
            'promedio_compras': leads.aggregate(
                promedio=Sum('total_compras') / leads.count()
            )['promedio'] or 0
        })
    
    @action(detail=False, methods=['get'])
    def leads_recientes(self, request):
        tenant = get_current_tenant()
        leads = Lead.objects.filter(
            tenant=tenant
        ).order_by('-fecha_creacion')[:5]
        
        return Response(self.get_serializer(leads, many=True).data)
    
    @action(detail=False, methods=['get'])
    def leads_activos(self, request):
        tenant = get_current_tenant()
        leads = Lead.objects.filter(
            tenant=tenant,
            ultima_actualizacion__gte=timezone.now() - timezone.timedelta(days=30)
        ).order_by('-ultima_actualizacion')
        
        return Response(self.get_serializer(leads, many=True).data)
    

class LeadEmailsView(APIView):
    permission_classes = [IsAuthenticated, IsMarketing]

    def get(self, request):
        tenant = get_current_tenant()
        leads = Lead.objects.filter(tenant=tenant).values('nombre', 'email')
        return Response(list(leads))


class LeadInteraccionesView(APIView):
    permission_classes = [IsAuthenticated, IsCRMManager | IsMarketing]
    
    def get_queryset(self, lead_id):
        """Obtener el queryset de interacciones para un lead"""
        return InteraccionLead.objects.filter(lead_id=lead_id).order_by('-fecha')
    
    def get(self, request, lead_id):
        """Obtener todas las interacciones de un lead"""
        try:
            interacciones = self.get_queryset(lead_id)
            serializer = InteraccionLeadSerializer(interacciones, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": f"Error al obtener interacciones: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, lead_id):
        """Crear una nueva interacción para un lead"""
        try:
            # Verificar que el lead existe
            try:
                lead = Lead.objects.get(id=lead_id)
            except Lead.DoesNotExist:
                return Response(
                    {"error": "Lead no encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Validar los datos de la solicitud
            data = request.data.copy()
            required_fields = ['tipo', 'descripcion']
            for field in required_fields:
                if field not in data or not data[field]:
                    return Response(
                        {"error": f"El campo '{field}' es requerido"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Validar que el tipo sea uno de los permitidos
            tipos_permitidos = dict(InteraccionLead.TIPOS).keys()
            if data['tipo'] not in tipos_permitidos:
                return Response(
                    {"error": f"Tipo de interacción no válido. Debe ser uno de: {', '.join(tipos_permitidos)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear la interacción
            interaccion_data = {
                'lead': lead.id,
                'tipo': data['tipo'],
                'descripcion': data['descripcion'],
                'valor': data.get('valor')
            }
            
            serializer = InteraccionLeadSerializer(data=interaccion_data)
            
            if serializer.is_valid():
                interaccion = serializer.save()
                
                # Actualizar la última actualización del lead
                lead.ultima_actualizacion = timezone.now()
                lead.save()
                
                return Response(
                    InteraccionLeadSerializer(interaccion).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {"error": "Datos de interacción no válidos", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {"error": f"Error al crear la interacción: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods

@method_decorator(csrf_exempt, name='dispatch')
class CrearLeadDesdeTiendaView(APIView):
    """
    Vista para crear leads desde la tienda pública.
    No requiere autenticación.
    """
    authentication_classes = []
    permission_classes = []
    http_method_names = ['post', 'options']
    
    def options(self, request, *args, **kwargs):
        """
        Manejar solicitudes OPTIONS para CORS
        """
        response = Response(status=200)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response['Access-Control-Max-Age'] = '86400'  # 24 hours
        return response

    def post(self, request):
        data = request.data
        
        # Validar datos requeridos
        required_fields = ['nombre', 'email', 'telefono', 'valor_compra', 'tienda_id']
        for field in required_fields:
            if field not in data:
                return Response(
                    {"error": f"El campo '{field}' es requerido"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Obtener la tienda
        from tienda.models import Tienda
        try:
            tienda = Tienda.objects.get(id=data['tienda_id'])
            
            # Si la tienda tiene tenant, lo usamos
            if hasattr(tienda, 'tenant') and tienda.tenant:
                tenant = tienda.tenant
                set_current_tenant(tenant)
            else:
                # Si no hay tenant, usamos el esquema público
                from django.db import connection
                connection.set_schema('public')
                tenant = None
            
            # Verificar si ya existe un lead con este email
            lead_query = Lead.objects.filter(email=data['email'])
            if tenant:
                lead_query = lead_query.filter(tenant=tenant)
            lead = lead_query.first()
            
            from decimal import Decimal
            
            valor_compra = Decimal(str(data['valor_compra']))  # Convertir a string primero para evitar problemas de precisión
            
            if lead:
                # Actualizar lead existente
                lead.telefono = data.get('telefono', lead.telefono)
                lead.total_compras = (lead.total_compras or 0) + 1
                lead.valor_total_compras = (Decimal(str(lead.valor_total_compras or '0')) + valor_compra).quantize(Decimal('0.01'))
                lead.ultima_compra = timezone.now()
                lead.ultima_actualizacion = timezone.now()
                lead.valor_estimado = valor_compra  # Actualizar el valor estimado con la última compra
                lead.save()
            else:
                # Crear nuevo lead sin usuario asociado
                lead = Lead.objects.create(
                    usuario=None,  # No asociamos un usuario por defecto
                    nombre=data['nombre'],
                    email=data['email'],
                    telefono=data.get('telefono', ''),
                    estado='nuevo',
                    tenant=tenant,
                    fuente='ecommerce',
                    valor_estimado=valor_compra,
                    total_compras=1,
                    valor_total_compras=valor_compra,
                    ultima_compra=timezone.now(),
                    tienda=tienda
                )
            
            # Verificar si ya existe una interacción de compa reciente (últimos 5 minutos)
            cinco_minutos_atras = timezone.now() - timezone.timedelta(minutes=5)
            interaccion_reciente = InteraccionLead.objects.filter(
                lead=lead,
                tipo='compra',
                fecha__gte=cinco_minutos_atras
            ).exists()
            
            # Solo crear la interacción si no hay una reciente
            if not interaccion_reciente:
                # Usar el símbolo de moneda correcto según el país de la tienda
                simbolo_moneda = 'Bs.'  # Valor por defecto
                if hasattr(tienda, 'pais') and tienda.pais:
                    if 'argentina' in tienda.pais.lower():
                        simbolo_moneda = '$'
                    elif 'chile' in tienda.pais.lower():
                        simbolo_moneda = '$'
                    elif 'peru' in tienda.pais.lower():
                        simbolo_moneda = 'S/'
                
                interaccion = InteraccionLead.objects.create(
                    lead=lead,
                    tipo='compra',
                    descripcion=f"Compra realizada en la tienda por valor de {simbolo_moneda} {data['valor_compra']}",
                    valor=valor_compra  # Usamos el valor ya convertido a Decimal
                )
                interaccion_id = interaccion.id
            else:
                interaccion_id = None
            
            response_data = {
                "message": "Lead creado/actualizado exitosamente",
                "lead_id": lead.id,
                "interaccion_creada": interaccion_id is not None
            }
            
            if interaccion_id:
                response_data["interaccion_id"] = interaccion_id
                
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Tienda.DoesNotExist:
            return Response(
                {"error": "La tienda especificada no existe"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Error al procesar el lead: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

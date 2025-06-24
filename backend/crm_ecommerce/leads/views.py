from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from .models import Lead, InteraccionLead
from .serializers import LeadSerializer, InteraccionLeadSerializer
from tenants.utils import get_current_tenant
from users.permissions import IsCRMManager, IsMarketingReadOnly
from rest_framework.views import APIView
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

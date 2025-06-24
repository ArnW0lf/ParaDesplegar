# tienda/views_marketing.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsMarketing
from tienda.models import Pedido
from django.utils import timezone
from tenants.utils import get_current_tenant

class MarketingStatsView(APIView):
    permission_classes = [IsAuthenticated, IsMarketing]

    def get(self, request):
        tenant = get_current_tenant()
        pedidos = Pedido.objects.filter(tienda__tenant=tenant)

        total_ventas = sum(p.total for p in pedidos)
        cantidad_pedidos = pedidos.count()

        return Response({
            "total_ventas": total_ventas,
            "cantidad_pedidos": cantidad_pedidos,
            "periodo": "Últimos 30 días"
        })

from rest_framework.permissions import BasePermission
import jwt
from django.conf import settings

class TieneTokenValido(BasePermission):
    def has_permission(self, request, view):
        print("🔐 Evaluando TieneTokenValido...")
        print("🔍 Headers completos:", dict(request.headers))

        # Extraer token del header manualmente
        auth_header = request.headers.get("Authorization", "")
        print("📥 Authorization:", auth_header)

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            print("⚠️ No se encontró token en el header")
            return False

        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            print("✅ Token decodificado correctamente:", decoded)
            request.user_id_from_token = decoded.get("user_id")
            return request.user_id_from_token is not None
        except Exception as e:
            print("❌ Error al decodificar token:", str(e))
            return False

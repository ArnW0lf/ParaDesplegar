import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import Header from "../common/PublicHeader";
import {
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";

export default function UserOrders() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeConfig, setStoreConfig] = useState(null);
  const [styleConfig, setStyleConfig] = useState({
    color_primario: "#3B82F6",
    color_secundario: "#1E40AF",
    color_texto: "#1F2937",
    color_fondo: "#F3F4F6",
    tipo_fuente: "Arial",
    tema: "claro",
  });
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const isDark = styleConfig.tema === "oscuro";
  const backgroundClass = isDark ? "bg-gray-900" : "bg-gray-50";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const cardClass = isDark
    ? "bg-gray-800 text-white"
    : "bg-white text-gray-800";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";

  const fetchStoreConfig = async () => {
    try {
      const response = await API.get(`tiendas/tiendas/${slug}/public_store/`);
      setStoreConfig(response.data);

      const styleRes = await API.get(`store-style/estilos-publicos/${slug}/`);

      setStyleConfig(styleRes.data);
    } catch (err) {
      console.error("Error al cargar la configuración de la tienda:", err);
    }
  };

  useEffect(() => {
    const tokenRaw = localStorage.getItem(`token_${slug}`);
    const tokenData = tokenRaw ? JSON.parse(tokenRaw) : null;

    console.log("TOKEN GUARDADO:", tokenData);

    if (!tokenData || !tokenData.access || !tokenData.user_id) {
      console.log("Token no válido o no encontrado");
      navigate(`/tienda-publica/${slug}/login`);
      return;
    }

    // Cargar estilo y datos de tienda
    fetchStoreConfig();

    // Verificar que el token sea del usuario correcto
    API.get(`users-public/profile/${tokenData.user_id}/`, {
      headers: {
        Authorization: `Bearer ${tokenData.access}`,
      },
    })
      .then((res) => {
        if (!res?.data?.email) {
          throw new Error("Perfil inválido");
        }
        fetchOrders(tokenData.access); // ✅ cargar pedidos con token correcto
      })
      .catch((err) => {
        console.warn("Token inválido o usuario incorrecto", err);
        localStorage.removeItem(`token_${slug}`);
        navigate(`/tienda-publica/${slug}/login`);
      });
  }, [slug]);

  const fetchOrders = async (accessToken) => {
    try {
      setLoading(true);

      const response = await API.get("pedidos-publicos/mis-pedidos/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setOrders(response.data);
    } catch (err) {
      console.error("❌ Error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${slug}`);
        navigate(`/tienda-publica/${slug}/login`);
      } else {
        setError("Error al cargar los pedidos");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pendiente":
        return <FaSpinner className="text-yellow-500" />;
      case "confirmado":
        return <FaCheckCircle className="text-blue-500" />;
      case "en_proceso":
        return <FaBox className="text-purple-500" />;
      case "enviado":
        return <FaTruck className="text-orange-500" />;
      case "entregado":
        return <FaCheckCircle className="text-green-500" />;
      case "cancelado":
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaSpinner className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pendiente: "Pendiente",
      confirmado: "Confirmado",
      en_proceso: "En Proceso",
      enviado: "Enviado",
      entregado: "Entregado",
      cancelado: "Cancelado",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className={`${backgroundClass} min-h-screen`}>
        <Header
          storeName={storeConfig?.nombre}
          logo={storeConfig?.logo}
          slug={slug}
          colorPrimario={styleConfig.color_primario}
          colorTexto={styleConfig.color_texto}
          tema={styleConfig.tema}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${backgroundClass} min-h-screen`}>
        <Header
          storeName={storeConfig?.nombre}
          logo={storeConfig?.logo}
          slug={slug}
          colorPrimario={styleConfig.color_primario}
          colorTexto={styleConfig.color_texto}
          tema={styleConfig.tema}
        />
        <div className="text-center py-10 text-red-500 font-medium">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${backgroundClass} ${textClass} min-h-screen`}
      style={{ fontFamily: styleConfig.tipo_fuente }}
    >
      <Header
        storeName={storeConfig?.nombre}
        logo={storeConfig?.logo}
        slug={slug}
        colorPrimario={styleConfig.color_primario}
        colorTexto={styleConfig.color_texto}
        tema={styleConfig.tema}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>

        {orders.length === 0 ? (
          <div className={`${cardClass} rounded-lg shadow p-8 text-center`}>
            <p className="text-gray-400">No tienes pedidos realizados.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`${cardClass} rounded-lg shadow overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        Pedido #{order.id}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {new Date(order.fecha_creacion).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.estado)}
                      <span className="font-medium">
                        {getStatusText(order.estado)}
                      </span>
                    </div>
                  </div>

                  <div className={`border-t pt-4 ${borderColor}`}>
                    <h3 className="font-medium mb-2">Productos:</h3>
                    <div className="space-y-2 text-sm">
                      {order.detalles.map((detalle, index) => (
                        <div key={index} className="flex justify-between">
                          <span>
                            {detalle.nombre_producto} x {detalle.cantidad}
                          </span>
                          <span className="font-medium">
                            Bs. {Number(detalle.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`border-t mt-4 pt-4 flex justify-between ${borderColor}`}
                  >
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-green-500">
                      Bs. {Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  {order.direccion_entrega && (
                    <div className={`border-t mt-4 pt-4 ${borderColor}`}>
                      <h3 className="font-medium mb-2">
                        Dirección de entrega:
                      </h3>
                      <p className="text-sm text-gray-400">
                        {order.direccion_entrega}
                      </p>
                    </div>
                  )}

                  {order.metodo_pago && (
                    <div className={`border-t mt-4 pt-4 ${borderColor}`}>
                      <h3 className="font-medium mb-2">Método de pago:</h3>
                      <p className="text-sm capitalize text-gray-400">
                        {order.metodo_pago}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

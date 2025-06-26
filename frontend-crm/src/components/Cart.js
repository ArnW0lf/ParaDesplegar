import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./common/PublicHeader";
import API from "../api/api";

export default function Cart() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [tiendaId, setTiendaId] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    ci: "",
    ciudad: "",
    provincia: "",
    direccion: "",
    referencia: "",
    telefono: "",
    correo: "",
    notas: "",
    metodoPago: "",
  });

  const cartKey = `cart_${slug}`;
  const tokenKey = `token_${slug}`;

  const [styleConfig, setStyleConfig] = useState({
    color_primario: "#3B82F6",
    color_secundario: "#1E40AF",
    color_texto: "#1F2937",
    color_fondo: "#F3F4F6",
    tipo_fuente: "Arial",
    tema: "claro",
  });

  const isDark = styleConfig.tema === "oscuro";
  const textColor = styleConfig.color_texto;
  const secondaryColor = styleConfig.color_secundario;
  const fontFamily = styleConfig.tipo_fuente;

  useEffect(() => {
    const fetchStyle = async () => {
      try {
        const res = await API.get("store-style/mi-estilo/");
        setStyleConfig(res.data);
      } catch (err) {
        console.error("Error al cargar estilo visual:", err);
      }
    };
    fetchStyle();
  }, []);

  // Autenticación + Carrito
  // Obtener información de la tienda
  useEffect(() => {
    const fetchTiendaInfo = async () => {
      try {
        const response = await API.get(`tiendas/tiendas/${slug}/public_store/`);
        setTiendaId(response.data.id);
      } catch (error) {
        console.error("Error al obtener información de la tienda:", error);
      }
    };
    
    if (slug) {
      fetchTiendaInfo();
    }
  }, [slug]);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    const auth = !!token;
    setIsAuthenticated(auth);

    if (auth) {
      const storedCart = localStorage.getItem(cartKey);
      try {
        const parsed = storedCart ? JSON.parse(storedCart) : [];
        setCartItems(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [slug, cartKey, tokenKey]);

  // Obtener formas de pago activas
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await API.get("payments/methods/");
        const activos = response.data.filter((m) => m.is_active);
        setPaymentMethods(activos);
        if (activos.length > 0) {
          setFormData((prev) => ({
            ...prev,
            metodoPago: activos[0].payment_type,
          }));
        }
      } catch (error) {
        console.error("Error al obtener métodos de pago:", error);
      }
    };

    if (isAuthenticated) fetchPaymentMethods();
  }, [isAuthenticated]);

  // Obtener datos del usuario
  useEffect(() => {
    const storedToken = localStorage.getItem(tokenKey);
    if (storedToken) {
      try {
        const tokenData = JSON.parse(storedToken);
        if (tokenData?.user_id) {
          API.get(`users-public/profile/${tokenData.user_id}/`)
            .then((response) => {
              const user = response.data;
              setFormData((prev) => ({
                ...prev,
                nombre: user.first_name || "",
                apellido: user.last_name || "",
                correo: user.email || "",
              }));
            })
            .catch((error) => {
              console.error("Error al obtener perfil del usuario:", error);
            });
        }
      } catch (err) {
        console.error("Token inválido en localStorage:", err);
      }
    }
  }, [isAuthenticated, tokenKey]);

  const saveCart = (cart) => {
    setCartItems(cart);
    localStorage.setItem(cartKey, JSON.stringify(cart));
  };

  const incrementarCantidad = (index) => {
    const updatedCart = [...cartItems];
    updatedCart[index].quantity += 1;
    saveCart(updatedCart);
  };

  const decrementarCantidad = (index) => {
    const updatedCart = [...cartItems];
    if (updatedCart[index].quantity > 1) {
      updatedCart[index].quantity -= 1;
      saveCart(updatedCart);
    }
  };

  const eliminarProducto = (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    saveCart(updatedCart);
  };

  const vaciarCarrito = () => {
    setCartItems([]);
    localStorage.removeItem(cartKey);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleComprar = async () => {
    try {
      const tokenRaw = localStorage.getItem(`token_${slug}`);
      const tokenData = JSON.parse(tokenRaw);

      if (!tokenData?.user_id) {
        alert("Sesión inválida. Por favor, inicia sesión nuevamente.");
        return;
      }

      // Preparar detalles del carrito
      const detalles = cartItems.map((item) => ({
        nombre_producto: item.nombre,
        cantidad: item.quantity,
        precio_unitario: parseFloat(item.precio),
        subtotal: parseFloat(item.precio) * item.quantity,
      }));

      if (detalles.length === 0) {
        alert("No hay productos en el carrito.");
        return;
      }

      const total = detalles.reduce((acc, item) => acc + item.subtotal, 0);

      // Validar que el slug no esté vacío
      if (!slug) {
        console.error("Slug de tienda no proporcionado:", slug);
        alert(
          "Error: No se pudo identificar la tienda. Por favor, recarga la página e intenta nuevamente."
        );
        return;
      }

      // 1. Primero, crear/actualizar el lead en el CRM
      if (tiendaId) {
        try {
          const leadData = {
            nombre: `${formData.nombre} ${formData.apellido}`.trim(),
            email: formData.correo,
            telefono: formData.telefono,
            valor_compra: total.toFixed(2),
            tienda_id: tiendaId,
          };

          // Obtener el token de autenticación específico para esta tienda
          const token = localStorage.getItem(`token_${slug}`);
          
          // Hacer la petición con el token de autorización
          const url = 'leads/crear-desde-tienda/';
          const config = {
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          };
          
          // Solo agregar el token si existe
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
          
          console.log('Enviando datos al servidor:', {
            url,
            data: leadData,
            config
          });
          
          // Usar una promesa para manejar la creación del lead de manera asíncrona
          await API.post(url, leadData, config)
            .then(response => {
              console.log('Lead creado/actualizado en el CRM con ID:', response.data?.lead_id);
            })
            .catch(error => {
              console.warn('Error al crear/actualizar lead en CRM:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
              });
              // Continuar con el flujo a pesar del error
            });
        } catch (error) {
          console.error("Error inesperado al procesar el lead:", error);
          // Continuar con el flujo a pesar del error
        }
      } else {
        console.warn("No se pudo obtener el ID de la tienda. No se creará/actualizará el lead en el CRM.");
      }

      // 2. Continuar con el proceso de compra normal
      const payload = {
        usuario: tokenData.user_id,
        nombre: formData.nombre,
        apellido: formData.apellido,
        ci: formData.ci,
        ciudad: formData.ciudad,
        provincia: formData.provincia,
        direccion: formData.direccion,
        referencia: formData.referencia,
        telefono: formData.telefono,
        correo: formData.correo,
        notas: formData.notas,
        metodo_pago: formData.metodoPago,
        total: total.toFixed(2),
        detalles: detalles,
        tienda: slug, // Cambiamos 'slug' por 'tienda' para que coincida con lo que espera el backend
      };

      console.log("Sending payload:", payload);

      const response = await API.post("pedidos-publicos/", payload, {
        headers: {
          Authorization: `Bearer ${tokenRaw}`,
        },
      });

      alert("¡Compra realizada con éxito!");
      vaciarCarrito();
      setMostrarFormulario(false);
    } catch (error) {
      console.error("Full error object:", error);
      if (error.response?.data) {
        console.error("Detalles del error:", error.response.data);
        const errorMessage = error.response.data.tienda_id
          ? `Error en el ID de la tienda: ${error.response.data.tienda_id[0]}`
          : JSON.stringify(error.response.data);
        alert(`Error: ${errorMessage}`);
      } else if (error.request) {
        console.error("No se recibió respuesta del servidor:", error.request);
        alert(
          "No se pudo conectar con el servidor. Por favor, verifica tu conexión e intenta nuevamente."
        );
      } else {
        console.error("Error al configurar la petición:", error.message);
        alert("Ocurrió un error inesperado. Por favor, inténtalo nuevamente.");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full mx-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Acceso Restringido
          </h1>
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para acceder a tu carrito de compras
          </p>
          <button
            onClick={() => navigate(`/tienda-publica/${slug}/login`)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 to-blue-50"
      }`}
      style={{ color: textColor, fontFamily }}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 5H2m5 8v6a2 2 0 002 2h8a2 2 0 002-2v-6m-7 2h2"
              />
            </svg>
          </div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: isDark ? "#ffffff" : textColor }}
          >
            Mi Carrito
          </h1>

          <p style={{ color: isDark ? "#ffffff" : textColor }}>
            Revisa tus productos antes de realizar el pago
          </p>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3
                        className="text-xl font-bold mb-2"
                        style={{ color: isDark ? "#ffffff" : textColor }}
                      >
                        {item.nombre}
                      </h3>
                      <div
                        className="grid grid-cols-2 gap-4 text-sm"
                        style={{ color: isDark ? "#dddddd" : textColor }}
                      >
                        <div className="flex items-center">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Cantidad:
                          <span className="font-semibold ml-1">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Precio:
                          <span className="font-semibold ml-1">
                            Bs. {Number(item.precio).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`mt-3 p-3 rounded-lg ${
                          isDark ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <span
                          className="text-lg font-bold"
                          style={{ color: secondaryColor }}
                        >
                          Subtotal: Bs.{" "}
                          {(Number(item.precio) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Controles */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center rounded-lg ${
                          isDark ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <button
                          onClick={() => decrementarCantidad(index)}
                          className={`w-10 h-10 flex items-center justify-center rounded-l-lg transition-colors duration-200 ${
                            isDark
                              ? "text-white hover:bg-yellow-600"
                              : "hover:bg-yellow-500 hover:text-white"
                          }`}
                        >
                          −
                        </button>
                        <span
                          className={`w-12 text-center font-semibold ${
                            isDark ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => incrementarCantidad(index)}
                          className={`w-10 h-10 flex items-center justify-center rounded-r-lg transition-colors duration-200 ${
                            isDark
                              ? "text-white hover:bg-green-600"
                              : "hover:bg-green-500 hover:text-white"
                          }`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => eliminarProducto(index)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200 ${
                          isDark
                            ? "bg-red-800 text-red-300 hover:bg-red-600 hover:text-white"
                            : "bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
                        }`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div
                className={`rounded-2xl shadow-lg p-6 sticky top-8 ${
                  isDark ? "bg-gray-800 border border-gray-700" : "bg-white"
                }`}
              >
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: isDark ? "#ffffff" : textColor }}
                >
                  Resumen del Pedido
                </h3>

                <div className="space-y-3 mb-6">
                  <div
                    className="flex justify-between"
                    style={{ color: isDark ? "#dddddd" : textColor }}
                  >
                    <span>Productos ({cartItems.length})</span>
                    <span>
                      Bs.{" "}
                      {cartItems
                        .reduce(
                          (acc, item) => acc + item.precio * item.quantity,
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                  <div
                    className={`border-t pt-3 ${
                      isDark ? "border-gray-600" : ""
                    }`}
                  >
                    <div
                      className="flex justify-between text-xl font-bold"
                      style={{ color: isDark ? "#ffffff" : textColor }}
                    >
                      <span>Total</span>
                      <span style={{ color: secondaryColor }}>
                        Bs.{" "}
                        {cartItems
                          .reduce(
                            (acc, item) => acc + item.precio * item.quantity,
                            0
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setMostrarFormulario(true)}
                    style={{
                      backgroundColor: secondaryColor,
                      color: "#fff",
                    }}
                    className="w-full py-3 rounded-xl hover:opacity-90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Proceder al Pago
                  </button>
                  <button
                    onClick={vaciarCarrito}
                    style={{
                      backgroundColor: isDark ? "#2d2d2d" : "#f3f4f6",
                      color: isDark ? "#ffffff" : textColor,
                      border: `1px solid ${isDark ? "#444" : "#d1d5db"}`,
                    }}
                    className="w-full py-3 rounded-xl transition-colors duration-200 font-semibold"
                  >
                    Vaciar Carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 5H2m5 8v6a2 2 0 002 2h8a2 2 0 002-2v-6"
                    />
                  </svg>
                </div>
              </div>

              <h2
                className="text-3xl font-bold mb-4"
                style={{ color: isDark ? "#ffffff" : textColor }}
              >
                Tu carrito está vacío
              </h2>

              <p
                className="mb-8 leading-relaxed"
                style={{ color: isDark ? "#ffffff" : textColor }}
              >
                Parece que aún no has agregado ningún producto a tu carrito.
                ¡Explora nuestros productos y encuentra algo que te guste!
              </p>

              <button
                onClick={() => navigate(`/tienda-publica/${slug}`)}
                style={{
                  backgroundColor: secondaryColor,
                  color: "#fff",
                }}
                className="inline-flex items-center px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        )}

        {/* Formulario de pago */}
        {mostrarFormulario && (
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Información de Entrega
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Ingresa tus nombres"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    placeholder="Ingresa tus apellidos"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    name="ci"
                    placeholder="Ej: 12345678"
                    value={formData.ci}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    placeholder="Tu ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    name="provincia"
                    placeholder="Tu provincia"
                    value={formData.provincia}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Teléfono *
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    placeholder="Ej: 70123456"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Dirección Completa *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    placeholder="Calle, número, edificio, piso, departamento"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Referencia
                  </label>
                  <input
                    type="text"
                    name="referencia"
                    placeholder="Puntos de referencia"
                    value={formData.referencia}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="correo"
                    placeholder="tu@email.com"
                    value={formData.correo}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Método de Pago *
                </label>
                <select
                  name="metodoPago"
                  value={formData.metodoPago}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  required
                >
                  <option value="" disabled hidden>
                    Selecciona una opción
                  </option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.payment_type}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleComprar}
                  style={{
                    backgroundColor: secondaryColor,
                    color: "#fff",
                  }}
                  className="px-8 py-3 rounded-xl hover:opacity-90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Confirmar Compra
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

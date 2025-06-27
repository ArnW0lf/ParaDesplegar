import axios from "axios";
import config from "../config";

const API = axios.create({
  baseURL: `${config.apiUrl}/api/`,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const path = window.location.pathname;
    const url = config.url;

    const tokenAdmin = localStorage.getItem("token");

    // 🔒 Lista de endpoints que siempre deben usar token del dueño
    const adminEndpoints = [
      "/tiendas/tiendas/config/",
      "/pedidos-publicos/por_tienda/",
      "/store-style/mi-estilo/",
      "/products/reportes/",
      "/ventas/",
      "/sales-report/",
    ];

    const requiereTokenAdmin = adminEndpoints.some((endpoint) =>
      url.includes(endpoint)
    );

    let rawToken = null;

    if (requiereTokenAdmin || tokenAdmin) {
      console.log("🛡️ Usando token ADMIN");
      rawToken = tokenAdmin;
    } else if (path.includes("tienda-publica")) {
      const slug =
        path.split("/")[path.split("/").indexOf("tienda-publica") + 1];
      rawToken = localStorage.getItem(`token_${slug}`);
      console.log("👤 Usando token del CLIENTE:", `token_${slug}`);
    } else {
      rawToken = tokenAdmin;
      console.log("👤 Usando token DEFAULT");
    }

    let token = null;
    try {
      const parsed = rawToken ? JSON.parse(rawToken) : null;
      token = parsed?.access || rawToken;
    } catch {
      token = rawToken;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar expiración del token
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en la petición:", error);

    const pathParts = window.location.pathname.split("/");
    const isPublicStore = pathParts.includes("tienda-publica");
    const slug = isPublicStore
      ? pathParts[pathParts.indexOf("tienda-publica") + 1]
      : null;

    const isPublicRoute =
      window.location.pathname.startsWith("/precios") ||
      window.location.pathname === "/" ||
      window.location.pathname === "/login" ||
      window.location.pathname === "/register";

    if (error.response?.status === 401 && !isPublicRoute) {
      if (isPublicStore && slug) {
        localStorage.removeItem(`token_${slug}`);
        localStorage.removeItem(`user_${slug}`);
        window.location.href = `/tienda-publica/${slug}/login?next=${encodeURIComponent(
          window.location.pathname
        )}`;
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = `/login?next=${encodeURIComponent(
          window.location.pathname
        )}`;
      }
    }

    return Promise.reject(error);
  }
);

export default API;

import axios from "axios";
import config from "../config";

const API = axios.create({
  baseURL: `${config.apiUrl}/api/`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token a todas las peticiones
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en la petición:", error);
    // No redirigir si estamos en la página de precios o si es una ruta pública
    const isPublicRoute =
      window.location.pathname.startsWith("/precios") ||
      window.location.pathname === "/" ||
      window.location.pathname === "/login" ||
      window.location.pathname === "/register";

    if (error.response?.status === 401 && !isPublicRoute) {
      // Si el token expiró y no estamos en una ruta pública, redirigir al login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Guardar la ruta actual para redirigir después del login
      window.location.href = `/login?next=${encodeURIComponent(
        window.location.pathname
      )}`;
    }
    return Promise.reject(error);
  }
);

export default API;

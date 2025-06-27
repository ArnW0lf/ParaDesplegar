import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";

export default function LoginTiendaPublica() {
  const { slug } = useParams();
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await API.get(`tiendas/tiendas/${slug}/public_store/`);
        setStoreName(response.data.nombre);
      } catch (err) {
        setError("No se pudo cargar la tienda.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchStoreInfo();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const response = await API.post("/users-public/login/", {
        email: formData.email,
        password: formData.password,
        tienda_slug: slug,
      });

      console.log("RESPUESTA LOGIN:", response.data);

      if (!response.data.access) {
        setFormError("El backend no devolvió el token de acceso.");
        return;
      }

      const tokenData = {
        access: response.data.access,
        refresh: response.data.refresh,
        user_id: response.data.user_id,
        email: response.data.email,
        slug: slug,
      };

      // ✅ limpiar token viejo antes de guardar uno nuevo
      localStorage.removeItem(`token_${slug}`);
      localStorage.setItem(`token_${slug}`, JSON.stringify(tokenData));

      // ✅ redirigir al home con flag opcional
      window.location.href = `/tienda-publica/${slug}`;
    } catch (err) {
      console.error("Error en login:", err.response?.data || err.message);
      setFormError("Credenciales inválidas.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
          {storeName}
        </h1>
        <h2 className="text-xl text-center text-gray-700 mb-6">
          Iniciar Sesión
        </h2>
        {formError && (
          <div className="text-red-500 text-sm mb-4 text-center">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Entrar
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-700">
          ¿No tienes una cuenta?{" "}
          <span
            onClick={() => navigate(`/tienda-publica/${slug}/register`)}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Registrarse
          </span>
        </div>
      </div>
    </div>
  );
}

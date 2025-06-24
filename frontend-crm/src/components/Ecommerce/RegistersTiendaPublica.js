import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/api';

export default function RegistersTiendaPublica() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmarPassword: '',
  });

  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchStoreName = async () => {
      try {
        const response = await API.get(`tiendas/tiendas/${slug}/public_store/`);
        setStoreName(response.data.nombre);
      } catch (err) {
        setError('No se pudo obtener la información de la tienda.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreName();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmarPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    try {
     const response = await API.post('/users-public/register/', {
        first_name: formData.nombre,
        last_name: formData.apellido,
        email: formData.email,
        password: formData.password,
        tienda_slug: slug, 
    });

    

      setSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
      setTimeout(() => navigate(`/tienda-publica/${slug}/login`), 2000);
    } catch (err) {
      const message =
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        'Ocurrió un error durante el registro.';
      setFormError(message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
console.log("TIPO:", typeof RegistersTiendaPublica);
console.log("CONTENIDO:", RegistersTiendaPublica);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">{storeName}</h1>
        <h2 className="text-xl text-center text-gray-700 mb-6">Crear una cuenta</h2>

        {formError && <div className="text-red-500 text-sm mb-4 text-center">{formError}</div>}
        {success && <div className="text-green-600 text-sm mb-4 text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700">Apellido</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

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

          <div>
            <label className="block text-gray-700">Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmarPassword"
              value={formData.confirmarPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Registrarse
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-700">
          ¿Ya tienes una cuenta?{' '}
          <span
            onClick={() => navigate(`/tienda-publica/${slug}/login`)}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Iniciar sesión
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import API from '../../api/api';

export default function CreateUserDialog({ onClose, onUserCreated, storeConfig }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'stock',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const roles = ['stock', 'crm', 'marketing', 'vendedor'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Form enviado:", formData);
      await API.post('/users/crear-usuario-interno/', {
        ...formData,
        tienda: storeConfig?.id  // 🔹 Añadir tienda al cuerpo del request
      });

      setLoading(false);
      onUserCreated();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || 'Error al crear usuario';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Agregar Usuario Interno</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="Nombre de usuario"
            value={formData.username}
            onChange={handleChange}
            required
            className="border rounded px-4 py-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
            className="border rounded px-4 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
            className="border rounded px-4 py-2"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="text-gray-600 hover:underline">
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



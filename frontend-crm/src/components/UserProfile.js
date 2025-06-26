import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaUserCircle, FaCamera, FaSave, FaTimes, FaArrowLeft } from "react-icons/fa";
import config from '../config';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    full_name: "", // Agregamos full_name para manejar la visualización
    email: "",
    preferred_language: "es",
    bio: "",
    birth_date: "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
    country: ""
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const languages = [
    { code: "es", name: "Español" },
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" }
  ];

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setError(null); // Limpiar errores anteriores

      const response = await axios.get(`${config.apiUrl}/api/users/profile/`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log("Respuesta del servidor:", response.data); // Para debugging

      if (response.data) {
        setUser(response.data);
        // Crear full_name combinando first_name y last_name
        const fullName = [response.data.first_name, response.data.last_name]
          .filter(Boolean)
          .join(' ');
          
        setFormData({
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          full_name: fullName, // Establecer el nombre completo
          email: response.data.email || "",
          preferred_language: response.data.preferred_language || "es",
          bio: response.data.bio || "",
          birth_date: response.data.birth_date ? response.data.birth_date.split('T')[0] : "",
          address: response.data.address || "",
          city: response.data.city || "",
          postal_code: response.data.postal_code || "",
          phone: response.data.phone || "",
          country: response.data.country || ""
        });
        if (response.data.profile_picture) {
          setPreviewImage(`${config.apiUrl}${response.data.profile_picture}`);
        }
      }
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
      if (error.response) {
        console.error("Detalles del error:", error.response.data);
        setError(error.response.data.message || "Error al cargar el perfil");
      } else if (error.request) {
        setError("No se pudo conectar con el servidor");
      } else {
        setError("Error al cargar el perfil");
      }
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const formDataToSend = new FormData();

      // Crear un objeto con los datos a enviar
      const dataToSend = { ...formData };
      
      // Dividir el nombre completo en first_name y last_name
      if (dataToSend.full_name) {
        const nameParts = dataToSend.full_name.trim().split(' ');
        dataToSend.first_name = nameParts[0] || '';
        dataToSend.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        delete dataToSend.full_name; // Eliminar el campo full_name antes de enviar
      }

      // Agregar todos los campos al formData
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] !== null && dataToSend[key] !== undefined) {
          formDataToSend.append(key, dataToSend[key]);
        }
      });

      // Si hay una imagen de perfil, agregarla
      if (profilePicture) {
        formDataToSend.append('profile_picture', profilePicture);
      }

      const response = await axios.put(
        `${config.apiUrl}/api/users/profile/update/`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUser(response.data);
      setEditMode(false);
      setProfilePicture(null);
      
      // Actualizar la imagen de perfil si se cambió
      if (response.data.profile_picture) {
        setPreviewImage(`${config.apiUrl}${response.data.profile_picture}`);
      }
      
      alert("Perfil actualizado exitosamente");
      
      // Actualizar el localStorage con los nuevos datos del usuario
      const userResponse = await axios.get(`${config.apiUrl}/api/users/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizar el full_name en el estado local
      const updatedUser = userResponse.data;
      const fullName = [updatedUser.first_name, updatedUser.last_name]
        .filter(Boolean)
        .join(' ');
      
      setFormData(prev => ({
        ...prev,
        full_name: fullName,
        first_name: updatedUser.first_name || "",
        last_name: updatedUser.last_name || ""
      }));
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.error || 
                         error.response?.data?.message ||
                         "Error al actualizar el perfil. Por favor, inténtalo de nuevo.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.put(
        `${config.apiUrl}/api/users/profile/password/`,
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setPasswordSuccess("¡Contraseña actualizada exitosamente!");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: ""
        });
        // Ocultar el formulario después de 3 segundos
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordSuccess("");
        }, 3000);
      }
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      if (error.response) {
        if (error.response.status === 400) {
          setPasswordError("La contraseña actual es incorrecta");
        } else {
          setPasswordError(error.response.data.error || "Error al cambiar la contraseña");
        }
      } else {
        setPasswordError("Error al cambiar la contraseña");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido del perfil */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 mt-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Información Personal</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-lg font-medium"
          >
            {editMode ? "Cancelar" : "Editar Perfil"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sección de Foto de Perfil */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Foto de perfil"
                  className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <FaUserCircle size={160} className="text-gray-400" />
              )}
              {editMode && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg">
                  <FaCamera size={24} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Información Personal */}
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Nombre completo</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleInputChange}
                disabled={!editMode}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                placeholder="Ingresa tu nombre completo"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm h-12 text-lg px-4"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!editMode}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
              />
            </div>
          </div>

          {/* Preferencias */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-6">Preferencias</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Idioma Preferido</label>
                <select
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-base font-medium text-gray-700 mb-2">Biografía</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!editMode}
                rows="4"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg px-4 py-3"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-6">Dirección</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">País</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Ciudad</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Código Postal</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                />
              </div>
            </div>
          </div>

          {/* Sección de Cambio de Contraseña */}
          <div className="border-t pt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Cambiar Contraseña</h2>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setPasswordError("");
                  setPasswordSuccess("");
                  setPasswordData({
                    current_password: "",
                    new_password: "",
                    confirm_password: ""
                  });
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-lg font-medium"
              >
                {showPasswordForm ? "Cancelar" : "Cambiar Contraseña"}
              </button>
            </div>

            {showPasswordForm && (
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Contraseña Actual</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                      required
                      placeholder="Ingrese su contraseña actual"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                      required
                      placeholder="Ingrese su nueva contraseña"
                      minLength="8"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 text-lg px-4"
                      required
                      placeholder="Confirme su nueva contraseña"
                      minLength="8"
                    />
                  </div>
                </div>
                {passwordError && (
                  <div className="text-red-600 text-base font-medium">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="text-green-600 text-base font-medium">{passwordSuccess}</div>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordSubmit}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium"
                  >
                    Guardar Nueva Contraseña
                  </button>
                </div>
              </div>
            )}
          </div>

          {editMode && (
            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  fetchUserProfile();
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium"
              >
                Guardar Cambios
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/api";

export default function ProfileTiendaPublica() {
  const { slug } = useParams();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
  });

  const [styleConfig, setStyleConfig] = useState({
    color_secundario: "#1E40AF",
    tema: "claro",
  });

  const tokenKey = `token_${slug}`;
  let tokenData = null;
  try {
    const tokenRaw = localStorage.getItem(tokenKey);
    tokenData = tokenRaw ? JSON.parse(tokenRaw) : null;
  } catch (e) {
    console.error("Token malformado o ausente en localStorage:", e);
  }

  useEffect(() => {
    if (tokenData?.user_id) {
      API.get(`users-public/profile/${tokenData.user_id}/`)
        .then((response) => {
          setUserData(response.data);
          setFormData({
            email: response.data.email,
            first_name: response.data.first_name,
            last_name: response.data.last_name,
          });
        })
        .catch((error) => {
          console.error("Error al cargar perfil:", error);
        });

      // Cargar estilo visual
      API.get("store-style/estilos-publicos/mitienda/")

        .then((res) => setStyleConfig(res.data))
        .catch((err) => console.error("Error al cargar estilo:", err));
    }
  }, [slug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };
      await API.patch(`users-public/profile/${tokenData.user_id}/`, payload);
      alert("Perfil actualizado correctamente");
      setIsEditing(false);
      setUserData(payload);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("Ocurrió un error al guardar los cambios");
    }
  };

  if (!tokenData?.user_id) {
    return (
      <div className="text-center mt-10 text-red-600">
        No se encontró una sesión válida. Por favor, inicia sesión.
      </div>
    );
  }

  if (!userData) {
    return <div className="text-center mt-10">Cargando perfil...</div>;
  }

  // Estilos dinámicos
  const buttonStyle = {
    backgroundColor: styleConfig.color_secundario,
    color: "#fff",
  };

  const isDark = styleConfig.tema === "oscuro";
  const backgroundClass = isDark ? "bg-gray-800" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const inputBgClass = isDark
    ? "bg-gray-700 text-white border-gray-600"
    : "bg-white text-black border-gray-300";

  return (
    <div
      className={`${
        isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      } min-h-screen py-10`}
      style={{ fontFamily: styleConfig.tipo_fuente }}
    >
      <div
        className={`max-w-xl mx-auto p-6 rounded shadow ${backgroundClass} ${textClass}`}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Mi Perfil</h2>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border rounded ${inputBgClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Nombre</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border rounded ${inputBgClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Apellido</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border rounded ${inputBgClass}`}
            />
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={buttonStyle}
              className="px-4 py-2 rounded hover:opacity-90 mt-4"
            >
              Editar Perfil
            </button>
          ) : (
            <button
              onClick={handleSave}
              style={buttonStyle}
              className="px-4 py-2 rounded hover:opacity-90 mt-4"
            >
              Guardar Cambios
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

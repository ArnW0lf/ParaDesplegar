import React, { useState, useEffect } from "react";
import {
  FaStore,
  FaPalette,
  FaImage,
  FaGlobe,
  FaSave,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import API from "../../api/api";
import config from "../../config";
import BloquesSettings from "./BloquesSettings";

export default function StoreSettings() {
  const [config, setConfig] = useState({
    nombre: "",
    descripcion: "",
    tema: "default",
    color_primario: "#3B82F6",
    color_secundario: "#1E40AF",
    color_texto: "#1F2937",
    color_fondo: "#F3F4F6",
    publicado: false,
    logo: null,
  });

  const [styleConfig, setStyleConfig] = useState({
    color_primario: "#3498db",
    color_secundario: "#2ecc71",
    color_texto: "#333333",
    color_fondo: "#ffffff",
    tipo_fuente: "Arial",
    tema: "claro",
    vista_producto: "grid",
    tema_plantilla: "clasico",
    bloques_bienvenida: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [mostrarModalBloques, setMostrarModalBloques] = useState(false);
  const [bloqueTemporal, setBloqueTemporal] = useState(null);
  const [estiloId, setEstiloId] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // Configuración general
      const tiendaResponse = await API.get("tiendas/tiendas/config/");
      setConfig(tiendaResponse.data);

      // Logo preview
      if (tiendaResponse.data.logo) {
        const logo = tiendaResponse.data.logo;
        setPreviewLogo(
          logo.startsWith("http") ? logo : `${config.apiUrl}${logo}`
        );
      }

      // Configuración de estilo
      const estiloResponse = await API.get("store-style/mi-estilo/");
      setStyleConfig(estiloResponse.data);
      setEstiloId(estiloResponse.data.id);

      const bloquesResponse = await API.get("store-style/bloques/");
      setBloques(bloquesResponse.data);

      setLoading(false);
    } catch (err) {
      setError("Error al cargar la configuración de la tienda");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name in styleConfig) {
      setStyleConfig((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setConfig((prev) => ({
        ...prev,
        logo: file,
      }));
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (!estiloId) {
        setError(
          "No se puede guardar porque el estilo de la tienda no fue cargado."
        );
        setSaving(false);
        return;
      }

      // Guardar configuración general
      const formData = new FormData();
      if (config.logo instanceof File) {
        formData.append("logo", config.logo);
      }

      for (const [key, value] of Object.entries(config)) {
        if (
          key !== "logo" &&
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          formData.append(key, value);
        }
      }

      await API.patch("tiendas/tiendas/config/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Si hay bloque temporal, subimos su imagen y lo creamos con POST
      if (bloqueTemporal) {
        let imagenUrl = bloqueTemporal.imagen;

        if (bloqueTemporal.imagen instanceof File) {
          const formDataImg = new FormData();
          formDataImg.append("file", bloqueTemporal.imagen);
          const res = await API.post(
            "store-style/upload-imagen/",
            formDataImg,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          imagenUrl = res.data.url;
        }

        const nuevoBloque = {
          tipo: bloqueTemporal.tipo || "apilado",
          titulo: bloqueTemporal.titulo || "Sin título",
          descripcion: bloqueTemporal.descripcion || "",
          imagen: imagenUrl,
          style: parseInt(estiloId),
        };

        const res = await API.post("store-style/bloques/", nuevoBloque);
        setBloques((prev) => [...prev, res.data]);
        setBloqueTemporal(null);
      }

      // Guardar solo configuración de estilo sin tocar bloques existentes
      await API.patch("store-style/mi-estilo/", {
        color_primario: styleConfig.color_primario,
        color_secundario: styleConfig.color_secundario,
        color_texto: styleConfig.color_texto,
        color_fondo: styleConfig.color_fondo,
        tipo_fuente: styleConfig.tipo_fuente,
        tema: styleConfig.tema,
        vista_producto: styleConfig.vista_producto,
        tema_plantilla: styleConfig.tema_plantilla || "clasico",
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error al guardar todo:", err);
      setError("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FaStore className="text-2xl text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Configuración de la Tienda
          </h2>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaCheck />
            Configuración guardada exitosamente
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaStore className="text-blue-600" />
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Tienda
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={config.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={config.descripcion}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Logo y Publicación */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaImage className="text-blue-600" />
              Logo y Publicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de la Tienda
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {previewLogo ? (
                      <img
                        src={previewLogo}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaStore className="text-gray-400 text-3xl" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cambiar Logo
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de la Tienda
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      config.publicado
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {config.publicado ? "Publicada" : "No Publicada"}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        publicado: !prev.publicado,
                      }))
                    }
                    className={`px-4 py-2 rounded-lg ${
                      config.publicado
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {config.publicado ? "Despublicar" : "Publicar"}
                  </button>
                </div>
                {config.publicado && (
                  <p className="mt-2 text-sm text-gray-600">
                    Tu tienda es visible públicamente en:
                    <a
                      href={`/tienda-publica/${config.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      Ver tienda →
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Personalización de Colores y Estilos */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaPalette className="text-blue-600" />
              Personalización de Colores y Estilos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color del Header
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="color_primario"
                    value={styleConfig.color_primario}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color_primario"
                    value={styleConfig.color_primario}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de Botones
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="color_secundario"
                    value={styleConfig.color_secundario}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color_secundario"
                    value={styleConfig.color_secundario}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de Texto
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="color_texto"
                    value={styleConfig.color_texto}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color_texto"
                    value={styleConfig.color_texto}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de Fondo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="color_fondo"
                    value={styleConfig.color_fondo}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color_fondo"
                    value={styleConfig.color_fondo}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            {/* Fuente y Vista */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Fuente
                </label>
                <select
                  name="tipo_fuente"
                  value={styleConfig.tipo_fuente}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Arial">Arial</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Lato">Lato</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tema Visual
                </label>
                <select
                  name="tema"
                  value={styleConfig.tema}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="claro">Claro</option>
                  <option value="oscuro">Oscuro</option>
                </select>
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vista de Productos
                </label>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Vista tipo Grid */}
                  <div
                    onClick={() =>
                      setStyleConfig((prev) => ({
                        ...prev,
                        vista_producto: "grid",
                      }))
                    }
                    className={`border rounded-lg p-4 min-w-[180px] flex-1 cursor-pointer hover:shadow-md transition ${
                      styleConfig.vista_producto === "grid"
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-200 h-16 rounded-md"
                        ></div>
                      ))}
                    </div>
                    <p className="text-center mt-2 text-sm font-medium text-gray-700">
                      Vista en cuadrícula
                    </p>
                  </div>

                  {/* Vista tipo Lista */}
                  <div
                    onClick={() =>
                      setStyleConfig((prev) => ({
                        ...prev,
                        vista_producto: "list",
                      }))
                    }
                    className={`border rounded-lg p-4 min-w-[180px] flex-1 cursor-pointer hover:shadow-md transition ${
                      styleConfig.vista_producto === "list"
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="space-y-2">
                      {[1, 2, 3].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-200 h-10 rounded-md"
                        ></div>
                      ))}
                    </div>
                    <p className="text-center mt-2 text-sm font-medium text-gray-700">
                      Vista en lista
                    </p>
                  </div>

                  {/* Vista tipo Detallada */}
                  <div
                    onClick={() =>
                      setStyleConfig((prev) => ({
                        ...prev,
                        vista_producto: "detallada",
                      }))
                    }
                    className={`border rounded-lg p-4 min-w-[180px] flex-1 cursor-pointer hover:shadow-md transition ${
                      styleConfig.vista_producto === "detallada"
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <div className="bg-gray-200 w-24 h-24 rounded-md"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 rounded-md w-2/3"></div>
                        <div className="bg-gray-200 h-4 rounded-md w-1/2"></div>
                      </div>
                    </div>
                    <p className="text-center mt-2 text-sm font-medium text-gray-700">
                      Vista detallada
                    </p>
                  </div>

                  {/* Vista tipo Masonry */}
                  <div
                    onClick={() =>
                      setStyleConfig((prev) => ({
                        ...prev,
                        vista_producto: "masonry",
                      }))
                    }
                    className={`border rounded-lg p-4 min-w-[180px] flex-1 cursor-pointer hover:shadow-md transition ${
                      styleConfig.vista_producto === "masonry"
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-200 h-16 rounded-md"></div>
                      <div className="bg-gray-200 h-24 rounded-md"></div>
                      <div className="bg-gray-200 h-20 rounded-md col-span-2"></div>
                    </div>
                    <p className="text-center mt-2 text-sm font-medium text-gray-700">
                      Vista tipo masonry
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaPalette className="text-blue-600" />
                Personalización de Bloques de Bienvenida
              </h3>

              {/* Tipo de plantilla visual */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tema de Plantilla
                </label>
                <select
                  name="tema_plantilla"
                  value={styleConfig.tema_plantilla || "clasico"}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="clasico">Clásico</option>
                  <option value="urbano">Urbano</option>
                  <option value="corporativo">Corporativo</option>
                </select>
              </div>

              {/* Configuración de bloques de bienvenida */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bloques de Bienvenida
                </label>
                <div className="flex items-center gap-4 mb-4">
                  {/* Botón Agregar / Cancelar */}
                  <button
                    onClick={() => {
                      if (bloqueTemporal) {
                        setBloqueTemporal(null); // Cierra el formulario
                      } else {
                        setBloqueTemporal({
                          id: null,
                          tipo: "apilado",
                          titulo: "",
                          descripcion: "",
                          imagen: "",
                        });
                      }
                    }}
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {bloqueTemporal ? "Cancelar" : "+ Agregar Bloque"}
                  </button>

                  {/* Botón Ver todos los bloques */}
                  <button
                    onClick={() => setMostrarModalBloques(true)}
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200"
                  >
                    Ver todos los Bloques
                  </button>
                </div>

                {bloqueTemporal && (
                  <div className="mb-4 border rounded-lg p-4 bg-white shadow">
                    {/* Tipo */}
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Bloque
                      </label>
                      <select
                        value={bloqueTemporal.tipo}
                        onChange={(e) =>
                          setBloqueTemporal({
                            ...bloqueTemporal,
                            tipo: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="apilado">Apilado</option>
                        <option value="en_linea">En línea</option>
                      </select>
                    </div>

                    {/* Título */}
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Título
                      </label>
                      <input
                        type="text"
                        value={bloqueTemporal.titulo}
                        onChange={(e) =>
                          setBloqueTemporal({
                            ...bloqueTemporal,
                            titulo: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        value={bloqueTemporal.descripcion}
                        onChange={(e) =>
                          setBloqueTemporal({
                            ...bloqueTemporal,
                            descripcion: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded"
                        rows={3}
                      ></textarea>
                    </div>

                    {/* Imagen */}
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Imagen del Bloque
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setBloqueTemporal({
                              ...bloqueTemporal,
                              imagen: file,
                            });
                          }
                        }}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border file:rounded file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />

                      {bloqueTemporal.imagen &&
                      typeof bloqueTemporal.imagen !== "string" ? (
                        <div className="mt-2">
                          <img
                            src={URL.createObjectURL(bloqueTemporal.imagen)}
                            alt="Previsualización"
                            className="w-32 h-32 object-cover rounded"
                          />
                        </div>
                      ) : (
                        bloqueTemporal.imagen && (
                          <div className="mt-2">
                            <img
                              src={bloqueTemporal.imagen}
                              alt="Previsualización"
                              className="w-32 h-32 object-cover rounded"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FaSave />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {mostrarModalBloques && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto relative shadow-xl">
            <button
              onClick={() => setMostrarModalBloques(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
            >
              &times;
            </button>
            <BloquesSettings />
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {  FaUserCircle, FaBell, FaShoppingCart, FaTags, FaBoxOpen } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';



export default function ClasicoComercial() {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState("MiTienda");
  const [logoPreview, setLogoPreview] = useState(null);
  const [userInitial, setUserInitial] = useState("J");
  const [published, setPublished] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("bloques");
  const [selectedElement, setSelectedElement] = useState(null);
  const [showLogoUploader, setShowLogoUploader] = useState(false);
  const [nameColor, setNameColor] = useState("#000000");
  const [fontSize, setFontSize] = useState("20px");
  const [fontFamily, setFontFamily] = useState("Arial");


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const name = localStorage.getItem("storeName");
    const logo = localStorage.getItem("logoPreview");

    if (user?.username) {
      setUserInitial(user.username.charAt(0).toUpperCase());
    }
    if (name) setStoreName(name);
    if (logo) setLogoPreview(logo);
  }, []);

  const handlePublishToggle = () => {
    const newPublished = !published;
    setPublished(newPublished);
    if (newPublished) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.username) {
        const publicURL = `http://localhost:8000/tienda/${user.username}/`;
        window.open(publicURL, "_blank");
      }
    }
  };

  const handleLogoChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      localStorage.setItem("logoPreview", reader.result);
      setShowLogoUploader(false); // cerrar la ventana flotante después de seleccionar
    };
    reader.readAsDataURL(file);
  }
};

const handleSaveCustomization = async () => {
  const token = localStorage.getItem("token");
  console.log("TOKEN ACTUAL:", token);
  const user = JSON.parse(localStorage.getItem("user")); // ✅ Agrega esto

  if (!token || !user) {
    alert("⚠️ No estás autenticado.");
    return;
  }

  const formData = new FormData();
  formData.append("nombre", storeName);
  formData.append("color_nombre", nameColor);
  formData.append("tamano_nombre", fontSize);
  formData.append("fuente_nombre", fontFamily);

  const logoFile = document.getElementById("logoInput")?.files?.[0];
  if (logoFile) {
    formData.append("logo", logoFile);
  }

  try {
    const response = await fetch("http://localhost:8000/api/tienda/actualizar-tienda/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });


    const data = await response.json();
    if (data.success) {
      alert("✅ Cambios guardados correctamente.");
      navigate(`/tienda/${user.username}`); // ✅ Ya puedes usarlo sin error
    } else {
      alert("⚠️ Error al guardar: " + (data.error || "desconocido"));
    }
  } catch (err) {
    alert("❌ Error de red al guardar los cambios.");
    console.error(err);
  }
};




 return (
  <div className="flex min-h-screen font-sans text-gray-800">
    {/* CONTENIDO PRINCIPAL */}
    <div className="flex-grow transition-all duration-300">
      {/* TOP CONFIG (NO TOCAR) */}
      <div className="bg-white text-sm border-b py-1 px-4 flex justify-between items-center">
        <div className="flex gap-4">
          <span className="font-bold text-blue-900">Ecommerce</span>
          <span className="hover:underline cursor-pointer">Sitio</span>
          <span className="hover:underline cursor-pointer">Comercio electrónico</span>
          <span className="hover:underline cursor-pointer">Informes</span>
          <span className="hover:underline cursor-pointer">Configuración</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-gray-800 text-white rounded-full px-2 py-1 text-xs">{userInitial}</span>
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-bold">Publicado</span>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={published}
                onChange={handlePublishToggle}
              />
              <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition duration-300 relative">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-md peer-checked:translate-x-4 transform transition duration-300"></div>
              </div>
            </label>
          </div>
          <span className="text-sm text-purple-900 font-semibold cursor-pointer">Nuevo</span>
          <button
            className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            onClick={() => setIsEditorOpen(true)}
          >
            Editar
          </button>
        </div>
      </div>

      {/* NAVBAR ECOMMERCE */}
      <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
          <div
            className={`relative cursor-pointer ${selectedElement === "logo" ? "border-2 border-cyan-400 rounded-full" : ""}`}
            onClick={() => {
              setIsEditorOpen(true);
              setSelectedElement("logo");
            }}
            onDoubleClick={() => setShowLogoUploader(true)}
          >
            {logoPreview && (
              <>
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-8 w-8 rounded-full object-cover"
                />
                {selectedElement === "logo" && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs bg-white text-gray-700 border px-2 py-1 shadow rounded z-50">
                    Presione dos veces para editar
                  </div>
                )}
              </>
            )}
          </div>


           <span
              className={`text-base font-semibold cursor-pointer px-1 rounded 
                ${selectedElement === "nombre" ? "ring-2 ring-cyan-400" : ""}`}
              style={{ color: nameColor, fontSize, fontFamily }}
              onClick={() => {
                setIsEditorOpen(true);
                setSelectedElement("nombre");
              }}
            >
              {storeName}
            </span>


          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <span
              className={`hover:underline cursor-pointer flex items-center gap-1 ${
                selectedElement === "inicio" && activeTab === "personalizar"
                  ? "border border-cyan-400 rounded px-1"
                  : ""
              }`}
              onClick={() => {
                if (activeTab === "personalizar") setSelectedElement("inicio");
              }}
            >
              <FaBoxOpen /> Inicio
            </span>

            <span
              className={`hover:underline cursor-pointer flex items-center gap-1 ${
                selectedElement === "categorias" && activeTab === "personalizar"
                  ? "border border-cyan-400 rounded px-1"
                  : ""
              }`}
              onClick={() => {
                if (activeTab === "personalizar") setSelectedElement("categorias");
              }}
            >
              <FaTags /> Categorías
            </span>

            <span
              className={`hover:underline cursor-pointer flex items-center gap-1 ${
                selectedElement === "productos" && activeTab === "personalizar"
                  ? "border border-cyan-400 rounded px-1"
                  : ""
              }`}
              onClick={() => {
                if (activeTab === "personalizar") setSelectedElement("productos");
              }}
            >
              <FaBoxOpen /> Productos
            </span>

          </nav>
        </div>
        <div className="flex items-center gap-6 text-gray-700 text-xl">
          <FaBell className="cursor-pointer hover:text-indigo-600" />
          <FaShoppingCart className="cursor-pointer hover:text-indigo-600" />
          <FaUserCircle className="cursor-pointer hover:text-indigo-600" />
        </div>
      </div>

      {/* HERO */}
      <div
        className="relative h-96 bg-cover bg-center flex items-end"
        style={{ backgroundImage: `url('/images/reloj-hero.jpg')` }}
      >
        <div className="bg-black bg-opacity-60 w-full p-10">
          <h1 className="text-4xl text-white font-bold">{storeName}</h1>
        </div>
      </div>
    </div>

    {/* PANEL EDITOR (COLAPSABLE DESDE LA DERECHA) */}
    {isEditorOpen && (
      <div className="w-72 bg-gray-900 text-white flex-shrink-0 shadow-lg z-50 border-l">
        {/* TOP BAR */}
        <div className="flex justify-between items-center px-4 py-3 bg-black border-b border-gray-800">
          <div className="flex items-center gap-4">
            <button className="hover:opacity-80">↺</button>
            <button className="hover:opacity-80">↻</button>
            <button className="hover:opacity-80">📱</button>
            <button className="hover:underline text-sm">Descartar</button>
          </div>
          <button
            className="bg-purple-700 hover:bg-purple-600 text-sm px-4 py-1 rounded"
            onClick={handleSaveCustomization}
          >
            Guardar
          </button>

        </div>

        {/* PESTAÑAS */}
        <div className="flex px-4 pt-2 gap-6 border-b border-gray-700 text-sm">
            {["bloques", "personalizar", "tema"].map((tab) => (
              <button
                key={tab}
                className={`pb-1 ${activeTab === tab ? "text-cyan-400 border-b-2 border-cyan-400" : "hover:text-cyan-300 text-gray-300"}`}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedElement(null); // Reiniciar selección
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>



        {/* BLOQUES */}
      <div className="p-4 text-sm text-white overflow-y-auto flex-grow">
            {activeTab === "bloques" && (
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {["Intro", "Columnas", "Contenido", "Imágenes", "Texto", "Productos", "Botón", "Eventos", "Social"].map((item) => (
                  <div key={item} className="p-2 bg-gray-800 rounded hover:bg-cyan-800 cursor-pointer">{item}</div>
                ))}
              </div>
          )}

       {activeTab === "personalizar" && (
  <div className="p-4 space-y-4 text-sm text-white">
    {selectedElement === null && (
      <p className="text-gray-400 text-center">Selecciona un elemento a personalizar</p>
    )}

    {selectedElement === "nombre" && (
      <div className="space-y-3">
        <label className="block text-sm">Nombre de la tienda:</label>
        <input
          type="text"
          className="w-full px-2 py-1 rounded text-black"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />

        <label className="block mt-2">Color de letra:</label>
        <input
          type="color"
          value={nameColor}
          onChange={(e) => setNameColor(e.target.value)}
          className="w-12 h-8 border rounded"
        />

        <label className="block mt-2">Tamaño:</label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="w-full text-black rounded"
        >
          <option value="16px">16px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="30px">30px</option>
        </select>

        <label className="block mt-2">Tipografía:</label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full text-black rounded"
        >
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>
    )}
  </div>
)}


          {activeTab === "tema" && (
            <p className="text-gray-400">Aquí podrás cambiar el tema visual más adelante.</p>
          )}
        </div>


        <div className="text-right pr-4 pb-4 mt-auto">
          <button onClick={() => setIsEditorOpen(false)} className="text-sm text-gray-300 hover:text-red-400">Cerrar ×</button>
        </div>
      </div>
    )}

    {showLogoUploader && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar una imagen para el logo</h2>
      <input id="logoInput" type="file" accept="image/*" onChange={handleLogoChange} />
      <div className="mt-6 flex justify-end gap-3">
        <button
          className="px-4 py-1 text-sm bg-gray-300 hover:bg-gray-400 rounded"
          onClick={() => setShowLogoUploader(false)}
        >
          Cancelar
        </button>
        <button
          className="px-4 py-1 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded"
          onClick={() => setShowLogoUploader(false)}
        >
          Añadir
        </button>
      </div>
    </div>
  </div>
)}

  </div>
);
}




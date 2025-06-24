import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaStore,
  FaChartLine,
  FaCog,
  FaUserCircle,
  FaBell,
} from "react-icons/fa";

export default function GaleriaVisual() {
  const [openMenu, setOpenMenu] = useState(null);
  const [storeName, setStoreName] = useState("Galería Visual");
  const [logoPreview, setLogoPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        localStorage.setItem("storeLogoGV", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    localStorage.setItem("storeNameGV", storeName);
  };

  const menuItems = [
    {
      title: "Ecommerce",
      items: [
        { name: "Pedidos", path: "/pedidos" },
        { name: "Categorías", path: "/categorias" },
        { name: "Productos", path: "/productos" },
        { name: "Ventas", path: "/ventas" },
        { name: "Precios", path: "/precios" },
        { name: "Métodos de Pago", path: "/metodos-pago" },
        { name: "Métodos de Envío", path: "/metodos-envio" },
      ],
    },
    {
      title: "Informes",
      items: [
        { name: "Informes de Ventas", path: "/informes-ventas" },
        { name: "Ventas en Línea", path: "/ventas-en-linea" },
      ],
    },
    {
      title: "Configuraciones",
      items: [
        { name: "Ajustes", path: "/ajustes" },
        { name: "Aplicaciones", path: "/aplicaciones" },
        { name: "CRM", path: "/app-crm" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo"
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="border rounded px-2 py-1 text-sm focus:outline-indigo-500"
              />
              <label className="text-sm text-blue-600 cursor-pointer">
                Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white text-sm px-3 py-1 rounded shadow hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-blue-700">{storeName}</h1>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              Editar
            </button>
          )}
          <FaBell className="text-xl text-gray-600" />
          <FaUserCircle className="text-2xl text-gray-600" />
        </div>
      </header>

      <main className="p-8">
        <h2 className="text-3xl font-semibold text-center text-blue-800 mb-8">
          Bienvenido a {storeName}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {menuItems.map((section) =>
            section.items.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="bg-white shadow-md p-6 rounded-lg hover:shadow-lg transition text-center border border-gray-200"
              >
                <p className="text-lg font-semibold text-blue-700">{item.name}</p>
              </Link>
            ))
          )}
        </div>
      </main>

      <footer className="text-center text-sm text-gray-500 py-6">
        © {new Date().getFullYear()} Galería Visual. Todos los derechos reservados.
      </footer>
    </div>
  );
}


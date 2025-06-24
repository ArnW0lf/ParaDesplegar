import { useState } from "react";
import { Link } from "react-router-dom";
import { FaStore, FaChartLine, FaCog, FaUserCircle, FaBell } from "react-icons/fa";

export default function Urbano() {
  const [openMenu, setOpenMenu] = useState(null);
  const [storeName, setStoreName] = useState(localStorage.getItem("storeName") || "URBANO");
  const [logoPreview, setLogoPreview] = useState(localStorage.getItem("logoUrl") || null);
  const [isEditing, setIsEditing] = useState(false);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      localStorage.setItem("logoUrl", url);
    }
  };

  const handleSave = () => {
    localStorage.setItem("storeName", storeName);
    setIsEditing(false);
  };

  const menuItems = [
    {
      title: "Ecommerce",
      icon: <FaStore className="mr-2 text-red-400" />,
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
      icon: <FaChartLine className="mr-2 text-yellow-400" />,
      items: [
        { name: "Informes de Ventas", path: "/informes-ventas" },
        { name: "Ventas en Línea", path: "/ventas-en-linea" },
      ],
    },
    {
      title: "Configuraciones",
      icon: <FaCog className="mr-2 text-green-400" />,
      items: [
        { name: "Ajustes", path: "/ajustes" },
        { name: "Aplicaciones", path: "/aplicaciones" },
        { name: "CRM", path: "/app-crm", submenu: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white font-sans">
      <header className="bg-gray-900 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo"
                className="h-10 w-10 rounded-full object-cover border-2 border-red-500"
              />
            )}
            {isEditing ? (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center gap-3">
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="bg-black border border-gray-600 text-white px-2 py-1 rounded"
                />
                <label className="text-sm text-red-400 cursor-pointer">
                  Subir Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
                <button
                  onClick={handleSave}
                  className="bg-red-600 px-3 py-1 rounded text-white font-bold hover:bg-red-700"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-black tracking-wider text-neon-green">{storeName}</h1>
            )}
          </div>
          <nav className="flex items-center space-x-6">
            {menuItems.map((menu) => (
              <div key={menu.title} className="relative">
                <button
                  onClick={() => toggleMenu(menu.title)}
                  className={`flex items-center text-white hover:text-red-400 transition-colors ${
                    openMenu === menu.title ? "text-red-500" : ""
                  }`}
                >
                  {menu.icon}
                  <span className="font-medium">{menu.title}</span>
                </button>
                {openMenu === menu.title && (
                  <div className="absolute bg-gray-900 shadow-lg rounded-lg mt-2 py-2 w-56 z-50 border border-gray-700">
                    {menu.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="block px-4 py-2 hover:bg-gray-800 text-white hover:text-neon-green"
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="ml-4 flex items-center gap-4">
              <FaBell className="text-yellow-400 text-xl" />
              <div className="relative">
                <button onClick={() => toggleMenu("user")}
                  className="flex items-center gap-2 text-white hover:text-red-500">
                  <FaUserCircle className="text-2xl text-red-400" />
                  <span className="hidden md:inline">Admin</span>
                </button>
                {openMenu === "user" && (
                  <div className="absolute right-0 bg-gray-900 border border-gray-700 rounded mt-2 py-2 w-48 z-50">
                    <Link to="/perfil" className="block px-4 py-2 hover:bg-gray-800">Mi perfil</Link>
                    <Link to="/configuracion" className="block px-4 py-2 hover:bg-gray-800">Configuración</Link>
                    <button onClick={() => setIsEditing(true)} className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 font-bold">
                      Editar tienda
                    </button>
                    <Link to="/logout" className="block px-4 py-2 text-red-500 hover:bg-red-700">Cerrar sesión</Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold text-white mb-6">Bienvenido a <span className="text-red-500">{storeName}</span></h2>
        <p className="text-lg text-gray-300 mb-10">
          Gestiona tu ecommerce urbano con estilo. Visualiza informes, maneja productos y potencia tu marca con un diseño audaz.
        </p>
        {/* Aquí puedes insertar más contenido */}
      </main>
      <footer className="text-center text-gray-500 py-6 border-t border-gray-700">
        © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
      </footer>
    </div>
  );
}

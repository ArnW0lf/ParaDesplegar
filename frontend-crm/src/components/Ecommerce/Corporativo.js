import { useState } from "react";
import { Link } from "react-router-dom";
import { FaStore, FaChartLine, FaCog, FaSearch, FaUserCircle, FaBell } from "react-icons/fa";

export default function Corporativo() {
  const [openMenu, setOpenMenu] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [storeName, setStoreName] = useState(localStorage.getItem("storeName") || "Corporativo");
  const [logoPreview, setLogoPreview] = useState(localStorage.getItem("storeLogo") || null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      localStorage.setItem("storeLogo", url);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    localStorage.setItem("storeName", storeName);
  };

  const menuItems = [
    {
      title: "Ecommerce",
      icon: <FaStore className="mr-2 text-blue-500" />,
      items: [
        { name: "Pedidos", path: "/pedidos" },
        { name: "Categorías", path: "/categorias" },
        { name: "Productos", path: "/productos" },
        { name: "Ventas", path: "/ventas" },
        { name: "Precios", path: "/precios" },
        { name: "Métodos de Pago", path: "/metodos-pago" },
        { name: "Métodos de Envío", path: "/metodos-envio" }
      ]
    },
    {
      title: "Informes",
      icon: <FaChartLine className="mr-2 text-blue-500" />,
      items: [
        { name: "Informes de Ventas", path: "/informes-ventas" },
        { name: "Ventas en Línea", path: "/ventas-en-linea" }
      ]
    },
    {
      title: "Configuraciones",
      icon: <FaCog className="mr-2 text-blue-500" />,
      items: [
        { name: "Ajustes", path: "/ajustes" },
        { name: "Aplicaciones", path: "/aplicaciones" },
        { name: "CRM", path: "/app-crm" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-gray-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {logoPreview && <img src={logoPreview} alt="Logo" className="h-10 w-10 rounded-full object-cover" />}
            {isEditing ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <label className="cursor-pointer text-sm text-blue-600 font-medium hover:underline">
                  Subir Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-blue-700">{storeName}</h1>
            )}
          </div>

          <nav className="flex items-center space-x-6">
            {menuItems.map((menu) => (
              <div key={menu.title} className="relative">
                <button
                  onClick={() => toggleMenu(menu.title)}
                  className={`flex items-center text-gray-600 hover:text-blue-600 font-medium ${
                    openMenu === menu.title ? "text-blue-600" : ""
                  }`}
                >
                  {menu.icon}
                  {menu.title}
                </button>
                {openMenu === menu.title && (
                  <div className="absolute bg-white shadow-xl rounded-lg py-2 mt-2 w-56 z-50 border border-gray-100">
                    {menu.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="block px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center space-x-4 ml-4">
              <button className="text-gray-500 hover:text-blue-600 relative">
                <FaBell className="text-xl" />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>

              <div className="relative">
                <button
                  onClick={() => toggleMenu("user")}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                >
                  <FaUserCircle className="text-2xl text-blue-500" />
                  <span className="hidden md:inline font-medium">Admin</span>
                </button>

                {openMenu === "user" && (
                  <div className="absolute right-0 bg-white shadow-xl rounded-lg py-2 mt-2 w-48 z-50 border border-gray-100">
                    <Link to="/perfil" className="block px-4 py-2 hover:bg-blue-50">Mi perfil</Link>
                    <Link to="/configuracion" className="block px-4 py-2 hover:bg-blue-50">Configuración</Link>
                    <div className="border-t my-1 border-gray-100" />
                    <Link to="/logout" className="block px-4 py-2 text-red-600 hover:bg-red-50">Cerrar sesión</Link>
                  </div>
                )}
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold text-sm hover:bg-blue-200"
                >
                  Editar
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
            Bienvenido a <span className="text-blue-600">{storeName}</span>
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Una experiencia profesional para gestionar tu negocio con eficacia y elegancia.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Gestión Eficiente",
                description: "Control total de tus operaciones con una interfaz clara.",
                icon: <FaCog className="text-3xl text-blue-600 mb-3" />
              },
              {
                title: "Ventas Inteligentes",
                description: "Analiza y mejora tu rendimiento con informes útiles.",
                icon: <FaChartLine className="text-3xl text-green-600 mb-3" />
              },
              {
                title: "Ecommerce Integrado",
                description: "Vende en línea sin complicaciones y con control completo.",
                icon: <FaStore className="text-3xl text-purple-600 mb-3" />
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 rounded-xl shadow hover:shadow-md transition">
                <div className="flex flex-col items-center text-center">
                  {feature.icon}
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
      </footer>
    </div>
  );
}


import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStore, FaChartLine, FaCog, FaSearch, FaUserCircle, FaBell } from "react-icons/fa";

export default function ModernoMinimalista() {
  const [openMenu, setOpenMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [storeName, setStoreName] = useState("Modernista");
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    const savedName = localStorage.getItem("storeName");
    const savedLogo = localStorage.getItem("logoPreview");
    if (savedName) setStoreName(savedName);
    if (savedLogo) setLogoPreview(savedLogo);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem("storeName", storeName);
    localStorage.setItem("logoPreview", logoPreview);
    setIsEditing(false);
  };

  const menuItems = [
    {
      title: "Ecommerce",
      icon: <FaStore className="mr-2 text-indigo-400" />,
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
      icon: <FaChartLine className="mr-2 text-indigo-400" />,
      items: [
        { name: "Informes de Ventas", path: "/informes-ventas" },
        { name: "Ventas en Línea", path: "/ventas-en-linea" }
      ]
    },
    {
      title: "Configuraciones",
      icon: <FaCog className="mr-2 text-indigo-400" />,
      items: [
        { name: "Ajustes", path: "/ajustes" },
        { name: "Aplicaciones", path: "/aplicaciones" },
        { name: "CRM", path: "/app-crm", submenu: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans text-gray-800 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {logoPreview && (
              <img src={logoPreview} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
            )}

            <h1 className="text-2xl font-bold text-indigo-600">{storeName}</h1>
          </div>

          <nav className="flex items-center space-x-6">
            {menuItems.map((menu) => (
              <div key={menu.title} className="relative">
                <button
                  onClick={() => toggleMenu(menu.title)}
                  className={`flex items-center text-gray-600 hover:text-indigo-600 transition-colors ${openMenu === menu.title ? 'text-indigo-600' : ''}`}
                >
                  {menu.icon}
                  <span className="font-medium">{menu.title}</span>
                </button>

                {openMenu === menu.title && (
                  <div className="absolute bg-white shadow-xl rounded-lg py-2 mt-2 w-56 z-50 border border-gray-100">
                    {menu.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="block px-4 py-2.5 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 transition-colors flex items-center"
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.submenu && <span className="mr-2">→</span>}
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center space-x-4 ml-4">
              <button className="text-gray-500 hover:text-indigo-600 relative">
                <FaBell className="text-xl" />
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => toggleMenu("user")}
                  className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600"
                >
                  <FaUserCircle className="text-2xl text-indigo-400" />
                  <span className="hidden md:inline font-medium">Admin</span>
                </button>

                {openMenu === "user" && (
                  <div className="absolute right-0 bg-white shadow-xl rounded-lg py-2 mt-2 w-48 z-50 border border-gray-100">
                    <Link to="/perfil" className="block px-4 py-2.5 hover:bg-indigo-50">Mi perfil</Link>
                    <Link to="/configuracion" className="block px-4 py-2.5 hover:bg-indigo-50">Configuración</Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <Link to="/logout" className="block px-4 py-2.5 text-red-500 hover:bg-red-50">Cerrar sesión</Link>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-2 block w-full text-left px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                      >
                        ✏ Editar Tienda
                      </button>
                    ) : (
                      <div className="px-4 py-2">
                        <input
                          type="text"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="w-full border p-2 rounded mb-2 text-sm"
                          placeholder="Nombre de la tienda"
                        />
                        <label className="text-indigo-600 text-sm font-medium cursor-pointer block mb-2">
                          Subir Logo
                          <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        </label>
                        <button
                          onClick={handleSave}
                          className="bg-indigo-600 text-white px-4 py-1 rounded text-sm hover:bg-indigo-700 w-full"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">
            Bienvenido a <span className="text-indigo-600">{storeName}</span>
          </h2>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Administra tu tienda con una interfaz limpia y minimalista. Simplifica tus procesos y enfócate en lo que realmente importa: hacer crecer tu negocio.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Diseño intuitivo",
                description: "Interfaz limpia que mejora la productividad y reduce la fatiga visual.",
                color: "bg-indigo-50 text-indigo-600"
              },
              {
                title: "Analíticas en tiempo real",
                description: "Accede a datos clave de tu negocio cuando los necesites.",
                color: "bg-emerald-50 text-emerald-600"
              },
              {
                title: "Gestión centralizada",
                description: "Controla todos los aspectos de tu tienda desde un solo lugar.",
                color: "bg-amber-50 text-amber-600"
              }
            ].map((card, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className={`${card.color} inline-flex items-center justify-center rounded-lg p-3 mb-4`}>
                  {index === 0 && <FaStore className="text-xl" />}
                  {index === 1 && <FaChartLine className="text-xl" />}
                  {index === 2 && <FaCog className="text-xl" />}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{card.title}</h3>
                <p className="text-gray-600">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">¿Necesitas ayuda?</h3>
            <p className="mb-6 opacity-90 max-w-2xl">
              Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier pregunta o problema que puedas tener.
            </p>
            <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition">
              Contactar soporte
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

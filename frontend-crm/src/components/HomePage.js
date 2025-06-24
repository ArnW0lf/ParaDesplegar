import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import HeaderWeb from "./common/HeaderWeb";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-800">
      <HeaderWeb />

      {/* Hero principal */}
      <section className="flex-1 flex flex-col justify-center items-center text-center py-20 bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4">
        <h1 className="text-5xl font-bold mb-6">Bienvenido a la Plataforma CRM+Ecommerce</h1>
        <p className="text-lg max-w-2xl mb-10">
          Crea tu propio sistema CRM o tienda en línea con un solo clic. Ideal para empresas, startups y emprendedores.
        </p>

        <Link
          to="/register"
          className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold hover:bg-blue-50 transition-all duration-300 shadow-sm"
        >
          Comienza Ahora
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl mt-10">
          <Link to="/app-crm" className="bg-white text-blue-600 p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
            <h2 className="text-2xl font-bold mb-3">🚀 Crear mi CRM</h2>
            <p>Gestiona clientes, ventas y seguimiento de oportunidades con tu propio sistema CRM personalizado.</p>
          </Link>
          <Link to="/app-ecommerce" className="bg-white text-blue-600 p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
            <h2 className="text-2xl font-bold mb-3">🛍️ Crear mi Tienda Online</h2>
            <p>Lanza tu e-commerce en minutos. Administra productos, pedidos y pagos desde una plataforma moderna.</p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-6 text-gray-600 text-sm">
        <p>© 2025 CRM+. Todos los derechos reservados.</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link to="/terminos" className="hover:underline">Términos y Condiciones</Link>
          <Link to="/privacidad" className="hover:underline">Política de Privacidad</Link>
          <Link to="/soporte" className="hover:underline">Soporte</Link>
        </div>
      </footer>
    </div>
  );
}
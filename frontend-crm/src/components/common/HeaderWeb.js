import { Link } from "react-router-dom";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function HeaderWeb() {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow-md sticky top-0 z-50">
      <Link to="/" className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 transition-colors">
        GFive
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6">
        <Link to="/precios" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
          Precios
        </Link>
        <Link to="/ayuda" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
          Ayuda
        </Link>
        <div className="flex items-center gap-3">
          <Link 
            to="/login" 
            className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-medium"
          >
            Ingresar
          </Link>
          <Link 
            to="/register" 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-blue-600 text-2xl p-2 focus:outline-none hover:text-blue-800 transition-colors"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden">
          <nav className="flex flex-col">
            <Link 
              to="/precios" 
              onClick={() => setMenuOpen(false)} 
              className="px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium border-b border-gray-100"
            >
              Precios
            </Link>
            <Link 
              to="/ayuda" 
              onClick={() => setMenuOpen(false)} 
              className="px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium border-b border-gray-100"
            >
              Ayuda
            </Link>
            <Link 
              to="/login" 
              onClick={() => setMenuOpen(false)} 
              className="mx-6 my-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-medium text-center"
            >
              Ingresar
            </Link>
            <Link 
              to="/register" 
              onClick={() => setMenuOpen(false)} 
              className="mx-6 mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import config from "../../config";
import {
  FaShoppingCart,
  FaUserCircle,
  FaStore,
  FaSignOutAlt,
  FaBox,
  FaClipboardList,
} from "react-icons/fa";

export default function PublicHeader({
  storeName,
  logo,
  slug,
  cartCount,
  colorPrimario,
  colorTexto,
  tema,
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  const isDark = tema === "oscuro";
  const colorTextoFinal =
    tema === "oscuro" ? "#ffffff" : colorTexto || "#333333";

  const checkAuth = () => {
    const token = localStorage.getItem(`token_${slug}`);
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    checkAuth();
  }, [slug]);

  useEffect(() => {
    const handleStorageChange = () => checkAuth();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [slug]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(`token_${slug}`);
    localStorage.removeItem(`cart_${slug}`);
    setIsAuthenticated(false);
    setMenuOpen(false);
    navigate(`/tienda-publica/${slug}`);
  };

  return (
    <header
      className="flex justify-between items-center p-4 shadow-md sticky top-0 z-50"
      style={{ backgroundColor: colorPrimario || "white" }}
    >
      <div className="flex items-center">
        <Link
          to={`/tienda-publica/${slug}`}
          className="flex items-center gap-2"
        >
          {logo ? (
            <img
              src={logo}
              alt={`Logo de ${storeName}`}
              className="h-10 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/fallback-logo.png";
              }}
            />
          ) : (
            <FaStore className="text-blue-600 text-2xl" />
          )}
          <div
            className="text-2xl font-bold"
            style={{ color: colorTextoFinal }}
          >
            {storeName}
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4 relative">
        <Link
          to={`/tienda-publica/${slug}/cart`}
          className="relative hover:bg-gray-100 p-2 rounded-full transition"
        >
          <FaShoppingCart className="text-gray-600" size={24} />
          {isAuthenticated && cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
              {cartCount}
            </span>
          )}
        </Link>

        {!isAuthenticated ? (
          <>
            <Link
              to={`/tienda-publica/${slug}/register`}
              className="bg-transparent border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition"
            >
              Registrarse
            </Link>
            <Link
              to={`/tienda-publica/${slug}/login`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Iniciar sesión
            </Link>
          </>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="hover:bg-gray-100 p-2 rounded-full transition"
            >
              <FaUserCircle className="text-gray-600" size={24} />
            </button>
            {menuOpen && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded shadow-lg z-50 border ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
              >
                <Link
                  to={`/tienda-publica/${slug}/perfil`}
                  className={`block px-4 py-2 flex items-center gap-2 ${
                    isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <FaUserCircle /> Mi perfil
                </Link>
                <Link
                  to={`/tienda-publica/${slug}/mis-pedidos`}
                  className={`block px-4 py-2 flex items-center gap-2 ${
                    isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <FaClipboardList /> Mis pedidos
                </Link>
                <button
                  onClick={handleLogout}
                  className={`w-full text-left px-4 py-2 flex items-center gap-2 ${
                    isDark
                      ? "text-red-400 hover:bg-gray-700"
                      : "text-red-600 hover:bg-red-100"
                  }`}
                >
                  <FaSignOutAlt /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

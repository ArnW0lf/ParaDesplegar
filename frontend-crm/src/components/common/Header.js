import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaEnvelope, FaArrowLeft, FaSignOutAlt, FaBook, FaDatabase } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

export default function Header({ title = "CRM-Ecommerce", showBackButton = false }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <header className="flex justify-between items-center p-4 shadow-md bg-white sticky top-0 z-50">
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
        )}
        <div className="text-2xl font-bold text-blue-600">{title}</div>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-full transition"
        >
          {user?.profile_picture ? (
            <img 
              src={`${config.apiUrl}${user.profile_picture}`} 
              alt="Foto de perfil" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <FaUserCircle size={28} className="text-gray-600" />
          )}
        </button>
        
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 z-50 border border-gray-100">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="font-semibold text-gray-900">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username || "Usuario"}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <Link to="/backup" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700">
              <FaDatabase className="text-blue-500" /> Copias de Seguridad
            </Link>
            <Link to="/user-profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700">
              <FaUserCircle className="text-blue-500" /> Editar Perfil
            </Link>
            <div className="border-t border-gray-100 my-2"></div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
            >
              <FaSignOutAlt className="text-red-500" /> Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
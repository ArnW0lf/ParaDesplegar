import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaShoppingCart, FaUserCircle, FaEnvelope, FaThLarge, FaUsers, FaStore, FaCog } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import CreateStoreDialog from './Ecommerce/CreateStoreDialog';
import Header from './common/Header';
import config from '../config';


export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [storeConfig, setStoreConfig] = useState(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    postal_code: user?.postal_code || '',
    company: user?.company || '',
    position: user?.position || '',
    bio: user?.bio || '',
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await axios.get(`${config.apiUrl}/api/users/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Datos del usuario:", response.data);
      console.log("Rol del usuario:", response.data.role);
      updateUser(response.data);
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
      setError(error.response?.data?.message || "Error al cargar el perfil");

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  fetchUserProfile();

}, []);


  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = storedCart.reduce((total, item) => total + item.quantity, 0);
    setCartCount(totalItems);
  }, []);

  useEffect(() => {
    checkStore();
  }, []);

const checkStore = async () => {
  try {
    const response = await axios.get(`${config.apiUrl}/api/tiendas/tiendas/config/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    setStoreConfig(response.data);
    setShowCreateDialog(false);
  } catch (error) {
    console.log('Error al verificar la tienda:', error);

    if (error.response?.status === 404) {
      
      setStoreConfig(null);
      setShowCreateDialog(true);
    } else {
      
      toast.error('Error interno al verificar la tienda');
      console.error(error);
    }
  }
};


  const handleStoreCreated = (storeData) => {
    setStoreConfig(storeData);
    setShowCreateDialog(false);
    toast.success('¡Tienda creada exitosamente!');
    navigate('/app-ecommerce');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.put('/api/users/profile/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      updateUser(response.data);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleCardClick = (route) => {
    navigate(route);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header title="CRM-Ecommerce" />

      <section className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full text-center">
          {user?.profile_picture ? (
            <img 
              src={`${config.apiUrl}${user.profile_picture}`} 
              alt="Foto de perfil" 
              className="w-32 h-32 rounded-full mb-4 object-cover mx-auto border-4 border-blue-100"
            />
          ) : (
            <div className="w-32 h-32 rounded-full mb-4 mx-auto bg-blue-100 flex items-center justify-center">
              <FaUserCircle size={80} className="text-blue-500" />
            </div>
          )}
          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user?.username || "Usuario"}
          </h1>
          <p className="text-lg mb-2 text-gray-600">
            <FaEnvelope className="inline-block mr-2 text-blue-500" />
            {user?.email || "No disponible"}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg text-gray-600">Rol:</span>
            <span className="px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {user?.role || "Usuario"}
            </span>
          </div>
        </div>
      </section>

      <section className="flex-1 flex flex-col items-center p-8">
        <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Selecciona el tipo de solución que deseas usar
        </h2>
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
          <div 
            onClick={() => handleCardClick("/crm")}
            className="bg-white p-8 rounded-2xl shadow-lg w-full cursor-pointer hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 group"
          >
            <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
              <FaUsers size={32} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-blue-700 mb-4">CRM</h3>
            <p className="text-gray-600">Gestiona clientes, oportunidades y tareas comerciales desde una sola plataforma.</p>
            <div className="mt-6 text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
              Comenzar →
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("/app-ecommerce")}
            className="bg-white p-8 rounded-2xl shadow-lg w-full cursor-pointer hover:shadow-xl transition-all duration-300 border border-green-100 hover:border-green-300 group"
          >
            <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
              <FaStore size={32} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-green-700 mb-4">E-commerce</h3>
            <p className="text-gray-600">Administra tu tienda virtual, productos, pagos y envíos de forma automatizada.</p>
            <div className="mt-6 text-green-600 font-medium group-hover:translate-x-2 transition-transform">
              Comenzar →
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center text-sm text-gray-500 p-6 border-t bg-white">
        <div className="max-w-4xl mx-auto">
          <p>© 2025 CRM-Commerce. Todos los derechos reservados.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-blue-600">Términos y Condiciones</a>
            <a href="#" className="hover:text-blue-600">Política de Privacidad</a>
            <a href="#" className="hover:text-blue-600">Soporte</a>
          </div>
        </div>
      </footer>

    {showCreateDialog && (
    <CreateStoreDialog
      isOpen={showCreateDialog}
      onClose={() => setShowCreateDialog(false)}
      onStoreCreated={handleStoreCreated}
    />
    )}
    </div>
  );
}


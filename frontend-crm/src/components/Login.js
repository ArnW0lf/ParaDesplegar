import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import API from "../api/api";

function Login({ setToken }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Limpiar cualquier estado residual al montar el componente
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('storeConfig');
    localStorage.removeItem('selectedStore');
    setToken(null);
  }, [setToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Intentando login con:', credentials);
      const res = await API.post("login/", credentials);
      console.log('Respuesta del servidor:', res.data);
      
      if (res.data && res.data.access) {
        // Guardar el token
        const token = res.data.access;
        setToken(token);
        localStorage.setItem('token', token);
        
        // Guardar la información del usuario
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }

        // Mostrar animación de éxito
        setSuccess(true);
        
        // Esperar a que se muestre la animación antes de navegar
        setTimeout(() => {
          // Forzar la navegación usando window.location
          window.location.href = '/profile';
        }, 1500);
      } else {
        throw new Error('No se recibió un token válido');
      }
    } catch (error) {
      console.error('Error detallado:', error);
      let errorMessage = "Error al iniciar sesión";
      
      if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail.toLowerCase();
        if (errorDetail.includes("no active account")) {
          errorMessage = "No existe una cuenta con estas credenciales";
        } else if (errorDetail.includes("invalid credentials")) {
          errorMessage = "Usuario o contraseña incorrectos";
        } else if (errorDetail.includes("token")) {
          errorMessage = "Error de autenticación";
        }
      } else if (error.request) {
        errorMessage = "No se pudo conectar con el servidor";
      }
      
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido</h1>
          <p className="text-slate-600">Inicia sesión en tu cuenta</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative">
          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center animate-fade-in">
              <FaTimesCircle className="mr-3 text-red-500" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Animación de éxito */}
          {success && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center animate-fade-in z-50 rounded-3xl">
              <div className="text-center transform scale-100 transition-transform duration-300">
                <FaCheckCircle className="text-green-500 text-6xl mb-4 animate-bounce" />
                <p className="text-green-600 font-semibold text-xl">¡Inicio de sesión exitoso!</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-6">
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                name="username"
                placeholder="Ingresa tu usuario"
                onChange={handleChange}
                value={credentials.username}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
                disabled={loading}
              />
            </div>

            {/* Contraseña */}
            <div className="mb-8">
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Ingresa tu contraseña"
                  onChange={handleChange}
                  value={credentials.password}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón iniciar sesión */}
            <button
              type="submit"
              className={`w-full bg-blue-600 text-white py-3 rounded-2xl font-medium transition-all duration-200 ${
                loading 
                  ? 'opacity-75 cursor-not-allowed' 
                  : 'hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200'
              }`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <>
                  Ingresar
                  <svg className="inline-block ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Enlaces inferiores */}
          <div className="mt-6 text-center text-sm space-y-3">
            <Link 
              to="/forgot-password" 
              className="block text-slate-500 hover:text-slate-700 transition-colors duration-200"
            >
              ¿Olvidaste tu contraseña?
            </Link>
            <div className="pt-4 border-t border-gray-100">
              <span className="text-slate-500">¿No tienes cuenta? </span>
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
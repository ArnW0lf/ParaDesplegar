import { useState } from "react";
import API from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    company_name: "",
    phonePrefix: "+591",
    phoneNumber: "",
    country: "Bolivia",
    language: "Español",
    company_size: "menos de 5 empleados",
    interest: "Utilizarlo en mi empresa",
    password: "",
    confirmPassword: "",
    role: "cliente"
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validar contraseña en tiempo real
  const validatePassword = (password) => {
    const newErrors = {};
    if (password.length > 0 && password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    } else {
      newErrors.password = "";
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0 || newErrors.password === "";
  };
  
  // Validar coincidencia de contraseñas
  const validatePasswordMatch = (password, confirmPassword) => {
    const newErrors = {};
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    } else {
      newErrors.confirmPassword = "";
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0 || newErrors.confirmPassword === "";
  };
  
  // Validar email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors = {};
    if (email && !re.test(email)) {
      newErrors.email = "Por favor ingresa un correo electrónico válido";
    } else {
      newErrors.email = "";
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0 || newErrors.email === "";
  };
  
  // Validar campos requeridos
  const validateRequired = (field, value) => {
    const newErrors = {};
    if (!value || value.trim() === "") {
      newErrors[field] = "Este campo es obligatorio";
    } else {
      newErrors[field] = "";
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0 || newErrors[field] === "";
  };

  const navigate = useNavigate();

  const countryPhoneCodes = {
    Bolivia: "+591",
    Argentina: "+54",
    Chile: "+56",
    Perú: "+51",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "country") {
      setFormData((prev) => ({
        ...prev,
        country: value,
        phonePrefix: countryPhoneCodes[value] || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Validaciones en tiempo real
      if (name === "password") {
        validatePassword(value);
        if (formData.confirmPassword) {
          validatePasswordMatch(value, formData.confirmPassword);
        }
      } else if (name === "confirmPassword") {
        validatePasswordMatch(formData.password, value);
      } else if (name === "email") {
        validateEmail(value);
      } else if (["full_name", "username", "company_name"].includes(name)) {
        validateRequired(name, value);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validar todos los campos requeridos
    const isFullNameValid = validateRequired("full_name", formData.full_name);
    const isUsernameValid = validateRequired("username", formData.username);
    const isEmailValid = validateEmail(formData.email);
    const isCompanyNameValid = validateRequired("company_name", formData.company_name);
    const isPasswordValid = validatePassword(formData.password);
    const isPasswordMatch = validatePasswordMatch(formData.password, formData.confirmPassword);
    
    // Verificar si hay errores de validación
    if (!isFullNameValid || !isUsernameValid || !isEmailValid || 
        !isCompanyNameValid || !isPasswordValid || !isPasswordMatch) {
      setIsLoading(false);
      return;
    }

    // Dividir el nombre completo en first_name y last_name
    const nameParts = formData.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Preparar los datos para enviar al backend
    const dataToSend = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: firstName,
      last_name: lastName,
      company_name: formData.company_name,
      phone: formData.phonePrefix + formData.phoneNumber,
      country: formData.country,
      language: formData.language,
      company_size: formData.company_size,
      interest: formData.interest,
      role: formData.role
    };

    try {
      console.log("Enviando datos al servidor:", JSON.stringify(dataToSend, null, 2));
      const res = await API.post("register/", dataToSend);
      console.log("Respuesta del servidor:", res.data);
      alert("Usuario registrado exitosamente");
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user)); // Guardar datos del usuario
      navigate("/profile");
    } catch (error) {
      console.error("Error completo:", error);
      if (error.response) {
        console.error("Error en la respuesta:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        let errorMessage = "Error en el registro";
        
        // Intentar obtener mensajes de error específicos
        if (error.response.data) {
          if (typeof error.response.data === 'object') {
            // Si hay errores de validación de Django
            if (error.response.data.detail) {
              errorMessage = error.response.data.detail;
            } else {
              // Recopilar todos los mensajes de error en un solo string
              const errorMessages = [];
              for (const [key, value] of Object.entries(error.response.data)) {
                if (Array.isArray(value)) {
                  errorMessages.push(`${key}: ${value.join(', ')}`);
                } else {
                  errorMessages.push(`${key}: ${value}`);
                }
              }
              errorMessage = errorMessages.join('\n');
            }
          } else {
            errorMessage = error.response.data;
          }
        }
        
        alert(`Error: ${errorMessage}`);
      } else if (error.request) {
        console.error("No se recibió respuesta del servidor:", error.request);
        alert("No se pudo conectar con el servidor. Verifica tu conexión a internet.");
      } else {
        console.error("Error al configurar la solicitud:", error.message);
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Crear cuenta</h2>
          <p className="text-slate-600">Únete y comienza tu experiencia digital</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Información Personal
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  Nombre y apellidos
                </label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Ingresa tu nombre completo"
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={(e) => validateRequired("full_name", e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.full_name ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  required
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Elige un nombre de usuario"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={(e) => validateRequired("username", e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.username ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  required
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) => validateEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">
                Número de teléfono
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  name="phonePrefix"
                  value={formData.phonePrefix}
                  readOnly
                  className="w-24 px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-slate-700 text-center font-medium"
                />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Número de teléfono"
                  required
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Información de la Empresa
            </h3>

            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">
                Nombre de la empresa
              </label>
              <input
                type="text"
                name="company_name"
                placeholder="Nombre de tu empresa"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  País
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="Bolivia">Bolivia</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Chile">Chile</option>
                  <option value="Perú">Perú</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  Idioma
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="Español">Español</option>
                  <option value="Inglés">Inglés</option>
                  <option value="Portugués">Portugués</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  Tamaño de la empresa
                </label>
                <select
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="menos de 5 empleados">Menos de 5 empleados</option>
                  <option value="5 a 10 empleados">5 a 10 empleados</option>
                  <option value="11 a 50 empleados">11 a 50 empleados</option>
                  <option value="más de 50 empleados">Más de 50 empleados</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  Interés
                </label>
                <select
                  name="interest"
                  value={formData.interest}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="Utilizarlo en mi empresa">Utilizarlo en mi empresa</option>
                  <option value="Solo estoy explorando">Solo estoy explorando</option>
                  <option value="Soy desarrollador o consultor">Soy desarrollador o consultor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Seguridad
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Crea una contraseña (mínimo 8 caracteres)"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={(e) => validatePassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-12 bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirma tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={(e) => validatePasswordMatch(formData.password, e.target.value)}
                    className={`w-full px-4 py-3 pr-12 bg-gray-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 text-white py-3 rounded-2xl font-medium transition-all duration-200 ${
              isLoading 
                ? 'opacity-75 cursor-not-allowed' 
                : 'hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
                Creando cuenta...
              </div>
            ) : (
              <>
                Empezar ahora
                <svg className="inline-block ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 space-y-4">
          <p className="text-sm text-center text-slate-500">
            Al hacer clic en <strong>Comenzar</strong>, aceptas nuestro{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors duration-200">Acuerdo de suscripción</a> y{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors duration-200">Política de privacidad</a>.
          </p>
          
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-slate-500">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
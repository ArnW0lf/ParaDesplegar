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
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    const dataToSend = {
      ...formData,
      phone: formData.phonePrefix + formData.phoneNumber,
    };

    try {
      const res = await API.post("register/", dataToSend);
      alert("Usuario registrado exitosamente");
      localStorage.setItem('token', res.data.token);
      navigate("/profile");
    } catch (error) {
      if (error.response) {
        console.error(error.response.data);
        alert(`Error en el registro: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error("Error:", error.message);
        alert("Error en la conexión");
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
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
                    placeholder="Crea una contraseña"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
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
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
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
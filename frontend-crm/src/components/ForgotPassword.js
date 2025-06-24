import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import API from "../api/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await API.post("users/password-reset/", { email });
      setSuccess(true);
    } catch (error) {
      let errorMessage = "Error al procesar la solicitud";
      
      if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail.toLowerCase();
        if (errorDetail.includes("no existe")) {
          errorMessage = "No existe una cuenta con este correo electrónico";
        } else if (errorDetail.includes("invalid")) {
          errorMessage = "Correo electrónico inválido";
        }
      } else if (error.request) {
        errorMessage = "No se pudo conectar con el servidor";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Recuperar Contraseña</h1>
          <p className="text-slate-600">Ingresa tu correo electrónico para recibir instrucciones</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative">
          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center animate-fade-in">
              <FaTimesCircle className="mr-3 text-red-500" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center animate-fade-in">
              <FaCheckCircle className="mr-3 text-green-500" />
              <span className="text-sm">
                Se han enviado las instrucciones a tu correo electrónico
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-8">
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="Ingresa tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
                disabled={loading}
              />
            </div>

            {/* Botón enviar */}
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
                  Enviando...
                </div>
              ) : (
                "Enviar instrucciones"
              )}
            </button>
          </form>

          {/* Enlace para volver */}
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-slate-500 hover:text-slate-700 transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword; 
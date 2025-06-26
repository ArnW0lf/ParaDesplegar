import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaCheck, FaTimes, FaArrowRight, FaArrowLeft, FaLock } from 'react-icons/fa';
import API from '../api/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Loader } from './common/Loader';
import HeaderWeb from './common/HeaderWeb';
import config from '../config';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Usar fetch directamente para evitar el interceptor de la API que agrega el token
        const response = await fetch(`${config.apiUrl}/api/subscriptions/plans/public/`);
        if (!response.ok) {
          throw new Error('Error al cargar los planes');
        }
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error('Error al cargar los planes:', error);
        toast.error('Error al cargar los planes. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (planId, isFree = false) => {
    // Si es un plan gratuito, manejarlo de manera diferente
    if (isFree) {
      if (!user) {
        toast.info('Por favor, regístrate para obtener el plan gratuito');
        navigate('/register', { state: { from: '/precios', plan: 'free' } });
      } else {
        // Aquí podrías manejar la suscripción gratuita directamente
        toast.info('¡Pronto podrás activar tu plan gratuito!');
      }
      return;
    }

    // Para planes de pago, verificar autenticación
    if (!user) {
      // Guardar el plan seleccionado para después del login
      localStorage.setItem('selectedPlan', planId);
      toast.info('Por favor, inicia sesión o regístrate para continuar con el pago');
      navigate('/login', { 
        state: { 
          from: '/precios',
          message: 'Por favor inicia sesión para continuar con tu suscripción'
        } 
      });
      return;
    }

    try {
      setLoading(true);
      const response = await API.post('/subscriptions/create-checkout-session/', {
        plan_id: planId
      });
      
      // Redirigir a Stripe Checkout
      const stripe = window.Stripe('tu_clave_publica_de_stripe');
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error al crear la sesión de pago:', error);
      const errorMessage = error.response?.data?.error || 'Error al procesar el pago. Por favor, intente nuevamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleBillingCycle = () => {
    setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly');
  };

  const filteredPlans = billingCycle === 'monthly' 
    ? plans.filter(plan => plan.plan_type === 'mensual')
    : plans.filter(plan => plan.plan_type === 'anual');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-800">
      <HeaderWeb />
      <div className="py-12 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Precios simples y transparentes
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Elige el plan que mejor se adapte a las necesidades de tu negocio.
          </p>
          
          {/* Toggle Billing Cycle */}
          <div className="mt-8 flex items-center justify-center">
            <span className="text-gray-700 font-medium">Mensual</span>
            <button 
              onClick={toggleBillingCycle}
              className="mx-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className={`w-12 h-6 bg-white rounded-full shadow-inner flex items-center transition-transform duration-300 ease-in-out ${billingCycle === 'yearly' ? 'transform translate-x-6' : ''}`}>
                <div className="w-5 h-5 bg-blue-500 rounded-full shadow-md transform transition-transform duration-300 ease-in-out" />
              </div>
            </button>
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium">Anual</span>
              <span className="text-xs text-blue-600 font-medium">Ahorra hasta un 20%</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {filteredPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-8 bg-white border-2 rounded-2xl shadow-sm flex flex-col ${
                plan.name.toLowerCase().includes('profesional') 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200'
              }`}
            >
              {plan.name.toLowerCase().includes('profesional') && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Más popular
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-gray-500">{plan.description}</p>
                
                <div className="mt-8">
                  <p className="text-4xl font-extrabold text-gray-900">
                    ${billingCycle === 'monthly' 
                      ? Number(plan.price).toFixed(2) 
                      : (Number(plan.price) * 12 * 0.8).toFixed(2)}
                    <span className="text-base font-medium text-gray-500">
                      /{billingCycle === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </p>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-gray-500 mt-1">
                      ${Number(plan.price).toFixed(2)}/mes facturado anualmente
                    </p>
                  )}
                </div>
                
                <ul className="mt-8 space-y-4">
                  <li className="flex items-start">
                    <FaCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Hasta {plan.max_products} productos</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Hasta {plan.max_users} usuarios</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{plan.max_storage}GB de almacenamiento</span>
                  </li>
                  <li className="flex items-start">
                    {plan.has_analytics ? (
                      <>
                        <FaCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Analíticas avanzadas</span>
                      </>
                    ) : (
                      <>
                        <FaTimes className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-400">Analíticas avanzadas</span>
                      </>
                    )}
                  </li>
                  <li className="flex items-start">
                    {plan.has_api_access ? (
                      <>
                        <FaCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Acceso a la API</span>
                      </>
                    ) : (
                      <>
                        <FaTimes className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-400">Acceso a la API</span>
                      </>
                    )}
                  </li>
                </ul>
              </div>
              
              <div className="mt-8">
                <div className="relative">
                  {!user && !plan.name.toLowerCase().includes('gratis') && (
                    <div className="absolute -top-3 right-0 left-0 flex justify-center">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <FaLock className="mr-1" size={10} />
                        Requiere registro
                      </span>
                    </div>
                  )}
                  {user ? (
                    <button
                      onClick={() => handleSubscribe(plan.id, plan.name.toLowerCase().includes('gratis'))}
                      disabled={loading}
                      className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                        plan.name.toLowerCase().includes('profesional')
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : plan.name.toLowerCase().includes('gratis')
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-800 hover:bg-gray-900'
                      } shadow-sm mt-2`}
                    >
                      {loading ? 'Procesando...' : 'Seleccionar plan'}
                    </button>
                  ) : (
                    <Link
                      to="/register"
                      state={{ from: '/precios', plan: plan.name.toLowerCase() }}
                      className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm mt-2"
                    >
                      Comenzar ahora
                    </Link>
                  )}

                </div>
                
                {plan.name.toLowerCase().includes('gratis') ? (
                  <p className="mt-3 text-center text-sm text-gray-500">
                    Sin tarjeta de crédito requerida
                  </p>
                ) : !user && (
                  <p className="mt-3 text-center text-sm text-gray-500">
                    Se te pedirá que inicies sesión o te registres
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">
            Preguntas frecuentes
          </h2>
          <div className="mt-12 max-w-3xl mx-auto space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white shadow overflow-hidden rounded-lg">
                <details className="group">
                  <summary className="flex items-center justify-between px-6 py-4 text-lg font-medium text-gray-900 cursor-pointer hover:bg-gray-50">
                    {item.question}
                    <svg className="w-5 h-5 text-gray-500 transition-transform duration-200 transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 pt-0 text-gray-500">
                    {item.answer}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

const faqItems = [
  {
    question: '¿Puedo cambiar de plan más tarde?',
    answer: '¡Sí! Puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplicarán de forma prorrateada.'
  },
  {
    question: '¿Hay un período de prueba gratuito?',
    answer: 'Sí, ofrecemos un período de prueba de 14 días para todos los planes. No se requiere tarjeta de crédito para comenzar.'
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos todas las principales tarjetas de crédito y débito, incluyendo Visa, Mastercard y American Express.'
  },
  {
    question: '¿Ofrecen descuentos para organizaciones sin fines de lucro?',
    answer: 'Sí, ofrecemos un 50% de descuento para organizaciones sin fines de lucro verificadas. Contáctanos para más información.'
  },
  {
    question: '¿Cómo funciona la facturación?',
    answer: 'La facturación es recurrente según el ciclo que elijas (mensual o anual). Te enviaremos un recibo por correo electrónico con cada pago exitoso.'
  }
];

export default Pricing;
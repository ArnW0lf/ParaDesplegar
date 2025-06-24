import React, { useState, useMemo, useEffect, useContext } from 'react';
import API from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

// Mapeo de países a monedas
const COUNTRY_CURRENCIES = {
  'Bolivia': { code: 'BOB', symbol: 'Bs', name: 'Boliviano' },
  'Argentina': { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
  'Chile': { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
  'Peru': { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
  'default': { code: 'USD', symbol: '$', name: 'Dólar' }
};

// Función para formatear números según la moneda del usuario
const formatNumber = (value, currency = { symbol: '$', code: 'USD' }) => {
  if (value === null || value === undefined || value === '') return '0';
  
  // Convertir a número y manejar valores no numéricos
  const number = typeof value === 'string' ? parseFloat(value.replace(/[^0-9,-]/g, '').replace(',', '.')) : Number(value);
  
  if (isNaN(number)) return '0';
  
  // Configuración regional basada en la moneda
  const locale = {
    'BOB': 'es-BO',
    'ARS': 'es-AR',
    'CLP': 'es-CL',
    'PEN': 'es-PE',
    'USD': 'en-US'
  }[currency.code] || 'en-US';
  
  // Formatear con separadores de miles y decimales
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(number);
};

// Función para obtener la moneda del usuario
const useUserCurrency = () => {
  const [currency, setCurrency] = useState(COUNTRY_CURRENCIES['default']);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await API.get('users/profile/');
        const userCountry = response.data?.country;
        
        if (userCountry && COUNTRY_CURRENCIES[userCountry]) {
          setCurrency(COUNTRY_CURRENCIES[userCountry]);
        }
      } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  return currency;
};

const LeadDetailModal = ({ lead, onClose, onStatusChange }) => {
  const currency = useUserCurrency();
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoInteraccion, setTipoInteraccion] = useState('llamada');
  const [descripcionInteraccion, setDescripcionInteraccion] = useState('');
  const [mostrarFormInteraccion, setMostrarFormInteraccion] = useState(false);
  const [interacciones, setInteracciones] = useState([]);
  const [cargandoInteracciones, setCargandoInteracciones] = useState(true);

  // Cargar interacciones al abrir el modal
  useEffect(() => {
    const cargarInteracciones = async () => {
      try {
        const response = await API.get(`leads/${lead.id}/interacciones/`);
        setInteracciones(response.data);
      } catch (error) {
        console.error('Error al cargar interacciones:', error);
      } finally {
        setCargandoInteracciones(false);
      }
    };

    cargarInteracciones();
  }, [lead.id]);

  // Manejar envío de interacción
  const handleEnviarInteraccion = async (e) => {
    e.preventDefault();
    
    try {
      // Validar que se haya ingresado una descripción
      if (!descripcionInteraccion.trim()) {
        alert('Por favor ingrese una descripción para la interacción');
        return;
      }
      
      // Preparar los datos de la interacción
      const interaccionData = {
        tipo: tipoInteraccion,
        descripcion: descripcionInteraccion.trim()
      };
      
      // Si es una compra, incluir el valor estimado
      if (tipoInteraccion === 'compra' && lead.valor_estimado) {
        interaccionData.valor = parseFloat(lead.valor_estimado);
      }
      
      console.log('Enviando interacción:', interaccionData);
      
      const response = await API.post(`leads/${lead.id}/interacciones/`, interaccionData);
      
      // Actualizar lista de interacciones
      setInteracciones([response.data, ...interacciones]);
      
      // Limpiar formulario
      setDescripcionInteraccion('');
      setTipoInteraccion('llamada');
      setMostrarFormInteraccion(false);
      
      // Mostrar mensaje de éxito
      alert('Interacción registrada correctamente');
      
    } catch (error) {
      console.error('Error al registrar interacción:', error);
      let errorMessage = 'Error al registrar la interacción. Por favor, intente nuevamente.';
      
      // Mostrar mensaje de error más específico si está disponible
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.details) {
          errorMessage = Object.values(error.response.data.details).join('\n');
        }
      }
      
      alert(errorMessage);
    }
  };

  // Abrir enlace de WhatsApp
  const abrirWhatsApp = () => {
    if (!lead.telefono) {
      alert('No hay número de teléfono registrado para este lead');
      return;
    }
    const mensaje = encodeURIComponent(`Hola ${lead.nombre}, `);
    window.open(`https://wa.me/${lead.telefono}?text=${mensaje}`, '_blank');
    
    // Registrar automáticamente la interacción
    registrarInteraccionAutomatica('whatsapp', `Se envió un mensaje de WhatsApp al número ${lead.telefono}`);
  };

  // Abrir cliente de correo
  const abrirCorreo = () => {
    if (!lead.email) {
      alert('No hay dirección de correo electrónico registrada para este lead');
      return;
    }
    window.location.href = `mailto:${lead.email}?subject=Contacto desde CRM`;
    
    // Registrar automáticamente la interacción
    registrarInteraccionAutomatica('email', `Se envió un correo electrónico a ${lead.email}`);
  };
  
  // Registrar interacción automática
  const registrarInteraccionAutomatica = async (tipo, descripcion) => {
    try {
      await API.post(`leads/${lead.id}/interacciones/`, {
        tipo,
        descripcion,
        fecha: new Date().toISOString()
      });
      
      // Actualizar la lista de interacciones
      const response = await API.get(`leads/${lead.id}/interacciones/`);
      setInteracciones(response.data);
      
    } catch (error) {
      console.error('Error al registrar interacción automática:', error);
    }
  };
  // Opciones de acción disponibles según el estado actual
  const getAccionesDisponibles = (estadoActual) => {
    const acciones = {
      nuevo: [
        { accion: 'contactar', texto: 'Marcar como Contactado', estado: 'contactado', icono: '📞', color: 'bg-blue-500' },
        { accion: 'calificar', texto: 'Calificar Lead', estado: 'calificado', icono: '⭐', color: 'bg-yellow-500' },
        { accion: 'perdido', texto: 'Marcar como Perdido', estado: 'perdido', icono: '❌', color: 'bg-red-500' }
      ],
      contactado: [
        { accion: 'calificar', texto: 'Calificar Lead', estado: 'calificado', icono: '⭐', color: 'bg-yellow-500' },
        { accion: 'propuesta', texto: 'Enviar Propuesta', estado: 'propuesta', icono: '📄', color: 'bg-purple-500' },
        { accion: 'nuevo', texto: 'Volver a Nuevo', estado: 'nuevo', icono: '↩️', color: 'bg-gray-500' }
      ],
      calificado: [
        { accion: 'propuesta', texto: 'Enviar Propuesta', estado: 'propuesta', icono: '📄', color: 'bg-purple-500' },
        { accion: 'contactado', texto: 'Volver a Contactado', estado: 'contactado', icono: '↩️', color: 'bg-blue-400' }
      ],
      propuesta: [
        { accion: 'negociacion', texto: 'Iniciar Negociación', estado: 'negociacion', icono: '🤝', color: 'bg-gray-600' },
        { accion: 'calificado', texto: 'Volver a Calificado', estado: 'calificado', icono: '↩️', color: 'bg-yellow-500' }
      ],
      negociacion: [
        { accion: 'ganado', texto: 'Marcar como Ganado', estado: 'ganado', icono: '🏆', color: 'bg-green-500' },
        { accion: 'propuesta', texto: 'Volver a Propuesta', estado: 'propuesta', icono: '↩️', color: 'bg-purple-500' }
      ],
      ganado: [
        { accion: 'nuevo', texto: 'Crear Oportunidad', estado: 'nuevo', icono: '🆕', color: 'bg-blue-500' },
        { accion: 'perdido', texto: 'Marcar como Perdido', estado: 'perdido', icono: '❌', color: 'bg-red-500' }
      ],
      perdido: [
        { accion: 'nuevo', texto: 'Reactivar Lead', estado: 'nuevo', icono: '🔄', color: 'bg-blue-500' },
        { accion: 'contactado', texto: 'Volver a Contactado', estado: 'contactado', icono: '↩️', color: 'bg-blue-400' }
      ]
    };
    return acciones[estadoActual] || [];
  };

  // Usar useMemo para memorizar las acciones basadas en el estado del lead
  const acciones = useMemo(
    () => (lead ? getAccionesDisponibles(lead.estado) : []),
    [lead?.estado]
  );
  
  const handleAccionClick = (nuevoEstado) => {
    if (lead) {
      onStatusChange(lead.id, nuevoEstado);
    }
  };

  if (!lead) return null;



  const getEstadoBadge = (estado) => {
    const colores = {
      nuevo: 'bg-blue-500',
      contactado: 'bg-blue-400',
      calificado: 'bg-yellow-500',
      propuesta: 'bg-purple-500',
      negociacion: 'bg-gray-700',
      ganado: 'bg-green-500',
      perdido: 'bg-red-500'
    };
    
    return (
      <span className={`${colores[estado] || 'bg-gray-500'} text-white text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
        {estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Sin estado'}
      </span>
    );
  };

  // Función para obtener los colores del estado
  const getEstadoColors = (estado) => {
    switch(estado) {
      case 'nuevo':
        return 'bg-blue-100 text-blue-800';
      case 'contactado':
        return 'bg-green-100 text-green-800';
      case 'calificado':
        return 'bg-yellow-100 text-yellow-800';
      case 'propuesta':
        return 'bg-purple-100 text-purple-800';
      case 'negociacion':
        return 'bg-indigo-100 text-indigo-800';
      case 'ganado':
        return 'bg-green-100 text-green-800';
      case 'perdido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{lead.nombre}</h2>
            <div className="flex items-center mt-2 space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColors(lead.estado)}`}>
                {lead.estado ? lead.estado.charAt(0).toUpperCase() + lead.estado.slice(1) : 'Sin estado'}
              </span>
              {lead.fuente && (
                <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                  {lead.fuente.charAt(0).toUpperCase() + lead.fuente.slice(1)}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 -mt-1 -mr-2 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Contenido */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda - Información de Contacto */}
            <div className="lg:col-span-1 space-y-6">
              {/* Tarjeta de Información de Contacto */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Información de Contacto
                </h3>
                
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700 ml-7">{lead.email || 'No especificado'}</p>
                      {lead.email && (
                        <button 
                          onClick={abrirCorreo}
                          className="ml-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center space-x-1 text-sm transition-colors"
                          title="Enviar correo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Correo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm font-medium">Teléfono</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700 ml-7">{lead.telefono || 'No especificado'}</p>
                      {lead.telefono && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={abrirWhatsApp}
                            className="px-2.5 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center space-x-1 text-sm transition-colors"
                            title="Enviar mensaje por WhatsApp"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.963-.94 1.16-.174.196-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.795-1.48-1.775-1.653-2.075-.174-.297-.018-.458.13-.606.136-.133.296-.347.445-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.508-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.874 1.213 3.074.149.197 2.096 3.2 5.078 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.345m-5.446 7.444h-.014a9.27 9.27 0 01-5.03-1.472l-.362-.216-3.742.982.998-3.648-.235-.375a9.31 9.31 0 01-1.43-4.972c.003-5.17 4.212-9.377 9.388-9.38a9.35 9.35 0 016.628 2.744 9.34 9.34 0 012.755 6.62c-.003 5.177-4.22 9.39-9.386 9.391z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => {
                              window.location.href = `tel:${lead.telefono}`;
                              registrarInteraccionAutomatica('llamada', `Se realizó una llamada al número ${lead.telefono}`);
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center space-x-1 text-sm transition-colors"
                            title="Llamar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fuente */}
                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-sm font-medium">Fuente</span>
                    </div>
                    <p className="text-gray-700 ml-7 capitalize">{lead.fuente || 'No especificada'}</p>
                  </div>

                  {/* Valor Estimado */}
                  {lead.valor_estimado && (
                    <div>
                      <div className="flex items-center text-gray-500 mb-1">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">Valor Estimado</span>
                      </div>
                      <p className="text-gray-700 ml-7 font-medium">
                        {formatNumber(lead.valor_estimado, currency)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta de Seguimiento */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Seguimiento
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Estado Actual</span>
                      {getEstadoBadge(lead.estado)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Próximos Pasos</p>
                    <div className="space-y-2">
                      {acciones.map((accion) => (
                        <button
                          key={accion.accion}
                          onClick={() => handleAccionClick(accion.estado)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${accion.color.replace('bg-', 'bg-').replace('500', '100')} ${accion.color.replace('bg-', 'text-').replace('500', '800')} hover:opacity-90 transition-opacity`}
                        >
                          <span className="flex items-center">
                            <span className="mr-2">{accion.icono}</span>
                            {accion.texto}
                          </span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Central - Interacciones */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tarjeta de Interacciones */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Interacciones
                  </h3>
                  <button 
                    onClick={() => setMostrarFormInteraccion(!mostrarFormInteraccion)}
                    className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center space-x-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Nueva Interacción</span>
                  </button>
                </div>

                {mostrarFormInteraccion && (
                  <form onSubmit={handleEnviarInteraccion} className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Interacción</label>
                      <select
                        value={tipoInteraccion}
                        onChange={(e) => setTipoInteraccion(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="llamada">Llamada</option>
                        <option value="email">Email</option>
                        <option value="reunion">Reunión</option>
                        <option value="compra">Compra</option>
                        <option value="otro">Otra</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea
                        value={descripcionInteraccion}
                        onChange={(e) => setDescripcionInteraccion(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        required
                        placeholder="Describe la interacción con el lead..."
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setMostrarFormInteraccion(false)}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                {/* Historial de Interacciones */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">HISTORIAL DE INTERACCIONES</h4>
                  {cargandoInteracciones ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : interacciones.length > 0 ? (
                    <div className="space-y-4">
                      {interacciones.map((interaccion) => (
                        <div key={interaccion.id} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <span className="font-medium text-sm text-gray-800 capitalize">{interaccion.tipo}</span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(interaccion.fecha_creacion || interaccion.fecha)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{interaccion.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Sin interacciones</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Comienza registrando tu primera interacción con este lead.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas del Lead */}
              {(lead.notas || lead.descripcion) && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Notas del Lead
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">{lead.notas || lead.descripcion}</p>
                  </div>
                </div>
              )}

              {/* Metadatos */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-sm text-gray-500">
                <h3 className="text-sm font-medium text-gray-500 mb-3">INFORMACIÓN ADICIONAL</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">ID del Lead</p>
                    <p className="text-gray-700 font-mono">{lead.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Creado</p>
                    <p className="text-gray-700">{formatDate(lead.fecha_creacion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Última actualización</p>
                    <p className="text-gray-700">{formatDate(lead.ultima_actualizacion)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de Compras */}
            {lead.total_compras > 0 && (
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Historial de Compras</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Total Compras</p>
                    <p className="font-semibold">{lead.total_compras}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Valor Total</p>
                    <p className="font-semibold">
                      {currency.symbol} {formatNumber(lead.valor_total_compras, currency)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Frecuencia</p>
                    <p className="font-semibold">{lead.frecuencia_compra || '0'}/mes</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Acciones */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="space-x-2">
            <select 
              value={lead.estado}
              onChange={(e) => onStatusChange(lead.id, e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.entries({
                nuevo: 'Nuevo',
                contactado: 'Contactado',
                calificado: 'Calificado',
                propuesta: 'Propuesta',
                negociacion: 'Negociación',
                ganado: 'Ganado',
                perdido: 'Perdido'
              }).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <div className="space-x-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;

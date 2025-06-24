import React, { useState, useEffect, useMemo } from 'react';
import ReactPaginate from 'react-paginate';
import { FaUsers, FaChartLine, FaMoneyBillWave, FaShoppingCart } from 'react-icons/fa';
import API from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import LeadDetailModal from './LeadDetailModal';

// Mapeo de países a monedas
const COUNTRY_CURRENCIES = {
    'Bolivia': { code: 'BOB', symbol: 'Bs', name: 'Boliviano' },
    'Argentina': { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
    'Chile': { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
    'Peru': { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
    'default': { code: 'USD', symbol: '$', name: 'Dólar' }
};


// Definición de estados de Lead
const ESTADOS_LEAD = {
    nuevo: 'Nuevo',
    contactado: 'Contactado',
    calificado: 'Calificado',
    propuesta: 'Propuesta',
    negociacion: 'Negociación',
    ganado: 'Ganado',
    perdido: 'Perdido'
};

const CRM = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [metricas, setMetricas] = useState({
        total_leads: 0,
        valor_total_pipeline: 0,
        valor_total_compras: 0,
        promedio_compras: 0,
        leads_por_estado: {}
    });
    const [error, setError] = useState("");
    const [selectedStatus, setSelectedStatus] = useState('todos');
    const [showModal, setShowModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showLeadDetail, setShowLeadDetail] = useState(false);
    const [currency, setCurrency] = useState(COUNTRY_CURRENCIES['default']);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage] = useState(10);

    // Filtrar leads por término de búsqueda y estado
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesSearch = searchTerm === '' || 
                lead.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
                
            const matchesStatus = selectedStatus === 'todos' || lead.estado === selectedStatus;
            
            return matchesSearch && matchesStatus;
        });
    }, [leads, searchTerm, selectedStatus]);

    // Obtener leads para la página actual
    const paginatedLeads = useMemo(() => {
        const startIndex = currentPage * itemsPerPage;
        return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLeads, currentPage, itemsPerPage]);

    // Manejar cambio de página
    const handlePageClick = (data) => {
        setCurrentPage(data.selected);
        window.scrollTo(0, 0);
    };

    const handleLeadClick = (lead) => {
        setSelectedLead(lead);
        setShowLeadDetail(true);
    };

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            // Actualizar el lead en el servidor
            const response = await API.patch(`leads/${leadId}/`, { estado: newStatus });
            const updatedLead = response.data;
            
            // Actualizar el estado local
            setLeads(leads.map(lead => 
                lead.id === leadId ? { ...lead, ...updatedLead } : lead
            ));
            
            // Si el lead seleccionado es el que cambió, actualizarlo también
            if (selectedLead && selectedLead.id === leadId) {
                setSelectedLead({ ...selectedLead, ...updatedLead });
            }
            
            // Actualizar las métricas
            fetchMetricas();
            
            return updatedLead;
        } catch (error) {
            console.error('Error actualizando estado del lead:', error);
            throw error;
        }
    };
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [nuevaNota, setNuevaNota] = useState('');
    const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        notas: '',
        valor_estimado: '',
        probabilidad: '',
        fuente: 'manual'
    });

    const handleCreateLeadSubmit = async (e) => {
        e.preventDefault();
        
        if (!userProfile) {
            setError('No se pudo identificar el usuario. Por favor, recargue la página.');
            return;
        }

        try {
            setError('');
            
            // Verificar que el usuario tenga un tenant asignado
            if (!userProfile.tenant_id) {
                setError('No se pudo identificar el tenant en tu perfil. Contacte al administrador.');
                return;
            }

            const leadData = {
                ...formData,
                usuario: userProfile.id,  // ID del usuario autenticado
                tienda: userProfile.tienda?.id || null,  // Opcional
                estado: 'nuevo',
                // Asegurarse de que los campos opcionales sean null si están vacíos
                telefono: formData.telefono || null,
                notas: formData.notas || null,
                valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : 0,
                probabilidad: formData.probabilidad ? parseInt(formData.probabilidad) : 0,
                // Inicializar métricas
                total_compras: 0,
                valor_total_compras: 0,
                frecuencia_compra: 0
            };
            
            console.log('Enviando datos del lead:', leadData);
            const response = await API.post('leads/', leadData);
            console.log('Lead creado exitosamente:', response.data);
            
            setShowCreateLeadModal(false);
            setFormData({
                nombre: '',
                email: '',
                telefono: '',
                notas: '',
                valor_estimado: '',
                probabilidad: '',
                fuente: 'manual'
            });
            
            // Actualizar la lista de leads y las métricas
            const updatedLeads = await API.get('leads/');
            setLeads(updatedLeads.data);
            
            // Calcular y actualizar las métricas
            const totalLeads = updatedLeads.data.length;
            const valorTotalPipeline = updatedLeads.data.reduce((sum, lead) => {
                // Asegurarse de que el valor sea un número
                const valor = parseFloat(lead.valor_estimado) || 0;
                return sum + valor;
            }, 0);
            
            const valorTotalCompras = updatedLeads.data.reduce((sum, lead) => {
                // Asegurarse de que el valor sea un número
                const valor = parseFloat(lead.valor_total_compras) || 0;
                return sum + valor;
            }, 0);
            
            const promedioCompras = totalLeads > 0 ? 
                updatedLeads.data.reduce((sum, lead) => {
                    // Asegurarse de que el valor sea un número
                    const valor = parseFloat(lead.frecuencia_compra) || 0;
                    return sum + valor;
                }, 0) / totalLeads : 0;
                
            // Contar leads por estado
            const leadsPorEstado = {};
            updatedLeads.data.forEach(lead => {
                if (lead.estado) {
                    leadsPorEstado[lead.estado] = (leadsPorEstado[lead.estado] || 0) + 1;
                }
            });
            
            setMetricas({
                total_leads: totalLeads,
                valor_total_pipeline: parseFloat(valorTotalPipeline.toFixed(2)),
                valor_total_compras: parseFloat(valorTotalCompras.toFixed(2)),
                promedio_compras: parseFloat(promedioCompras.toFixed(2)),
                leads_por_estado: leadsPorEstado
            });
        } catch (error) {
            console.error('Error creando lead:', error);
            const errorMessage = error.response?.data || error.message || 'Error al crear el lead';
            console.error('Detalles del error:', errorMessage);
            setError(JSON.stringify(errorMessage));
        }
    };

    const handleCreateLeadModal = () => {
        setShowCreateLeadModal(true);
    };

    const handleCloseCreateLeadModal = () => {
        setShowCreateLeadModal(false);
        setFormData({
            nombre: '',
            email: '',
            telefono: '',
            notas: '',
            valor_estimado: '',
            probabilidad: '',
            fuente: 'manual'
        });
        setError('');
    };

    // Obtener el perfil del usuario al cargar el componente
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await API.get('users/profile/');
                console.log('Perfil del usuario:', response.data);
                setUserProfile(response.data);
                
                // Establecer la moneda según el país del usuario
                if (response.data.country) {
                    const userCurrency = COUNTRY_CURRENCIES[response.data.country] || COUNTRY_CURRENCIES['default'];
                    setCurrency(userCurrency);
                }
                
                // Verificar si el perfil incluye el tenant
                if (!response.data.tenant_id) {
                    console.warn('El perfil del usuario no incluye información de tenant');
                }
            } catch (error) {
                console.error('Error al obtener el perfil del usuario:', error);
                setError('No se pudo cargar la información del usuario');
            }
        };

        fetchUserProfile();
    }, []);

    // Cargar leads y métricas cuando el perfil esté disponible
    useEffect(() => {
        if (userProfile) {
            fetchLeads();
            fetchMetricas();
        }
    }, [userProfile]);

    const fetchLeads = async () => {
        try {
            const response = await API.get('leads/');
            const leadsData = response.data;
            
            // Procesar los leads para asegurar que los valores numéricos sean correctos
            const processedLeads = leadsData.map(lead => ({
                ...lead,
                valor_estimado: parseFloat(lead.valor_estimado) || 0,
                valor_total_compras: parseFloat(lead.valor_total_compras) || 0,
                frecuencia_compra: parseFloat(lead.frecuencia_compra) || 0
            }));
            
            setLeads(processedLeads);
            
            // Calcular métricas con los valores procesados
            const totalLeads = processedLeads.length;
            const valorTotalPipeline = processedLeads.reduce((sum, lead) => sum + (lead.valor_estimado || 0), 0);
            const valorTotalCompras = processedLeads.reduce((sum, lead) => sum + (lead.valor_total_compras || 0), 0);
            const promedioCompras = totalLeads > 0 ? 
                processedLeads.reduce((sum, lead) => sum + (lead.frecuencia_compra || 0), 0) / totalLeads : 0;
            
            // Contar leads por estado
            const leadsPorEstado = {};
            processedLeads.forEach(lead => {
                if (lead.estado) {
                    leadsPorEstado[lead.estado] = (leadsPorEstado[lead.estado] || 0) + 1;
                }
            });
            
            setMetricas({
                total_leads: totalLeads,
                valor_total_pipeline: parseFloat(valorTotalPipeline.toFixed(2)),
                valor_total_compras: parseFloat(valorTotalCompras.toFixed(2)),
                promedio_compras: parseFloat(promedioCompras.toFixed(2)),
                leads_por_estado: leadsPorEstado
            });
            
            setError('');
        } catch (error) {
            console.error('Error al obtener leads:', error);
            let errorMessage = '';
            
            if (error.response) {
                if (error.response.status === 404) {
                    errorMessage = 'No se encontró tu tienda. Por favor, contacta al administrador.';
                } else {
                    errorMessage = error.response.data.detail || 'Error al obtener los leads';
                }
            } else {
                errorMessage = 'Error al conectar con el servidor';
            }
            setError(errorMessage);
        }
    };

    useEffect(() => {
        if (error) {
            alert(error);
        }
    }, [error]);

    const fetchMetricas = async () => {
        try {
            const response = await API.get('leads/metricas/');
            setMetricas(response.data);
        } catch (error) {
            console.error('Error al obtener métricas:', error);
        }
    };

    const handleActualizarEstado = async () => {
        try {
            await API.post(`leads/${selectedLead.id}/actualizar_estado/`, {
                estado: nuevoEstado,
                notas: nuevaNota
            });
            setShowModal(false);
            fetchLeads();
            fetchMetricas();
        } catch (error) {
            console.error('Error al actualizar estado:', error);
        }
    };

    const getEstadoBadge = (estado) => {
        const colores = {
            nuevo: 'bg-blue-100 text-blue-800',
            contactado: 'bg-blue-100 text-blue-800',
            calificado: 'bg-yellow-100 text-yellow-800',
            propuesta: 'bg-gray-100 text-gray-800',
            negociacion: 'bg-gray-100 text-gray-800',
            ganado: 'bg-green-100 text-green-800',
            perdido: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colores[estado]}`}>
                {estado.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header title="Dashboard CRM" />
            
            {/* Main Content */}
            <main className="flex-1 p-6">
                {/* Filtros y Acciones */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">CRM</h1>
                    <div className="flex items-center space-x-4">
                        {userProfile?.tenant_id && (
                            <div className="text-sm text-gray-600">
                                Moneda: {currency.name} ({currency.symbol}) • Tenant ID: {userProfile.tenant_id}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            className="w-full border rounded px-3 py-2"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(0); // Resetear a la primera página al buscar
                            }}
                        />
                    </div>
                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <select 
                            className="border rounded px-3 py-2 w-full md:w-auto"
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setCurrentPage(0); // Resetear a la primera página al cambiar el filtro
                            }}
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="nuevo">Nuevo</option>
                            <option value="contactado">Contactado</option>
                            <option value="calificado">Calificado</option>
                            <option value="propuesta">Propuesta</option>
                            <option value="negociacion">Negociación</option>
                            <option value="ganado">Ganado</option>
                            <option value="perdido">Perdido</option>
                        </select>
                        <span className="text-sm text-gray-500">
                            {filteredLeads.length} resultados
                        </span>
                    </div>
                    <div>
                        <button
                            onClick={handleCreateLeadModal}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Crear Nuevo Lead
                        </button>
                    </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <FaUsers className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <h5 className="text-gray-600 mb-2">Total Leads</h5>
                        <h3 className="text-2xl font-bold">{metricas?.total_leads || 0}</h3>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <FaChartLine className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <h5 className="text-gray-600 mb-2">Pipeline</h5>
                        <h3 className="text-2xl font-bold">{currency.symbol} {(metricas?.valor_total_pipeline || 0).toLocaleString('es-ES')}</h3>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <FaMoneyBillWave className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                        <h5 className="text-gray-600 mb-2">Ventas Totales</h5>
                        <h3 className="text-2xl font-bold">{currency.symbol} {(metricas?.valor_total_compras || 0).toLocaleString('es-ES')}</h3>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <FaShoppingCart className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <h5 className="text-gray-600 mb-2">Promedio Compras</h5>
                        <h3 className="text-2xl font-bold">{currency.symbol} {(metricas?.promedio_compras || 0).toFixed(2)}</h3>
                    </div>
                </div>

                {/* Tabla de Leads */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                        <h4 className="text-lg font-semibold">Leads</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Estimado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Compras</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedLeads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button 
                                                onClick={() => handleLeadClick(lead)}
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {lead.nombre}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{lead.email || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(lead.estado)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{currency.symbol} {lead.valor_estimado || '0'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{currency.symbol} {lead.valor_total_compras || '0'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(lead.ultima_actualizacion).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button 
                                                onClick={() => handleLeadClick(lead)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Paginación */}
                        {Math.ceil(filteredLeads.length / itemsPerPage) > 1 && (
                            <div className="px-6 py-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Mostrando {Math.min(currentPage * itemsPerPage + 1, filteredLeads.length)} a {Math.min((currentPage * itemsPerPage) + itemsPerPage, filteredLeads.length)} de {filteredLeads.length} resultados
                                    </div>
                                    <ReactPaginate
                                        previousLabel={'Anterior'}
                                        nextLabel={'Siguiente'}
                                        breakLabel={'...'}
                                        pageCount={Math.ceil(filteredLeads.length / itemsPerPage)}
                                        marginPagesDisplayed={2}
                                        pageRangeDisplayed={5}
                                        onPageChange={handlePageClick}
                                        containerClassName={'flex items-center space-x-1'}
                                        pageClassName={'px-3 py-1 border rounded'}
                                        pageLinkClassName={'text-blue-600'}
                                        activeClassName={'bg-blue-100 border-blue-300'}
                                        previousClassName={'px-3 py-1 border rounded'}
                                        nextClassName={'px-3 py-1 border rounded'}
                                        disabledClassName={'opacity-50 cursor-not-allowed'}
                                        breakClassName={'px-2'}
                                        forcePage={currentPage}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal de Detalles del Lead */}
                {showLeadDetail && selectedLead && (
                    <LeadDetailModal
                        lead={selectedLead}
                        onClose={() => setShowLeadDetail(false)}
                        onStatusChange={handleStatusChange}
                        currency={currency}
                    />
                )}

                {/* Mensaje de error */}
                {error && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                        <div className="relative top-20 mx-auto p-6 bg-red-100 rounded-lg shadow-lg w-96">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-red-700">Error</h3>
                                <button
                                    onClick={() => setError('')}
                                    className="text-red-400 hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Modal de Creación de Lead - Mejorado */}
                {showCreateLeadModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            {/* Fondo oscuro del modal */}
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseCreateLeadModal}></div>
                            
                            {/* Contenido del modal */}
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-2xl font-semibold leading-6 text-gray-900" id="modal-title">
                                                    Nuevo Lead
                                                </h3>
                                                <button
                                                    type="button"
                                                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                                    onClick={handleCloseCreateLeadModal}
                                                >
                                                    <span className="sr-only">Cerrar</span>
                                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            
                                            {error && (
                                                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                                                    {error}
                                                </div>
                                            )}
                                            
                                            <form onSubmit={handleCreateLeadSubmit} className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre *</label>
                                                        <input
                                                            type="text"
                                                            id="nombre"
                                                            name="nombre"
                                                            value={formData.nombre}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                            placeholder="Nombre completo"
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                            placeholder="correo@ejemplo.com"
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 flex items-center">
                                                                <label htmlFor="country" className="sr-only">País</label>
                                                                <span className="text-gray-500 sm:text-sm pl-3">+591</span>
                                                            </div>
                                                            <input
                                                                type="tel"
                                                                id="telefono"
                                                                name="telefono"
                                                                value={formData.telefono}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-14 sm:text-sm border-gray-300 rounded-md p-2 border"
                                                                placeholder="7XX-XXXXX"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label htmlFor="fuente" className="block text-sm font-medium text-gray-700">Fuente</label>
                                                        <select
                                                            id="fuente"
                                                            name="fuente"
                                                            value={formData.fuente}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, fuente: e.target.value }))}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                        >
                                                            <option value="manual">Manual</option>
                                                            <option value="tienda_publica">Tienda Pública</option>
                                                            <option value="ecommerce">E-commerce</option>
                                                            <option value="redes_sociales">Redes Sociales</option>
                                                            <option value="recomendacion">Recomendación</option>
                                                            <option value="otro">Otro</option>
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label htmlFor="valor_estimado" className="block text-sm font-medium text-gray-700">
                                                            Valor Estimado ({currency.symbol})
                                                        </label>
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <span className="text-gray-500 sm:text-sm">{currency.symbol}</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                id="valor_estimado"
                                                                name="valor_estimado"
                                                                min="0"
                                                                step="0.01"
                                                                value={formData.valor_estimado}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado: e.target.value }))}
                                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label htmlFor="probabilidad" className="block text-sm font-medium text-gray-700">
                                                            Probabilidad de cierre
                                                        </label>
                                                        <div className="mt-1">
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="range"
                                                                    id="probabilidad"
                                                                    name="probabilidad"
                                                                    min="0"
                                                                    max="100"
                                                                    value={formData.probabilidad || 0}
                                                                    onChange={(e) => setFormData(prev => ({ ...prev, probabilidad: e.target.value }))}
                                                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                                />
                                                                <span className="ml-3 text-sm font-medium text-gray-700 w-12">
                                                                    {formData.probabilidad || 0}%
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                                <span>Baja</span>
                                                                <span>Media</span>
                                                                <span>Alta</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-span-2">
                                                        <label htmlFor="notas" className="block text-sm font-medium text-gray-700">Notas</label>
                                                        <div className="mt-1">
                                                            <textarea
                                                                id="notas"
                                                                name="notas"
                                                                rows="3"
                                                                value={formData.notas}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                                                placeholder="Información adicional sobre el lead..."
                                                            ></textarea>
                                                        </div>
                                                        <p className="mt-2 text-sm text-gray-500">
                                                            Incluye cualquier detalle relevante sobre el lead.
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-6 flex items-center justify-end space-x-3">
                                                    <button
                                                        type="button"
                                                        onClick={handleCloseCreateLeadModal}
                                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Guardar Lead
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Actualización */}
                {showModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Actualizar Lead</h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setError('');
                                    }}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="mt-2">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                                    <select
                                        value={nuevoEstado}
                                        onChange={(e) => setNuevoEstado(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        {Object.entries(ESTADOS_LEAD).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                                    <textarea
                                        value={nuevaNota}
                                        onChange={(e) => setNuevaNota(e.target.value)}
                                        rows="3"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-4">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleActualizarEstado}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Detalles del Lead */}
                {showLeadDetail && selectedLead && (
                    <LeadDetailModal
                        lead={selectedLead}
                        onClose={() => setShowLeadDetail(false)}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </main>
        </div>
    );
};

export default CRM;

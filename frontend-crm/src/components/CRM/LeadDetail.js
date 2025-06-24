import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaShoppingCart, FaHistory, FaMoneyBillWave } from 'react-icons/fa';
import API from '../../utils/api';

const LeadDetail = ({ leadId }) => {
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeadDetails();
    }, [leadId]);

    const fetchLeadDetails = async () => {
        try {
            const response = await API.get(`leads/${leadId}/`);
            setLead(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error al obtener detalles del lead:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    if (!lead) {
        return <div className="flex justify-center items-center h-screen">Lead no encontrado</div>;
    }

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
            <span className={`${colores[estado]} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
                {estado.toUpperCase()}
            </span>
        );
    };

    const getFuenteColor = (fuente) => {
        const colores = {
            tienda_publica: 'bg-blue-500',
            ecommerce: 'bg-green-500'
        };
        return colores[fuente] || 'bg-gray-500';
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Detalles del Lead</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Información Principal */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b p-4">
                        <h4 className="text-lg font-semibold">Información del Lead</h4>
                    </div>
                    <div className="p-4">
                        <ul className="space-y-3">
                            <li className="flex items-center">
                                <FaUser className="mr-2 text-gray-500" />
                                <span className="font-semibold mr-2">Nombre:</span> {lead.nombre}
                            </li>
                            <li className="flex items-center">
                                <FaEnvelope className="mr-2 text-gray-500" />
                                <span className="font-semibold mr-2">Email:</span> {lead.email}
                            </li>
                            <li className="flex items-center">
                                <span className="font-semibold mr-2">Estado:</span> {getEstadoBadge(lead.estado)}
                            </li>
                            <li className="flex items-center">
                                <span className="font-semibold mr-2">Valor Estimado:</span> ${lead.valor_estimado}
                            </li>
                            <li className="flex items-center">
                                <span className="font-semibold mr-2">Probabilidad:</span> {lead.probabilidad}%
                            </li>
                            <li className="flex items-center">
                                <span className="font-semibold mr-2">Fuente:</span> 
                                <span className={`text-white px-2 py-1 rounded-full text-xs font-semibold ${getFuenteColor(lead.fuente)}`}>
                                    {lead.fuente.toUpperCase()}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Métricas de Compras */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b p-4">
                        <h4 className="text-lg font-semibold">Métricas de Compras</h4>
                    </div>
                    <div className="p-4">
                        <ul className="space-y-3">
                            <li className="flex items-center">
                                <FaShoppingCart className="mr-2 text-gray-500" />
                                <span className="font-semibold mr-2">Total Compras:</span> {lead.total_compras}
                            </li>
                            <li className="flex items-center">
                                <FaMoneyBillWave className="mr-2 text-gray-500" />
                                <span className="font-semibold mr-2">Valor Total:</span> ${lead.valor_total_compras}
                            </li>
                            <li className="flex items-center">
                                <span className="font-semibold mr-2">Frecuencia:</span> {lead.frecuencia_compra} días
                            </li>
                            <li className="flex items-center">
                                <span className="font-semibold mr-2">Última Compra:</span> {new Date(lead.ultima_compra).toLocaleDateString()}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Historial de Interacciones */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b p-4">
                        <h4 className="text-lg font-semibold">Historial de Interacciones</h4>
                    </div>
                    <div className="p-4">
                        <ul className="space-y-3">
                            {lead.interacciones.map(interaccion => (
                                <li key={interaccion.id} className="border-b pb-3 last:border-b-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{interaccion.tipo}</p>
                                            <p className="text-sm text-gray-600">{interaccion.descripcion}</p>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(interaccion.fecha).toLocaleDateString()}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Notas */}
            {lead.notas && (
                <div className="mt-4 bg-white rounded-lg shadow-md">
                    <div className="border-b p-4">
                        <h4 className="text-lg font-semibold">Notas</h4>
                    </div>
                    <div className="p-4">
                        <p className="text-gray-700">{lead.notas}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadDetail;
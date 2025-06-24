import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import CreateStoreDialog from './CreateStoreDialog';

const Store = () => {
    const [storeConfig, setStoreConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchStoreConfig();
    }, []);

    const fetchStoreConfig = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/tiendas/tiendas/config/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setStoreConfig(response.data);
            setLoading(false);
        } catch (error) {
            console.log('Error al cargar la tienda:', error);
            if (error.response?.status === 404) {
                setShowCreateDialog(true);
            } else {
                setError('Error al cargar la configuración de la tienda');
                toast.error('Error al cargar la configuración de la tienda');
            }
            setLoading(false);
        }
    };

    const handleStoreCreated = (storeData) => {
        setStoreConfig(storeData);
        setShowCreateDialog(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <CreateStoreDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onStoreCreated={handleStoreCreated}
            />

            {storeConfig && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            {storeConfig.logo && (
                                <img
                                    src={storeConfig.logo}
                                    alt={storeConfig.nombre}
                                    className="h-16 w-16 object-contain"
                                />
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{storeConfig.nombre}</h1>
                                <p className="text-gray-600">{storeConfig.descripcion}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/store/settings')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Configurar Tienda
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold mb-2">Productos</h2>
                            <p className="text-gray-600">Gestiona tu catálogo de productos</p>
                            <button
                                onClick={() => navigate('/store/products')}
                                className="mt-2 text-blue-600 hover:text-blue-800"
                            >
                                Ver Productos →
                            </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold mb-2">Categorías</h2>
                            <p className="text-gray-600">Organiza tus productos por categorías</p>
                            <button
                                onClick={() => navigate('/store/categories')}
                                className="mt-2 text-blue-600 hover:text-blue-800"
                            >
                                Ver Categorías →
                            </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold mb-2">Vista Previa</h2>
                            <p className="text-gray-600">Ve cómo se ve tu tienda para los clientes</p>
                            {storeConfig.publicado ? (
                                <button
                                    onClick={() => navigate(`/tienda-publica/${storeConfig.slug}`)}
                                    className="mt-2 text-blue-600 hover:text-blue-800"
                                >
                                    Ver Tienda →
                                </button>
                            ) : (
                                <p className="mt-2 text-yellow-600">
                                    Tu tienda aún no está publicada. Configúrala para hacerla pública.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store; 
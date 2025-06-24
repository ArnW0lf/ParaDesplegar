import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCreditCard, FaMoneyBill, FaExchangeAlt, FaMoneyBillWave, FaBitcoin, FaInfoCircle, FaPaypal, FaStripe } from 'react-icons/fa';
import API from '../../api/api';
import { toast } from 'react-toastify';

const PaymentSettings = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        payment_type: '',
        is_active: true,
        credentials: {
            client_id: '',
            client_secret: '',
            sandbox: true
        },
        instructions: ''
    });

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const response = await API.get('payments/methods/');
            setPaymentMethods(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar métodos de cobro:', error);
            toast.error('Error al cargar los métodos de cobro');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMethod) {
                await API.patch(`payments/methods/${editingMethod.id}/`, formData);
                toast.success('Método de cobro actualizado exitosamente');
            } else {
                await API.post('payments/methods/', formData);
                toast.success('Método de cobro agregado exitosamente');
            }
            setShowAddModal(false);
            setEditingMethod(null);
            setFormData({
                name: '',
                payment_type: '',
                is_active: true,
                credentials: {
                    client_id: '',
                    client_secret: '',
                    sandbox: true
                },
                instructions: ''
            });
            fetchPaymentMethods();
        } catch (error) {
            console.error('Error al guardar método de cobro:', error);
            toast.error('Error al guardar el método de cobro');
        }
    };

    const handleEdit = (method) => {
        setEditingMethod(method);
        setFormData({
            name: method.name,
            payment_type: method.payment_type,
            is_active: method.is_active,
            credentials: method.credentials || {},
            instructions: method.instructions || ''
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este método de cobro?')) {
            try {
                await API.delete(`payments/methods/${id}/`);
                toast.success('Método de cobro eliminado exitosamente');
                fetchPaymentMethods();
            } catch (error) {
                console.error('Error al eliminar método de cobro:', error);
                toast.error('Error al eliminar el método de cobro');
            }
        }
    };

    const getPaymentTypeIcon = (type) => {
        switch (type) {
            case 'credit_card':
                return <FaCreditCard className="text-blue-600" />;
            case 'debit_card':
                return <FaMoneyBill className="text-green-600" />;
            case 'bank_transfer':
                return <FaExchangeAlt className="text-purple-600" />;
            case 'cash':
                return <FaMoneyBillWave className="text-yellow-600" />;
            case 'crypto':
                return <FaBitcoin className="text-orange-600" />;
            case 'paypal':
                return <FaPaypal className="text-blue-500" />;
            case 'stripe':
                return <FaStripe className="text-purple-500" />;
            default:
                return <FaCreditCard className="text-gray-600" />;
        }
    };

    const getPaymentTypeName = (type) => {
        const types = {
            'credit_card': 'Tarjeta de Crédito',
            'debit_card': 'Tarjeta de Débito',
            'bank_transfer': 'Transferencia Bancaria',
            'cash': 'Efectivo',
            'crypto': 'Criptomonedas',
            'paypal': 'PayPal',
            'stripe': 'Stripe'
        };
        return types[type] || type;
    };

    const renderCredentialsFields = () => {
        switch (formData.payment_type) {
            case 'paypal':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Client ID
                            </label>
                            <input
                                type="text"
                                name="credentials.client_id"
                                value={formData.credentials.client_id}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    credentials: { ...prev.credentials, client_id: e.target.value }
                                }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="PayPal Client ID"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Client Secret
                            </label>
                            <input
                                type="password"
                                name="credentials.client_secret"
                                value={formData.credentials.client_secret}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    credentials: { ...prev.credentials, client_secret: e.target.value }
                                }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="PayPal Client Secret"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="credentials.sandbox"
                                checked={formData.credentials.sandbox}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    credentials: { ...prev.credentials, sandbox: e.target.checked }
                                }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                                Usar modo Sandbox (pruebas)
                            </label>
                        </div>
                    </>
                );
            case 'stripe':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Public Key
                            </label>
                            <input
                                type="text"
                                name="credentials.public_key"
                                value={formData.credentials.public_key}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    credentials: { ...prev.credentials, public_key: e.target.value }
                                }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Stripe Public Key"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Secret Key
                            </label>
                            <input
                                type="password"
                                name="credentials.secret_key"
                                value={formData.credentials.secret_key}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    credentials: { ...prev.credentials, secret_key: e.target.value }
                                }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Stripe Secret Key"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="credentials.test_mode"
                                checked={formData.credentials.test_mode}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    credentials: { ...prev.credentials, test_mode: e.target.checked }
                                }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                                Usar modo de prueba
                            </label>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Métodos de Cobro</h2>
                    <p className="text-gray-600 mt-1">Configura los métodos de pago que aceptarás en tu tienda</p>
                </div>
                <button
                    onClick={() => {
                        setEditingMethod(null);
                        setFormData({
                            name: '',
                            payment_type: '',
                            is_active: true,
                            credentials: {
                                client_id: '',
                                client_secret: '',
                                sandbox: true
                            },
                            instructions: ''
                        });
                        setShowAddModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <FaPlus /> Agregar Método de Cobro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentMethods.map((method) => (
                    <div key={method.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                {getPaymentTypeIcon(method.payment_type)}
                                <h3 className="text-lg font-semibold">{method.name}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(method)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDelete(method.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-2">
                            Tipo: {getPaymentTypeName(method.payment_type)}
                        </p>
                        {method.instructions && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <FaInfoCircle className="text-blue-600 mt-1" />
                                    <p className="text-sm text-blue-800">{method.instructions}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                                method.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {method.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                            {method.credentials?.sandbox && (
                                <span className="px-2 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                                    Modo Prueba
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal para agregar/editar método de cobro */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">
                            {editingMethod ? 'Editar Método de Cobro' : 'Agregar Método de Cobro'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nombre del Método
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                    placeholder="Ej: Pago con PayPal"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Tipo de Pago
                                </label>
                                <select
                                    name="payment_type"
                                    value={formData.payment_type}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleccionar tipo</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="stripe">Stripe</option>
                                    <option value="credit_card">Tarjeta de Crédito</option>
                                    <option value="debit_card">Tarjeta de Débito</option>
                                    <option value="bank_transfer">Transferencia Bancaria</option>
                                    <option value="cash">Efectivo</option>
                                    <option value="crypto">Criptomonedas</option>
                                </select>
                            </div>

                            {/* Campos específicos para PayPal y Stripe */}
                            {(formData.payment_type === 'paypal' || formData.payment_type === 'stripe') && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-700">
                                        Credenciales de {getPaymentTypeName(formData.payment_type)}
                                    </h4>
                                    {renderCredentialsFields()}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Instrucciones para el Cliente
                                </label>
                                <textarea
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Instrucciones específicas para el cliente..."
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    Activar este método de cobro
                                </label>
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    {editingMethod ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentSettings; 
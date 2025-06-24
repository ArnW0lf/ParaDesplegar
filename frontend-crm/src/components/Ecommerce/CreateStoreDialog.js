import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import config from '../../config';

const CreateStoreDialog = ({ isOpen, onClose, onStoreCreated }) => {
    const [newStoreData, setNewStoreData] = useState({
        nombre: '',
        logo: null,
        descripcion: ''
    });
    const [logoPreview, setLogoPreview] = useState(null);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewStoreData(prev => ({ ...prev, logo: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateStore = async () => {
        try {
            const formData = new FormData();
            formData.append('nombre', newStoreData.nombre);
            formData.append('descripcion', newStoreData.descripcion);
            if (newStoreData.logo) {
                formData.append('logo', newStoreData.logo);
            }

            const response = await axios.post(`${config.apiUrl}/api/tiendas/tiendas/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            onStoreCreated(response.data);
        } catch (error) {
            console.error('Error al crear la tienda:', error);
            if (error.response?.status === 400 && error.response?.data?.detail?.includes('ya existe')) {
                toast.error('Ya tienes una tienda creada');
                onClose(); // Cerrar el diálogo si ya existe una tienda
            } else {
                toast.error(error.response?.data?.error || 'Error al crear la tienda');
            }
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-2xl font-bold text-gray-900 mb-4"
                                >
                                    ¡Bienvenido a tu Tienda!
                                </Dialog.Title>
                                <Dialog.Description className="text-gray-600 mb-6">
                                    Para comenzar, necesitamos configurar tu tienda. Por favor, proporciona la siguiente información:
                                </Dialog.Description>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nombre de la Tienda</label>
                                        <input
                                            type="text"
                                            value={newStoreData.nombre}
                                            onChange={(e) => setNewStoreData(prev => ({ ...prev, nombre: e.target.value }))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="Mi Tienda"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                        <textarea
                                            value={newStoreData.descripcion}
                                            onChange={(e) => setNewStoreData(prev => ({ ...prev, descripcion: e.target.value }))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            rows="3"
                                            placeholder="Describe tu tienda..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Logo</label>
                                        <div className="mt-1 flex items-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                                className="hidden"
                                                id="logo-upload"
                                            />
                                            <label
                                                htmlFor="logo-upload"
                                                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Seleccionar Logo
                                            </label>
                                        </div>
                                        {logoPreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="h-20 w-20 object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={handleCreateStore}
                                        disabled={!newStoreData.nombre}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        Crear Tienda
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CreateStoreDialog; 
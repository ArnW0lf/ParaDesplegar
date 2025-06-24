import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import API from '../../api/api';

export default function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchLowStockProducts = async () => {
    try {
      console.log('Buscando productos con stock bajo...');
      const response = await API.get('tiendas/productos/low-stock/');
      console.log('Productos con stock bajo:', response.data);
      setLowStockProducts(response.data);
    } catch (error) {
      console.error('Error al obtener productos con stock bajo:', error);
    }
  };

  useEffect(() => {
    fetchLowStockProducts();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchLowStockProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  // No ocultar el componente si hay productos con stock bajo
  if (lowStockProducts.length === 0) {
    console.log('No hay productos con stock bajo');
    return null;
  }

  console.log('Mostrando alerta para', lowStockProducts.length, 'productos con stock bajo');

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
      >
        <div className="relative">
          <FaExclamationTriangle size={24} />
          <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {lowStockProducts.length}
          </span>
        </div>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-600">Productos con Stock Bajo</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{product.nombre}</h3>
                      <p className="text-gray-600">Stock actual: {product.stock}</p>
                    </div>
                    <span className="text-red-600 font-bold">¡Stock Bajo!</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
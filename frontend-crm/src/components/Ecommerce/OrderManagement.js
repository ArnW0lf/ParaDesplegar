import React, { useState, useEffect, useMemo } from 'react';
import { FaBox, FaTruck, FaCheck, FaTimes, FaExclamationTriangle, FaSearch, FaFilter, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaPhone, FaCreditCard, FaBarcode } from 'react-icons/fa';
import ReactPaginate from 'react-paginate';
import API from '../../api/api';
import '../../styles/pagination.css';

export default function OrderManagement() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pedidoExpandido, setPedidoExpandido] = useState(null);
  
  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5; // Número de pedidos por página

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Solicitando pedidos al backend...');
      const response = await API.get('pedidos-publicos/por_tienda/');
      console.log('Respuesta del backend:', response);
      // Si la respuesta es un array, lo usamos, si no, usamos un array vacío
      const pedidosData = Array.isArray(response.data) ? response.data : [];
      console.log('Pedidos recibidos:', pedidosData);
      setPedidos(pedidosData);
    } catch (err) {
      // Si es un 404, no hay pedidos, lo cual es normal
      if (err.response && err.response.status === 404) {
        setPedidos([]);
      } else {
        console.error('Error al cargar los pedidos:', err);
        setError('Error al cargar los pedidos. Por favor, intente nuevamente más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };


  const actualizarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      await API.post(`pedidos-publicos/${pedidoId}/actualizar_estado/`, {
        estado: nuevoEstado
      });
      fetchPedidos();
    } catch (err) {
      setError('Error al actualizar el estado del pedido');
    }
  };

  const agregarCodigoSeguimiento = async (pedidoId, codigo) => {
    try {
      await API.post(`tiendas/pedidos/${pedidoId}/agregar_codigo_seguimiento/`, {
        codigo_seguimiento: codigo
      });
      fetchPedidos();
    } catch (err) {
      setError('Error al agregar el código de seguimiento');
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
      en_proceso: 'bg-purple-100 text-purple-800 border-purple-200',
      enviado: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      entregado: 'bg-green-100 text-green-800 border-green-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEstadoIcono = (estado) => {
    const iconos = {
      pendiente: <FaExclamationTriangle className="text-yellow-600" />,
      confirmado: <FaBox className="text-blue-600" />,
      en_proceso: <FaBox className="text-purple-600" />,
      enviado: <FaTruck className="text-indigo-600" />,
      entregado: <FaCheck className="text-green-600" />,
      cancelado: <FaTimes className="text-red-600" />
    };
    return iconos[estado] || <FaBox />;
  };

  const pedidosFiltrados = useMemo(() => {
    if (!pedidos || pedidos.length === 0) return [];
    
    return pedidos.filter(pedido => {
      const coincideEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado;
      const coincideBusqueda = 
        pedido.id.toString().includes(busqueda) ||
        (pedido.cliente_nombre && pedido.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (pedido.codigo_seguimiento && pedido.codigo_seguimiento.toLowerCase().includes(busqueda.toLowerCase()));
      
      return coincideEstado && coincideBusqueda;
    });
  }, [pedidos, filtroEstado, busqueda]);

  // Lógica para la paginación
  const pageCount = Math.ceil(pedidosFiltrados.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentPedidos = pedidosFiltrados.slice(offset, offset + itemsPerPage);

  // Manejador de cambio de página
  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
    window.scrollTo(0, 0); // Opcional: volver al inicio de la página
  };

  // Reiniciar a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(0);
  }, [filtroEstado, busqueda]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Pedidos</h2>
        
        {/* Filtros y búsqueda */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por ID, cliente o código de seguimiento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="relative">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_proceso">En Proceso</option>
              <option value="enviado">Enviado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <FaFilter className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="space-y-4">
          {pedidos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-4">
                <FaBox className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Bienvenido a tu panel de pedidos!</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Aún no tienes pedidos en tu tienda. Cuando los clientes realicen compras, aparecerán aquí.
              </p>
              <p className="text-sm text-gray-500">
                Comparte el enlace de tu tienda con tus clientes para empezar a recibir pedidos.
              </p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FaBox className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No hay pedidos</h3>
              <p className="text-gray-500">No hay pedidos que coincidan con los filtros actuales.</p>
              {(filtroEstado !== 'todos' || busqueda !== '') && (
                <button
                  onClick={() => {
                    setFiltroEstado('todos');
                    setBusqueda('');
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ver todos los pedidos
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentPedidos.map((pedido) => (
                <div key={pedido.id} className="w-full border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white">
                <div 
                  className="flex justify-between items-start mb-4 cursor-pointer"
                  onClick={() => setPedidoExpandido(pedidoExpandido === pedido.id ? null : pedido.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-800">Pedido #{pedido.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm border ${getEstadoColor(pedido.estado)}`}>
                        <span className="flex items-center gap-2">
                          {getEstadoIcono(pedido.estado)}
                          {pedido.estado_display}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400" />
                        <span>{pedido.cliente_nombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        <span>{new Date(pedido.fecha_creacion).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCreditCard className="text-gray-400" />
                        <span>{pedido.metodo_pago_display}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Productos: </span>
                        {pedido.detalles.map((detalle, index) => (
                          <span key={detalle.id}>
                            {index > 0 && ', '}
                            {detalle.cantidad} x {detalle.nombre_producto || 'Producto sin nombre'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">Bs. {pedido.total}</p>
                  </div>
                </div>

                {pedidoExpandido === pedido.id && (
                  <div className="mt-4 pt-4 border-t">
                    {/* Detalles del pedido */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-700">Productos:</h4>
                      <div className="space-y-3">
                        {pedido.detalles.map((detalle) => (
                          <div key={detalle.id} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              {detalle.producto_imagen ? (
                                <img 
                                  src={detalle.producto_imagen} 
                                  alt={detalle.producto_nombre}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                  <FaBox className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <span className={`font-medium ${detalle.producto_eliminado ? 'text-gray-500' : ''}`}>
                                  {detalle.nombre_producto}
                                </span>
                                {detalle.producto_eliminado && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                    Producto eliminado
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-600">{detalle.cantidad} x Bs. {detalle.precio_unitario}</p>
                              <p className="font-semibold">Bs. {detalle.subtotal}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Información de entrega */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-700">Información de Entrega:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">{pedido.direccion_entrega}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FaPhone className="text-gray-400" />
                          <p className="text-sm text-gray-600">{pedido.telefono}</p>
                        </div>
                        {pedido.codigo_seguimiento && (
                          <div className="flex items-center gap-3">
                            <FaBarcode className="text-gray-400" />
                            <p className="text-sm text-gray-600">
                              Código de seguimiento: {pedido.codigo_seguimiento}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={pedido.estado}
                        onChange={(e) => actualizarEstadoPedido(pedido.id, e.target.value)}
                        className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>

                      {!pedido.codigo_seguimiento && (
                        <button
                          onClick={() => {
                            const codigo = prompt('Ingrese el código de seguimiento:');
                            if (codigo) {
                              agregarCodigoSeguimiento(pedido.id, codigo);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <FaBarcode />
                          Agregar Código de Seguimiento
                        </button>
                      )}
                    </div>
                  </div>
                )}
                </div>
              ))}
              
              
              {/* Componente de paginación */}
              {pageCount > 1 && (
                <div className="mt-6 flex justify-center">
                  <ReactPaginate
                    previousLabel={'Anterior'}
                    nextLabel={'Siguiente'}
                    breakLabel={'...'}
                    pageCount={pageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageClick}
                    containerClassName={'pagination'}
                    activeClassName={'active'}
                    forcePage={currentPage}
                    className="flex gap-2 items-center"
                    pageClassName="page-item"
                    pageLinkClassName="page-link"
                    previousClassName="page-item"
                    previousLinkClassName="page-link"
                    nextClassName="page-item"
                    nextLinkClassName="page-link"
                    breakClassName="page-item"
                    breakLinkClassName="page-link"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
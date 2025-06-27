
import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaTimes, FaFilter, FaBox, FaShoppingCart,
  FaCreditCard, FaCog, FaStore, FaBoxOpen, FaTrash, FaEdit, FaChartLine
} from 'react-icons/fa';
import ProductForm from './ProductForm';
import API from '../api/api';
import StoreSettings from './Ecommerce/StoreSettings';
import { useNavigate } from 'react-router-dom';
import Header from './common/Header';
import CreateStoreDialog from './Ecommerce/CreateStoreDialog';
import LowStockAlert from './Ecommerce/LowStockAlert';
import PaymentSettings from './Ecommerce/PaymentSettings';
import OrderManagement from './Ecommerce/OrderManagement';
import CreateUserDialog from './Ecommerce/CreateUserDialog';
import { useAuth } from '../context/AuthContext'; 
import config from '../config'; 



export default function Store() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [storeConfig, setStoreConfig] = useState(null);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, lowStock: 0 });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState(null);
  const [categorySuccess, setCategorySuccess] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [success, setSuccess] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState('month'); // 'month' o 'all'
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAllowedTo = (section) => {
    const role = user?.role;

    const permissions = {
      cliente: ['products', 'orders', 'payments', 'settings', 'stats'],
      vendedor: ['orders', 'payments', 'stats'],
      stock: ['products', 'categories', 'stats']
    };

    return permissions[role]?.includes(section);
  };


 useEffect(() => {
  if (!user) return;

  // Solo cliente o stock pueden cargar productos y categorías
  if (user.role === 'cliente' || user.role === 'stock') {
    fetchProducts();
    fetchCategories();
  }

  // Todos pueden verificar tienda
  checkStore();

}, [selectedCategory, user]);


  useEffect(() => {
  if (user?.role === 'cliente' || user?.role === 'vendedor' || user?.role === 'stock') {
    fetchStats();
  }
}, [products, user]);


  const checkStore = async () => {
    try {
      const response = await API.get('tiendas/tiendas/config/');
      setStoreConfig(response.data);
      setShowCreateDialog(false);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setShowCreateDialog(true);
      } else {
        setError('Error al verificar la tienda');
      }
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await API.get('tiendas/productos/');
      const filtered = selectedCategory
        ? response.data.filter(p => p.categoria === selectedCategory)
        : response.data;
      setProducts(filtered);
    } catch (err) {
      setError('Error al cargar los productos');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get('tiendas/categorias/');
      setCategories(response.data);
    } catch (err) {
      setError('Error al cargar las categorías');
    }
  };


const fetchStats = async () => {
  try {
    const statsData = {
      totalProducts: products.length,
      totalOrders: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      lowStock: 0
    };

    // Solo cliente y vendedor ven pedidos e ingresos
    if (user?.role === 'cliente' || user?.role === 'vendedor') {
      const pedidosResponse = await API.get('pedidos-publicos/por_tienda/');
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calcular ingresos totales y del mes actual
      statsData.totalOrders = pedidosResponse.data.length;
      
      pedidosResponse.data.forEach(pedido => {
        const pedidoDate = new Date(pedido.fecha_creacion || pedido.fecha);
        const pedidoMonth = pedidoDate.getMonth();
        const pedidoYear = pedidoDate.getFullYear();
        const monto = parseFloat(pedido.total) || 0;
        
        // Sumar a ingresos totales
        statsData.totalRevenue += monto;
        
        // Sumar a ingresos del mes si corresponde
        if (pedidoMonth === currentMonth && pedidoYear === currentYear) {
          statsData.monthlyRevenue += monto;
        }
      });
    }

    // Solo cliente o stock consultan stock bajo
    if (user?.role === 'cliente' || user?.role === 'stock') {
      const response = await API.get('tiendas/productos/low-stock/');
      statsData.lowStock = response.data.length;
    }

    setStats(statsData);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
  }
};

// Función para formatear números grandes
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};


  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?\n\nNota: El producto se marcará como eliminado pero permanecerá en el sistema para mantener el historial de pedidos.')) {
      try {
        // Mostrar mensaje de carga
        setError(null);
        setSuccess('Eliminando producto...');
        
        // Realizar la petición de eliminación
        const response = await API.delete(`tiendas/productos/${id}/`);
        
        // Actualizar la lista de productos
        await fetchProducts();
        
        // Mostrar mensaje de éxito
        setSuccess('✅ Producto marcado como eliminado correctamente');
        setTimeout(() => setSuccess(null), 5000);
        
      } catch (err) {
        console.error('Error al eliminar el producto:', err);
        const errorMessage = err.response?.data?.error || 
                            err.response?.data?.detail || 
                            'Error al eliminar el producto. Por favor, inténtalo de nuevo.';
        
        setError(`❌ ${errorMessage}`);
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  const handleProductAdded = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleProductCancel = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCategoryError(null);
    setCategorySuccess(null);
    if (!newCategory.trim()) {
      setCategoryError('El nombre de la categoría es requerido');
      return;
    }
    try {
      const response = await API.post('tiendas/categorias/', { nombre: newCategory.trim() });
      setCategories(prev => [...prev, response.data]);
      setNewCategory('');
      setShowNewCategoryForm(false);
      setCategorySuccess('Categoría agregada exitosamente');
      setTimeout(() => setCategorySuccess(null), 3000);
    } catch (err) {
      const message = err.response?.data?.nombre?.[0] || 'Error al agregar la categoría';
      setCategoryError(message);
      setTimeout(() => setCategoryError(null), 3000);
    }
  };

 const renderStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

    {/* Total Productos - visible para cliente y stock */}
    {(user?.role === 'cliente' || user?.role === 'stock') && (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">Total Productos</p>
            <h3 className="text-2xl font-bold">{products.length}</h3>
          </div>
          <FaBox className="text-blue-600 text-2xl" />
        </div>
      </div>
    )}

    {/* Pedidos Totales - visible para cliente y vendedor */}
    {(user?.role === 'cliente' || user?.role === 'vendedor') && (
      <div 
        className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setActiveTab('orders')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">Pedidos Totales</p>
            <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
          </div>
          <FaShoppingCart className="text-green-600 text-2xl" />
        </div>
      </div>
    )}

    {/* Ingresos - visible para cliente y vendedor */}
    {(user?.role === 'cliente' || user?.role === 'vendedor') && (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500">
            {revenuePeriod === 'month' ? 'Ingresos del Mes' : 'Ingresos Totales'}
          </p>
          <button 
            onClick={() => setRevenuePeriod(prev => prev === 'month' ? 'all' : 'month')}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600"
            title={revenuePeriod === 'month' ? 'Ver todos los ingresos' : 'Ver solo este mes'}
          >
            {revenuePeriod === 'month' ? 'Ver total' : 'Ver mes actual'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">
            {formatCurrency(revenuePeriod === 'month' ? stats.monthlyRevenue : stats.totalRevenue)}
          </h3>
          <FaChartLine className="text-purple-600 text-2xl" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {revenuePeriod === 'month' 
            ? `Ver total: ${formatCurrency(stats.totalRevenue)}` 
            : `Este mes: ${formatCurrency(stats.monthlyRevenue)}`
          }
        </div>
      </div>
    )}

    {/* Stock Bajo - visible para cliente y stock */}
    {(user?.role === 'cliente' || user?.role === 'stock') && (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">Stock Bajo</p>
            <h3 className="text-2xl font-bold">{stats.lowStock}</h3>
          </div>
          <FaTrash className="text-red-600 text-2xl" />
        </div>
      </div>
    )}

  </div>
);


  const renderTabs = () => (
  <div className="flex space-x-4 mb-8">
    {isAllowedTo('products') && (
      <button
        onClick={() => setActiveTab('products')}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <FaBox /> Productos
      </button>
    )}
    {isAllowedTo('orders') && (
      <button
        onClick={() => setActiveTab('orders')}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <FaShoppingCart /> Pedidos
      </button>
    )}
    {isAllowedTo('payments') && (
      <button
        onClick={() => setActiveTab('payments')}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          activeTab === 'payments' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <FaCreditCard /> Pagos
      </button>
    )}
    {isAllowedTo('settings') && (
      <button
        onClick={() => setActiveTab('settings')}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <FaCog /> Configuración
      </button>
    )}
  </div>
);


  const renderContent = () => {
    if (activeTab === 'products') {
      return (
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos y Usuarios</h2>
            <div className="flex gap-4">
             {isAllowedTo('products') && (
  <button
    onClick={() => { setEditingProduct(null); setShowAddProduct(true); }}
    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
  >
    <FaPlus /> Agregar Producto
  </button>
)}

{user?.role === 'cliente' && (
  <>
    <button
      onClick={() => navigate(`/tienda-publica/${storeConfig.slug}`)}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
    >
      <FaStore /> Ver Tienda Pública
    </button>

    <button
      onClick={() => navigate(`/tienda-publica/${storeConfig.slug}/reportes`)}
      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
    >
      <FaChartLine /> Reportes de Ventas
    </button>

    <button
      onClick={() => setShowCreateUserDialog(true)}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
    >
      <FaPlus /> Agregar Usuario
    </button>
  </>
)}


            </div>
          </div>

          {/* Filtro de categorías - solo visible para cliente o encargado de stock */}
         {(user?.role === 'cliente' || user?.role === 'stock') && renderCategoryFilter()}

<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {products.length > 0 ? products.map(product => {
 const imageUrl = product.imagen
  ? (product.imagen.startsWith('http') ? product.imagen : `${config.apiUrl}${product.imagen}`)
  : null;




    return (
      <div key={product.id} className="bg-white p-6 rounded-xl shadow-md">
        <div className="relative">
          {imageUrl ? (
            <img src={imageUrl} alt={product.nombre} className="w-full h-48 object-cover rounded mb-4" />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded mb-4 flex flex-col items-center justify-center">
              <FaBoxOpen className="text-blue-400 text-5xl mb-2" />
              <span className="text-blue-500 text-sm font-medium">Sin imagen</span>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <button onClick={() => handleEditProduct(product)} className="bg-blue-600 text-white p-2 rounded-full">
              <FaEdit />
            </button>
            <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 text-white p-2 rounded-full">
              <FaTrash />
            </button>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-800">{product.nombre}</h2>
        <p className="text-gray-600 mb-1">{product.descripcion}</p>
        {product.categoria_nombre && (
          <p className="text-sm text-gray-500 italic mb-2">Categoría: {product.categoria_nombre}</p>
        )}
        <div className="flex justify-between items-center">
          <p className="font-semibold text-green-600 text-lg">Bs. {product.precio}</p>
          <p className="text-gray-500 text-sm">Stock: {product.stock}</p>
        </div>
      </div>
    );
  }) : (
    <div className="col-span-3 text-center py-12">
      <FaBoxOpen className="text-gray-400 text-6xl mx-auto mb-4" />
      <p className="text-gray-500 text-lg">No hay productos disponibles en esta categoría</p>
    </div>
  )}
</div>

        </>
      );
    }
    if (activeTab === 'orders') return <OrderManagement />;
    if (activeTab === 'payments') return <PaymentSettings />;
    if (activeTab === 'settings') return <StoreSettings />;
  };

  const renderCategoryFilter = () => (
    <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <FaFilter className="text-blue-600" />
          <h3 className="text-xl font-semibold">Filtrar por categoría:</h3>
        </div>
        <button onClick={() => setShowNewCategoryForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          <FaPlus /> Nueva Categoría
        </button>
      </div>
      {showNewCategoryForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-lg">Agregar Nueva Categoría</h4>
            <button onClick={() => { setShowNewCategoryForm(false); setNewCategory(''); setCategoryError(null); }}>
              <FaTimes />
            </button>
          </div>
          {categoryError && <div className="text-red-500 mb-2">{categoryError}</div>}
          {categorySuccess && <div className="text-green-600 mb-2">{categorySuccess}</div>}
          <form onSubmit={handleAddCategory} className="flex gap-4">
            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" required />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              <FaPlus /> Agregar
            </button>
          </form>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-full ${selectedCategory === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Todas
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-full ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {cat.nombre}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="text-center p-10">Cargando...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard de la Tienda" />
      <div className="p-10">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            <p>{success}</p>
          </div>
        )}
        {renderStats()}
        {renderTabs()}
        {renderContent()}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-600">
                  {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                </h2>
                <button onClick={handleProductCancel} className="text-gray-500 hover:text-gray-700">
                  <FaTimes size={24} />
                </button>
              </div>
              <ProductForm onProductAdded={handleProductAdded} onCancel={handleProductCancel} editingProduct={editingProduct} hideTitle={true} />
            </div>
          </div>
        )}
          {(user?.role === 'cliente' || user?.role === 'stock') && <LowStockAlert />}
          {showCreateDialog && <CreateStoreDialog onStoreCreated={setStoreConfig} />}
          {showCreateUserDialog && (
            <CreateUserDialog
              onClose={() => setShowCreateUserDialog(false)}
              onUserCreated={() => console.log('Usuario creado')}
            />
          )}
        </div>
      </div>
  );
}


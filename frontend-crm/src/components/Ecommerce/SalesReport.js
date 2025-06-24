import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaFilter, FaDownload, FaChartLine, FaBox, FaMoneyBillWave, FaFileExcel } from 'react-icons/fa';
import API from '../../api/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Header from '../common/Header';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SalesReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noData, setNoData] = useState(false);
  const [storeConfig, setStoreConfig] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [reportData, setReportData] = useState({
    totalVentas: 0,
    pedidosPorEstado: {},
    ventasPorDia: [],
    productosMasVendidos: [],
    ventasPorMetodoPago: {}
  });
  const [metodosPago, setMetodosPago] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Últimos 30 días por defecto
    fechaFin: new Date().toISOString().split('T')[0],
    estado: 'todos',
    metodoPago: 'todos'
  });

  useEffect(() => {
    fetchStoreConfig();
    fetchUserInfo();
    fetchReportData();
  }, [filtros]);

  const fetchStoreConfig = async () => {
    try {
      const response = await API.get('tiendas/tiendas/config/');
      setStoreConfig(response.data);
    } catch (err) {
      console.error('Error al cargar la configuración de la tienda:', err);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await API.get('users/profile/');
      setUserInfo(response.data);
    } catch (err) {
      console.error('Error al cargar la información del usuario:', err);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar errores previos
      setNoData(false); // Reiniciar estado de no datos
      console.log('Fetching orders with filters:', filtros);
      
      let pedidos = [];
      
      try {
        // Usar el endpoint de pedidos-publicos para obtener el historial completo
        const response = await API.get('pedidos-publicos/por_tienda/');
        console.log('Raw API response:', response.data);

        // Procesar datos para el reporte
        pedidos = Array.isArray(response.data) ? response.data : [];
        console.log('Total orders fetched:', pedidos.length);
        
        // Si no hay pedidos, mostrar mensaje amigable
        if (pedidos.length === 0) {
          setReportData({
            totalVentas: 0,
            pedidosPorEstado: {},
            ventasPorDia: [],
            productosMasVendidos: [],
            ventasPorMetodoPago: {}
          });
          setNoData(true);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('Error al obtener los pedidos:', apiError);
        // Verificar si es un error de red
        if (apiError.message === 'Network Error') {
          setError('No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.');
        } else if (apiError.response?.status === 404) {
          setError('No se encontraron pedidos en el sistema.');
        } else if (apiError.response?.status === 403) {
          setError('No tienes permiso para ver este reporte.');
        } else {
          setError('Ocurrió un error al cargar los datos. Por favor, intenta de nuevo más tarde.');
        }
        setLoading(false);
        return;
      }
      
      // Obtener métodos de pago únicos con manejo de errores
      const metodosPagoUnicos = [...new Set(
        pedidos
          .map(pedido => pedido?.metodo_pago)
          .filter(metodo => metodo && typeof metodo === 'string')
      )];
      
      setMetodosPago(metodosPagoUnicos);
      
      // Función para normalizar fechas a inicio/fin de día
      const normalizarFecha = (fecha, finDeDia = false) => {
        try {
          if (!fecha) return null;
          const d = new Date(fecha);
          if (isNaN(d.getTime())) return null;
          
          if (finDeDia) {
            d.setHours(23, 59, 59, 999);
          } else {
            d.setHours(0, 0, 0, 0);
          }
          return d;
        } catch (e) {
          console.error('Error al normalizar fecha:', fecha, e);
          return null;
        }
      };

      // Obtener fechas de filtro
      const fechaInicio = normalizarFecha(filtros.fechaInicio);
      const fechaFin = normalizarFecha(filtros.fechaFin, true);
      
      if (!fechaInicio || !fechaFin) {
        setError('Las fechas de filtro no son válidas');
        setLoading(false);
        return;
      }
      
      console.log('Filtro de fechas - Inicio:', fechaInicio);
      console.log('Filtro de fechas - Fin:', fechaFin);
      
      // Filtrar pedidos por fecha
      const pedidosFiltradosPorFecha = pedidos.filter(pedido => {
        try {
          // Manejar diferentes formatos de fecha
          const fechaPedidoStr = pedido.fecha_creacion || pedido.fecha_compra || pedido.fecha;
          if (!fechaPedidoStr) {
            console.warn('Pedido sin fecha válida:', pedido);
            return false; // Excluir pedidos sin fecha
          }
          
          // Crear objeto de fecha y ajustar zona horaria
          let fechaPedido = new Date(fechaPedidoStr);
          
          // Si la fecha es inválida, intentar parsear manualmente
          if (isNaN(fechaPedido.getTime())) {
            // Intentar con formato ISO 8601
            const match = fechaPedidoStr.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
            if (match) {
              fechaPedido = new Date(`${match[1]}T${match[2]}`);
            }
            
            if (isNaN(fechaPedido.getTime())) {
              console.warn('Fecha inválida en pedido:', pedido);
              return false; // Excluir fechas inválidas
            }
          }
          
          // Ajustar la fecha al inicio del día para comparación
          const fechaPedidoInicioDia = normalizarFecha(fechaPedido);
          
          // Verificar si la fecha del pedido está dentro del rango
          const dentroDelRango = fechaPedidoInicioDia >= fechaInicio && fechaPedidoInicioDia <= fechaFin;
          
          if (!dentroDelRango) {
            console.log('Pedido fuera de rango:', {
              id: pedido.id,
              fechaPedido: fechaPedido,
              fechaInicio,
              fechaFin,
              dentroDelRango
            });
          }
          
          return dentroDelRango;
        } catch (e) {
          console.error('Error al procesar fecha del pedido:', pedido, e);
          return true; // Incluir pedidos con error en el procesamiento
        }
      });
      
      console.log('Pedidos después de filtrar por fecha (todos incluidos):', pedidosFiltradosPorFecha);
      console.log('Total de pedidos después de filtrar por fecha:', pedidosFiltradosPorFecha.length);

      // Filtrar por estado y método de pago
      const pedidosFiltrados = pedidosFiltradosPorFecha.filter(pedido => {
        const cumpleEstado = filtros.estado === 'todos' || pedido.estado === filtros.estado;
        const cumpleMetodoPago = filtros.metodoPago === 'todos' || pedido.metodo_pago === filtros.metodoPago;
        return cumpleEstado && cumpleMetodoPago;
      });
      
      console.log('Pedidos después de filtrar:', pedidosFiltrados);

      console.log('Pedidos después de filtrar:', pedidosFiltrados);
      
      // Calcular total de ventas con manejo de errores
      const totalVentas = pedidosFiltrados.reduce((acc, pedido) => {
        try {
          return acc + (parseFloat(pedido.total) || 0);
        } catch (e) {
          console.error('Error al procesar total del pedido:', pedido, e);
          return acc;
        }
      }, 0);
      console.log('Total de ventas calculado:', totalVentas);
      
      // Agrupar por estado
      const pedidosPorEstado = pedidosFiltrados.reduce((acc, pedido) => {
        if (pedido.estado) {
          acc[pedido.estado] = (acc[pedido.estado] || 0) + 1;
        } else {
          console.warn('Pedido sin estado:', pedido);
          acc['sin_estado'] = (acc['sin_estado'] || 0) + 1;
        }
        return acc;
      }, {});

      // Agrupar por método de pago
      const ventasPorMetodoPago = pedidosFiltrados.reduce((acc, pedido) => {
        try {
          const metodo = pedido.metodo_pago || 'sin_metodo';
          const total = parseFloat(pedido.total) || 0;
          acc[metodo] = (acc[metodo] || 0) + total;
        } catch (e) {
          console.error('Error al procesar método de pago del pedido:', pedido, e);
        }
        return acc;
      }, {});

      // Productos más vendidos
      const productosMasVendidos = pedidosFiltrados.reduce((acc, pedido) => {
        try {
          // Verificar si hay detalles en el formato de PedidoPublico
          const detalles = pedido.detalles || [];
          
          if (!Array.isArray(detalles)) {
            console.warn('Detalles no es un array:', detalles);
            return acc;
          }
          
          detalles.forEach(detalle => {
            try {
              // Extraer información del producto del detalle
              const nombreProducto = detalle.nombre_producto || 'Producto desconocido';
              const cantidad = parseInt(detalle.cantidad || 0, 10);
              const subtotal = parseFloat(detalle.subtotal || (detalle.precio_unitario * (detalle.cantidad || 0)) || 0);
              
              if (!nombreProducto) {
                console.warn('Detalle sin nombre de producto:', detalle);
                return;
              }
              
              if (!acc[nombreProducto]) {
                acc[nombreProducto] = { 
                  nombre: nombreProducto,
                  cantidad: 0, 
                  total: 0 
                };
              }
              
              acc[nombreProducto].cantidad += cantidad;
              acc[nombreProducto].total += subtotal;
            } catch (e) {
              console.error('Error al procesar detalle del pedido:', detalle, e);
            }
          });
        } catch (e) {
          console.error('Error al procesar pedido:', pedido, e);
        }
        return acc;
      }, {});
      
      console.log('Productos más vendidos procesados:', productosMasVendidos);

      setReportData({
        totalVentas,
        pedidosPorEstado,
        ventasPorDia: pedidosFiltrados,
        productosMasVendidos: Object.values(productosMasVendidos)
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5),
        ventasPorMetodoPago
      });

      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos del reporte');
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const now = new Date();
      
      // Título
      doc.setFontSize(20);
      doc.text('Reporte de Ventas', pageWidth / 2, 20, { align: 'center' });
      
      // Información de la tienda
      doc.setFontSize(12);
      if (storeConfig) {
        doc.text(`Tienda: ${storeConfig.nombre}`, 14, 30);
      }
      
      // Información del usuario
      if (userInfo) {
        doc.text(`Generado por: ${userInfo.first_name} ${userInfo.last_name}`, 14, 37);
      }
      
      // Fecha y hora del reporte
      doc.text(`Generado el: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, 44);
      
      // Período del reporte
      doc.text(`Período: ${new Date(filtros.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(filtros.fechaFin).toLocaleDateString('es-ES')}`, 14, 51);
      
      // Resumen
      doc.setFontSize(16);
      doc.text('Resumen', 14, 65);
      
      // Tabla de resumen
      autoTable(doc, {
        startY: 70,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total Ventas', `Bs. ${reportData.totalVentas.toFixed(2)}`],
          ['Total Pedidos', Object.values(reportData.pedidosPorEstado).reduce((a, b) => a + b, 0)],
          ['Productos Vendidos', reportData.productosMasVendidos.reduce((acc, prod) => acc + prod.cantidad, 0)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      // Productos más vendidos
      doc.setFontSize(16);
      doc.text('Productos Más Vendidos', 14, doc.lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Producto', 'Cantidad', 'Total']],
        body: reportData.productosMasVendidos.map(producto => [
          producto.nombre,
          producto.cantidad,
          `Bs. ${Number(producto.total).toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      // Pedidos por estado
      doc.setFontSize(16);
      doc.text('Pedidos por Estado', 14, doc.lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Estado', 'Cantidad']],
        body: Object.entries(reportData.pedidosPorEstado).map(([estado, cantidad]) => [
          estado,
          cantidad
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      // Ventas por método de pago
      doc.setFontSize(16);
      doc.text('Ventas por Método de Pago', 14, doc.lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Método', 'Total']],
        body: Object.entries(reportData.ventasPorMetodoPago).map(([metodo, total]) => [
          metodo,
          `Bs. ${Number(total).toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      // Guardar el PDF
      const nombreArchivo = `reporte-ventas-${storeConfig?.nombre?.toLowerCase().replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
      
      // Registrar acción de auditoría
      await logExportAction('PDF');
      
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      setError('Ocurrió un error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  const logExportAction = async (exportType) => {
    try {
      await API.post('/audit-logs/logs/', {
        action: 'export',
        description: `Exportación de reporte de ventas en formato ${exportType}`,
        metadata: {
          report_type: 'sales_report',
          export_format: exportType,
          filters: filtros
        }
      });
    } catch (error) {
      console.error('Error al registrar acción de auditoría:', error);
      // No mostramos error al usuario para no interrumpir la exportación
    }
  };

  const handleExportExcel = async () => {
    try {
      // Crear un nuevo libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Hoja de Resumen
      const resumenData = [
        ['Métrica', 'Valor'],
        ['Total Ventas', `Bs. ${reportData.totalVentas.toFixed(2)}`],
        ['Total Pedidos', Object.values(reportData.pedidosPorEstado).reduce((a, b) => a + b, 0)],
        ['Productos Vendidos', reportData.productosMasVendidos.reduce((acc, prod) => acc + prod.cantidad, 0)]
      ];
      
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

      // Hoja de Productos Más Vendidos
      const productosData = [
        ['Producto', 'Cantidad', 'Total'],
        ...reportData.productosMasVendidos.map(producto => [
          producto.nombre,
          producto.cantidad,
          `Bs. ${Number(producto.total).toFixed(2)}`
        ])
      ];
      
      const wsProductos = XLSX.utils.aoa_to_sheet(productosData);
      XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos Más Vendidos');

      // Guardar el archivo
      const nombreArchivo = `reporte-ventas-${storeConfig?.nombre?.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);
      
      // Registrar acción de auditoría
      await logExportAction('Excel');
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      setError('Ocurrió un error al exportar a Excel. Por favor, inténtalo de nuevo.');
    }
  };

  // Mostrar mensaje cuando no hay datos
  if (noData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Reporte de Ventas" 
          showBackButton={true}
          onBackClick={() => navigate(-1)}
        />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay datos disponibles</h3>
              <p className="text-gray-600 mb-6">
                No se encontraron pedidos registrados en el sistema.
              </p>
              <button
                onClick={() => navigate('/ecommerce/orders')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir a Pedidos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Reporte de Ventas" 
        showBackButton={true}
        onBackClick={() => navigate(-1)}
      />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Reporte de Ventas" 
        showBackButton={true}
        onBackClick={() => navigate(-1)}
      />
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar los datos</h3>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={fetchReportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Verificar si hay datos para mostrar
  const hasData = Object.keys(reportData.pedidosPorEstado).length > 0 || 
                reportData.productosMasVendidos.length > 0 ||
                Object.keys(reportData.ventasPorMetodoPago).length > 0;

  const chartData = {
    labels: Object.keys(reportData.pedidosPorEstado),
    datasets: [
      {
        label: 'Pedidos por Estado',
        data: Object.values(reportData.pedidosPorEstado),
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Reporte de Ventas" 
        showBackButton={true}
        onBackClick={() => navigate(-1)}
      />
      <div className="p-10">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Reporte de Ventas</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExportExcel}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  disabled={!hasData}
                >
                  <FaFileExcel /> Exportar Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  disabled={!hasData}
                >
                  <FaDownload /> Exportar PDF
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={filtros.metodoPago}
                  onChange={(e) => handleFilterChange('metodoPago', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  {metodosPago.map(metodo => (
                    <option key={metodo} value={metodo}>
                      {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium">Total Ventas</p>
                    <h3 className="text-2xl font-bold text-blue-700">Bs. {reportData.totalVentas.toFixed(2)}</h3>
                  </div>
                  <FaMoneyBillWave className="text-blue-600 text-3xl" />
                </div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 font-medium">Total Pedidos</p>
                    <h3 className="text-2xl font-bold text-green-700">
                      {Object.values(reportData.pedidosPorEstado).reduce((a, b) => a + b, 0)}
                    </h3>
                  </div>
                  <FaChartLine className="text-green-600 text-3xl" />
                </div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-medium">Productos Vendidos</p>
                    <h3 className="text-2xl font-bold text-purple-700">
                      {reportData.productosMasVendidos.reduce((acc, prod) => acc + prod.cantidad, 0)}
                    </h3>
                  </div>
                  <FaBox className="text-purple-600 text-3xl" />
                </div>
              </div>
            </div>

            {!hasData ? (
              <div className="col-span-2 bg-white p-8 rounded-xl shadow-md text-center">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay datos para mostrar</h3>
                  <p className="text-gray-500 max-w-md">
                    No se encontraron pedidos que coincidan con los filtros seleccionados. 
                    Intenta con un rango de fechas diferente o ajusta los filtros.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Pedidos por Estado</h3>
                    {Object.keys(reportData.pedidosPorEstado).length > 0 ? (
                      <Bar data={chartData} />
                    ) : (
                      <p className="text-gray-500 text-center py-4">No hay datos de pedidos por estado</p>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
                    {reportData.productosMasVendidos.length > 0 ? (
                      <div className="space-y-4">
                        {reportData.productosMasVendidos.map((producto, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{producto.nombre}</p>
                              <p className="text-sm text-gray-500">{producto.cantidad} unidades vendidas</p>
                            </div>
                            <p className="font-semibold text-green-600">
                              Bs. {Number(producto.total).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No hay datos de productos vendidos</p>
                    )}
                  </div>
                </div>

                {/* Métodos de Pago */}
                {Object.keys(reportData.ventasPorMetodoPago).length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Ventas por Método de Pago</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(reportData.ventasPorMetodoPago).map(([metodo, total]) => (
                        <div key={metodo} className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-600 font-medium">{metodo}</p>
                          <p className="text-xl font-bold text-blue-600">Bs. {Number(total).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
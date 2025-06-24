import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import Header from './common/Header';
import {
  FaFilter,
  FaDownload,
  FaCalendarAlt,
  FaUser,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import config from '../config';

// Configurar dayjs para usar español
dayjs.locale('es');

export default function Bitacora() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [actions, setActions] = useState({});
  const [report, setReport] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    fetchLogs();
    fetchActions();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.userId) params.append('user_id', filters.userId);

      const response = await axios.get(
        `${config.apiUrl}/api/audit-logs/logs/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setLogs(response.data);
    } catch (error) {
      setError('Error al cargar los registros de la bitácora');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${config.apiUrl}/api/audit-logs/logs/actions/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setActions(response.data);
    } catch (error) {
      console.error('Error al cargar las acciones:', error);
    }
  };

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await axios.get(
        `${config.apiUrl}/api/audit-logs/logs/report/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setReport(response.data);
    } catch (error) {
      console.error('Error al generar el reporte:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      startDate: '',
      endDate: '',
      userId: ''
    });
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('D [de] MMMM [de] YYYY [a las] HH:mm');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando bitácora...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Bitácora de Actividades" 
              showBackButton={true}
              onBackClick={() => navigate(-1)}
      />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Bitácora de Actividades</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                >
                  <FaFilter className="mr-2" />
                  Filtros
                </button>
                <button
                  onClick={fetchReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <FaDownload className="mr-2" />
                  Generar Reporte
                </button>
              </div>
            </div>

            {/* Filtros */}
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Acción
                    </label>
                    <select
                      name="action"
                      value={filters.action}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Todas las acciones</option>
                      {Object.entries(actions).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID de Usuario
                    </label>
                    <input
                      type="text"
                      name="userId"
                      value={filters.userId}
                      onChange={handleFilterChange}
                      placeholder="Filtrar por ID de usuario"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
                  >
                    <FaTimes className="mr-2" />
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}

            {/* Reporte */}
            {report && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-4">Resumen de Actividad</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700">Total de Acciones</h3>
                    <p className="text-2xl font-bold text-blue-600">{report.total_actions}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700">Acciones por Tipo</h3>
                    <ul className="mt-2">
                      {Object.entries(report.actions_by_type).map(([action, count]) => (
                        <li key={action} className="flex justify-between">
                          <span>{actions[action] || action}</span>
                          <span className="font-medium">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700">Acciones por Usuario</h3>
                    <ul className="mt-2">
                      {Object.entries(report.actions_by_user).map(([user, count]) => (
                        <li key={user} className="flex justify-between">
                          <span>{user}</span>
                          <span className="font-medium">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Registros */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.action_display}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
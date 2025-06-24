import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './common/Header';
import { FaDownload, FaUpload, FaSync, FaTimes, FaCloudDownloadAlt, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import JSZip from 'jszip';
import config from '../config';

export default function Backup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [backupDetails, setBackupDetails] = useState({});

  // Función auxiliar para obtener token
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No hay sesión activa');
      navigate('/login');
    }
    return token;
  };

  // Función para obtener lista de backups
  const fetchBackups = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      setLoading(true);
      
      // Mostrar información del usuario y tenant
      console.log('Usuario:', user);
      console.log('Tenant ID:', user?.tenant_id);

      const response = await axios.get(`${config.apiUrl}/api/backups/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Respuesta de la API:', response.data);
      
      // Verificar si hay datos y su estructura
      if (!response.data) {
        throw new Error('Respuesta vacía de la API');
      }
      
      // Verificar si es un array
      if (!Array.isArray(response.data)) {
        throw new Error('La respuesta no es un array');
      }
      
      // Verificar si hay al menos un elemento
      if (response.data.length === 0) {
        console.log('No se encontraron backups');
        setError('No se encontraron backups para este tenant');
        setBackups([]);
        return;
      }
      
      // Verificar la estructura del primer elemento
      const firstBackup = response.data[0];
      if (!firstBackup || typeof firstBackup !== 'object') {
        throw new Error('Elemento de backup inválido');
      }
      
      console.log('Estructura del primer backup:', firstBackup);
      
      // Si todo está bien, actualizar el estado
      setBackups(response.data);
      setError('');
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error en la respuesta:', err.response?.data);
      
      let errorMessage = 'Error al cargar los backups';
      
      // Intentar obtener detalles del error
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = 'Sesión expirada';
        navigate('/login');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para crear backup
  const createBackup = async () => {
    try {
      setIsCreatingBackup(true);
      setLoading(true);
      setProgress(0);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) return;

      console.log('Intentando crear backup...');
      const response = await axios.post(`${config.apiUrl}/api/backups/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Respuesta de la API:', response.data);
      
      // Verificar que el backup se creó correctamente
      if (!response.data || !response.data.id) {
        throw new Error('Respuesta inválida de la API');
      }

      // Simular progreso (en producción, esto vendría del backend)
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSuccess('Backup creado exitosamente');
      toast.success('Backup creado exitosamente');
      
      // Actualizar la lista de backups
      fetchBackups();
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error en la respuesta:', err.response?.data);
      
      let errorMessage = 'Error al crear el backup';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = 'Sesión expirada';
        navigate('/login');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingBackup(false);
      setLoading(false);
      setProgress(0);
    }
  };

  // Función para eliminar un backup
  const deleteBackup = async (backupId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este backup? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) return;

      await axios.delete(`${config.apiUrl}/api/backups/${backupId}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccess('Backup eliminado exitosamente');
      toast.success('Backup eliminado exitosamente');
      
      // Actualizar la lista de backups
      fetchBackups();
    } catch (err) {
      console.error('Error al eliminar el backup:', err);
      
      let errorMessage = 'Error al eliminar el backup';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 403) {
        errorMessage = 'No tienes permiso para eliminar este backup';
      } else if (err.response?.status === 404) {
        errorMessage = 'El backup no fue encontrado';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para restaurar backup desde la lista
  const restoreBackup = async (backupId) => {
    try {
      setIsRestoring(true);
      setLoading(true);
      setProgress(0);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) return;

      const response = await axios.post(`${config.apiUrl}/api/backups/${backupId}/restore/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSuccess('Backup restaurado exitosamente');
      toast.success('Backup restaurado exitosamente');
      fetchBackups();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Error al restaurar el backup';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsRestoring(false);
      setProgress(0);
    }
  };

  // Función para descargar backup
  const downloadBackup = async (backupId, fileName) => {
    try {
      setDownloadingId(backupId);
      setIsDownloading(true);
      
      const token = getToken();
      if (!token) {
        setError('No se encontró el token de autenticación');
        setIsDownloading(false);
        setDownloadingId(null);
        return;
      }

      // Hacer la petición con axios
      const response = await axios({
        url: `${config.apiUrl}/api/backups/${backupId}/download/`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      // Crear una URL para el blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Crear un enlace temporal
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `backup_${backupId}.zip`);
      
      // Simular clic para iniciar la descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setIsDownloading(false);
        setDownloadingId(null);
        setProgress(0);
      }, 100);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Error al descargar el backup';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Función para manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Leer metadatos del archivo ZIP
      const reader = new FileReader();
      reader.onload = (e) => {
        const zip = new JSZip();
        zip.loadAsync(e.target.result)
          .then((zip) => {
            // Leer el archivo metadata.json
            return zip.file('metadata.json')?.async('text');
          })
          .then((metadata) => {
            if (metadata) {
              try {
                setBackupDetails(JSON.parse(metadata));
              } catch (err) {
                console.error('Error al parsear metadatos:', err);
              }
            }
          })
          .catch((err) => {
            console.error('Error al leer metadatos:', err);
          });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Función para restaurar desde archivo
  const handleRestore = async (file) => {
    try {
      const token = getToken();
      if (!token) return;

      setIsRestoring(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${config.apiUrl}/api/backups/restore_from_file/`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      );

      if (response.data.success) {
        setSuccess('Restauración completada exitosamente');
        toast.success('Restauración completada exitosamente');
        setShowRestoreModal(false);
        setSelectedFile(null);
        setBackupDetails({});
        fetchBackups();
      } else {
        const errorMessage = response.data.error || 'Error al restaurar el backup';
        setError(errorMessage);
        toast.error('Error al restaurar: ' + errorMessage);
      }

    } catch (err) {
      console.error('Error en la restauración:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Error al restaurar el backup';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRestoring(false);
      setProgress(0);
    }
  };

  // Funciones para limpiar mensajes
  const clearError = () => {
    setError('');
  };

  const clearSuccess = () => {
    setSuccess('');
  };

  // Efectos
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Verificar si el usuario tiene tenant
    if (!user || !user.tenant_id) {
      setError('Usuario no tiene tenant asignado');
      return;
    }

    fetchBackups();
  }, [user, navigate]);

  // Actualizar la lista de backups cuando cambie el estado de success
  useEffect(() => {
    if (success) {
      // Esperar un momento antes de actualizar la lista
      setTimeout(() => {
        fetchBackups();
      }, 1000);
    }
  }, [success]);

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title="Backup y Restauración" 
        showBackButton={true}
        onBackClick={() => navigate(-1)}
      />
        
      <div className="container mx-auto p-4">
        {/* Mensajes */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-700 hover:text-red-900">
              <FaTimes />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={clearSuccess} className="text-green-700 hover:text-green-900">
              <FaTimes />
            </button>
          </div>
        )}

        {/* Barra de progreso */}
        {(isCreatingBackup || isRestoring || isDownloading) && (
          <div className="fixed top-0 left-0 w-full bg-gray-200 h-1 z-50">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={createBackup}
            disabled={loading || isCreatingBackup}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaUpload />
            {isCreatingBackup ? 'Creando...' : 'Crear Backup'}
          </button>

          <button
            onClick={() => setShowRestoreModal(true)}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaSync />
            Restaurar Backup
          </button>
        </div>

        {/* Lista de backups */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {backups.length === 0 ? (
            <div className="p-12 text-center">
              <FaCloudDownloadAlt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay backups disponibles
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Crea tu primer backup para proteger tus datos
              </p>
              <div className="mt-6">
                <button
                  onClick={createBackup}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isCreatingBackup || loading}
                >
                  <FaSync className="-ml-1 mr-2 h-5 w-5" />
                  Crear Backup
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(backup.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                        backup.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-4">
                        {/* Botón de descargar */}
                        <div className="relative">
                          <button
                            onClick={() => downloadBackup(backup.id, `backup_${backup.id}.zip`)}
                            className={`text-blue-600 hover:text-blue-800 ${isDownloading && downloadingId === backup.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Descargar backup"
                            disabled={isDownloading && downloadingId === backup.id}
                          >
                            {isDownloading && downloadingId === backup.id ? (
                              <div className="flex items-center">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-xs">{progress}%</span>
                              </div>
                            ) : (
                              <FaDownload className="text-lg" />
                            )}
                          </button>
                          {isDownloading && downloadingId === backup.id && (
                            <div className="absolute -bottom-6 left-0 w-24 bg-gray-800 text-white text-xs p-1 rounded text-center">
                              {progress}% descargado
                            </div>
                          )}
                        </div>
                        
                        {/* Botón de restaurar */}
                        <button
                          onClick={() => restoreBackup(backup.id)}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          disabled={backup.status !== 'completed' || isRestoring}
                          title="Restaurar backup"
                        >
                          <FaSync className="text-lg" />
                        </button>
                        
                        {/* Botón de eliminar */}
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          disabled={loading}
                          title="Eliminar backup"
                        >
                          <FaTrash className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de restauración */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold">Restaurar Backup</h3>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedFile(null);
                  setBackupDetails({});
                }}
                className="text-gray-600 hover:text-gray-700 text-2xl"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mt-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Selecciona el archivo ZIP
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  disabled={isRestoring}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                {selectedFile && (
                  <div className="mt-2 text-gray-600">
                    <strong>Archivo seleccionado:</strong> {selectedFile.name}
                    {backupDetails.created_at && (
                      <div className="text-sm text-gray-500 mt-1">
                        Creado: {new Date(backupDetails.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Barra de progreso del modal */}
              {isRestoring && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-gray-600 text-sm">
                    Restaurando... {progress}%
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end pt-4">
                <button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedFile(null);
                    setBackupDetails({});
                  }}
                  disabled={isRestoring}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRestore(selectedFile)}
                  disabled={!selectedFile || isRestoring}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                >
                  {isRestoring ? 'Restaurando...' : 'Restaurar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import API from "../../api/api";
import {
  FaEdit,
  FaTrash,
  FaCube,
  FaImage,
  FaSave,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";

export default function BloquesSettings() {
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [bloqueEditado, setBloqueEditado] = useState({});
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [bloqueAEliminar, setBloqueAEliminar] = useState(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetchBloques();
  }, []);

  const fetchBloques = async () => {
    try {
      const response = await API.get("store-style/bloques/");
      setBloques(response.data);
    } catch (err) {
      console.error("Error al cargar los bloques", err);
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 3000);
  };

  const handleEdit = (bloque) => {
    setEditandoId(bloque.id);
    setBloqueEditado({ ...bloque });
  };

  const handleUpdate = async () => {
    if (!bloqueEditado.id) {
      console.error("Error: bloqueEditado.id es undefined");
      return;
    }

    try {
      let imagenUrl = bloqueEditado.imagen;

      if (bloqueEditado.imagen instanceof File) {
        const formData = new FormData();
        formData.append("file", bloqueEditado.imagen);
        const res = await API.post("store-style/upload-imagen/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imagenUrl = res.data.url;
      }

      await API.patch(`store-style/bloques/${bloqueEditado.id}/`, {
        tipo: bloqueEditado.tipo,
        titulo: bloqueEditado.titulo,
        descripcion: bloqueEditado.descripcion,
        imagen: imagenUrl,
      });

      setBloques((prev) =>
        prev.map((b) =>
          b.id === bloqueEditado.id
            ? { ...bloqueEditado, imagen: imagenUrl }
            : b
        )
      );

      setEditandoId(null);
      setBloqueEditado({});
      mostrarMensaje("Bloque actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar el bloque", err);
    }
  };

  const handleDeleteClick = (id) => {
    setBloqueAEliminar(id);
    setMostrarModalEliminar(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!bloqueAEliminar) return;

      await API.delete(`store-style/bloques/${bloqueAEliminar}/`);
      setBloques((prev) => prev.filter((b) => b.id !== bloqueAEliminar));
      setMostrarModalEliminar(false);
      setBloqueAEliminar(null);
      mostrarMensaje("Bloque eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar el bloque", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaCube className="text-blue-600" />
        Bloques de Bienvenida
      </h2>

      {mensaje && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <FaCheckCircle />
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {bloques.map((bloque) => {
          const esEditando =
            editandoId === bloque.id && bloqueEditado.id === bloque.id;

          return (
            <div
              key={bloque.id}
              className="relative bg-white rounded-lg shadow p-4 border"
            >
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleEdit(bloque)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Editar"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteClick(bloque.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="mb-4">
                {esEditando && bloqueEditado.imagen ? (
                  <img
                    src={
                      bloqueEditado.imagen instanceof File
                        ? URL.createObjectURL(bloqueEditado.imagen)
                        : bloqueEditado.imagen
                    }
                    alt={`Bloque ${bloque.id}`}
                    className="w-full h-40 object-cover rounded"
                  />
                ) : bloque.imagen ? (
                  <img
                    src={bloque.imagen}
                    alt={`Bloque ${bloque.id}`}
                    className="w-full h-40 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    <FaImage className="text-4xl" />
                  </div>
                )}
              </div>

              {esEditando ? (
                <>
                  <select
                    value={bloqueEditado.tipo}
                    onChange={(e) =>
                      setBloqueEditado({
                        ...bloqueEditado,
                        tipo: e.target.value,
                      })
                    }
                    className="w-full mb-2 px-3 py-2 border rounded"
                  >
                    <option value="apilado">Apilado</option>
                    <option value="en_linea">En línea</option>
                  </select>

                  <input
                    type="text"
                    value={bloqueEditado.titulo}
                    onChange={(e) =>
                      setBloqueEditado({
                        ...bloqueEditado,
                        titulo: e.target.value,
                      })
                    }
                    className="w-full mb-2 px-3 py-2 border rounded"
                    placeholder="Título"
                  />

                  <textarea
                    value={bloqueEditado.descripcion}
                    onChange={(e) =>
                      setBloqueEditado({
                        ...bloqueEditado,
                        descripcion: e.target.value,
                      })
                    }
                    className="w-full mb-2 px-3 py-2 border rounded"
                    placeholder="Descripción"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setBloqueEditado({ ...bloqueEditado, imagen: file });
                      }
                    }}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border file:rounded file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  <button
                    onClick={handleUpdate}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <FaSave />
                    Actualizar
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {bloque.titulo || "(Sin título)"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {bloque.descripcion || "(Sin descripción)"}
                  </p>
                  <span className="text-xs text-white bg-blue-500 px-2 py-1 rounded">
                    {bloque.tipo}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {mostrarModalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setMostrarModalEliminar(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
            >
              <FaTimes />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ¿Eliminar bloque?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrarModalEliminar(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import API from '../api/api';

export default function ProductForm({ onProductAdded, editingProduct, onCancel, hideTitle = false }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    imagen: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');

 useEffect(() => {
  fetchCategories();

  if (editingProduct) {
    setFormData({
      nombre: editingProduct.nombre,
      descripcion: editingProduct.descripcion,
      precio: editingProduct.precio,
      stock: editingProduct.stock,
      categoria: editingProduct.categoria,
      imagen: null, // importante para que no se envíe una imagen vieja en FormData
    });
    setPreviewImage(editingProduct.imagen || null); // ✅ aquí se muestra visualmente la imagen actual
  } else {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoria: '',
      imagen: null,
    });
    setPreviewImage(null);
  }
}, [editingProduct]);


  const fetchCategories = async () => {
    try {
      const response = await API.get('tiendas/categorias/');
      setCategories(response.data);
    } catch (err) {
      setError('Error al cargar las categorías');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imagen: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      const response = await API.post('tiendas/categorias/', {
        nombre: newCategory,
      });
      setCategories((prev) => [...prev, response.data]);
      setFormData((prev) => ({ ...prev, categoria: response.data.id }));
      setNewCategory('');
      setShowNewCategoryForm(false);
      setSuccess('Categoría agregada exitosamente');
    } catch (err) {
      setError('Error al agregar la categoría');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      setError('El stock no puede ser negativo');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('nombre', formData.nombre);
    formDataToSend.append('descripcion', formData.descripcion);
    formDataToSend.append('precio', formData.precio);
    formDataToSend.append('stock', formData.stock);
    if (formData.categoria) formDataToSend.append('categoria', formData.categoria);
    if (formData.imagen) formDataToSend.append('imagen', formData.imagen);

    console.log('🔍 Debug - Stock antes de enviar:', formData.stock);
    console.log('🔍 Debug - FormData completo:', Object.fromEntries(formDataToSend));

    try {
      if (editingProduct) {
        console.log('🔍 Debug - Actualizando producto:', editingProduct.id);
        await API.put(`tiendas/productos/${editingProduct.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Producto actualizado exitosamente');
      } else {
        console.log('🔍 Debug - Creando nuevo producto');
        await API.post('tiendas/productos/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Producto agregado exitosamente');
      }

      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        categoria: '',
        imagen: null,
      });
      setPreviewImage(null);
      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error('❌ Error al guardar producto:', err);
      setError(
        err.response?.data?.categoria?.[0] ||
        err.response?.data?.detail ||
        'Error al guardar el producto'
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      {!hideTitle && (
        <h2 className="text-2xl font-bold mb-6 text-blue-600">
          {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </h2>
      )}
      {error && <div className="bg-red-100 text-red-700 border border-red-400 p-3 mb-4 rounded">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 border border-green-400 p-3 mb-4 rounded">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Nombre del Producto</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Descripción</label>
          <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" className="w-full px-4 py-2 border rounded-lg" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Precio</label>
            <input type="number" name="precio" value={formData.precio} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" step="0.01" required />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Stock</label>
            <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700">Categoría</label>
            <button type="button" onClick={() => setShowNewCategoryForm(true)} className="text-blue-600 text-sm flex items-center gap-1">
              <FaPlus size={12} /> Nueva Categoría
            </button>
          </div>
          {showNewCategoryForm ? (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Agregar Nueva Categoría</h3>
                <button type="button" onClick={() => setShowNewCategoryForm(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nombre de la categoría" className="flex-1 px-4 py-2 border rounded-lg" required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Agregar</button>
              </form>
            </div>
          ) : (
            <select name="categoria" value={formData.categoria} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required>
              <option value="">Seleccionar categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.nombre}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Imagen del Producto</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
            required={!editingProduct}
          />

         
          {previewImage && (
            <div className="mt-3">
              <img
                src={previewImage}
                alt="Vista previa"
                className="w-32 h-32 object-cover rounded"
              />
            </div>
          )}
        </div>


        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {editingProduct ? 'Actualizar' : 'Agregar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}

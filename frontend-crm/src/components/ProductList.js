import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // 👈 Importa useLocation también
import { FaShoppingCart } from "react-icons/fa";
import axios from "axios";
import config from '../config';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Obtiene la ruta actual

  useEffect(() => {
    axios.get(`${config.apiUrl}/api/products/`)
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error("Error fetching products:", error);
      });

    actualizarCarrito();
  }, []);

  const actualizarCarrito = () => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalCantidad = storedCart.reduce((acc, item) => acc + item.quantity, 0);
    setCartItemsCount(totalCantidad);
  };

  const addToCart = (product) => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      alert('Debe iniciar sesión para añadir productos al carrito');
      navigate("/login");
      return;
    }
  
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProduct = storedCart.find(item => item.id === product.id);
  
    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      storedCart.push({ ...product, quantity: 1 });
    }
  
    localStorage.setItem('cart', JSON.stringify(storedCart));
    actualizarCarrito();
    alert('Producto añadido al carrito');
  };
  

  const irAlCarrito = () => {
    navigate("/cart");
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen relative">
      {/* Carrito flotante */}
      <div className="fixed top-5 right-5 z-50">
        <div className="relative cursor-pointer" onClick={irAlCarrito}>
          <FaShoppingCart size={30} className="text-blue-600 hover:text-blue-800" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {cartItemsCount}
            </span>
          )}
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">Catálogo de Productos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.length > 0 ? (
          products.map((product) => {
            const imageUrl = product.image?.startsWith('/media/')
              ? `${config.apiUrl}${product.image}`
              : `${config.apiUrl}/media/${product.image}`;

            return (
              <div key={product.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
                
                <button
                  onClick={() => addToCart(product)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                >
                  Agregar al Carrito
                </button>

                <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                <p className="text-gray-700 mb-2">{product.description}</p>
                <p className="font-semibold text-green-600">${product.price}</p>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No hay productos disponibles.</p>
        )}
      </div>
    </div>
  );
}

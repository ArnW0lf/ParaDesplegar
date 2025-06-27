import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/api";
import Header from "../common/PublicHeader";
import { FaShoppingCart } from "react-icons/fa";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import homeImage from "../../assets/Home.svg";
import corpoImage from "../../assets/Corporativo.svg";
import urbanoImage from "../../assets/Urbano.svg";
import config from "../../config";

export default function TiendaPublica() {
  const { slug } = useParams();
  const [storeInfo, setStoreInfo] = useState(null);
  const [storeStyle, setStoreStyle] = useState(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("all");

  const cartKey = `cart_${slug}`;
  const tokenKey = `token_${slug}`;

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    setIsAuthenticated(!!token);
  }, [slug]);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem(tokenKey);
      setIsAuthenticated(!!token);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [slug]);

  useEffect(() => {
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) setCart(JSON.parse(storedCart));
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, slug, isAuthenticated]);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const tiendaRes = await API.get(
          `tiendas/tiendas/${slug}/public_store/`
        );
        setStoreInfo(tiendaRes.data);

        const estiloRes = await API.get(
          `store-style/tiendas/${slug}/public_store/`
        );
        setStoreStyle(estiloRes.data.style);

        const productsResponse = await API.get(
          `tiendas/tiendas/${slug}/public_products/`
        );
        setProducts(productsResponse.data);

        const categoriesResponse = await API.get(
          `tiendas/tiendas/${slug}/public_categories/`
        );
        setCategories(categoriesResponse.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Error al cargar la tienda");
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [slug]);

  const isDark = storeStyle?.tema === "oscuro";
  const vista = storeStyle?.vista_producto;

  const isGrid = vista === "grid";
  const isList = vista === "list";
  const isDetallada = vista === "detallada";
  const isMasonry = vista === "masonry";

  const customStyle = {
    "--color-primario": storeStyle?.color_primario,
    "--color-secundario": storeStyle?.color_secundario,
    "--color-texto": storeStyle?.color_texto,
    "--color-fondo": storeStyle?.color_fondo,
    fontFamily: storeStyle?.tipo_fuente,
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para agregar productos al carrito.");
      return;
    }

    const existingIndex = cart.findIndex((item) => item.id === product.id);
    let updatedCart;

    if (existingIndex !== -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(updatedCart);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-center text-red-600 mt-10">{error}</div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchCategory =
      selectedCategory === "all" || p.categoria_nombre === selectedCategory;
    const matchSearch = p.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchPrice = (() => {
      const price = Number(p.precio);
      switch (priceRange) {
        case "0-25":
          return price >= 0 && price <= 25;
        case "25-50":
          return price > 25 && price <= 50;
        case "50-100":
          return price > 50 && price <= 100;
        case "100+":
          return price > 100;
        default:
          return true;
      }
    })();
    return matchCategory && matchSearch && matchPrice;
  });

  // Vista cuando no hay productos
  if (products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={customStyle}>
        <Header
          storeName={storeInfo?.nombre}
          logo={storeInfo?.logo}
          slug={slug}
          cartCount={0}
          colorPrimario={storeStyle?.color_primario}
        />
        <div className={`flex-1 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="text-center p-8 max-w-3xl mx-auto">
            <ShoppingBag className="w-24 h-24 text-gray-400 mb-6 mx-auto" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">¡Tienda en Construcción!</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Lo sentimos, actualmente no hay productos disponibles en nuestra tienda.
              Estamos trabajando para ofrecerte los mejores productos muy pronto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: storeStyle?.color_primario || '#3b82f6',
                }}
              >
                Volver a intentar
              </button>
              <a
                href="#"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Contáctanos
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
      style={customStyle}
    >
      <Header
        storeName={storeInfo?.nombre}
        logo={storeInfo?.logo}
        slug={slug}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        colorPrimario={storeStyle?.color_primario}
      />

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Menú superior de navegación */}
        <div className="flex justify-center gap-6 mb-10">
          <button
            onClick={() => setShowProducts(false)}
            style={{
              color: !showProducts ? "var(--color-secundario)" : undefined,
              borderBottomColor: !showProducts
                ? "var(--color-secundario)"
                : "transparent",
            }}
            className={`text-lg font-semibold border-b-4 pb-1 transition ${
              !showProducts
                ? ""
                : "text-gray-700 hover:text-[color:var(--color-secundario)]"
            }`}
          >
            Inicio
          </button>

          <button
            onClick={() => setShowProducts(true)}
            style={{
              color: showProducts ? "var(--color-secundario)" : undefined,
              borderBottomColor: showProducts
                ? "var(--color-secundario)"
                : "transparent",
            }}
            className={`text-lg font-semibold border-b-4 pb-1 transition ${
              showProducts
                ? ""
                : "text-gray-700 hover:text-[color:var(--color-secundario)]"
            }`}
          >
            Productos
          </button>
        </div>

        {/* Sección de Bienvenida */}
        {!showProducts && (
          <>
            {!showProducts && (
              <>
                {storeStyle?.tema_plantilla === "urbano" && (
                  <section className="bg-gradient-to-br from-purple-800 via-purple-600 to-pink-500 text-white py-20 px-6 rounded-xl shadow-lg mb-10">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                      <div className="md:w-1/2">
                        <h1 className="text-5xl font-extrabold leading-tight mb-4">
                          Vive el estilo urbano
                        </h1>
                        <p className="text-lg mb-6">
                          Encuentra los productos más cool del momento, con
                          diseño y actitud.
                        </p>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setShowProducts(true)}
                            className="bg-yellow-400 text-black px-6 py-3 rounded-md font-semibold hover:bg-yellow-300"
                          >
                            Explorar ahora
                          </button>
                          <button
                            onClick={() => setShowProducts(true)}
                            className="border border-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-purple-800"
                          >
                            Ver categorías
                          </button>
                        </div>
                      </div>
                      {/* Imagen animada */}
                      <motion.div
                        className="md:w-1/2 flex justify-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                      >
                        <motion.img
                          src={urbanoImage}
                          alt="Tienda online"
                          className="w-80 md:w-96 drop-shadow-lg"
                          animate={{ y: [0, -10, 0] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                    </div>
                  </section>
                )}

                {storeStyle?.tema_plantilla === "corporativo" && (
                  <section className="bg-white py-20 px-6 rounded-xl shadow-md mb-10 border border-gray-200">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                      <div className="md:w-1/2">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">
                          Soluciones profesionales para tu empresa
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                          Productos seleccionados para negocios que buscan
                          eficiencia y calidad.
                        </p>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setShowProducts(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700"
                          >
                            Comprar ahora
                          </button>
                          <button
                            onClick={() => setShowProducts(true)}
                            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-blue-50"
                          >
                            Soluciones empresariales
                          </button>
                        </div>
                      </div>
                      {/* Imagen animada */}
                      <motion.div
                        className="md:w-1/2 flex justify-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                      >
                        <motion.img
                          src={corpoImage}
                          alt="Tienda online"
                          className="w-80 md:w-96 drop-shadow-lg"
                          animate={{ y: [0, -10, 0] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                    </div>
                  </section>
                )}

                {(storeStyle?.tema_plantilla === "clasico" ||
                  !storeStyle?.tema_plantilla) && (
                  <section className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 py-24 px-4 rounded-xl shadow mb-10">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                      {/* Texto principal */}
                      <motion.div
                        className="text-left md:w-1/2"
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                      >
                        <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-700 leading-tight">
                          ¡Los mejores productos, al mejor precio!
                        </h1>
                        <p className="mt-4 text-lg text-emerald-700 mb-8">
                          Encuentra los mejores productos a precios
                          irresistibles, todo en un solo lugar.
                        </p>
                        {/* Botones */}
                        <motion.div
                          className="flex flex-wrap gap-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.8 }}
                        >
                          <button
                            onClick={() => setShowProducts(true)}
                            style={{
                              backgroundColor: "var(--color-secundario)",
                            }}
                            className="flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
                          >
                            <ShoppingBag size={20} />
                            Comprar ahora
                          </button>

                          <button
                            onClick={() => setShowProducts(true)}
                            style={{
                              borderColor: "var(--color-secundario)",
                              color: "var(--color-secundario)",
                            }}
                            className="flex items-center gap-2 bg-white hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold border transition-all"
                          >
                            Explorar categorías
                            <ArrowRight size={20} />
                          </button>
                        </motion.div>
                      </motion.div>

                      {/* Imagen animada */}
                      <motion.div
                        className="md:w-1/2 flex justify-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                      >
                        <motion.img
                          src={homeImage}
                          alt="Tienda online"
                          className="w-80 md:w-96 drop-shadow-lg"
                          animate={{ y: [0, -10, 0] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                    </div>
                  </section>
                )}
              </>
            )}

            {storeStyle?.bloques_bienvenida?.length > 0 && (
              <>
                {/* Bloques tipo "en_linea" */}
                <section className="max-w-7xl mx-auto px-4 mb-16">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {storeStyle.bloques_bienvenida
                      .filter((b) => b.tipo === "en_linea")
                      .map((bloque, index) => (
                        <div
                          key={index}
                          className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center text-center border border-gray-200"
                        >
                          <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                            <img
                              src={bloque.imagen}
                              alt={bloque.titulo}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                              }}
                            />
                          </div>
                          <h3 className="text-xl font-bold text-emerald-700 mb-2">
                            {bloque.titulo}
                          </h3>
                          <p className="text-gray-600">{bloque.descripcion}</p>
                        </div>
                      ))}
                  </div>
                </section>

                {/* Bloques tipo "apilado" */}
                <section className="max-w-7xl mx-auto px-4 mb-16 space-y-10">
                  {storeStyle.bloques_bienvenida
                    .filter((b) => b.tipo === "apilado")
                    .map((bloque, index) => (
                      <div
                        key={index}
                        className={`flex flex-col md:flex-row ${
                          index % 2 === 1 ? "md:flex-row-reverse" : ""
                        } items-center bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200`}
                      >
                        {/* Imagen */}
                        <div className="w-full md:w-1/2 h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                          <img
                            src={bloque.imagen}
                            alt={bloque.titulo}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                            }}
                          />
                        </div>

                        {/* Texto */}
                        <div className="w-full md:w-1/2 p-6 text-center md:text-left">
                          <h3 className="text-2xl font-bold text-emerald-700 mb-2">
                            {bloque.titulo}
                          </h3>
                          <p className="text-gray-600">{bloque.descripcion}</p>
                        </div>
                      </div>
                    ))}
                </section>
              </>
            )}
          </>
        )}

        {/* Categorías */}
        {showProducts && categories.length > 0 && (
          <section className="flex gap-6">
            {/* Filtros laterales */}
            <aside className="w-full max-w-xs bg-white rounded-lg p-4 shadow">
              {/* Buscador */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <h3 className="text-lg font-bold mb-4 text-[color:var(--color-texto)]">
                Filtros
              </h3>

              <div className="mb-6">
                <h4 className="font-semibold text-sm mb-2 text-[color:var(--color-texto)]">
                  Categorías
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[color:var(--color-texto)]">
                    <input
                      type="radio"
                      name="categoria"
                      checked={selectedCategory === "all"}
                      onChange={() => setSelectedCategory("all")}
                    />
                    Todas
                  </label>
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 text-[color:var(--color-texto)]"
                    >
                      <input
                        type="radio"
                        name="categoria"
                        checked={selectedCategory === category.nombre}
                        onChange={() => setSelectedCategory(category.nombre)}
                      />
                      {category.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 text-[color:var(--color-texto)]">
                  Precio
                </h4>

                <div className="space-y-2 text-sm text-[color:var(--color-texto)]">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="precio"
                      checked={priceRange === "all"}
                      onChange={() => setPriceRange("all")}
                    />
                    Todos
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="precio"
                      checked={priceRange === "0-25"}
                      onChange={() => setPriceRange("0-25")}
                    />
                    Bs. 0 - Bs. 25
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="precio"
                      checked={priceRange === "25-50"}
                      onChange={() => setPriceRange("25-50")}
                    />
                    Bs. 25 - Bs. 50
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="precio"
                      checked={priceRange === "50-100"}
                      onChange={() => setPriceRange("50-100")}
                    />
                    Bs. 50 - Bs. 100
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="precio"
                      checked={priceRange === "100+"}
                      onChange={() => setPriceRange("100+")}
                    />
                    Bs. 100 o más
                  </label>
                </div>
              </div>
            </aside>

            {/* Lista de productos */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2
                    className="text-2xl font-bold"
                    style={{
                      color: isDark ? "white" : "var(--color-texto)",
                    }}
                  >
                    Nuestros Productos
                  </h2>
                  <p
                    className="text-sm"
                    style={{
                      color: isDark ? "#e0e0e0" : "var(--color-texto)",
                    }}
                  >
                    Explora nuestra amplia selección de productos de alta
                    calidad al mejor precio.
                  </p>
                </div>
              </div>

              <div
                className={`${
                  isMasonry
                    ? "columns-1 sm:columns-2 md:columns-3 gap-6"
                    : isGrid
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "flex flex-col gap-6"
                }`}
              >
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    if (isDetallada) {
                      return (
                        <div
                          key={product.id}
                          className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-6"
                        >
                          {product.imagen ? (
                            <img
                              src={`${config.apiUrl}${product.imagen}`}
                              alt={product.nombre}
                              className="w-full md:w-1/3 h-48 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full md:w-1/3 h-48 bg-gray-100 rounded flex flex-col items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm">Sin imagen</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-xl mb-1">
                              {product.nombre}
                            </h3>
                            <p className="text-sm mb-2">
                              {product.categoria_nombre}
                            </p>
                            <p className="text-green-600 font-bold text-lg mb-4">
                              Bs{Number(product.precio).toFixed(2)}
                            </p>
                            <button
                              onClick={() => handleAddToCart(product)}
                              style={{
                                backgroundColor: "var(--color-secundario)",
                                color: "white",
                              }}
                              className="px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                            >
                              <ShoppingBag size={16} /> Comprar
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (isMasonry) {
                      return (
                        <div
                          key={product.id}
                          className="bg-white rounded-lg shadow p-4 break-inside-avoid"
                        >
                          {product.imagen ? (
                            <img
                              src={`${config.apiUrl}${product.imagen}`}
                              alt={product.nombre}
                              className="w-full object-cover rounded mb-4"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 rounded mb-4 flex flex-col items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs">Sin imagen</span>
                            </div>
                          )}
                          <h3 className="font-bold text-lg mb-1">
                            {product.nombre}
                          </h3>
                          <p className="text-sm mb-1">
                            {product.categoria_nombre}
                          </p>
                          <p className="text-green-600 font-bold text-lg mb-3">
                            Bs{Number(product.precio).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleAddToCart(product)}
                            style={{
                              backgroundColor: "var(--color-secundario)",
                              color: "white",
                            }}
                            className="w-full py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                          >
                            <ShoppingBag size={16} /> Comprar
                          </button>
                        </div>
                      );
                    }

                    // grid o list
                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition ${
                          isList ? "flex gap-4 items-center" : ""
                        }`}
                      >
                        {product.imagen ? (
                          <img
                            src={`${config.apiUrl}${product.imagen}`}
                            alt={product.nombre}
                            className="w-full h-48 object-cover mb-4 rounded"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 rounded mb-4 flex flex-col items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">Sin imagen</span>
                          </div>
                        )}
                        <h3 className="font-bold text-lg mb-1">
                          {product.nombre}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">
                          {product.categoria_nombre}
                        </p>
                        <p className="text-green-600 font-bold text-lg mb-2">
                          Bs{Number(product.precio).toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          style={{
                            backgroundColor: "var(--color-secundario)",
                            color: "white",
                          }}
                          className="w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 hover:opacity-90"
                        >
                          <ShoppingBag size={16} />
                          Comprar
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-gray-100 p-6 rounded-full mb-6">
                      <ShoppingBag size={48} className="text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">
                      No hay productos disponibles
                    </h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      No encontramos productos que coincidan con tu búsqueda.
                      Prueba con otros filtros o vuelve más tarde.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory("all");
                        setSearchTerm("");
                        setPriceRange("all");
                      }}
                      style={{
                        backgroundColor: "var(--color-secundario)",
                        color: "white",
                      }}
                      className="px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                    >
                      Ver todos los productos
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

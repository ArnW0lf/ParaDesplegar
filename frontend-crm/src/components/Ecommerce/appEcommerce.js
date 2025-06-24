import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


export default function AppEcommerce() {
  const [selectedStyle, setSelectedStyle] = useState(null);
  const navigate = useNavigate();

  const styles = [
    {
      id: 1,
      name: "Moderno Minimalista",
      description: "Diseño limpio, elegante y enfocado en el producto...",
      image: "/images/moderno-minimalista.jpg",
      path: "/moderno-minimalista",
    },
    {
      id: 2,
      name: "Clásico Comercial",
      description: "Estilo tradicional de catálogo...",
      image: "/images/clasico-comercial.jpg",
      path: "/clasico-comercial",
    },
    {
      id: 3,
      name: "Galería Visual",
      description: "Gran enfoque en imágenes...",
      image: "/images/galeria-visual.jpg",
      path: "/galeria-visual",
    },
    {
      id: 4,
      name: "Estilo Urbano",
      description: "Diseño juvenil, audaz y dinámico...",
      image: "/images/urbano.jpg",
      path: "/urbano",
    },
    {
      id: 5,
      name: "Tema Corporativo",
      description: "Estilo sobrio y profesional...",
      image: "/images/tema-corporativo.jpg",
      path: "/tema-corporativo",
    },
  ];

  const handleContinue = () => {
    const selected = styles.find((s) => s.id === selectedStyle);
    if (selected) {
      // Aquí simularíamos una creación automática del ecommerce
      console.log(`✨ Creando ecommerce con el estilo: ${selected.name}`);
      navigate(selected.path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-10">
        Elige el Estilo de Tu Tienda Online
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {styles.map((style) => (
          <div
            key={style.id}
            className={`bg-white p-6 rounded-lg shadow-md transition-all border-2 ${
              selectedStyle === style.id ? "border-indigo-600" : "border-transparent"
            }`}
          >
            <img
              src={style.image}
              alt={style.name}
              className="w-full h-40 object-cover rounded mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{style.name}</h2>
            <p className="text-gray-600 mb-4">{style.description}</p>

            <button
              onClick={() => setSelectedStyle(style.id)}
              className={`w-full py-2 rounded font-semibold ${
                selectedStyle === style.id
                  ? "bg-indigo-600 text-white"
                  : "border border-indigo-600 text-indigo-600 hover:bg-indigo-100"
              } transition`}
            >
              {selectedStyle === style.id ? "Estilo Seleccionado" : "Seleccionar este estilo"}
            </button>
          </div>
        ))}
      </div>

      {selectedStyle && (
        <div className="text-center mt-10">
          <button
            onClick={handleContinue}
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition"
          >
            Continuar con este estilo
          </button>
        </div>
      )}
    </div>
  );
}


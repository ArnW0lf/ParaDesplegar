import { useParams } from 'react-router-dom';

export default function EcommercePublico() {
  const { slug } = useParams(); // ejemplo: generation-relojes

  return (
    <div className="min-h-screen">
      {/* Barra de navegación */}
      <header className="bg-white shadow px-6 py-3 flex justify-between items-center">
        <nav className="flex space-x-6 text-sm font-semibold">
          <a href="#">Inicio</a>
          <a href="#">Tienda</a>
        </nav>
        <div>
          <a
            href="/login"
            className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
          >
            Iniciar Sesión
          </a>
        </div>
      </header>

      {/* Imagen principal con nombre */}
      <section
        className="h-[450px] bg-cover bg-center flex items-end"
        style={{ backgroundImage: `url('/images/${slug}.jpg')` }} // coloca la imagen del estilo
      >
        <div className="bg-black bg-opacity-60 w-full py-10 text-center">
          <h1 className="text-4xl font-bold text-white">
            {slug.replace(/-/g, ' ').toUpperCase()}
          </h1>
        </div>
      </section>
    </div>
  );
}

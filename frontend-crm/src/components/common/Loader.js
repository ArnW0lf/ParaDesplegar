import React from 'react';

export const Loader = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'text-blue-500',
    white: 'text-white',
    gray: 'text-gray-500',
    black: 'text-gray-900'
  };

  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} border-t-2 border-b-2 border-current`}>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

export const PageLoader = () => (
  <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
    <div className="text-center">
      <Loader size="xl" color="blue" />
      <p className="mt-4 text-gray-600">Cargando...</p>
    </div>
  </div>
);

export const ButtonLoader = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
    <span>Procesando...</span>
  </div>
);

export default Loader;

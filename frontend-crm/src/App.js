import React from 'react';
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ProductList from "./components/ProductList";
import HomePage from "./components/HomePage";
import Profile from "./components/Profile";
import Register from "./components/Register";
import Cart from "./components/Cart";          
import AppEcommerce from "./components/Ecommerce/appEcommerce";
import ModernoMinimalista from "./components/Ecommerce/ModernoMinimalista";
import Urbano from "./components/Ecommerce/Urbano";
import GaleriaVisual from "./components/Ecommerce/GaleriaVisual";
import ClasicoComercial from "./components/Ecommerce/ClasicoComercial";
import Corporativo from "./components/Ecommerce/Corporativo";
import EditProfile from "./components/EditProfile";
import CustomizeCompany from "./components/CustomizeCompany";
import UserProfile from "./components/UserProfile";
import Backup from './components/Backup';
import EcommercePublico from './components/Ecommerce/EcommercePublico';
import TiendaPublica from './components/Ecommerce/TiendaPublica';
import Store from './components/Store';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginTiendaPublica from './components/Ecommerce/LoginTiendaPublica';
import RegistersTiendaPublica from './components/Ecommerce/RegistersTiendaPublica';
import ProfileTiendaPublica from './components/Ecommerce/ProfileTiendaPublica';
import SalesReport from './components/Ecommerce/SalesReport';
import UserOrders from './components/Ecommerce/UserOrders';
import CRM from './components/CRM/CRM';
import LeadDetail from './components/CRM/LeadDetail';
import Bitacora from './components/Bitacora';
import Pricing from './components/Pricing';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/user-profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="/backup" element={<PrivateRoute><Backup /></PrivateRoute>} />
          <Route path="/register" element={<Register />} />
          <Route path="/app-ecommerce" element={<PrivateRoute><Store /></PrivateRoute>} />
          <Route path="/moderno-minimalista" element={<ModernoMinimalista />}/>
          <Route path="/editar-perfil" element={<EditProfile />}/>
          <Route path="/personalizar-empresa" element={<CustomizeCompany />} />
          <Route path="/urbano" element={<Urbano />}/>
          <Route path="/galeria-visual" element={<GaleriaVisual />}/>
          <Route path="/clasico-comercial" element={<ClasicoComercial />}/>
          <Route path="/tema-corporativo" element={<Corporativo />}/>
          <Route path="/tienda-publica/:slug" element={<TiendaPublica />} />
          <Route path="/tienda-publica/:slug/login" element={<LoginTiendaPublica />} />
          <Route path="/tienda-publica/:slug/register" element={<RegistersTiendaPublica />} />
          <Route path="/tienda-publica/:slug/cart" element={<Cart />} />
          <Route path="/tienda-publica/:slug/perfil" element={<ProfileTiendaPublica />} />
          <Route path="/tienda-publica/:slug/reportes" element={<SalesReport />} />
          <Route path="/tienda-publica/:slug/mis-pedidos" element={<UserOrders />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/lead/:id" element={<LeadDetail />} />
          <Route path="/bitacora" element={<Bitacora />} />
          <Route path="/precios" element={<Pricing />} />
    
        </Routes>
      </Router>
    </AuthProvider>
  );
}


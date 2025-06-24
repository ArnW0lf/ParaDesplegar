import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserProfile(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async (token) => {
        try {
            const response = await axios.get(`${config.apiUrl}/api/users/profile/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const userData = response.data;
            setUser(userData);
            setTenant(userData.tenant || null);
        } catch (error) {
            console.error('Error al obtener el perfil:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${config.apiUrl}/api/users/login/`, {
                email,
                password
            });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
            return { success: true };
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Error al iniciar sesión'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext; 